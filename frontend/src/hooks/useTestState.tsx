import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TestStateInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getTestState = async ({
  queryKey,
}: {
  queryKey: string[];
}): Promise<TestStateInterface> => {
  const [, testId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/test/state?_id=${testId}`,
    {
      headers: { Authorization: idToken },
    }
  );
  const state = data;

  return state;
};

export default function useTestState(
  testId: string
): UseQueryResult<TestStateInterface> {
  return useQuery(['state', testId], getTestState, {
    refetchOnWindowFocus: false,
  });
}
