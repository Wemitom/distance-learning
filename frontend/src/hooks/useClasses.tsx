import { useQuery, UseQueryResult } from 'react-query';
import axios from 'axios';
import { ClassNameInterface } from '../interfaces/interfaces';
import { firebaseAuth } from '../components/Firebase';

const getClasses = async (): Promise<ClassNameInterface[]> => {
  const idToken = (await firebaseAuth.currentUser?.getIdToken(true)) || '0';
  const { data } = await axios.get(`http://localhost:5000/api/classes`, {
    headers: { Authorization: idToken },
  });

  return data;
};

export default function useClasses(): UseQueryResult<ClassNameInterface[]> {
  return useQuery(['classes'], getClasses, {
    refetchOnWindowFocus: false,
  });
}
