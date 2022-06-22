import { TaskCard } from '../interfaces/interfaces';
import Task from './Task';
import TaskPhone from './TaskPhone';
import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import axios from 'axios';
import ModalDialog from './ModalDialog';
import { firebaseAuth } from './Firebase';
import { useParams } from 'react-router-dom';

function Tasks({
  scrolledPosition,
  setScrolledPosition,
  tasks,
  className,
}: {
  scrolledPosition: number | null;
  setScrolledPosition: (value: number | null) => void;
  tasks: TaskCard[];
  className: string;
}) {
  const { classId } = useParams();
  const queryClient = useQueryClient();
  const [phoneLayout, setPhoneLayout] = useState(window.innerWidth < 600);
  const [deleteTaskOpened, setDeleteTaskOpened] = useState(false);
  const [deletedTaskId, setDeletedTaskId] = useState('');

  const deleteTaskMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.delete(
        `https://distance-learning.herokuapp.com/api/tasks?taskId=${deletedTaskId}&classId=${classId}`,
        {
          headers: { Authorization: idToken },
        }
      ),
    {
      onSuccess: ({ data }) => {
        queryClient.setQueryData(
          ['tasks', tasks[0].type, classId, className],
          data
        );
      },
      onError: () => {
        toast.error('При удалении произошла ошибка.', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      },
    }
  );

  const handleResize = () => {
    if (window.innerWidth >= 600 && phoneLayout) {
      setPhoneLayout(false);
    } else if (window.innerWidth < 600 && !phoneLayout) {
      setPhoneLayout(true);
    }
  };

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  });
  return (
    <div className="tasks">
      {tasks.length === 0 && (
        <p className="fs-2 text-center mt-4 fw-bold">Заданий нет</p>
      )}
      {tasks.map((task: TaskCard, index: number) =>
        !phoneLayout ? (
          <Task
            key={task._id}
            _id={task._id}
            type={task.type}
            taskNumber={task.taskNumber}
            name={task.name}
            description={task.description}
            taskFiles={task?.taskFiles}
            reports={task?.reports}
            taskDate={task.taskDate}
            beginningTime={task.beginningTime}
            endingTime={task.endingTime}
            settings={task.settings}
            available={task.available}
            state={task.state}
            position={index}
            scrolledPosition={scrolledPosition}
            setScrolledPosition={setScrolledPosition}
            handleDelete={(_id) => {
              setDeletedTaskId(_id);
              setDeleteTaskOpened(true);
            }}
          />
        ) : (
          <TaskPhone
            key={task._id}
            _id={task._id}
            type={task.type}
            taskNumber={task.taskNumber}
            name={task.name}
            description={task.description}
            taskFiles={task?.taskFiles}
            reports={task?.reports}
            taskDate={task.taskDate}
            beginningTime={task.beginningTime}
            endingTime={task.endingTime}
            settings={task.settings}
            available={task.available}
            state={task.state}
            handleDelete={(_id) => {
              setDeletedTaskId(_id);
              setDeleteTaskOpened(true);
            }}
          />
        )
      )}
      {phoneLayout && <div style={{ clear: 'both', height: '10%' }} />}
      <ModalDialog
        message="Вы уверены, что хотите удалить данное задание?"
        title="Удаление"
        action={async () => {
          const idToken =
            (await firebaseAuth.currentUser?.getIdToken(true)) || '0';

          deleteTaskMutation.mutate({ idToken });
        }}
        modalEnabled={deleteTaskOpened}
        handleClose={() => setDeleteTaskOpened(false)}
        buttonsType="YesNo"
        actionParams={[]}
      />
    </div>
  );
}

export default Tasks;
