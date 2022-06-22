import { useState } from 'react';
import {
  Button,
  Card,
  ListGroup,
  OverlayTrigger,
  Placeholder,
  Popover,
  Spinner,
} from 'react-bootstrap';
import { useIsMutating } from 'react-query';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useClasses from '../hooks/useClasses';
import { firebaseAuth } from './Firebase';
import { JoinClassModal } from './JoinClassModal';
import { NewClassModal } from './NewClassModal';

const ProfileInfo = () => {
  const isMutating = useIsMutating() !== 0;
  const { data, isLoading } = useClasses();
  const { data: authData, isLoading: isLoadingAuth } = useAuth(
    firebaseAuth.currentUser?.uid,
    isMutating
  );
  const [joinClassOpened, setJoinClassOpened] = useState(false);
  const [createClassOpened, setCreateClassOpened] = useState(false);
  const [popupOpen, setPopupOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <Card className="profile-card text-center">
        <Card.Header>
          <Card.Title>Информация</Card.Title>
        </Card.Header>
        <Card.Body className="fs-6">
          {!isLoadingAuth && !!authData ? (
            <>
              <p>{`Имя: ${authData.name} ${authData.surname}`}</p>
              <p>{`Тип аккаунта: ${authData.role}`}</p>
              <p>{`email: ${firebaseAuth.currentUser?.email}`}</p>
            </>
          ) : (
            <Spinner animation="border" variant="primary" />
          )}
        </Card.Body>
        <Card.Header style={{ borderTop: '1px solid rgba(0, 0, 0, 0.125)' }}>
          <Card.Title>Курсы</Card.Title>
        </Card.Header>
        <Card.Body className="fs-6 p-0">
          <ListGroup variant="flush" className="justify-content-center">
            {isLoading && (
              <ListGroup.Item>
                <Spinner animation="border" variant="primary" />
              </ListGroup.Item>
            )}
            {!!data && data.length !== 0
              ? data.map((value) => (
                  <OverlayTrigger
                    placement="bottom"
                    onToggle={() => setPopupOpen(!popupOpen)}
                    delay={popupOpen ? 5000 : 1500}
                    key={value.classId}
                    overlay={
                      (!!authData && authData.role === 'Студент') ||
                      authData === undefined ? (
                        <></>
                      ) : (
                        <Popover id="popover-contained" className="text-center">
                          <Popover.Header>Код для приглашения</Popover.Header>
                          <Popover.Body>
                            {value.accessCode}
                            <p className="text-muted">
                              Подсказка исчезнет через 5 секунд
                            </p>
                          </Popover.Body>
                        </Popover>
                      )
                    }
                  >
                    <ListGroup.Item
                      action
                      onClick={() => {
                        localStorage.setItem('lastClass', value.classId);
                        navigate(`/class/${value.classId}`);
                      }}
                    >
                      <p>{value.name}</p>
                    </ListGroup.Item>
                  </OverlayTrigger>
                ))
              : !isLoading && <ListGroup.Item>Курсов нет</ListGroup.Item>}
          </ListGroup>
        </Card.Body>
      </Card>
      {!!authData ? (
        authData.role === 'Студент' ? (
          <>
            <Button
              onClick={() => setJoinClassOpened(true)}
              className="profile-card"
            >
              Присоединиться к курсу
            </Button>
            <JoinClassModal
              modalEnabled={joinClassOpened}
              handleClose={() => setJoinClassOpened(false)}
            />
          </>
        ) : (
          <>
            <Button
              onClick={() => setCreateClassOpened(true)}
              className="profile-card"
            >
              Создать новый курс
            </Button>
            <p className="text-muted profile-card text-center">
              Для получения кода для приглашения задержите курсор на курсе, либо
              ,если на телефоне, задержите палец на нужном курсе
            </p>
            <NewClassModal
              modalEnabled={createClassOpened}
              handleClose={() => setCreateClassOpened(false)}
            />
          </>
        )
      ) : (
        <Placeholder.Button className="profile-card" />
      )}
    </>
  );
};

export default ProfileInfo;
