import { useState } from 'react';
import { Card, CloseButton, Stack } from 'react-bootstrap';
import { AnswerType, QuestionInterface } from '../interfaces/interfaces';
import { Form } from 'react-bootstrap';
import Answers from './Answers';
import QuestionModal from './QuestionModal';
import ModalDialog from './ModalDialog';

function QuestionsPlaceholder({
  questionConfig,
  handleClose,
  changeSettings,
}: {
  questionConfig: QuestionInterface;
  handleClose: (position: number) => void;
  changeSettings: {
    position: (value: number, position: number) => void;
    question: (value: string, position: number) => void;
    type: (value: AnswerType, position: number) => void;
    answers: (value: string[], position: number) => void;
    images: (value: string[], position: number) => void;
    rightAnswer: (value: number | number[] | string, position: number) => void;
    weight: (value: number, position: number) => void;
  };
}) {
  const [modalId, setModalId] = useState(0);
  const [closePressed, setClosePressed] = useState(false);
  const [settingsOpened, setSettingsOpened] = useState(false);

  return (
    <>
      <Card className="mb-3">
        <Card.Header>
          <Card.Title>
            {
              <Stack direction="horizontal" gap={3}>
                <p>{`Вопрос №${questionConfig.position}`}</p>
                <button
                  className="settings-button ms-auto"
                  onClick={() => {
                    setModalId(modalId + 1);
                    setSettingsOpened(true);
                  }}
                />
                <CloseButton onClick={() => setClosePressed(true)} />
              </Stack>
            }
          </Card.Title>
        </Card.Header>
        <Form.Group controlId="formQuestion">
          <Form.Control
            as="textarea"
            placeholder="Введите вопрос"
            className="border-0"
            value={questionConfig.question}
            style={{ height: '7em' }}
            onChange={(e) =>
              changeSettings.question(e.target.value, questionConfig.position)
            }
          />
        </Form.Group>
        <Answers
          answerType={questionConfig.type}
          answers={questionConfig.answers}
          rightAnswer={questionConfig.rightAnswer}
          setRightAnswer={(value) =>
            changeSettings.rightAnswer(value, questionConfig.position)
          }
          position={questionConfig.position}
        />
      </Card>
      <QuestionModal
        key={modalId}
        modalEnabled={settingsOpened}
        handleClose={() => setSettingsOpened(false)}
        images={questionConfig.images}
        type={questionConfig.type}
        answers={questionConfig.answers}
        weight={questionConfig.weight}
        setters={{
          setImages: (value) =>
            changeSettings.images(value, questionConfig.position),
          setType: (value) =>
            changeSettings.type(value, questionConfig.position),
          setAnswers: (value) =>
            changeSettings.answers(value, questionConfig.position),
          setWeight: (value) =>
            changeSettings.weight(value, questionConfig.position),
          setRightAnswer: (value) =>
            changeSettings.rightAnswer(value, questionConfig.position),
        }}
      />
      <ModalDialog
        message="Вы действительно хотите удалить данный вопрос?"
        title={'Удаление'}
        action={(position) => handleClose(position)}
        modalEnabled={closePressed}
        handleClose={() => setClosePressed(false)}
        buttonsType="YesNo"
        actionParams={[questionConfig.position]}
      />
    </>
  );
}

export default QuestionsPlaceholder;
