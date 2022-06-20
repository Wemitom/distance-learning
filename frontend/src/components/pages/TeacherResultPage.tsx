import { useEffect } from 'react';
import { Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import useTestResults from '../../hooks/useTestResults';
import AnswersCards from '../AnswersCards';

const TeacherResultPage = () => {
  const { testId, userId } = useParams();
  const { data } = useTestResults(testId || '', userId);

  useEffect(() => {
    document.title = 'Ответы на тест';
  }, []);

  return (
    <>
      {!!data ? (
        <AnswersCards answers={data.answers} />
      ) : (
        <Spinner
          animation="border"
          variant="primary"
          style={{ position: 'absolute', top: '5em', left: '50%' }}
        />
      )}
    </>
  );
};

export default TeacherResultPage;
