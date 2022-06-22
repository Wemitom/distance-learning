import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { ReportsInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getReports = async ({
  queryKey,
}: {
  queryKey: string[];
}): Promise<ReportsInterface> => {
  const [, uid, taskId] = queryKey;
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(
    `https://distance-learning.herokuapp.com/api/reports?userId=${uid}&taskId=${taskId}`,
    {
      headers: { Authorization: idToken },
    }
  );

  return data;
};

export default function useReports(
  uid: string,
  taskId: string,
  enabled: boolean
): UseQueryResult<ReportsInterface> {
  return useQuery(['reports', uid, taskId], getReports, {
    refetchOnWindowFocus: false,
    enabled: enabled,
  });
}
