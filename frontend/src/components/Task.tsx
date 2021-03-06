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
          '?????? ???????????????? ???????????? ?????????????????? ????????????, ???????????????????? ?????? ??????.',
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
          '?????? ???????????????? ???????????? ?????????????????? ????????????, ???????????????????? ?????? ??????.',
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
      onSuccess: ({ data }) => navigate(`test/${_id}`),
      onError: () => {
        toast.error('?????? ???????????? ?????????? ?????????????????? ????????????, ???????????????????? ?????? ??????.', {
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
      {!!authData && authData.role === '??????????????????????????' && (
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
          ? `${TaskName[type]} ???${taskNumber}`
          : TaskName[type]}
      </p>
      <p className="task-title mb-3">{name}</p>
      <p className="task-description mb-3">{description}</p>
      {!!taskFiles && (
        <>
          <p className="task-files">?????????? ?? ????????????</p>
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
          <p className="task-report">?????????? ?? ????????????????????</p>
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
                ?????????????????? ??????????
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
                ???????????? ????????????: .pdf, .doc, .docx, .zip, .rar, .png, .jpg, .ppt
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
                ????????????????
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
                ??????????????????
              </Button>
            </Col>
          </Row>
        </>
      )}
      {videoOpened && (
        <div className="mb-3">
          <p style={{ fontSize: '1.8em', fontWeight: '500' }} className="mb-3">
            ?????????? ??????????
          </p>
          <ResponsivePlayer url={videoName} />
        </div>
      )}
      {!!reports && (
        <div className="mb-3">
          <p className="task-report">?????????? ????????????</p>
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
          {authData?.role === '??????????????' && (
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
                ? `${state === null ? '????????????' : '????????????????????'} ????????`
                : '???????????????????? ????????????????????'}
            </Button>
          )}
          <ModalDialog
            message='???? ??????????????, ?????? ???????????? ???????????? ????????? ?????????? ?????????????? ???????????? "????" ???????????????????? ???????????? ?? ???????????????? ???????????????????? ??????????.'
            title="?????????????????????? ????????????????"
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
        <p className="task-date">{`???????? ????????????????????: ${
          date.getDate() < 10 ? `0${date.getDate()}` : date.getDate()
        }.${
          date.getMonth() + 1 < 10
            ? `0${date.getMonth() + 1}`
            : date.getMonth() + 1
        }.${date.getFullYear()}`}</p>
        <p className="task-time">{`?????????? ????????????????????: ${getFormattedTime(
          beginningTime
        )}${settings.canEnd ? `-${getFormattedTime(endingTime)}` : ''}`}</p>
      </div>
      {!available && authData?.role === '??????????????' && (
        <div className="greybox"></div>
      )}
      {!!authData && authData.role === '??????????????????????????' && (
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
