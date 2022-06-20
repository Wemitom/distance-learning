import { Form, ListGroupItem } from 'react-bootstrap';

function Answer({
  answerType,
  rightAnswer,
  setRightAnswer,
  answer,
  index,
  position,
  results = false,
}: {
  answerType: string;
  rightAnswer: number | number[] | string | null;
  setRightAnswer: (rightAnswer: number | number[] | string) => void;
  answer: string;
  index: number;
  position?: number;
  results?: boolean;
}) {
  const getComponent = (): JSX.Element => {
    switch (answerType) {
      case 'С несколькими вариантами':
        return (
          <Form.Check
            type="checkbox"
            label={answer}
            checked={
              typeof rightAnswer === 'object' && rightAnswer !== null
                ? rightAnswer.findIndex((value) => value === index) !== -1
                : typeof rightAnswer === 'string'
                ? rightAnswer
                    .split(',')
                    .findIndex((value) => +value === index) !== -1
                : false
            }
            id="answer-checkbox"
            name={`answers-${position}`}
            disabled={results}
            onChange={(e) => {
              if (typeof rightAnswer === 'object') {
                if (e.currentTarget.checked) {
                  if (rightAnswer === null) {
                    setRightAnswer([index]);
                  } else {
                    setRightAnswer(
                      [...rightAnswer, index].sort(
                        (firstValue, secondValue) => firstValue - secondValue
                      )
                    );
                  }
                } else {
                  const indexInArray = rightAnswer!.findIndex(
                    (value) => value === index
                  );

                  setRightAnswer(
                    [
                      ...rightAnswer!.filter((_, ind) => ind !== indexInArray),
                    ].sort(
                      (firstValue, secondValue) => firstValue - secondValue
                    )
                  );
                }
              }
            }}
          />
        );
      case 'С одним вариантом':
        return (
          <Form.Check
            type="radio"
            label={answer}
            checked={
              rightAnswer === index || (!!rightAnswer && +rightAnswer === index)
            }
            id="answer-radio"
            name={`answers-${position}`}
            disabled={results}
            onChange={(e) => {
              e.currentTarget.checked && setRightAnswer(index);
            }}
          />
        );
      case 'Текстовый':
        return (
          <Form.Control
            type="text"
            id="answer-text"
            placeholder="Введите ответ"
            disabled={results}
            value={rightAnswer?.toString() ?? ''}
            onChange={(e) => setRightAnswer(e.target.value)}
          />
        );
      default:
        return <Form.Control type="text" id="answer-text" className="mb-3" />;
    }
  };

  return <ListGroupItem>{getComponent()}</ListGroupItem>;
}

export default Answer;
