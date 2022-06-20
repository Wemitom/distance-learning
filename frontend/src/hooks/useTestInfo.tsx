import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TestInfoInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

export default function useTestInfo(
  testId: string
): UseQueryResult<TestInfoInterface> {
  return useQuery(
    'testInfo',
    async () => {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';

      const { data } = await axios.get(
        `http://localhost:5000/api/test/info?_id=${testId}`,
        {
          headers: { Authorization: `${idToken}` },
        }
      );
      return data;
    },
    {
      refetchOnWindowFocus: false,
    }
  );
}
