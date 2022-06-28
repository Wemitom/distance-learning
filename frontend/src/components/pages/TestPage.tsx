import Header from '../Header';
import { Question } from '../Question';
import '../../styles/testPage.css';
import useTestInfo from '../../hooks/useTestInfo';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import Countdown from 'react-countdown';
import QuestionMultiple from '../QuestionMultiple';
import useCurrentQuestion from '../../hooks/useCurrentQuestion';
import { Button } from 'react-bootstrap';
import { useMutation } from 'react-query';
import axios from 'axios';
import { firebaseAuth } from '../Firebase';
import { useEffect, useState } from 'react';

function TestPage() {
  const { testId } = useParams();
  const { isLoading: testInfoLoading, data: testInfo } = useTestInfo(
    testId || ''
  );
  const { isLoading: questionLoading, data } = useCurrentQuestion(testId || '');
  const [chosenAnswers, setChosenAnswers] = useState<
    (number | number[] | string | null)[]
  >([]);
  const navigate = useNavigate();

  const submitTestMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.put(
        `https://distance-learning.herokuapp.com/api/test/started/submit?_id=${testId}`,
        {
          chosenAnswers,
        },
        {
          headers: { Authorization: idToken },
        }
      ),
    {
      onSuccess: async () => {
        navigate('results');
      },
    }
  );

  useEffect(() => {
    !!testInfo &&
      setChosenAnswers(
        Array.apply(null, Array(testInfo.questionsCount)).map(() => null)
      );
  }, [testInfo]);

  return (
    <div style={{ height: '100vh' }}>
      <Header />
      {!testInfoLoading && (
        <>
          {!!data && Array.isArray(data) ? (
            <>
              {data.map((questionInfo) => (
                <div key={`question_${questionInfo.position}`}>
                  <QuestionMultiple
                    position={questionInfo.position}
                    question={questionInfo.question}
                    type={questionInfo.type}
                    answers={questionInfo.answers}
                    images={questionInfo.images}
                    weight={questionInfo.weight}
                    rightAnswer={questionInfo.rightAnswer}
                    results={false}
                    chosenAnswer={chosenAnswers[questionInfo.position - 1]}
                    setChosenAnswer={(value, position) =>
                      setChosenAnswers(
                        chosenAnswers.map((chosenAnswer, index) => {
                          if (index === position - 1) {
                            chosenAnswer = value;
                          }
                          return chosenAnswer;
                        })
                      )
                    }
                  />
                </div>
              ))}
              <Button
                onClick={async () => {
                  const idToken =
                    (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
                  submitTestMutation.mutate({ idToken });
                }}
                className="question-card mt-3"
              >
                Завершить
              </Button>
            </>
          ) : (
            <Question
              questionsCount={testInfo?.questionsCount || 0}
              isLoading={questionLoading}
              data={data}
            />
          )}
          <Countdown
            date={testInfo?.timeLeft !== undefined ? +testInfo?.timeLeft : 0}
            intervalDelay={0}
            precision={3}
            onComplete={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              submitTestMutation.mutate({ idToken });
              navigate('results');
            }}
            renderer={(props) => (
              <p style={{ textAlign: 'center' }}>{`Оставшиеся время ${
                props.hours !== 0 ? `0${props.hours}:` : ''
              }${props.minutes < 10 ? `0${props.minutes}` : props.minutes}:${
                props.seconds < 10 ? `0${props.seconds}` : props.seconds
              }`}</p>
            )}
          />
          {testInfo?.testComplete && <Navigate to="results" />}
        </>
      )}
      <div style={{ clear: 'both', height: '10%' }} />
    </div>
  );
}

export default TestPage;
