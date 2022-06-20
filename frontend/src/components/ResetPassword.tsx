import { useState } from 'react';
import { Card, Button, Collapse, Form, Row, Col } from 'react-bootstrap';
import { firebaseAuth } from './Firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

function ResetPassword({
  resetPasswordOpened,
  setResetPasswordOpened,
}: {
  resetPasswordOpened: boolean;
  setResetPasswordOpened: (value: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [emailEntered, setEmailEntered] = useState(false);
  const [wrongEmail, setWrongEmail] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const handleNextClicked = async () => {
    if (!emailEntered) {
      try {
        setSendingRequest(true);
        await sendPasswordResetEmail(firebaseAuth, email);
        setEmailEntered(true);
      } catch (error) {
        setWrongEmail(true);
      }
    } else {
      setEmail('');
      setEmailEntered(false);
      setResetPasswordOpened(false);
    }
    setSendingRequest(false);
  };

  return (
    <Collapse in={resetPasswordOpened}>
      <Card style={{ width: '30em', position: 'absolute' }}>
        <Card.Body>
          <Card.Title className="text-center mt-4 mb-4 fs-4">
            {'Восстановление пароля'}
          </Card.Title>
          <Form.Group className="mb-4" hidden={emailEntered}>
            <Form.Label className="fs-6">Введите e-mail</Form.Label>
            <Form.Control
              type="email"
              value={email}
              onChange={(e) => {
                setWrongEmail(false);
                setEmail(e.target.value);
              }}
              autoComplete="username"
              isInvalid={wrongEmail}
              disabled={sendingRequest}
            />
            <Form.Control.Feedback type="invalid">
              Введен неверный e-mail
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-4" hidden={!emailEntered}>
            На указанный e-mail было отправлено письмо с указаниями для сброса
            пароля.
          </Form.Group>
          <Row>
            <Col>
              <Button
                className="mx-auto"
                onClick={() => {
                  if (!emailEntered) {
                    setResetPasswordOpened(false);
                    setEmail('');
                    setWrongEmail(false);
                  } else {
                    setEmailEntered(false);
                  }
                }}
                disabled={sendingRequest}
              >
                {'Назад'}
              </Button>
            </Col>
            <Col>
              <Button
                className="mx-auto"
                style={{ float: 'right' }}
                onClick={handleNextClicked}
                disabled={sendingRequest}
              >
                {'Далее'}
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Collapse>
  );
}

export default ResetPassword;
