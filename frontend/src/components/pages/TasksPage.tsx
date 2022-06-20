import ButtonsSidebar from '../ButtonsSidebar';
import Header from '../Header';
import Sidebar from '../Sidebar';
import Tasks from '../Tasks';
import { TaskType } from '../../interfaces/interfaces';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import useTasks from '../../hooks/useTasks';
import { ReactComponent as LecturesIcon } from '../../icons/lectures.svg';
import { ReactComponent as HomeworkIcon } from '../../icons/homework.svg';
import { ReactComponent as LabIcon } from '../../icons/lab.svg';
import { ReactComponent as TestIcon } from '../../icons/test.svg';
import { useParams } from 'react-router-dom';
import useClassName from '../../hooks/useClassName';
import NoMatchPage from './NoMatchPage';
import ServerErrorPage from './ServerErrorPage';

function TasksPage() {
  const { classId } = useParams();
  const [currentTaskType, setCurrentTaskType] = useState<TaskType>(
    (localStorage.getItem('TaskType') as TaskType) ?? 'Lecture'
  );
  const [scrolledPosition, setScrolledPosition] = useState<number | null>(null);

  const {
    data: name,
    isError: isErrorName,
    isLoading: isLoadingName,
  } = useClassName(classId || '');
  const {
    isLoading,
    isError: isErrorTasks,
    data,
  } = useTasks(currentTaskType, classId || '', name || null);

  const onSidebarButtonClick = (taskType: TaskType) => {
    setCurrentTaskType(taskType);
    localStorage.setItem('TaskType', taskType);
  };

  useEffect(() => {
    if (name !== undefined) {
      !!name && (document.title = name);
    }
  }, [name]);

  return (
    <>
      {name !== null && !isErrorName ? (
        !isLoadingName ? (
          <>
            <Header />
            <div className="class-name">{name}</div>
            <Sidebar
              setScrolled={setScrolledPosition}
              currentTaskType={currentTaskType}
              setCurrentTaskType={setCurrentTaskType}
            />
            {isLoading && !isErrorTasks && (
              <Spinner
                animation="border"
                variant="primary"
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                }}
              />
            )}
            {!isLoading && data !== undefined && (
              <Tasks
                scrolledPosition={scrolledPosition}
                setScrolledPosition={setScrolledPosition}
                tasks={data.filter((task) => task.type === currentTaskType)}
                className={name || ''}
              />
            )}
            <ButtonsSidebar
              showSelectedButton={true}
              currentSelectedButton={currentTaskType}
              buttons={{
                firstButton: {
                  id: 'Lecture',
                  icon: <LecturesIcon className="sidebar-svg" />,
                  text: 'Лекции',
                  type: 'button',
                  action: (value: TaskType) => onSidebarButtonClick(value),
                },
                secondButton: {
                  id: 'Homework',
                  icon: <HomeworkIcon className="sidebar-svg" />,
                  text: 'Д/з',
                  type: 'button',
                  action: (value: TaskType) => onSidebarButtonClick(value),
                },
                thirdButton: {
                  id: 'Labs',
                  icon: <LabIcon className="sidebar-svg" />,
                  text: 'Лаб. работы',
                  type: 'button',
                  action: (value: TaskType) => onSidebarButtonClick(value),
                },
                fourthButton: {
                  id: 'Test',
                  icon: <TestIcon className="sidebar-svg" />,
                  text: 'Тесты',
                  type: 'button',
                  action: (value: TaskType) => onSidebarButtonClick(value),
                },
              }}
            />
          </>
        ) : (
          <Spinner
            animation="grow"
            variant="primary"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      ) : !isErrorName ? (
        <NoMatchPage />
      ) : (
        <ServerErrorPage />
      )}
    </>
  );
}

export default TasksPage;
