import ButtonsSidebar from '../ButtonsSidebar';
import Header from '../Header';
import QuestionsPlaceholders from '../QuestionsPlaceholders';
import { ReactComponent as SettingsIcon } from '../../icons/cogwheel.svg';
import { ReactComponent as DraftIcon } from '../../icons/draft.svg';
import { ReactComponent as CheckIcon } from '../../icons/check.svg';
import { useNavigate, useParams } from 'react-router-dom';
import useTestConfig from '../../hooks/useTestConfig';
import { TestConfigInterface } from '../../interfaces/interfaces';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { firebaseAuth } from '../Firebase';
import { Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import useClassName from '../../hooks/useClassName';
import TestSettings from '../TestSettings';
import useTask from '../../hooks/useTask';

function TestEditPage() {
  const { testId, classId } = useParams();
  const queryClient = useQueryClient();
  const { isLoading, isError, data } = useTestConfig(testId || '');
  const [testConfig, setTestConfig] = useState<TestConfigInterface>(
    data || { questions: [] }
  );
  const [testSettingsOpened, setTestSettingsOpened] = useState(false);
  const navigate = useNavigate();
  const { data: name } = useClassName(classId || '');
  const { data: testInfo } = useTask(testId || '', classId || '', name || null);

  useEffect(() => {
    document.title = 'Создание теста';
  }, []);

  useEffect(() => {
    setTestConfig((state) => (state = data || { questions: [] }));
  }, [data]);

  const handleClose = (position: number) => {
    setTestConfig({
      questions: [
        ...testConfig.questions.slice(0, position - 1),
        ...testConfig.questions.slice(position),
      ].map((question) => {
        if (question.position > position) {
          question.position--;
        }
        return question;
      }),
    });
  };

  const addTestMutation = useMutation(
    ({
      testState,
      tokenId,
    }: {
      testState: 'Draft' | 'Submitted';
      tokenId: string;
    }) =>
      axios.put(
        `http://localhost:5000/api/test?state=${testState}`,
        {
          questions: testConfig.questions,
          _id: testId,
        },
        { headers: { Authorization: tokenId } }
      ),
    {
      onSuccess: (_, { testState }) => {
        toast.success('Тест сохранен!', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        if (testState === 'Submitted') {
          queryClient.invalidateQueries(['tasks', 'Test']);
          navigate('../');
        }
      },
      onError: () => {
        toast.error('При сохранении теста произошла ошибка!', {
          position: 'top-right',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      },
    }
  );

  return (
    <div>
      <Header />
      <div className="class-name">{name}</div>
      {isLoading && !isError && (
        <Spinner
          animation="border"
          variant="primary"
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
          }}
        />
      )}
      {!isLoading && (
        <QuestionsPlaceholders
          testConfig={testConfig}
          handleClose={handleClose}
          setTestConfig={setTestConfig}
          changeSettings={{
            position: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.position = value;
                  }
                  return question;
                }),
              }),

            question: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.question = value;
                  }
                  return question;
                }),
              }),
            images: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.images = value;
                  }
                  return question;
                }),
              }),
            type: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.type = value;
                  }
                  return question;
                }),
              }),
            answers: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.answers = value;
                  }
                  return question;
                }),
              }),
            weight: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.weight = value;
                  }
                  return question;
                }),
              }),
            rightAnswer: (value, position) =>
              setTestConfig({
                questions: testConfig.questions.map((question) => {
                  if (question.position === position) {
                    question.rightAnswer = value;
                  }
                  return question;
                }),
              }),
          }}
        />
      )}
      <ButtonsSidebar
        showSelectedButton={false}
        buttons={{
          firstButton: {
            id: 'Settings',
            icon: <SettingsIcon className="sidebar-svg" />,
            text: 'Настройки',
            type: 'button',
            action: () => setTestSettingsOpened(true),
          },
          secondButton: {
            id: 'Draft',
            icon: <DraftIcon className="sidebar-svg" />,
            text: 'Сохранить в черновик',
            type: 'button',
            action: async () => {
              const tokenId =
                (await firebaseAuth.currentUser?.getIdToken(false)) || '0';
              addTestMutation.mutate({ testState: 'Draft', tokenId: tokenId });
            },
          },
          thirdButton: {
            id: 'Submit',
            icon: <CheckIcon className="sidebar-svg" />,
            text: 'Сохранить и выложить',
            type: 'submit',
            action: async () => {
              const tokenId =
                (await firebaseAuth.currentUser?.getIdToken(false)) || '0';
              addTestMutation.mutate({
                testState: 'Submitted',
                tokenId: tokenId,
              });
            },
          },
          fourthButton: {
            id: '',
            icon: <></>,
            text: '',
            type: 'button',
            hide: true,
            action: (value) => {},
          },
        }}
      />
      {!!testInfo && (
        <TestSettings
          modalEnabled={testSettingsOpened}
          handleClose={() => setTestSettingsOpened(false)}
          taskId={testId || ''}
          taskName={testInfo.name}
          taskDescription={testInfo.description}
          taskAvailability={testInfo.available}
          testSettings={testInfo.settings}
          taskNumber={testInfo.taskNumber}
        />
      )}
    </div>
  );
}

export default TestEditPage;
