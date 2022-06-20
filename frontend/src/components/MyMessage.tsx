import useMonth from '../hooks/useMonth';
import { MessageInterface } from '../interfaces/interfaces';

const MyMessage = ({
  messageInfo,
  isFirstMessage,
  renderDate,
}: {
  messageInfo: MessageInterface;
  isFirstMessage: boolean;
  renderDate: boolean;
}) => {
  const messageTimestamp = new Date(messageInfo.timestamp);
  const messageMonth = useMonth(messageTimestamp.getMonth());

  return (
    <>
      {isFirstMessage && (
        <>
          <br />
          {renderDate && (
            <p className="text-muted text-center">{`${messageTimestamp.getDate()} ${messageMonth}`}</p>
          )}
          <p
            className="text-muted"
            style={{
              float: 'right',
              marginRight: '4px',
              fontSize: '1.5em',
            }}
          >
            Вы
          </p>
        </>
      )}
      <div className="message-block">
        <div
          className="message"
          style={{
            float: 'right',
            marginRight: '4px',
            color: 'white',
            backgroundColor: '#3B2A50',
          }}
        >
          {messageInfo.message}
        </div>
      </div>
      <p
        style={{
          float: 'right',
          marginRight: '4px',
        }}
      >
        {`${('0' + messageTimestamp.getHours()).slice(-2)}:${(
          '0' + messageTimestamp.getMinutes()
        ).slice(-2)}`}
      </p>
    </>
  );
};

export default MyMessage;
