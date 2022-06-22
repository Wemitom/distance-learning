import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { GradesInterface, TaskType } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getGrades = async ({
  queryKey,
}: {
  queryKey: (string | null)[];
}): Promise<GradesInterface[] | null> => {
  const [, taskType, classId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/grades?type=${taskType}&classId=${classId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useGrades(
  taskType: TaskType,
  classId: string,
  className: string | null
): UseQueryResult<GradesInterface[] | null> {
  return useQuery(['grades', taskType, classId, className], getGrades, {
    refetchOnWindowFocus: false,
    enabled: !!className,
  });
}
