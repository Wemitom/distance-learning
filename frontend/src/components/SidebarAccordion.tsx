import {
  Accordion,
  Button,
  ListGroup,
  Nav,
  Placeholder,
  Spinner,
  Badge,
} from 'react-bootstrap';
import Searchbar from './Searchbar';
import { NewClassModal } from './NewClassModal';
import { useNavigate, useParams, generatePath } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { TaskType } from '../interfaces/interfaces';
import useTasks from '../hooks/useTasks';
import useClasses from '../hooks/useClasses';
import NewTaskModal from './NewTaskModal';
import useCurrentPath from '../hooks/useCurrentPath';
import { JoinClassModal } from './JoinClassModal';
import { firebaseAuth } from './Firebase';
import useAuth from '../hooks/useAuth';
import useClassName from '../hooks/useClassName';
import ModalDialog from './ModalDialog';
import { useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import useClassUsers from '../hooks/useClassUsers';

const SidebarAccordion = ({
  setScrolled,
  currentTaskType,
  setCurrentTaskType,
}: {
  setScrolled?: (value: number | null) => void;
  currentTaskType?: TaskType;
  setCurrentTaskType?: (value: TaskType) => void;
}) => {
  const queryClient = useQueryClient();
  const { classId, dialogId } = useParams();
  const [classModal, setClassModal] = useState(false);
  const [joinClassModal, setJoinClassModal] = useState(false);
  const [searchTermTasks, setSearchTermTasks] = useState('');
  const [searchTermClasses, setSearchTermClasses] = useState('');
  const [searchTermChats, setSearchTermChats] = useState('');
  const [searchTermParticipants, setSearchTermParticipants] = useState('');
  const [selectedType, setSelectedType] = useState(currentTaskType || 'Labs');
  const [modalEnabled, setModalEnabled] = useState(false);
  const [confirmActionOpened, setConfirmActionOpened] = useState(false);
  const [removeParticOpened, setRemoveParticOpened] = useState(false);
  const [removedUserUid, setRemovedUserUid] = useState('');
  const [modalId, setModalId] = useState(0);
  const { data: name } = useClassName(classId || '');
  const { data: tasks, isLoading: isLoadingTasks } = useTasks(
    selectedType,
    classId || '',
    name || null
  );
  const { data: classes, isLoading: isLoadingClasses } = useClasses();
  const navigate = useNavigate();
  const routePattern = useCurrentPath();
  const { data: authData } = useAuth(firebaseAuth.currentUser?.uid);
  const { data: usersData, isLoading: isLoadingUsers } = useClassUsers(
    classId || '',
    firebaseAuth.currentUser?.uid,
    authData?.role
  );

  const deleteClassMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.delete(`http://localhost:5000/api/classes?classId=${classId}`, {
        headers: {
          Authorization: idToken,
        },
      }),
    {
      onSuccess: () => navigate('/profile'),
    }
  );

  const removeParticipantMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.put(
        `http://localhost:5000/api/classes?classId=${classId}`,
        {
          uid: removedUserUid,
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      ),
    {
      onSuccess: () => queryClient.invalidateQueries(['classUsers']),
    }
  );

  const quitClassMutation = useMutation(
    ({ idToken }: { idToken: string }) =>
      axios.patch(
        `http://localhost:5000/api/classes?action=quit&classId=${classId}`,
        {},
        {
          headers: {
            Authorization: idToken,
          },
        }
      ),
    {
      onSuccess: () => navigate('/profile'),
    }
  );

  useEffect(() => {
    if (
      !!authData &&
      !!usersData &&
      authData.role === 'Преподаватель' &&
      routePattern === '/class/:classId/chat'
    ) {
      navigate(`/class/${classId}/chat/${usersData[0].uid}`);
    }
  }, [authData, classId, navigate, routePattern, usersData]);

  return (
    <>
      <Accordion defaultActiveKey={!!currentTaskType ? '0' : '1'}>
        {!!setScrolled && !!currentTaskType && !!setCurrentTaskType && (
          <Accordion.Item eventKey="0">
            <Accordion.Header>Задания курса</Accordion.Header>
            <Accordion.Body className="p-0">
              <ListGroup variant="flush" className="align-items-center">
                <ListGroup.Item>
                  <Searchbar
                    searchTerm={searchTermTasks}
                    setSearchTerm={setSearchTermTasks}
                  />
                  <Nav
                    variant="pills"
                    style={{ color: 'black' }}
                    className="mt-3"
                    activeKey={selectedType}
                    onSelect={(e) => setSelectedType(e as TaskType)}
                    justify
                  >
                    <Nav.Item>
                      <Nav.Link eventKey="Lecture">Лекции</Nav.Link>
                    </Nav.Item>
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
                </ListGroup.Item>
                {isLoadingTasks ? (
                  <ListGroup.Item>
                    <Spinner animation="border" variant="primary" />
                  </ListGroup.Item>
                ) : (
                  tasks !== undefined &&
                  tasks
                    .filter((task) =>
                      searchTermTasks === ''
                        ? true
                        : task.name
                            .toLowerCase()
                            .startsWith(searchTermTasks.toLowerCase())
                    )
                    .map((task, index) => (
                      <ListGroup.Item
                        onClick={() => {
                          if (selectedType !== currentTaskType) {
                            setCurrentTaskType(selectedType);
                          }
                          setScrolled(index);
                        }}
                        style={{ cursor: 'pointer' }}
                        key={task.name}
                        className="w-100 text-center"
                      >
                        {task.name}
                      </ListGroup.Item>
                    ))
                )}
              </ListGroup>
              {!!authData ? (
                authData.role === 'Преподаватель' && (
                  <Button
                    onClick={() => {
                      setModalId(modalId + 1);
                      setModalEnabled(true);
                    }}
                    className="w-100"
                  >
                    Добавить новое задание
                  </Button>
                )
              ) : (
                <Placeholder.Button className="w-100" />
              )}
            </Accordion.Body>
          </Accordion.Item>
        )}
        <Accordion.Item eventKey="1">
          <Accordion.Header>Ваши курсы</Accordion.Header>
          <Accordion.Body className="p-0">
            <ListGroup variant="flush" className="align-items-center">
              <ListGroup.Item>
                <Searchbar
                  searchTerm={searchTermClasses}
                  setSearchTerm={setSearchTermClasses}
                />
              </ListGroup.Item>
              {isLoadingClasses ? (
                <ListGroup.Item>
                  <Spinner animation="border" variant="primary" />
                </ListGroup.Item>
              ) : (
                classes !== undefined &&
                classes
                  .filter((classDoc) =>
                    searchTermClasses === ''
                      ? true
                      : classDoc.name
                          .toLowerCase()
                          .startsWith(searchTermClasses.toLowerCase())
                  )
                  .map((classDoc) => (
                    <ListGroup.Item
                      onClick={() => {
                        localStorage.setItem('lastClass', classDoc.classId);
                        !!routePattern &&
                          navigate(
                            generatePath(routePattern, {
                              classId: classDoc.classId,
                              dialogId: !!usersData ? usersData[0].uid : '',
                            })
                          );
                      }}
                      style={{ cursor: 'pointer' }}
                      active={classDoc.classId === classId}
                      key={classDoc.classId}
                      className="w-100 text-center"
                    >
                      {classDoc.name}
                    </ListGroup.Item>
                  ))
              )}
            </ListGroup>
            {!!authData ? (
              <>
                <Button
                  onClick={() => {
                    authData.role === 'Преподаватель'
                      ? setClassModal(true)
                      : setJoinClassModal(true);
                  }}
                  className="w-100 mt-2"
                >
                  {authData.role === 'Преподаватель'
                    ? 'Создать новый курс'
                    : 'Присоединиться к новому курсу'}
                </Button>
                <Button
                  variant="danger"
                  className="w-100"
                  onClick={() => {
                    setConfirmActionOpened(true);
                  }}
                >
                  {authData.role === 'Студент'
                    ? 'Покинуть текущий курс'
                    : 'Удалить текущий курс'}
                </Button>
              </>
            ) : (
              <Placeholder.Button className="w-100" />
            )}
          </Accordion.Body>
        </Accordion.Item>
        {routePattern === '/class/:classId/chat/:dialogId' &&
          authData?.role === 'Преподаватель' && (
            <Accordion.Item eventKey="2">
              <Accordion.Header>Ваши чаты</Accordion.Header>
              <Accordion.Body className="p-0">
                <ListGroup variant="flush" className="align-items-center">
                  <ListGroup.Item>
                    <Searchbar
                      searchTerm={searchTermChats}
                      setSearchTerm={setSearchTermChats}
                    />
                  </ListGroup.Item>
                  {isLoadingUsers ? (
                    <ListGroup.Item>
                      <Spinner animation="border" variant="primary" />
                    </ListGroup.Item>
                  ) : (
                    usersData !== undefined &&
                    usersData
                      .filter((userInfo) =>
                        searchTermChats === ''
                          ? true
                          : userInfo.fullname
                              .toLowerCase()
                              .startsWith(searchTermChats.toLowerCase())
                      )
                      .map((userInfo) => (
                        <ListGroup.Item
                          onClick={() => {
                            !!routePattern &&
                              navigate(
                                generatePath(routePattern, {
                                  classId: classId,
                                  dialogId: userInfo.uid,
                                })
                              );
                          }}
                          style={{ cursor: 'pointer' }}
                          active={userInfo.uid === dialogId}
                          key={`chat_${userInfo.uid}`}
                          className="w-100 text-center"
                        >
                          {userInfo.fullname}
                        </ListGroup.Item>
                      ))
                  )}
                </ListGroup>
              </Accordion.Body>
            </Accordion.Item>
          )}
        {authData?.role === 'Преподаватель' && (
          <Accordion.Item eventKey="3">
            <Accordion.Header>Участники курса</Accordion.Header>
            <Accordion.Body className="p-0">
              <ListGroup variant="flush" as="ol" numbered>
                <ListGroup.Item>
                  <Searchbar
                    searchTerm={searchTermParticipants}
                    setSearchTerm={setSearchTermParticipants}
                  />
                </ListGroup.Item>
                {isLoadingUsers ? (
                  <ListGroup.Item>
                    <Spinner animation="border" variant="primary" />
                  </ListGroup.Item>
                ) : (
                  usersData !== undefined &&
                  usersData
                    .filter((userInfo) =>
                      searchTermParticipants === ''
                        ? true
                        : userInfo.fullname
                            .toLowerCase()
                            .startsWith(searchTermParticipants.toLowerCase())
                    )
                    .map((userInfo) => (
                      <ListGroup.Item
                        key={userInfo.uid}
                        as="li"
                        className="d-flex justify-content-between align-items-start"
                      >
                        <div className="ms-2 me-auto">{userInfo.fullname}</div>
                        <Badge
                          bg="danger"
                          pill
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setRemovedUserUid(userInfo.uid);
                            setRemoveParticOpened(true);
                          }}
                        >
                          X
                        </Badge>
                      </ListGroup.Item>
                    ))
                )}
              </ListGroup>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>

      {!!authData && authData.role === 'Преподаватель' ? (
        <>
          <NewTaskModal
            modalEnabled={modalEnabled}
            handleClose={() => setModalEnabled(false)}
            key={modalId}
          />
          <NewClassModal
            modalEnabled={classModal}
            handleClose={() => setClassModal(false)}
          />
          <ModalDialog
            message="Вы уверены что хотите удалить текущий курс и все задания в нем?"
            title="Подтвердите действие"
            action={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              deleteClassMutation.mutate({ idToken });
            }}
            modalEnabled={confirmActionOpened}
            handleClose={() => setConfirmActionOpened(false)}
            buttonsType="YesNo"
          />
          <ModalDialog
            message="Вы уверены что хотите выгнать участника с данного курса?"
            title="Подтвердите действие"
            action={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              removeParticipantMutation.mutate({ idToken });
            }}
            modalEnabled={removeParticOpened}
            handleClose={() => setRemoveParticOpened(false)}
            buttonsType="YesNo"
          />
        </>
      ) : (
        <>
          <JoinClassModal
            modalEnabled={joinClassModal}
            handleClose={() => setJoinClassModal(false)}
          />
          <ModalDialog
            message="Вы уверены что хотите покинуть текущий курс? После выхода вы сможете вернуться по тому же коду без потери оценок."
            title="Подтвердите действие"
            action={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              quitClassMutation.mutate({ idToken });
            }}
            modalEnabled={confirmActionOpened}
            handleClose={() => setConfirmActionOpened(false)}
            buttonsType="YesNo"
          />
        </>
      )}
    </>
  );
};

export default SidebarAccordion;
