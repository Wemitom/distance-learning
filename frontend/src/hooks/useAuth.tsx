import axios from 'axios';
import { useQuery } from 'react-query';
import { firebaseAuth } from '../components/Firebase';
import { UserInfoInterface } from '../interfaces/interfaces';

const getUsers = async (): Promise<UserInfoInterface | null> => {
  let data: UserInfoInterface | null = null;
  if (firebaseAuth.currentUser !== null) {
    const idToken = await firebaseAuth.currentUser?.getIdToken(true);
    data = (
      await axios.get(`http://localhost:5000/api/users`, {
        headers: { Authorization: idToken },
      })
    ).data;
  }

  return data;
};

export default function useAuth(uid: string | undefined) {
  return useQuery(['users', uid], getUsers, {
    refetchOnWindowFocus: false,
    enabled: !!uid,
    staleTime: 5000,
  });
}