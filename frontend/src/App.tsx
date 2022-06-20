import { onAuthStateChanged } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import { firebaseAuth } from './components/Firebase';
import LoginPage from './components/pages/LoginPage';
import TestEditPage from './components/pages/TestCreatePage';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import TestPage from './components/pages/TestPage';
import ResultsPage from './components/pages/ResultsPage';
import TasksPage from './components/pages/TasksPage';
import ProfilePage from './components/pages/ProfilePage';
import GradesPage from './components/pages/GradesPage';
import NoMatchPage from './components/pages/NoMatchPage';
import SettingsPage from './components/pages/SettingsPage';
import ChatPage from './components/pages/ChatPage';
import TeacherResultPage from './components/pages/TeacherResultPage';

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authStateChanged, setAuthStateChanged] = useState(false);

  useEffect(() => {
    onAuthStateChanged(firebaseAuth, (user) => {
      if (user !== null) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }

      setAuthStateChanged(true);
    });
  }, []);

  return (
    <div className="App">
      {authStateChanged && (
        <Routes>
          <Route
            path="/"
            element={loggedIn ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/login"
            element={!loggedIn ? <LoginPage /> : <Navigate to="/" />}
          />
          <Route
            path="/profile"
            element={loggedIn ? <ProfilePage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId"
            element={loggedIn ? <TasksPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/grades"
            element={loggedIn ? <GradesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/grades/test-results/:testId/:userId"
            element={
              loggedIn ? <TeacherResultPage /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/class/:classId/settings"
            element={loggedIn ? <SettingsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/chat"
            element={loggedIn ? <ChatPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/chat/:dialogId"
            element={loggedIn ? <ChatPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/edit-test/:testId"
            element={loggedIn ? <TestEditPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/test/:testId/results"
            element={loggedIn ? <ResultsPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/class/:classId/test/:testId"
            element={loggedIn ? <TestPage /> : <Navigate to="/login" />}
          />
          <Route path="*" element={<NoMatchPage />} />
        </Routes>
      )}
      {!authStateChanged && (
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
      )}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

export default App;
