import axios from 'axios';
import { firebaseAuth } from './Firebase';
import { useEffect, useState } from 'react';
import { Button, Form, Modal, Spinner, Stack } from 'react-bootstrap';
import { useMutation, useQueryClient } from 'react-query';
import { Link, useParams } from 'react-router-dom';
import useReports from '../hooks/useReports';
import Files from './Files';

const GradeTaskModal = ({
  modalEnabled,
  handleClose,
  initGrade,
  initNote,
  uid,
  taskName,
  taskType,
  taskId,
  className,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
  initGrade: 0 | 2 | 3 | 4 | 5 | '-';
  initNote: string;
  uid: string;
  taskName: string;
  taskType: string;
  taskId: string;
  className: string;
}) => {
  const { classId } = useParams();
  const [grade, setGrade] = useState(initGrade);
  const [note, setNote] = useState(initNote);
  const { data } = useReports(uid, taskId, modalEnabled);
  const queryClient = useQueryClient();

  useEffect(() => {
    setGrade(initGrade);
    setNote(initNote);
  }, [initGrade, initNote]);

  const gradeTaskMutation = useMutation(
    ({ idToken }: { idToken: string }) => {
      return axios.patch(
        'http://localhost:5000/api/grades',
        {
          classId: classId,
          uid: uid,
          taskId: taskId,
          grade: grade,
          note: note,
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      );
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['grades', taskType, classId, className]);
        handleClose();
      },
    }
  );

  return (
    <Modal show={modalEnabled} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Оценивание</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {taskType !== 'Test' ? (
          <Form.Group className="mb-3">
            <Form.Label>Файлы отчета</Form.Label>
            {!!data ? (
              !!data.reports ? (
                <Files
                  taskFiles={data.reports}
                  clickable={true}
                  taskFilesType="reports"
                  taskId={taskId}
                  uid={uid}
                />
              ) : (
                <p className="text-center">Отчет не загружен</p>
              )
            ) : (
              <Stack className="align-items-center">
                <Spinner animation="border" variant="primary" />
              </Stack>
            )}
          </Form.Group>
        ) : (
          <Stack className="align-items-center">
            <Link
              to={`test-results/${taskId}/${uid}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>Посмотреть ответы</Button>
            </Link>
          </Stack>
        )}
        <Form.Group className="mb-3">
          <Form.Label>Оценка</Form.Label>
          <Form.Select
            value={grade}
            onChange={(e) =>
              setGrade(
                e.target.value === '-'
                  ? e.target.value
                  : (+e.target.value as 0 | 2 | 3 | 4 | 5)
              )
            }
          >
            <option>-</option>
            <option>0</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Комментарий</Form.Label>
          <Form.Control
            placeholder="Комментарий"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </Form.Group>
        <Stack className="mb-3">
          <Button
            onClick={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              gradeTaskMutation.mutate({ idToken });
            }}
          >
            Оценить
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  );
};

export default GradeTaskModal;
