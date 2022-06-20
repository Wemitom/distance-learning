import { useEffect, useState } from 'react';
import Header from '../Header';
import ResultsCard from '../ResultsCard';
import { Button, Spinner } from 'react-bootstrap';
import '../../styles/resultsPage.css';
import AnswersCards from '../AnswersCards';
import { useParams } from 'react-router-dom';
import useTestResults from '../../hooks/useTestResults';

const ResultsPage = () => {
  const { testId } = useParams();
  const { data } = useTestResults(testId || '');
  const [answersOpened, setAnswersOpened] = useState(false);

  useEffect(() => {
    document.title = 'Результаты теста';
  }, []);

  return (
    <div>
      <Header />
      <ResultsCard data={data} />
      <Button
        className="results-card"
        onClick={() => setAnswersOpened(!answersOpened)}
      >
        {answersOpened ? 'Скрыть ответы' : 'Посмотреть ответы'}
      </Button>
      {answersOpened &&
        (!!data ? (
          <AnswersCards answers={data.answers} />
        ) : (
          <Spinner
            animation="border"
            variant="primary"
            style={{ position: 'absolute', top: '5em', left: '50%' }}
          />
        ))}
    </div>
  );
};

export default ResultsPage;
