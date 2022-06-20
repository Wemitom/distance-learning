import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { QuestionInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

export default function useCurrentQuestion(
  testId: string
): UseQueryResult<QuestionInterface | QuestionInterface[]> {
  return useQuery(
    'currentQuestion',
    async () => {
      const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';

      const { data } = await axios.get(
        `http://localhost:5000/api/test/started/question?_id=${testId}`,
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
