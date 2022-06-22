import { Button, Card, ListGroup, Placeholder } from 'react-bootstrap';
import Answers from './Answers';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import { firebaseAuth } from './Firebase';
import { QuestionInterface } from '../interfaces/interfaces';

export const Question = ({
  questionsCount,
  isLoading,
  data,
}: {
  questionsCount: number;
  isLoading: boolean;
  data?: QuestionInterface;
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { testId } = useParams();

  const [chosenAnswer, setChosenAnswer] = useState<
    number | number[] | string | null
  >(null);

  const nextQuestionMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.put(
        `https://distance-learning.herokuapp.com/api/test/started/next?_id=${testId}`,
        { answer: chosenAnswer },
        {
          headers: { Authorization: idToken },
        }
      ),
    {
      onSuccess: async () => {
        if (data?.position !== questionsCount) {
          await queryClient.invalidateQueries(['currentQuestion']);
          setChosenAnswer(null);
        } else {
          const idToken =
            (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
          submitTestMutation.mutate({ idToken });
        }
      },
    }
  );

  const submitTestMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.put(
        `https://distance-learning.herokuapp.com/api/test/started/submit?_id=${testId}`,
        {},
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

  return (
    <>
      {data !== undefined && !isLoading && !nextQuestionMutation.isLoading ? (
        <Card className="question-card">
          <Card.Header className="text-md-center">
            <Card.Title>{`Вопрос №${data.position}`}</Card.Title>
            <p>{`${data?.position}/${questionsCount}`}</p>
          </Card.Header>
          <Card.Body className="text-md-center">
            <Card.Text className="fs-6" style={{ minHeight: '5em' }}>
              {data.question}
            </Card.Text>
          </Card.Body>
          <Card.Footer className="p-0">
            <Answers
              answerType={data.type}
              answers={data.answers}
              rightAnswer={chosenAnswer}
              setRightAnswer={setChosenAnswer}
              position={data.position}
            />
          </Card.Footer>
          <Card.Footer className="p-0">
            <Button
              className="w-100"
              onClick={async () => {
                const idToken =
                  (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
                nextQuestionMutation.mutate({ idToken });
              }}
            >
              {data?.position !== questionsCount ? 'Далее' : 'Завершить'}
            </Button>
          </Card.Footer>
        </Card>
      ) : (
        data?.position !== questionsCount && (
          <Card className="question-card">
            <Card.Header className="text-md-center">
              <Placeholder as={Card.Title} animation="glow">
                <Placeholder xs={3} /> <Placeholder xs={1} />
              </Placeholder>
              <p>{`?/${questionsCount}`}</p>
            </Card.Header>
            <Card.Body className="text-md-center">
              <Placeholder
                as={Card.Text}
                className="fs-6"
                style={{ minHeight: '5em' }}
                animation="glow"
              >
                <Placeholder xs={5} /> <Placeholder xs={4} />{' '}
                <Placeholder xs={2} /> <Placeholder xs={8} />{' '}
                <Placeholder xs={3} />
              </Placeholder>
            </Card.Body>
            <Card.Footer className="p-0">
              <Placeholder as={ListGroup} className="fs-6" animation="glow">
                <ListGroup.Item>
                  <Placeholder xs={4} />
                </ListGroup.Item>
                <ListGroup.Item>
                  <Placeholder xs={2} />
                </ListGroup.Item>
              </Placeholder>
            </Card.Footer>
            <Card.Footer className="p-0">
              <Placeholder.Button className="w-100" />
            </Card.Footer>
          </Card>
        )
      )}
    </>
  );
};
