import React, { useState } from 'react';
import { Spinner, Table } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import useGrades from '../hooks/useGrades';
import { GradesInterface, TaskType } from '../interfaces/interfaces';
import GradeTaskModal from './GradeTaskModal';

const GradesTableTeacher = ({
  taskType,
  name,
}: {
  taskType: TaskType;
  name: string | null;
}) => {
  const { classId } = useParams();
  const { data: grades } = useGrades(
    taskType,
    classId || '',
    name || null
  );
  const [gradeTaskModal, setGradeTaskModal] = useState(false);
  const [modalGrade, setModalGrade] = useState<'-' | 0 | 2 | 3 | 4 | 5>('-');
  const [modalNote, setModalNote] = useState('');
  const [modalUid, setModalUid] = useState('');
  const [modalTaskName, setModalTaskName] = useState('');
  const [modalTaskId, setModalTaskId] = useState('');

  const groupBy = (
    items: GradesInterface[],
    key: string
  ): { [key: string]: GradesInterface[] } =>
    items.reduce(
      (result: { [key: string]: GradesInterface[] }, item) => ({
        ...result,
        [item[key as keyof typeof item] as string | number]: [
          ...(result[item[key as keyof typeof item] as string | number] || []),
          item,
        ],
      }),
      {}
    );

  return (
    <div className="grades-table" style={{ position: 'relative' }}>
      {!!grades ? (
        <>
          <Table bordered striped hover responsive className="fs-6">
            <thead>
              <tr>
                <th>Имя студента</th>
                {Object.keys(groupBy(grades, 'name')).map((taskName) => (
                  <th key={taskName}>{taskName}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.keys(groupBy(grades, 'userFullname')).map((user, i) => (
                <tr key={i}>
                  <td>{user}</td>
                  {Object.values(groupBy(grades, 'name')).map(
                    (gradeDocs, j) => (
                      <td
                        className="text-center"
                        key={i + j}
                        style={{ cursor: 'pointer' }}
                        onClick={() => {
                          const gradeInfo = gradeDocs.find(
                            (gradeDoc) => gradeDoc.userFullname === user
                          );
                          if (!!gradeInfo) {
                            setModalGrade(gradeInfo.grade);
                            setModalNote(gradeInfo.note);
                            setModalUid(gradeInfo.uid || '');
                            setModalTaskName(gradeInfo.name);
                            setModalTaskId(gradeInfo.taskId);
                          }
                          setGradeTaskModal(true);
                        }}
                      >
                        {
                          gradeDocs.find(
                            (gradeDoc) => gradeDoc.userFullname === user
                          )?.grade
                        }
                      </td>
                    )
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
          <p className="text-muted text-center">
            *Для проставления оценки нажмите на соответствующую клетку таблицы
          </p>
        </>
      ) : (
        <Spinner
          animation="border"
          variant="primary"
          style={{ position: 'absolute', top: '5em', left: '50%' }}
        />
      )}
      <GradeTaskModal
        modalEnabled={gradeTaskModal}
        handleClose={() => setGradeTaskModal(false)}
        initGrade={modalGrade}
        initNote={modalNote}
        uid={modalUid}
        taskName={modalTaskName}
        taskType={taskType}
        className={name || ''}
        taskId={modalTaskId}
      />
    </div>
  );
};

export default GradesTableTeacher;
