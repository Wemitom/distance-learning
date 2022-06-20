import { signOut } from 'firebase/auth';
import { useState } from 'react';
import {
  Nav,
  Navbar,
  NavDropdown,
  Offcanvas,
  Stack,
} from 'react-bootstrap';
import { useNavigate, NavLink, useParams } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useCurrentPath from '../hooks/useCurrentPath';
import { ReactComponent as ChatIcon } from '../icons/chat.svg';
import { ReactComponent as HomeIcon } from '../icons/home.svg';
import { firebaseAuth } from './Firebase';
import NewTaskModal from './NewTaskModal';
import SidebarAccordion from './SidebarAccordion';

function Header() {
  const { classId } = useParams();
  const { data } = useAuth(firebaseAuth.currentUser?.uid);
  const [modalOpened, setModalOpened] = useState(false);
  const navigate = useNavigate();
  const routePattern = useCurrentPath();

  return (
    <Navbar
      variant="light"
      bg="blue"
      expand="sm"
      sticky="top"
      style={{ height: '5.8em' }}
    >
      <HomeIcon
        style={{
          width: '2em',
          height: '2em',
          marginLeft: '2em',
          cursor: 'pointer',
        }}
        onClick={() => {
          const lastClass = localStorage.getItem('lastClass');
          navigate(
            lastClass === null || lastClass === '' || lastClass === undefined
              ? '/'
              : `/class/${lastClass}`
          );
        }}
      />
      <Navbar.Toggle
        aria-controls="responsive-navbar-nav"
        style={{ marginRight: '1em' }}
      />
      <div className="nav-offcanvas">
        <Nav className="fs-6 ms-4">
          {routePattern?.startsWith('/class/:classId') && (
            <NavLink to={`/class/${classId}/grades`} className="nav-link">
              Оценки
            </NavLink>
          )}
        </Nav>
        <Stack direction="horizontal" className="ms-auto">
          {routePattern?.startsWith('/class/:classId') && (
            <ChatIcon
              style={{ width: '2em', cursor: 'pointer' }}
              onClick={() => navigate(`/class/${classId}/chat`)}
            />
          )}
          {!!data && (
            <NavDropdown
              title={`${data.surname} ${data.name}`}
              className="fs-6"
              style={{ marginRight: '4em' }}
            >
              <NavDropdown.Item onClick={() => navigate('/profile')}>
                Профиль
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={() => signOut(firebaseAuth)}>
                Выйти
              </NavDropdown.Item>
            </NavDropdown>
          )}
        </Stack>
      </div>
      <Navbar.Offcanvas
        id="offcanvasNavbar"
        aria-labelledby="offcanvasNavbarLabel"
        placement="end"
        style={{ backgroundColor: '#175D8F' }}
      >
        <Offcanvas.Header closeButton className="fs-5">
          Меню
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Stack
            direction="vertical"
            className="align-items-center"
            style={{ color: 'black' }}
          >
            <Nav className="fs-6 ms-4">
              {routePattern?.startsWith('/class/:classId') && (
                <NavLink to={`/class/${classId}/grades`} className="nav-link">
                  Оценки
                </NavLink>
              )}
            </Nav>
            <Nav className="fs-6 ms-4">
              {routePattern?.startsWith('/class/:classId') && (
                <NavLink to={`/class/${classId}/chat`} className="nav-link">
                  Чат
                </NavLink>
              )}
            </Nav>
            {!!data && (
              <NavDropdown
                title={`${data.surname} ${data.name}`}
                className="fs-6"
              >
                <NavDropdown.Item onClick={() => navigate('/profile')}>
                  Профиль
                </NavDropdown.Item>
                <NavDropdown.Divider />
                <NavDropdown.Item
                  onClick={() => {
                    localStorage.removeItem('lastClass');
                    signOut(firebaseAuth);
                  }}
                >
                  Выйти
                </NavDropdown.Item>
              </NavDropdown>
            )}
            {!!data && data.role === 'Преподаватель' && (
              <>
                <p
                  onClick={() => setModalOpened(true)}
                  className="mb-3"
                  style={{ cursor: 'pointer' }}
                >
                  Добавить задание
                </p>
                <NewTaskModal
                  modalEnabled={modalOpened}
                  handleClose={() => setModalOpened(false)}
                />
              </>
            )}
            {!!classId && <SidebarAccordion />}
          </Stack>
        </Offcanvas.Body>
      </Navbar.Offcanvas>
    </Navbar>
  );
}

export default Header;
