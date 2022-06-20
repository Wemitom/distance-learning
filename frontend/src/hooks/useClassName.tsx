import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { firebaseAuth } from '../components/Firebase';

export default function useClassName(classId: string): UseQueryResult<string> {
  return useQuery(
    ['className', classId],
    async ({ queryKey }) => {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
      const [, classId] = queryKey;

      const { data } = await axios.get(
        `http://localhost:5000/api/class-name?classId=${classId}`,
        {
          headers: { Authorization: `${idToken}` },
        }
      );
      return data;
    },
    {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5000,
    }
  );
}
