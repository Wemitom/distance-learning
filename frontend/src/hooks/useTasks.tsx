import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TaskCard, TaskType } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getTasks = async ({
  queryKey,
}: {
  queryKey: (string | null)[];
}): Promise<TaskCard[]> => {
  const [, taskType, classId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/tasks?type=${taskType}&classId=${classId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useTasks(
  taskType: TaskType,
  classId: string,
  className: string | null
): UseQueryResult<TaskCard[]> {
  return useQuery(['tasks', taskType, classId, className], getTasks, {
    refetchOnWindowFocus: false,
    retry: false,
    enabled: !!className,
  });
}
