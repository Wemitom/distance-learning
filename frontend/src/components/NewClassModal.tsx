import axios from 'axios';
import { firebaseAuth } from './Firebase';
import { FormEvent, useState } from 'react';
import { Button, Form, InputGroup, Modal, Stack } from 'react-bootstrap';
import { useMutation, useQueryClient } from 'react-query';
import ModalDialog from './ModalDialog';

export const NewClassModal = ({
  modalEnabled,
  handleClose,
}: {
  modalEnabled: boolean;
  handleClose: () => void;
}) => {
  const [className, setClassName] = useState('');
  const [limited, setLimited] = useState(false);
  const [limit, setLimit] = useState(5);
  const [validated, setValidated] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showAccessCode, setShowAccessCode] = useState(false);
  const queryClient = useQueryClient();

  const addNewClassMutation = useMutation(
    ({ idToken }: { idToken: string }) => {
      return axios.post(
        `https://distance-learning.herokuapp.com/api/classes`,
        {
          name: className,
          limit: limit,
          limited: limited,
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
        setAccessCode(`${data.accessCode}`);
        setShowAccessCode(true);
        queryClient.invalidateQueries('classes');
        handleClose();
      },
    }
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    e.preventDefault();
    if (form.checkValidity() === false) {
      e.stopPropagation();
    } else {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
      addNewClassMutation.mutate({ idToken });
    }

    setValidated(true);
  };

  return (
    <>
      <Modal show={modalEnabled} onHide={handleClose} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Добавление нового курса</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Label>Название курса</Form.Label>
            <Form.Control
              placeholder="Название курса"
              className="mb-3"
              value={className}
              minLength={3}
              disabled={addNewClassMutation.isLoading}
              onChange={(e) => setClassName(e.target.value)}
            />
            <Form.Label>Кол-во участников</Form.Label>
            <InputGroup className="mb-3">
              <InputGroup.Checkbox
                aria-label="Checkbox for following text input"
                value={limited}
                disabled={addNewClassMutation.isLoading}
                onChange={() => setLimited(!limited)}
              />
              <Form.Control
                aria-label="Text input with checkbox"
                value={limit}
                onChange={(e) => setLimit(+e.target.value)}
                min={5}
                disabled={!limited || addNewClassMutation.isLoading}
                type="number"
              />
            </InputGroup>
            <Stack className="mb-3">
              <Button type="submit">Создать</Button>
            </Stack>
          </Form>
        </Modal.Body>
      </Modal>

      <ModalDialog
        message={accessCode}
        title="Ваш код для приглашения участников"
        action={() => {}}
        modalEnabled={showAccessCode}
        handleClose={() => {
          setShowAccessCode(false);
        }}
        buttonsType="Ok"
        actionParams={[]}
      />
    </>
  );
};
