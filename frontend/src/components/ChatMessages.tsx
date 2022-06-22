import axios from 'axios';
import { useEffect, useRef, useState } from 'react';
import { Button, Form, Spinner } from 'react-bootstrap';
import { useMutation, useQueryClient } from 'react-query';
import { useParams } from 'react-router-dom';
import useChatMessages from '../hooks/useChatMessages';
import { MessageInterface } from '../interfaces/interfaces';
import { firebaseAuth } from './Firebase';
import MyMessage from './MyMessage';
import ThierMessage from './ThierMessage';

const ChatMessages = () => {
  const { classId, dialogId } = useParams();
  const queryClient = useQueryClient();
  const { data: messages } = useChatMessages(
    classId || '',
    firebaseAuth.currentUser?.uid,
    dialogId
  );
  const [message, setMessage] = useState('');
  const endRef = useRef<null | HTMLDivElement>(null);

  const postMessageMutation = useMutation(
    ({
      idToken,
      previousMessages,
    }: {
      idToken: string;
      previousMessages?: MessageInterface[];
    }) => {
      return axios.post(
        `https://distance-learning.herokuapp.com/api/chat?classId=${classId}`,
        {
          message,
          receiverUid: dialogId,
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
        setMessage('');
      },
      onMutate: async () => {
        await queryClient.cancelQueries([
          'messages',
          classId || '',
          firebaseAuth.currentUser?.uid,
          dialogId,
        ]);

        const previousMessages = queryClient.getQueryData([
          'messages',
          classId || '',
          firebaseAuth.currentUser?.uid,
          dialogId,
        ]);

        queryClient.setQueryData<MessageInterface[]>(
          ['messages', classId || '', firebaseAuth.currentUser?.uid, dialogId],
          (): MessageInterface[] => [
            ...(previousMessages as MessageInterface[]),
            {
              message: message,
              receiver: { uid: '', fullname: '' },
              sender: {
                uid: firebaseAuth.currentUser?.uid || '',
                fullname: '',
              },
              timestamp: Date.now(),
            },
          ]
        );

        return { previousMessages };
      },
      onError: (error, context) => {
        queryClient.setQueryData(
          ['messages', classId || '', firebaseAuth.currentUser?.uid, dialogId],
          context.previousMessages
        );
      },
      onSettled: () => {
        queryClient.invalidateQueries([
          'messages',
          classId || '',
          firebaseAuth.currentUser?.uid,
          dialogId,
        ]);
      },
    }
  );

  useEffect(() => {
    endRef.current !== null && endRef.current.scrollIntoView();
  }, []);

  return (
    <>
      <div className="chat-messages">
        <div style={{ minHeight: '82vh' }}>
          {!!messages ? (
            messages.length !== 0 ? (
              messages.map((messageInfo, index, messages) => {
                const messageTimestamp = new Date(messageInfo.timestamp);
                if (messageInfo.sender.uid === firebaseAuth.currentUser?.uid) {
                  return (
                    <div key={`msg_${index}`}>
                      <MyMessage
                        messageInfo={messageInfo}
                        isFirstMessage={
                          index
                            ? messages[index - 1].sender.uid !==
                              messageInfo.sender.uid
                            : true
                        }
                        renderDate={
                          index
                            ? new Date(
                                messages[index - 1].timestamp
                              ).getDate() !== messageTimestamp.getDate()
                            : true
                        }
                      />
                    </div>
                  );
                } else {
                  return (
                    <div key={`msg_${index}`}>
                      <ThierMessage
                        messageInfo={messageInfo}
                        isFirstMessage={
                          index
                            ? messages[index - 1].sender.uid !==
                              messageInfo.sender.uid
                            : true
                        }
                        renderDate={
                          index
                            ? new Date(
                                messages[index - 1].timestamp
                              ).getDate() !== messageTimestamp.getDate()
                            : true
                        }
                      />
                    </div>
                  );
                }
              })
            ) : (
              <h2 className="text-center">Сообщений нет</h2>
            )
          ) : (
            <Spinner
              animation="border"
              variant="primary"
              style={{ position: 'absolute', top: '5em', left: '50%' }}
            />
          )}
        </div>
        <div className="position-sticky" style={{ bottom: '0px' }}>
          <Form.Control
            placeholder="Сообщение"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <Button
            className="w-100"
            onClick={async () => {
              const idToken =
                (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
              postMessageMutation.mutate({ idToken });
            }}
          >
            Отправить
          </Button>
        </div>
        <div style={{ clear: 'both' }} ref={endRef}></div>
      </div>
    </>
  );
};

export default ChatMessages;
