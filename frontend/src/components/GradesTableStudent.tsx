import { Table, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import useGrades from '../hooks/useGrades';
import { TaskType } from '../interfaces/interfaces';

const GradesTableStudent = ({
  taskType,
  name,
}: {
  taskType: TaskType;
  name: string | null;
}) => {
  const { classId } = useParams();
  const { data: grades } = useGrades(taskType, classId || '', name || null);

  return (
    <div className="grades-table">
      {!!grades ? (
        <Table bordered striped hover responsive className="fs-6">
          <thead>
            <tr>
              <th>Название задания</th>
              <th className="text-center">Оценка</th>
              <th className="text-center">Комментарий</th>
            </tr>
          </thead>
          <tbody>
            {grades.map((grade) => (
              <tr key={grade.name}>
                <td>{grade.name}</td>
                <td className="text-center">{grade.grade}</td>
                <td className="text-center">{grade.note}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Spinner
          animation="border"
          variant="primary"
          style={{ position: 'absolute', top: '5em', left: '50%' }}
        />
      )}
    </div>
  );
};

export default GradesTableStudent;
