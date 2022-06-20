import { Card } from 'react-bootstrap';
import Answers from './Answers';
import { QuestionInterface } from '../interfaces/interfaces';

const QuestionMultiple = ({
  position,
  question,
  type,
  answers,
  images,
  rightAnswer,
  chosenAnswer,
  setChosenAnswer,
  results,
  chosenResultAnswer,
}: QuestionInterface) => {
  return (
    <>
      <Card className="question-card mt-3">
        <Card.Header className="text-md-center">
          <Card.Title>{`Вопрос №${position}`}</Card.Title>
        </Card.Header>
        <Card.Body className="text-md-center">
          <Card.Text className="fs-6" style={{ minHeight: '5em' }}>
            {question}
          </Card.Text>
        </Card.Body>
        <Card.Footer className="p-0">
          <Answers
            answerType={type}
            answers={answers}
            rightAnswer={
              (!results || chosenResultAnswer === undefined) &&
              chosenAnswer !== undefined
                ? chosenAnswer
                : chosenResultAnswer || null
            }
            setRightAnswer={
              !results && !!setChosenAnswer
                ? (value) => setChosenAnswer(value, position)
                : () => {}
            }
            position={position}
            results={results}
          />
        </Card.Footer>
      </Card>
    </>
  );
};

export default QuestionMultiple;
