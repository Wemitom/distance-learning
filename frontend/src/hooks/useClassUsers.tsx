import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { ClassUserInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getUsers = async ({
  queryKey,
}: {
  queryKey: (string | undefined)[];
}): Promise<ClassUserInterface[]> => {
  const [, classId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `http://localhost:5000/api/classes/users?classId=${classId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useClassUsers(
  classId: string,
  uid?: string,
  role?: 'Преподаватель' | 'Студент'
): UseQueryResult<ClassUserInterface[]> {
  return useQuery(['classUsers', classId, uid], getUsers, {
    refetchOnWindowFocus: false,
    enabled: !!uid && role === 'Преподаватель',
  });
}
