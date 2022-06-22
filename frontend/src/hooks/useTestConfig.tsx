import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { TestConfigInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getTestConfig = async ({
  queryKey,
}: {
  queryKey: string[];
}): Promise<TestConfigInterface | null> => {
  const [, testId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/test?testId=${testId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useTestConfig(
  testId: string
): UseQueryResult<TestConfigInterface | null> {
  return useQuery(['testConfigs', testId], getTestConfig, {
    refetchOnWindowFocus: false,
  });
}
