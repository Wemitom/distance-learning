import { Card, ProgressBar } from 'react-bootstrap';
import { TestResultsInterface } from '../interfaces/interfaces';

const ResultsCard = ({ data }: { data?: TestResultsInterface }) => {
  return (
    <div className="results-card">
      <Card>
        <Card.Header className="text-md-center">
          <Card.Title>Результаты теста</Card.Title>
        </Card.Header>
        <Card.Body className="text-md-center">
          <ProgressBar className="mb-3">
            <ProgressBar
              striped
              now={data?.gradePercentages[0]}
              variant="danger"
              label={`0%-${
                data === undefined ? 0 : data?.gradePercentages[0]
              }%`}
            />
            <ProgressBar
              now={
                data === undefined
                  ? 0
                  : data?.gradePercentages[1] - data?.gradePercentages[0]
              }
              variant="danger"
              label={`${
                data === undefined
                  ? 0
                  : data.gradePercentages[0] !== 0
                  ? data?.gradePercentages[0] + 1
                  : 0
              }%-${data?.gradePercentages[1]}%`}
            />
            <ProgressBar
              now={
                data === undefined
                  ? 0
                  : data?.gradePercentages[2] - data?.gradePercentages[1]
              }
              variant="warning"
              label={`${
                data === undefined ? 0 : data?.gradePercentages[1] + 1
              }%-${data?.gradePercentages[2]}%`}
            />
            <ProgressBar
              now={
                data === undefined
                  ? 0
                  : data?.gradePercentages[3] - data?.gradePercentages[2]
              }
              variant="info"
              label={`${
                data === undefined ? 0 : data?.gradePercentages[2] + 1
              }%-${data?.gradePercentages[3]}%`}
            />
            <ProgressBar
              now={data === undefined ? 0 : 100 - data?.gradePercentages[3]}
              variant="success"
              label={`${
                data === undefined ? 0 : data?.gradePercentages[3] + 1
              }%-100%`}
            />
          </ProgressBar>
          <Card.Text className="fs-4">{`Оценка за тест: ${
            data?.grade || '-'
          }`}</Card.Text>
          <Card.Text className="fs-4">{`Процентов выполнено: ${
            !!data && data.percentage !== undefined
              ? Math.round(data.percentage * 100) / 100
              : '-'
          }`}</Card.Text>
          <Card.Text className="fs-4">
            {`Количество правильных ответов: ${
              data?.correctAnswers?.length !== undefined
                ? data?.correctAnswers?.length
                : '-'
            }`}
          </Card.Text>
          <Card.Text className="fs-4">
            {`Тест выполнен за: ${
              data !== undefined
                ? Math.round(+data.completionTime / 60000)
                : '0'
            } мин.`}
          </Card.Text>
        </Card.Body>
      </Card>
    </div>
  );
};

export default ResultsCard;
