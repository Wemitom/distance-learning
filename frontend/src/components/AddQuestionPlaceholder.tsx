import { TestConfigInterface } from '../interfaces/interfaces';
import { ReactComponent as PlusIcon } from '../icons/plus.svg';

function AddQuestionPlaceholder({
  testConfig,
  setTestConfig,
}: {
  testConfig: TestConfigInterface;
  setTestConfig: (testConfig: TestConfigInterface) => void;
}) {
  return (
    <div className="add-question-placeholder">
      <button
        onClick={() =>
          setTestConfig({
            questions: [
              ...testConfig.questions,
              {
                position: (testConfig.questions.pop()?.position || 0) + 1,
                question: '',
                type: 'С одним вариантом',
                answers: ['Ответ1', 'Ответ2'],
                images: [],
                rightAnswer: 0,
                weight: 1,
              },
            ],
          })
        }
      >
        <PlusIcon />
        <p>Добавить новый вопрос</p>
      </button>
    </div>
  );
}

export default AddQuestionPlaceholder;
