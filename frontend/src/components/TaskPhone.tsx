import { TaskCard, TaskName } from '../interfaces/interfaces';
import { useDropzone } from 'react-dropzone';
import Files from './Files';
import { ReactComponent as ExpandIcon } from '../icons/expand.svg';
import { useEffect, useState } from 'react';
import {
  Button,
  Col,
  Collapse,
  Row,
  Stack,
  CloseButton,
} from 'react-bootstrap';
import { firebaseAuth } from './Firebase';
import axios from 'axios';
import { useMutation, useQueryClient } from 'react-query';
import mongoose from 'mongoose';
import ModalDialog from './ModalDialog';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useAuth from '../hooks/useAuth';
import ResponsivePlayer from './ResponsivePlayer';
import TaskSettings from './TaskSettings';

function TaskPhone({
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
  const files = uploadedFiles.map((file) => file.name);
  const { data: authData } = useAuth(firebaseAuth.currentUser?.uid, false);
  const date = new Date(taskDate);
  const [cardExpanded, setCardExpanded] = useState<boolean>(false);
  const navigate = useNavigate();

  const dropzoneStyle = {
    height: files.length !== 0 ? '16em' : '9.6em',
    gridTemplateRows: files.length !== 0 ? '60% 40%' : '100%',
  };

  useEffect(() => {
    setUploadedFiles((files) => [...files, ...acceptedFiles]);
  }, [acceptedFiles]);

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
          `https://distance-learning.herokuapp.com/api/files?type=reports&taskId=${taskId}&classId=${classId}`,
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
        `https://distance-learning.herokuapp.com/api/tasks?change=report&classId=${classId}`,
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
        `https://distance-learning.herokuapp.com/api/test/start?_id=${_id}`,
        {},
        { headers: { Authorization: idToken } }
      ),
    {
      onSuccess: () => navigate(`test/${_id}`),
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
    <>
      <div
        className={`task-card-phone${!available ? ' greyed-out' : ''}`}
        style={{ height: authData?.role === 'Преподаватель' ? '10em' : '8em' }}
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
        <p className="task-number">
          {taskNumber != null
            ? `${TaskName[type]} №${taskNumber}`
            : TaskName[type]}
        </p>
        <button
          className={`expand-button${cardExpanded ? ' btn-pressed' : ''}`}
          aria-expanded={cardExpanded}
          aria-controls="collapsed-card"
          disabled={!available}
          onClick={() => setCardExpanded(!cardExpanded)}
        >
          <ExpandIcon />
        </button>
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
        {!available && <div className="greybox"></div>}
      </div>
      {available && (
        <Collapse in={cardExpanded}>
          <div className="collapsed-card">
            <p className="task-title mb-3">{name}</p>
            <p className="task-description mb-3">{description}</p>
            {taskFiles !== undefined && (
              <div className="mb-3">
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
              </div>
            )}
            {videoOpened && (
              <div className="mb-3">
                <p
                  style={{ fontSize: '1.8em', fontWeight: '500' }}
                  className="mb-3"
                >
                  Видео плеер
                </p>
                <ResponsivePlayer url={videoName} />
              </div>
            )}
            {type !== 'Test' && type !== 'Lecture' && reports === undefined && (
              <>
                <p className="task-report">{'Отчет о выполнении'}</p>
                <div className="dropzone-phone" style={dropzoneStyle}>
                  <div {...getRootProps({ className: 'dropzone-block' })}>
                    <input {...getInputProps()} />
                    <p
                      style={{
                        position: 'absolute',
                        width: '100%',
                        textAlign: 'center',
                        bottom: '0.4em',
                        fontSize: '1.2em',
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
                        fontSize: '0.8em',
                        fontWeight: 100,
                        fontStyle: 'italic',
                      }}
                    >
                      Формат файлов: .pdf, .doc, .docx, .zip, .rar
                    </p>
                  </div>
                  {files.length !== 0 && (
                    <Files taskFiles={files.join('|')} clickable={false} />
                  )}
                </div>
                <Row className="mb-3 g-0">
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
                          (await firebaseAuth.currentUser?.getIdToken(true)) ||
                          '0';
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
          </div>
        </Collapse>
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
    </>
  );
}

export default TaskPhone;
