import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { MessageInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getMessages = async ({
  queryKey,
}: {
  queryKey: (string | undefined)[];
}): Promise<MessageInterface[]> => {
  const [, classId, uid, receiver] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `http://localhost:5000/api/chat?classId=${classId}${
      !!receiver ? `&receiverUid=${receiver}` : ''
    }`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useChatMessages(
  classId: string,
  uid?: string,
  receiver?: string
): UseQueryResult<MessageInterface[]> {
  return useQuery(['messages', classId, uid, receiver], getMessages, {
    refetchOnWindowFocus: false,
    enabled: !!uid,
  });
}
