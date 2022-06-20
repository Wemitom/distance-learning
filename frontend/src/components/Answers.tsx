import { ListGroup } from 'react-bootstrap';
import Answer from './Answer';

function Answers({
  answerType,
  answers,
  rightAnswer,
  setRightAnswer,
  position,
  results,
}: {
  answerType: string;
  answers: string[];
  rightAnswer: number | number[] | string | null;
  setRightAnswer: (rightAnswer: number | number[] | string) => void;
  position: number;
  results?: boolean;
}) {
  return (
    <>
      {answerType === 'Текстовый' ? (
        <Answer
          answerType={answerType}
          rightAnswer={rightAnswer}
          setRightAnswer={setRightAnswer}
          answer=""
          index={0}
          results={results}
        />
      ) : (
        <ListGroup variant="flush" className="fs-6">
          {answers.map((answer, index) => (
            <Answer
              key={index}
              answerType={answerType}
              rightAnswer={rightAnswer}
              setRightAnswer={setRightAnswer}
              answer={answer}
              index={index}
              position={position}
              results={results}
            />
          ))}
        </ListGroup>
      )}
    </>
  );
}

export default Answers;
