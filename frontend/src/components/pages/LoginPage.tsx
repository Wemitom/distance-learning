import Login from '../Login';
import '../../styles/loginPage.css';
import { useState } from 'react';
import SignUp from '../SignUp';
import ResetPassword from '../ResetPassword';

function LoginPage() {
  const [signUpOpened, setSignUpOpened] = useState(false);
  const [resetPasswordOpened, setResetPasswordOpened] = useState(false);

  return (
    <div
      className="w-100 d-flex justify-content-center align-items-center"
      style={{
        background:
          'linear-gradient(0deg, rgba(23,93,143,1) 0%, rgba(92,187,255,1) 100%)',
        height: '100vh',
      }}
    >
      <Login
        signUpOpened={signUpOpened}
        setSignUpOpened={setSignUpOpened}
        resetPasswordOpened={resetPasswordOpened}
        setResetPasswordOpened={setResetPasswordOpened}
      />
      <SignUp signUpOpened={signUpOpened} setSignUpOpened={setSignUpOpened} />
      <ResetPassword
        resetPasswordOpened={resetPasswordOpened}
        setResetPasswordOpened={setResetPasswordOpened}
      />
    </div>
  );
}

export default LoginPage;
