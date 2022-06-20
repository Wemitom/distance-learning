import GradesTableStudent from '../GradesTableStudent';
import Header from '../Header';
import Sidebar from '../Sidebar';
import '../../styles/gradesPage.css';
import { Nav, Spinner } from 'react-bootstrap';
import useClassName from '../../hooks/useClassName';
import { useParams } from 'react-router-dom';
import { useState } from 'react';
import { TaskType } from '../../interfaces/interfaces';
import NoMatchPage from './NoMatchPage';
import { firebaseAuth } from '../Firebase';
import useAuth from '../../hooks/useAuth';
import GradesTableTeacher from '../GradesTableTeacher';

const GradesPage = () => {
  const { classId } = useParams();
  const {
    data: name,
    isLoading: isLoadingName,
    isError: isErrorName,
  } = useClassName(classId || '');
  const [selectedType, setSelectedType] = useState<TaskType>('Homework');
  const { data: authData } = useAuth(firebaseAuth.currentUser?.uid);

  return (
    <>
      {name !== null && !isErrorName ? (
        !isLoadingName ? (
          <div>
            <Header />
            <div className="class-name">{name}</div>
            <Sidebar />
            <Nav
              variant="tabs"
              style={{ color: 'black' }}
              className="grades-table"
              activeKey={selectedType}
              onSelect={(e) => setSelectedType(e as TaskType)}
              justify
            >
              <Nav.Item>
                <Nav.Link eventKey="Homework">Д/з</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Labs">Лаб. работы</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="Test">Тесты</Nav.Link>
              </Nav.Item>
            </Nav>
            {!!authData ? (
              authData.role === 'Студент' ? (
                <GradesTableStudent
                  taskType={selectedType}
                  name={name || null}
                />
              ) : (
                <GradesTableTeacher
                  taskType={selectedType}
                  name={name || null}
                />
              )
            ) : (
              <></>
            )}
          </div>
        ) : (
          <Spinner
            animation="grow"
            variant="primary"
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        )
      ) : (
        <NoMatchPage />
      )}
    </>
  );
};

export default GradesPage;
