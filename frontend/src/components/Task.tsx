import { TaskCard, TaskName } from '../interfaces/interfaces';
import { useDropzone } from 'react-dropzone';
import Files from './Files';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { firebaseAuth } from './Firebase';
import { Button, CloseButton, Col, Row, Stack } from 'react-bootstrap';
import mongoose from 'mongoose';
import { useMutation, useQueryClient } from 'react-query';
import ModalDialog from './ModalDialog';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import ResponsivePlayer from './ResponsivePlayer';
import TaskSettings from './TaskSettings';

function Task({
  _id,
  type,
  taskNumber,
  name,
  description,
  taskFiles,
  reports,
  taskDate,
  beginningTime,
  endingTime,
  settings,
  available,
  state,
  position,
  scrolledPosition,
  setScrolledPosition,
  handleDelete,
}: TaskCard) {
  const queryClient = useQueryClient();
  const { classId } = useParams();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: '.pdf,.docx,.doc,.zip,.rar,.png,.jpg,.ppt',
  });
  const [confirmTestOpened, setConfirmTestOpened] = useState(false);
  const [videoOpened, setVideoOpened] = useState(false);
  const [taskSettingsOpened, setTaskSettingsOpened] = useState(false);
  const [videoName, setVideoName] = useState<string>('');
  const { data: authData } = useAuth(firebaseAuth.currentUser?.uid, false);
  const files = uploadedFiles.map((file) => file.name);
  const date = new Date(taskDate);
  const navigate = useNavigate();
  const componentRef = useRef<null | HTMLDivElement>(null);

  useEffect(() => {
    setUploadedFiles((files) => [...files, ...acceptedFiles]);
  }, [acceptedFiles]);

  useEffect(() => {
    if (
      scrolledPosition === position &&
      componentRef.current !== null &&
      !!setScrolledPosition
    ) {
      componentRef.current.scrollIntoView({ block: 'end', inline: 'nearest' });
      setScrolledPosition(null);
    }
  }, [position, scrolledPosition, setScrolledPosition]);

  const addFilesMutation = useMutation(
    ({
      idToken,
      files,
      setFiles,
      taskId,
    }: {
      idToken: string;
      files: File[];
      setFiles: (files: File[]) => void;
      taskId: mongoose.Types.ObjectId;
    }): Promise<void> => {
      const formData = new FormData();
      files
        .slice(0, 5)
        .forEach((file, index) => formData.append(`file${index}`, file));

      if (files.length !== 0) {
        return axios.post(
          `http://localhost:5000/api/files?type=reports&taskId=${taskId}&classId=${classId}`,
          formData,
          {
            headers: {
              'Content-type': 'multipart/form-data',
              Authorization: idToken,
            },
          }
        );
      } else {
        return Promise.resolve();
      }
    },
    {
      onSuccess: async (_, { setFiles }) => {
        const idToken =
          (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
        addReportMutation.mutate({ idToken });
        setFiles([]);
      },
      onError: () => {
        toast.error(
          'При загрузке отчета произошла ошибка, попробуйте еще раз.',
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
      },
    }
  );

  const addReportMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.put(
        `http://localhost:5000/api/tasks?change=report&classId=${classId}`,
        {
          reports: files.join('|'),
          _id: _id,
        },
        { headers: { Authorization: idToken } }
      ),
    {
      onSuccess: () => queryClient.invalidateQueries(['tasks', type]),
      onError: () => {
        toast.error(
          'При загрузке отчета произошла ошибка, попробуйте еще раз.',
          {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
            progress: undefined,
          }
        );
      },
    }
  );

  const startTestMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.post(
        `http://localhost:5000/api/test/start?_id=${_id}`,
        {},
        { headers: { Authorization: idToken } }
      ),
    {
      onSuccess: ({ data }) => navigate(`test/${_id}`),
      onError: () => {
        toast.error('При начале теста произошла ошибка, попробуйте еще раз.', {
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

  const dropzoneStyle = {
    height: files.length !== 0 ? '25em' : '15em',
    gridTemplateRows: files.length !== 0 ? '60% 40%' : '100%',
  };

  const getFormattedTime = (time: string) =>
    `${
      new Date(time).getHours() < 10
        ? `0${new Date(time).getHours()}`
        : new Date(time).getHours()
    }:${
      new Date(time).getMinutes() < 10
        ? `0${new Date(time).getMinutes()}`
        : new Date(time).getMinutes()
    }`;

  return (
    <div
      className={`task-card ${!available ? 'greyed-out' : ''}`}
      ref={componentRef}
    >
      {!!authData && authData.role === 'Преподаватель' && (
        <Stack direction="horizontal" gap={3} className="fs-6">
          <button
            className="settings-button ms-auto"
            onClick={() => {
              type === 'Test'
                ? navigate(`edit-test/${_id}`)
                : setTaskSettingsOpened(true);
            }}
          />
          <CloseButton onClick={() => handleDelete(_id)} />
        </Stack>
      )}
      <p className="task-number mb-3">
        {taskNumber != null
          ? `${TaskName[type]} №${taskNumber}`
          : TaskName[type]}
      </p>
      <p className="task-title mb-3">{name}</p>
      <p className="task-description mb-3">{description}</p>
      {!!taskFiles && (
        <>
          <p className="task-files">Файлы к работе</p>
          <Files
            taskFiles={taskFiles}
            clickable={true}
            taskFilesType="tasks"
            taskId={_id}
            videoOpened={videoOpened}
            setVideoName={setVideoName}
            setVideoOpened={setVideoOpened}
          />
        </>
      )}
      {type !== 'Test' && type !== 'Lecture' && reports === undefined && (
        <>
          <p className="task-report">Отчет о выполнении</p>
          <div className="dropzone" style={dropzoneStyle}>
            <div {...getRootProps({ className: 'dropzone-block' })}>
              <input {...getInputProps()} />
              <p
                style={{
                  position: 'absolute',
                  width: '100%',
                  textAlign: 'center',
                  bottom: '1.2em',
                  fontSize: '1.4em',
                  fontWeight: 300,
                }}
              >
                Загрузить отчет
              </p>
              <p
                style={{
                  width: '98%',
                  textAlign: 'right',
                  marginRight: '1em',
                  fontSize: '1em',
                  fontWeight: 100,
                  fontStyle: 'italic',
                }}
              >
                Формат файлов: .pdf, .doc, .docx, .zip, .rar, .png, .jpg, .ppt
              </p>
            </div>
            {files.length !== 0 && (
              <Files taskFiles={files.join('|')} clickable={false} />
            )}
          </div>
          <Row className="mb-3 g-0" hidden={!available}>
            <Col>
              <Button
                onClick={() => setUploadedFiles([])}
                disabled={addFilesMutation.isLoading}
              >
                Сбросить
              </Button>
            </Col>
            <Col>
              <Button
                onClick={async () => {
                  const idToken =
                    (await firebaseAuth.currentUser?.getIdToken(true)) || '0';

                  addFilesMutation.mutate({
                    idToken: idToken,
                    files: uploadedFiles,
                    setFiles: setUploadedFiles,
                    taskId: new mongoose.Types.ObjectId(_id),
                  });
                }}
                disabled={addFilesMutation.isLoading}
              >
                Загрузить
              </Button>
            </Col>
          </Row>
        </>
      )}
      {videoOpened && (
        <div className="mb-3">
          <p style={{ fontSize: '1.8em', fontWeight: '500' }} className="mb-3">
            Видео плеер
          </p>
          <ResponsivePlayer url={videoName} />
        </div>
      )}
      {!!reports && (
        <div className="mb-3">
          <p className="task-report">Файлы отчета</p>
          <Files
            taskFiles={reports}
            clickable={true}
            taskFilesType="reports"
            taskId={_id}
          />
        </div>
      )}
      {type === 'Test' && available && (
        <>
          {authData?.role === 'Студент' && (
            <Button
              onClick={() => {
                if (state === null) {
                  setConfirmTestOpened(true);
                } else if (state === 'Working') {
                  navigate(`test/${_id}`);
                } else if (state === 'Complete') {
                  navigate(`test/${_id}/results`);
                }
              }}
              className="mb-3"
            >
              {state !== 'Complete'
                ? `${state === null ? 'Пройти' : 'Продолжить'} тест`
                : 'Посмотреть результаты'}
            </Button>
          )}
          <ModalDialog
            message='Вы уверены, что хотите начать тест? После нажатия кнопки "Да" запустится таймер и начнется выполнение теста.'
            title="Подтвердите действие"
            action={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              startTestMutation.mutate({ idToken });
            }}
            modalEnabled={confirmTestOpened}
            handleClose={() => setConfirmTestOpened(false)}
            buttonsType="YesNo"
          />
        </>
      )}
      <div className="task-datetime">
        <p className="task-date">{`Дата проведения: ${
          date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
        }.${
          date.getMonth() + 1 < 10
            ? `0${date.getMonth() + 1}`
            : date.getMonth() + 1
        }.${date.getFullYear()}`}</p>
        <p className="task-time">{`Время проведения: ${getFormattedTime(
          beginningTime
        )}${settings.canEnd ? `-${getFormattedTime(endingTime)}` : ''}`}</p>
      </div>
      {!available && authData?.role === 'Студент' && (
        <div className="greybox"></div>
      )}
      {!!authData && authData.role === 'Преподаватель' && (
        <TaskSettings
          modalEnabled={taskSettingsOpened}
          handleClose={() => setTaskSettingsOpened(false)}
          taskId={_id}
          taskType={type}
          taskName={name}
          taskNumber={taskNumber}
          taskDescription={description}
          taskAvailability={available}
        />
      )}
    </div>
  );
}

export default Task;
