import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TestResultsInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getTestResults = async ({
  queryKey,
}: {
  queryKey: (string | undefined)[];
}): Promise<TestResultsInterface> => {
  const [, testId, uid] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `http://localhost:5000/api/test/results?_id=${testId}${
      !!uid ? `&userId=${uid}` : ''
    }`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useTestResults(
  testId: string,
  uid?: string
): UseQueryResult<TestResultsInterface> {
  return useQuery(['results', testId, uid], getTestResults, {
    refetchOnWindowFocus: false,
  });
}
