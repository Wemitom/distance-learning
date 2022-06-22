import axios from 'axios';
import { useState, FormEvent } from 'react';
import { Modal, Form, InputGroup, Button, Stack } from 'react-bootstrap';
import { useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import { TaskName, TaskType } from '../interfaces/interfaces';
import { firebaseAuth } from './Firebase';

const TaskSettings = ({
  modalEnabled,
  handleClose,
  taskId,
  taskType,
  taskName,
  taskDescription,
  taskAvailability,
  taskNumber,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
  taskId: string;
  taskType: TaskType;
  taskName: string;
  taskDescription: string;
  taskAvailability: boolean;
  taskNumber?: number;
}) => {
  const { classId } = useParams();
  const queryClient = useQueryClient();
  const [newTaskType, setNewTaskType] = useState<TaskType>(taskType);
  const [newTaskName, setNewTaskName] = useState(taskName);
  const [newTaskNumber, setNewTaskNumber] = useState(taskNumber);
  const [newTaskDescription, setNewTaskDescription] = useState(taskDescription);
  const [newTaskAvailability, setNewTaskAvailability] =
    useState(taskAvailability);
  const [validated, setValidated] = useState(false);

  const patchTaskMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.patch(
        `https://distance-learning.herokuapp.com/api/tasks?classId=${classId}&taskId=${taskId}`,
        {
          type: newTaskType,
          taskNumber: newTaskNumber,
          name: newTaskName,
          description: newTaskDescription,
          available: newTaskAvailability,
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      ),
    {
      onSuccess: async () => {
        queryClient.invalidateQueries(['tasks', taskType]);
        handleClose();
      },
    }
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(false)) || '';
      patchTaskMutation.mutate({ idToken });
    }
    setValidated(true);
  };

  return (
    <Modal show={modalEnabled} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Настройки</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="formTaskType">
            <Form.Label>Тип задания</Form.Label>
            <Form.Select
              defaultValue={newTaskType}
              disabled={patchTaskMutation.isLoading}
              onChange={(e) => setNewTaskType(e.target.value as TaskType)}
            >
              <option value={'Lecture' as TaskType}>Лекции</option>
              <option value={'Homework' as TaskType}>Домашнее задание</option>
              <option value="Labs">Лабораторная работа</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="validationName">
            <Form.Label>Название</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                disabled={patchTaskMutation.isLoading}
                placeholder="Название"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3" controlId="validationNumber">
            <Form.Label>Номер</Form.Label>
            <InputGroup>
              <InputGroup.Text id="addon1">{`${TaskName[newTaskType]} №`}</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder="Номер"
                aria-describedby="addon1"
                disabled={patchTaskMutation.isLoading}
                value={newTaskNumber}
                onChange={(e) => setNewTaskNumber(+e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3" controlId="validationDescription">
            <Form.Label>Описание</Form.Label>
            <InputGroup>
              <Form.Control
                as="textarea"
                placeholder="Описание"
                disabled={patchTaskMutation.isLoading}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>
          <Stack className="align-items-center">
            <Form.Group className="mb-3" controlId="validationDescription">
              <Form.Label>Доступность задания</Form.Label>
              <InputGroup className="justify-content-center">
                <Form.Check
                  type="switch"
                  disabled={patchTaskMutation.isLoading}
                  checked={newTaskAvailability}
                  onChange={(e) => setNewTaskAvailability(!newTaskAvailability)}
                />
              </InputGroup>
            </Form.Group>
            <Button type="submit" disabled={patchTaskMutation.isLoading}>
              Сохранить
            </Button>
          </Stack>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TaskSettings;
