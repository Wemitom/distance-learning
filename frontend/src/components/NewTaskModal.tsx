import { useState, FormEvent, useEffect } from 'react';
import {
  Modal,
  Form,
  InputGroup,
  Button,
  Collapse,
  Row,
  Col,
} from 'react-bootstrap';
import { TaskName, TaskType } from '../interfaces/interfaces';
import { useDropzone } from 'react-dropzone';
import Files from './Files';
import RangeSlider from 'react-bootstrap-range-slider';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { firebaseAuth } from './Firebase';
import mongoose from 'mongoose';
import { useNavigate, useParams } from 'react-router-dom';

function NewTaskModal({
  modalEnabled,
  handleClose,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
}) {
  const { classId } = useParams();
  const [partOneInputsOn, setPartOneInputsOn] = useState(true);
  const [taskType, setTaskType] = useState<TaskType>('Lecture');
  const [taskName, setTaskName] = useState('');
  const [taskNumber, setTaskNumber] = useState(1);
  const [taskDescription, setTaskDescription] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [beginningTime, setBeginningTime] = useState('');
  const [canEnd, setCanEnd] = useState(true);
  const [endingTime, setEndingTime] = useState('');
  const [firstPartValidated, setFirstPartValidated] = useState(false);
  const [secondPartValidated, setSecondPartValidated] = useState(false);
  const [gradePercentages, setGradePercentages] = useState([0, 40, 70, 90]);
  const [autoReview, setAutoReview] = useState(true);
  const [graded, setGraded] = useState(true);
  const [freeMove, setFreeMove] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [testDuration, setTestDuration] = useState(1);
  const { acceptedFiles, getRootProps, getInputProps } = useDropzone({
    accept: '.pdf,.docx,.doc,.zip,.rar,.mp4',
  });
  const files = uploadedFiles.map((file) => file.name);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const taskId = new mongoose.Types.ObjectId();

  useEffect(() => {
    setUploadedFiles((files) => [...files, ...acceptedFiles]);
  }, [acceptedFiles]);

  const addTaskMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.post(
        `https://distance-learning.herokuapp.com/api/tasks?classId=${classId}`,
        {
          _id: taskId.toString(),
          type: taskType,
          taskNumber: taskNumber,
          name: taskName,
          description: taskDescription,
          taskFiles: files.join('|'),
          taskDate: taskDate,
          beginningTime: `${taskDate}T${beginningTime}`,
          endingTime: `${taskDate}T${endingTime}`,
          settings: {
            canEnd: canEnd,
            testDuration: taskType === 'Test' ? testDuration : undefined,
            autoReview: taskType === 'Test' ? autoReview : undefined,
            graded: taskType === 'Test' ? graded : undefined,
            freeMove: taskType === 'Test' ? freeMove : undefined,
            gradePercentages:
              taskType === 'Test' ? gradePercentages : undefined,
          },
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      ),
    {
      onSuccess: async (_, { idToken }) => {
        if (taskType !== 'Test') {
          await addFilesMutation.mutate({
            files: uploadedFiles,
            setFiles: setUploadedFiles,
            taskId: taskId,
            idToken: idToken,
          });
        } else {
          navigate(`edit-test/${taskId}`);
        }
        queryClient.invalidateQueries(['tasks', taskType]);
      },
    }
  );

  const addFilesMutation = useMutation(
    ({
      files,
      setFiles,
      taskId,
      idToken,
    }: {
      files: File[];
      setFiles: (files: File[]) => void;
      taskId: mongoose.Types.ObjectId;
      idToken: string;
    }): Promise<void> => {
      const formData = new FormData();
      files.forEach((file, index) => formData.append(`file${index}`, file));

      if (files.length !== 0) {
        return axios.post(
          `https://distance-learning.herokuapp.com/api/files?type=tasks&taskId=${taskId}`,
          formData,
          {
            headers: {
              'Content-type': 'multipart/form-data',
              Authorization: idToken,
            },
          }
        );
      } else {
        return Promise.reject('No files to upload');
      }
    },
    {
      onSuccess: (_, { setFiles }) => {
        setFiles([]);
        handleClose();
      },
    }
  );

  const handleSubmitPartOne = (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      setPartOneInputsOn(false);
    }

    setFirstPartValidated(true);
    setSecondPartValidated(false);
  };

  const handleSubmitPartTwo = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(false)) || '';
      addTaskMutation.mutate({ idToken });
    }
    setSecondPartValidated(true);
  };

  const dropzoneStyle = {
    height: files.length !== 0 ? '14em' : '8.4em',
    gridTemplateRows: files.length !== 0 ? '60% 40%' : '100%',
  };

  return (
    <Modal show={modalEnabled} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Добавление нового задания</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form
          noValidate
          validated={firstPartValidated}
          onSubmit={handleSubmitPartOne}
        >
          <Form.Group className="mb-3" controlId="formTaskType">
            <Form.Label>Тип задания</Form.Label>
            <Form.Select
              defaultValue={taskType}
              onChange={(e) => setTaskType(e.target.value as TaskType)}
              disabled={!partOneInputsOn}
            >
              <option value={'Lecture' as TaskType}>Лекции</option>
              <option value={'Homework' as TaskType}>Домашнее задание</option>
              <option value="Labs">Лабораторная работа</option>
              <option value="Test">Тест</option>
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="validationName">
            <Form.Label>{'Название'}</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Название"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
                disabled={!partOneInputsOn}
                required
              />
            </InputGroup>
          </Form.Group>
          <Form.Group
            hidden={!partOneInputsOn}
            className="mb-3"
            style={{ display: 'flex' }}
          >
            <Button
              className="mx-auto"
              variant="primary"
              type="submit"
              aria-expanded={!partOneInputsOn}
            >
              Далее
            </Button>
          </Form.Group>
        </Form>
        <Collapse in={!partOneInputsOn}>
          <Form
            noValidate
            validated={secondPartValidated}
            onSubmit={handleSubmitPartTwo}
          >
            <Form.Group className="mb-3" controlId="validationNumber">
              <Form.Label>Номер</Form.Label>
              <InputGroup>
                <InputGroup.Text id="addon1">{`${TaskName[taskType]} №`}</InputGroup.Text>
                <Form.Control
                  type="number"
                  placeholder="Номер"
                  aria-describedby="addon1"
                  value={taskNumber}
                  disabled={
                    addTaskMutation.isLoading || addFilesMutation.isLoading
                  }
                  onChange={(e) => setTaskNumber(+e.target.value)}
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
                  value={taskDescription}
                  disabled={
                    addTaskMutation.isLoading || addFilesMutation.isLoading
                  }
                  onChange={(e) => setTaskDescription(e.target.value)}
                  required
                />
              </InputGroup>
            </Form.Group>
            {taskType !== 'Test' ? (
              <>
                <Form.Group className="mb-3" controlId="formFiles">
                  <Form.Label>Файлы</Form.Label>
                  <div className="dropzone-modal" style={dropzoneStyle}>
                    <div {...getRootProps({ className: 'dropzone-block' })}>
                      <input {...getInputProps()} />
                      <p
                        style={{
                          position: 'absolute',
                          width: '100%',
                          textAlign: 'center',
                          bottom: '0.6em',
                          fontSize: '1em',
                          fontWeight: 300,
                        }}
                      >
                        Загрузить файлы
                      </p>
                      <p
                        style={{
                          width: '98%',
                          textAlign: 'right',
                          marginRight: '1em',
                          fontSize: '0.7em',
                          fontWeight: 100,
                          fontStyle: 'italic',
                        }}
                      >
                        Формат файлов: .pdf, .doc, .docx, .zip, .rar, .mp4
                      </p>
                      <p
                        style={{
                          width: '98%',
                          textAlign: 'right',
                          marginRight: '1em',
                          fontSize: '0.7em',
                          fontWeight: 100,
                          fontStyle: 'italic',
                        }}
                      >
                        Максимальный размер 10 Мб
                      </p>
                    </div>
                    {files.length !== 0 && (
                      <Files taskFiles={files.join('|')} clickable={false} />
                    )}
                  </div>
                  <Row className="justify-content-center mt-3">
                    <Button
                      className="w-25"
                      onClick={() => setUploadedFiles([])}
                      disabled={
                        addTaskMutation.isLoading || addFilesMutation.isLoading
                      }
                    >
                      Сбросить
                    </Button>
                  </Row>
                </Form.Group>
              </>
            ) : (
              <>
                <Row>
                  <Col>
                    {gradePercentages.map((percentage, index) => (
                      <Form.Group className="mb-3" key={index}>
                        <Form.Label>{`Процентов выполнения для ${
                          index + 2
                        }`}</Form.Label>
                        <InputGroup>
                          <RangeSlider
                            value={percentage}
                            disabled={
                              addTaskMutation.isLoading ||
                              addFilesMutation.isLoading
                            }
                            min={
                              index !== 0 ? gradePercentages[index - 1] + 1 : 0
                            }
                            max={
                              index !== gradePercentages.length - 1
                                ? gradePercentages[index + 1] - 1
                                : 100
                            }
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
                        checked={autoReview}
                        disabled={
                          addTaskMutation.isLoading ||
                          addFilesMutation.isLoading
                        }
                        onChange={(e) => setAutoReview(e.target.checked)}
                      />
                    </Form.Group>
                    <Form.Group className="mb-5">
                      <Form.Check
                        type="switch"
                        id="test-graded"
                        label="На оценку"
                        checked={graded}
                        disabled={
                          addTaskMutation.isLoading ||
                          addFilesMutation.isLoading
                        }
                        onChange={(e) => setGraded(e.target.checked)}
                      />
                    </Form.Group>
                    <Form.Group className="mb-5">
                      <Form.Check
                        type="switch"
                        id="free-move"
                        label="Свободное перемещение между вопросами во время выполнения"
                        checked={freeMove}
                        disabled={
                          addTaskMutation.isLoading ||
                          addFilesMutation.isLoading
                        }
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
                    placeholder="Продолжительность теста"
                    onChange={(e) => setTestDuration(+e.target.value)}
                  />
                </Form.Group>
              </>
            )}

            <Form.Group controlId="validationBeginingDateTime" className="mb-3">
              <Row>
                <Col>
                  <Form.Label>Дата проведения</Form.Label>
                  <Form.Control
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    disabled={
                      addTaskMutation.isLoading || addFilesMutation.isLoading
                    }
                    required
                  />
                </Col>
              </Row>
            </Form.Group>

            <Form.Group controlId="validationEndingDateTime" className="mb-3">
              <Row>
                <Col>
                  <Form.Label>{'Время начала'}</Form.Label>
                  <Form.Control
                    type="time"
                    value={beginningTime}
                    onChange={(e) => setBeginningTime(e.target.value)}
                    disabled={
                      addTaskMutation.isLoading || addFilesMutation.isLoading
                    }
                    required
                  />
                </Col>
                <Col>
                  <Form.Label>{'Время конца'}</Form.Label>
                  <InputGroup>
                    <InputGroup.Checkbox
                      checked={canEnd}
                      onChange={() => setCanEnd(!canEnd)}
                    />
                    <Form.Control
                      type="time"
                      value={endingTime}
                      onChange={(e) => setEndingTime(e.target.value)}
                      disabled={
                        addTaskMutation.isLoading ||
                        addFilesMutation.isLoading ||
                        !canEnd
                      }
                      required
                    />
                  </InputGroup>
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Row>
                <Col>
                  <Button
                    className="mx-auto"
                    variant="primary"
                    aria-expanded={partOneInputsOn}
                    disabled={
                      addTaskMutation.isLoading || addFilesMutation.isLoading
                    }
                    onClick={(e) => {
                      setFirstPartValidated(false);
                      setPartOneInputsOn(true);
                    }}
                  >
                    Назад
                  </Button>
                </Col>
                <Col>
                  <Button
                    className="mx-auto"
                    variant="primary"
                    type="submit"
                    style={{ float: 'right' }}
                    disabled={
                      addTaskMutation.isLoading || addFilesMutation.isLoading
                    }
                  >
                    Далее
                  </Button>
                </Col>
              </Row>
            </Form.Group>
          </Form>
        </Collapse>
      </Modal.Body>
    </Modal>
  );
}

export default NewTaskModal;
