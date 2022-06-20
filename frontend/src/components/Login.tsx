import { FormEvent, useState } from 'react';
import { Card, Form, Button, Collapse } from 'react-bootstrap';
import { firebaseAuth } from './Firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';

function Login({
  signUpOpened,
  setSignUpOpened,
  resetPasswordOpened,
  setResetPasswordOpened,
}: {
  signUpOpened: boolean;
  setSignUpOpened: (value: boolean) => void;
  resetPasswordOpened: boolean;
  setResetPasswordOpened: (value: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validated, setValidated] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      setSendingRequest(true);
      await signInWithEmailAndPassword(firebaseAuth, email, password);
    } catch (error) {
      setValidated(true);
      setSendingRequest(false);
    }
  };

  return (
    <Collapse in={!signUpOpened && !resetPasswordOpened}>
      <Card style={{ width: '30em' }}>
        <Card.Body>
          <Card.Title className="text-center mt-4 mb-4 fs-4">
            {'Войти'}
          </Card.Title>
          <Form noValidate onSubmit={handleSubmit}>
            <Form.Group className="mb-3 mt-3">
              <Form.Label className="fs-6">{'E-mail'}</Form.Label>
              <Form.Control
                type="email"
                placeholder="Введите e-mail"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setValidated(false);
                  setEmail(e.target.value);
                }}
                isInvalid={validated}
                disabled={sendingRequest}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fs-6">{'Пароль'}</Form.Label>
              <Form.Control
                type="password"
                placeholder="Введите пароль"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setValidated(false);
                  setPassword(e.target.value);
                }}
                isInvalid={validated}
                disabled={sendingRequest}
                required
              />
              <p
                onClick={() => setResetPasswordOpened(true)}
                style={{ cursor: 'pointer', float: 'right' }}
                className="mt-1"
              >
                {'Забыли пароль?'}
              </p>
            </Form.Group>
            <Button
              className="mt-5 w-100 mb-3"
              type="submit"
              disabled={sendingRequest}
            >
              {'Войти'}
            </Button>
            <p className="text-center">{'Ещё нету аккаунта?'}</p>
            <p
              className="text-center mt-2 fs-6 text-decoration-underline"
              onClick={() => setSignUpOpened(true)}
              style={{ cursor: 'pointer' }}
            >
              {'Зарегистрироваться'}
            </p>
          </Form>
        </Card.Body>
      </Card>
    </Collapse>
  );
}

export default Login;
