import axios from 'axios';
import { useState, FormEvent } from 'react';
import {
  Modal,
  Form,
  InputGroup,
  Button,
  Stack,
  Row,
  Col,
} from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import { useMutation } from 'react-query';
import { useParams } from 'react-router-dom';
import { firebaseAuth } from './Firebase';

const TestSettings = ({
  modalEnabled,
  handleClose,
  taskId,
  taskName,
  taskDescription,
  taskAvailability,
  testSettings,
  taskNumber,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
  taskId: string;
  taskName: string;
  taskDescription: string;
  taskAvailability: boolean;
  testSettings: {
    canEnd: boolean;
    testDuration?: number;
    autoReview?: boolean;
    graded?: boolean;
    freeMove?: boolean;
    gradePercentages?: number[];
  };
  taskNumber?: number;
}) => {
  const { classId } = useParams();
  const [newTaskName, setNewTaskName] = useState(taskName);
  const [newTaskNumber, setNewTaskNumber] = useState(taskNumber);
  const [newTaskDescription, setNewTaskDescription] = useState(taskDescription);
  const [newTaskAvailability, setNewTaskAvailability] =
    useState(taskAvailability);
  const [testDuration, setTestDuration] = useState(testSettings.testDuration);
  const [autoReview, setAutoReview] = useState(testSettings.autoReview);
  const [graded, setGraded] = useState(testSettings.graded);
  const [freeMove, setFreeMove] = useState(testSettings.freeMove);
  const [gradePercentages, setGradePercentages] = useState(
    testSettings.gradePercentages
  );
  const [validated, setValidated] = useState(false);

  const patchTestMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.patch(
        `https://distance-learning.herokuapp.com/api/tasks?classId=${classId}&taskId=${taskId}`,
        {
          taskNumber: newTaskNumber,
          name: newTaskName,
          description: newTaskDescription,
          available: newTaskAvailability,
          settings: {
            canEnd: testSettings.canEnd,
            testDuration: testDuration,
            autoReview: autoReview,
            graded: graded,
            freeMove: freeMove,
            gradePercentages: gradePercentages,
          },
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      ),
    {
      onSuccess: async () => {
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
      patchTestMutation.mutate({ idToken });
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
          <Form.Group className="mb-3" controlId="validationName">
            <Form.Label>Название</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                disabled={patchTestMutation.isLoading}
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
              <InputGroup.Text id="addon1">Тест №</InputGroup.Text>
              <Form.Control
                type="number"
                placeholder="Номер"
                aria-describedby="addon1"
                disabled={patchTestMutation.isLoading}
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
                disabled={patchTestMutation.isLoading}
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>
          <Row>
            <Col>
              {!!gradePercentages &&
                gradePercentages.map((percentage, index) => (
                  <Form.Group className="mb-3" key={index}>
                    <Form.Label>{`Процентов выполнения для ${
                      index + 2
                    }`}</Form.Label>
                    <InputGroup>
                      <RangeSlider
                        value={percentage}
                        min={index !== 0 ? gradePercentages[index - 1] + 1 : 0}
                        max={
                          index !== gradePercentages.length - 1
                            ? gradePercentages[index + 1] - 1
                            : 100
                        }
                        disabled={patchTestMutation.isLoading}
                        onChange={(e) =>
                          setGradePercentages(
                            gradePercentages.map((percentage, i) => {
                              if (i === index) {
                                return +e.target.value;
                              }

                              return percentage;
                            })
                          )
                        }
                      />
                    </InputGroup>
                  </Form.Group>
                ))}
            </Col>
            <Col>
              <Form.Group className="mb-5">
                <Form.Check
                  type="switch"
                  id="auto-review"
                  label="Автопроверка"
                  disabled={patchTestMutation.isLoading}
                  checked={autoReview}
                  onChange={(e) => setAutoReview(e.target.checked)}
                />
              </Form.Group>
              <Form.Group className="mb-5">
                <Form.Check
                  type="switch"
                  id="test-graded"
                  label="На оценку"
                  disabled={patchTestMutation.isLoading}
                  checked={graded}
                  onChange={(e) => setGraded(e.target.checked)}
                />
              </Form.Group>
              <Form.Group className="mb-5">
                <Form.Check
                  type="switch"
                  id="free-move"
                  label="Свободное перемещение между вопросами во время выполнения"
                  disabled={patchTestMutation.isLoading}
                  checked={freeMove}
                  onChange={(e) => setFreeMove(e.target.checked)}
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Продолжительность теста</Form.Label>
            <Form.Control
              type="number"
              min={1}
              max={240}
              value={testDuration}
              disabled={patchTestMutation.isLoading}
              placeholder="Продолжительность теста"
              onChange={(e) => setTestDuration(+e.target.value)}
            />
          </Form.Group>
          <Stack className="align-items-center">
            <Form.Group className="mb-3" controlId="validationDescription">
              <Form.Label>Доступность теста</Form.Label>
              <InputGroup className="justify-content-center">
                <Form.Check
                  type="switch"
                  disabled={patchTestMutation.isLoading}
                  checked={newTaskAvailability}
                  onChange={(e) => setNewTaskAvailability(!newTaskAvailability)}
                />
              </InputGroup>
            </Form.Group>
          </Stack>
          <Button type="submit" disabled={patchTestMutation.isLoading}>
            Сохранить
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default TestSettings;
