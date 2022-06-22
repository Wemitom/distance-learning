import { FormEvent, useState } from 'react';
import { Card, Form, Button, Collapse, Row, Col } from 'react-bootstrap';
import { firebaseAuth } from './Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';
import { useMutation } from 'react-query';

function SignUp({
  signUpOpened,
  setSignUpOpened,
}: {
  signUpOpened: boolean;
  setSignUpOpened: (value: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [surname, setSurname] = useState('');
  const [role, setRole] = useState('Преподаватель');
  const [validated, setValidated] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      try {
        setSendingRequest(true);
        createUserWithEmailAndPassword(firebaseAuth, email, password).then(
          async (userCredential) => {
            const { user } = userCredential;
            const idToken = await user.getIdToken(true);
            await addAccount.mutateAsync({ idToken });
          }
        );
      } catch (error) {
        setSendingRequest(false);
      }
    }

    setValidated(true);
  };

  const addAccount = useMutation(({ idToken }: { idToken: string }) =>
    axios.post(
      'https://distance-learning.herokuapp.com/api/users',
      {
        userName: name,
        userSurname: surname,
        userRole: role,
      },
      { headers: { Authorization: idToken } }
    )
  );

  return (
    <Collapse in={signUpOpened}>
      <Card style={{ width: '30em', position: 'absolute' }}>
        <Card.Body>
          <p
            className="fs-6 text-center text-decoration-underline"
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSignUpOpened(false);
              setEmail('');
              setPassword('');
              setName('');
              setSurname('');
              setValidated(false);
            }}
          >
            Назад ко входу
          </p>
          <Card.Title className="text-center mt-4 mb-4 fs-4">
            {'Регистрация'}
          </Card.Title>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Group className="mb-3 mt-3">
              <Form.Label className="fs-6">{'E-mail'}</Form.Label>
              <Form.Control
                type="email"
                placeholder="Введите e-mail"
                pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,5}$"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={sendingRequest}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fs-6">{'Пароль'}</Form.Label>
              <Form.Control
                type="password"
                placeholder="Введите пароль"
                pattern="^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={sendingRequest}
                required
              />
              <Form.Control.Feedback type="invalid">
                Пароль должен содержать как минимум 8 символов, 1 букву и 1
                цифру
              </Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3">
              <Row>
                <Col>
                  <Form.Label className="fs-6">{'Имя'}</Form.Label>
                  <Form.Control
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    disabled={sendingRequest}
                    required
                  />
                </Col>
                <Col>
                  <Form.Label className="fs-6">Фамилия</Form.Label>
                  <Form.Control
                    type="text"
                    value={surname}
                    onChange={(e) => setSurname(e.target.value)}
                    autoComplete="family-name"
                    disabled={sendingRequest}
                    required
                  />
                </Col>
              </Row>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fs-6">Тип аккаунта</Form.Label>
              <Form.Select
                disabled={sendingRequest}
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                }}
              >
                <option value={'Преподаватель'}>Преподаватель</option>
                <option value={'Студент'}>Студент</option>
              </Form.Select>
            </Form.Group>
            <Button
              className="mt-4 w-100 mb-3"
              type="submit"
              disabled={sendingRequest}
            >
              {'Зарегистрироваться'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Collapse>
  );
}

export default SignUp;
