import axios from 'axios';
import { firebaseAuth } from './Firebase';
import { useState } from 'react';
import { Button, Form, Modal, Stack } from 'react-bootstrap';
import { useMutation } from 'react-query';
import { useNavigate } from 'react-router-dom';

export const JoinClassModal = ({
  modalEnabled,
  handleClose,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
}) => {
  const navigate = useNavigate();
  const [accessCode, setAccessCode] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const joinNewClassMutation = useMutation(
    ({ idToken }: { idToken: string }) => {
      return axios.patch(
        `https://distance-learning.herokuapp.com/api/classes?action=join`,
        {
          accessCode,
        },
        {
          headers: {
            Authorization: idToken,
          },
        }
      );
    },
    {
      onSuccess: ({ data }) => {
        localStorage.setItem('lastClass', data._id);
        navigate(`/class/${data._id}`);
        handleClose();
      },
      onError: ({ response }) => {
        setIsError(true);
        setErrorMessage(response.data.message);
      },
    }
  );

  return (
    <Modal show={modalEnabled} onHide={handleClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Присоединение к курсу</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Label>Код для присоединения</Form.Label>
        <Form.Group className="mb-3">
          <Form.Control
            placeholder="Код для присоединения"
            value={accessCode}
            disabled={joinNewClassMutation.isLoading}
            isInvalid={isError}
            onChange={(e) => {
              setAccessCode(e.target.value);
              isError && setIsError(false);
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errorMessage}
          </Form.Control.Feedback>
        </Form.Group>
        <Stack className="mb-3">
          <Button
            onClick={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              joinNewClassMutation.mutate({ idToken });
            }}
          >
            Присоединиться
          </Button>
        </Stack>
      </Modal.Body>
    </Modal>
  );
};
