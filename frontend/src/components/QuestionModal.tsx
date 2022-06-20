import { useState, FormEvent } from 'react';
import { Modal, Form, InputGroup, Button } from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';
import { AnswerType } from '../interfaces/interfaces';

function QuestionModal({
  modalEnabled,
  handleClose,
  images,
  type,
  answers,
  weight,
  setters,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
  images: string[];
  type: AnswerType;
  answers: string[];
  weight: number;
  setters: {
    setImages: (images: string[]) => void;
    setType: (answerType: AnswerType) => void;
    setAnswers: (answers: string[]) => void;
    setWeight: (questionWeight: number) => void;
    setRightAnswer: (rightAnswer: number | number[] | string) => void;
  };
}) {
  const [validated, setValidated] = useState(false);
  const [newImages, ] = useState<string[]>([]);
  const [newType, setNewType] = useState(type);
  const [newAnswers, setNewAnswers] = useState(answers);
  const [newWeight, setNewWeight] = useState(weight);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    setValidated(true);
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      switch (newType) {
        case 'С одним вариантом':
          setters.setAnswers(setToCount(2));
          setters.setRightAnswer(0);
          break;
        case 'С несколькими вариантами':
          setters.setAnswers(setToCount(2));
          setters.setRightAnswer([0]);
          break;
        case 'Текстовый':
          setters.setAnswers(setToCount(1));
          setters.setRightAnswer('');
          break;
      }
      setters.setImages(newImages);
      setters.setType(newType);
      setters.setAnswers(newAnswers);
      setters.setWeight(newWeight);

      handleClose();
    }
  };

  const setToCount = (count: number) =>
    Array.apply('', Array(count)).map((_, index) => {
      const newValue: string | undefined = answers[index];
      if (newValue === undefined) {
        return '';
      } else {
        return newValue;
      }
    });

  return (
    <Modal show={modalEnabled} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Настройки</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form noValidate validated={validated} onSubmit={handleSubmit}>
          <Form.Group className="mb-3" controlId="validationImgCount">
            <Form.Label>Тип вопроса</Form.Label>
            <Form.Select
              defaultValue={newType}
              onChange={(e) => {
                setNewType(e.target.value as AnswerType);
              }}
            >
              <option value="С одним вариантом">
                С одним вариантом ответа
              </option>
              <option value="С несколькими вариантами">
                С несколькими вариантами ответа
              </option>
              <option value="Текстовый">Текстовый</option>
            </Form.Select>
          </Form.Group>
          {newType !== 'Текстовый' && (
            <>
              <Form.Group className="mb-3" controlId="validationAnswersCount">
                <Form.Label>Количество ответов</Form.Label>
                <InputGroup>
                  <RangeSlider
                    value={newAnswers.length}
                    min={2}
                    max={8}
                    onChange={(e) => {
                      setNewAnswers(setToCount(+e.target.value));
                    }}
                  />
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-1" controlId="validationAnswers">
                <Form.Label>{'Ответы'}</Form.Label>
                {newAnswers.map((answer, index) => (
                  <div key={index}>
                    <Form.Group className="mb-3">
                      <InputGroup>
                        <InputGroup.Text id="addon-answer">{`Ответ №${
                          index + 1
                        }`}</InputGroup.Text>
                        <Form.Control
                          type="text"
                          aria-describedby="addon-answer"
                          value={answer}
                          onChange={(e) =>
                            setNewAnswers([
                              ...newAnswers.slice(0, index),
                              e.target.value,
                              ...newAnswers.slice(index + 1),
                            ])
                          }
                          required
                        />
                      </InputGroup>
                    </Form.Group>
                  </div>
                ))}
              </Form.Group>
            </>
          )}
          <Form.Group className="mb-3" controlId="validationWeight">
            <Form.Label>Вес вопроса</Form.Label>
            <InputGroup>
              <Form.Control
                type="number"
                value={newWeight}
                min={1}
                onChange={(e) => setNewWeight(+e.target.value)}
                required
              />
            </InputGroup>
          </Form.Group>
          <Form.Group className="mb-3">
            <div
              style={{ display: 'flex' }}
              className="justify-content-md-center"
            >
              <Button type="submit" className="mx-auto" variant="primary">
                Сохранить
              </Button>
            </div>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default QuestionModal;
