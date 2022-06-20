import { useParams } from 'react-router-dom';
import useTestConfig from '../hooks/useTestConfig';
import QuestionMultiple from './QuestionMultiple';

const AnswersCards = ({ answers }: { answers: string[] }) => {
  const { testId } = useParams();
  const { data } = useTestConfig(testId || '');

  return (
    <div>
      {!!data &&
        data.questions.map((questionInfo, index) => (
          <div key={`question_${questionInfo.position}`}>
            <QuestionMultiple
              position={questionInfo.position}
              question={questionInfo.question}
              type={questionInfo.type}
              answers={questionInfo.answers}
              images={questionInfo.images}
              weight={0}
              rightAnswer={questionInfo.rightAnswer}
              results={true}
              chosenResultAnswer={answers[index]}
            />
          </div>
        ))}
    </div>
  );
};

export default AnswersCards;
