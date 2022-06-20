import { Modal, Button, Row, Col, ModalTitle, Stack } from 'react-bootstrap';

function ModalDialog({
  message,
  title,
  action,
  modalEnabled,
  handleClose,
  buttonsType,
  ...actionParams
}: {
  message: string;
  title: string;
  action: (...params: any) => void;
  modalEnabled: boolean;
  handleClose: () => void;
  buttonsType: 'Ok' | 'YesNo';
  actionParams?: any[];
}) {
  return (
    <Modal show={modalEnabled} onHide={handleClose}>
      <Modal.Header closeButton>
        {' '}
        <ModalTitle>{title}</ModalTitle>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-3">{message}</p>
        {buttonsType === 'YesNo' ? (
          <Row>
            <Col>
              <Button onClick={handleClose}>Нет</Button>
            </Col>
            <Col>
              <Button
                onClick={() => {
                  actionParams.actionParams !== undefined
                    ? action(...actionParams.actionParams)
                    : action();
                  handleClose();
                }}
                style={{ float: 'right' }}
              >
                Да
              </Button>
            </Col>
          </Row>
        ) : (
          <Stack>
            <Button
              onClick={() => {
                actionParams.actionParams !== undefined
                  ? action(...actionParams.actionParams)
                  : action();
                handleClose();
              }}
            >
              Ок
            </Button>
          </Stack>
        )}
      </Modal.Body>
    </Modal>
  );
}

export default ModalDialog;
