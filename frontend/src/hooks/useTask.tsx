import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TaskCard } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getTask = async ({
  queryKey,
}: {
  queryKey: (string | null)[];
}): Promise<TaskCard> => {
  const [, taskId, classId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/task?taskId=${taskId}&classId=${classId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useTask(
  taskId: string,
  classId: string,
  className: string | null
): UseQueryResult<TaskCard> {
  return useQuery(['tasks', taskId, classId, className], getTask, {
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!className,
  });
}
