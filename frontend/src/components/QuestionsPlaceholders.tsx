import AddQuestionPlaceholder from './AddQuestionPlaceholder';
import { AnswerType, TestConfigInterface } from '../interfaces/interfaces';
import QuestionsPlaceholder from './QuestionsPlaceholder';

function QuestionsPlaceholders({
  testConfig,
  handleClose,
  setTestConfig,
  changeSettings,
}: {
  testConfig: TestConfigInterface;
  handleClose: (position: number) => void;
  setTestConfig: (testConfig: TestConfigInterface) => void;
  changeSettings: {
    position: (value: number, position: number) => void;
    question: (value: string, position: number) => void;
    images: (value: string[], postion: number) => void;
    type: (value: AnswerType, position: number) => void;
    answers: (value: string[], position: number) => void;
    weight: (value: number, position: number) => void;
    rightAnswer: (value: number | number[] | string, position: number) => void;
  };
}) {
  return (
    <div className="questions-placeholders">
      {testConfig.questions.map((question) => (
        <QuestionsPlaceholder
          key={question.position}
          questionConfig={question}
          handleClose={handleClose}
          changeSettings={changeSettings}
        />
      ))}
      <AddQuestionPlaceholder
        testConfig={testConfig}
        setTestConfig={(value) => setTestConfig(value)}
      />
    </div>
  );
}

export default QuestionsPlaceholders;
