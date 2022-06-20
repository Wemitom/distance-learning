import useMonth from '../hooks/useMonth';
import { MessageInterface } from '../interfaces/interfaces';

const ThierMessage = ({
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
      <br />
      {isFirstMessage && (
        <>
          {renderDate && (
            <p className="text-muted text-center">{`${messageTimestamp.getDate()} ${messageMonth}`}</p>
          )}
          <p
            className="text-muted"
            style={{
              float: 'left',
              marginLeft: '4px',
              fontSize: '1.5em',
            }}
          >
            {messageInfo.sender.fullname}
          </p>
        </>
      )}
      <div className="message-block">
        <div
          className="message"
          style={{
            float: 'left',
            marginLeft: '4px',
            backgroundColor: '#CABCDC',
          }}
        >
          {messageInfo.message}
        </div>
      </div>
      <p
        style={{
          float: 'left',
          marginLeft: '4px',
        }}
      >
        {`${('0' + messageTimestamp.getHours()).slice(-2)}:${(
          '0' + messageTimestamp.getMinutes()
        ).slice(-2)}`}
      </p>
    </>
  );
};

export default ThierMessage;
