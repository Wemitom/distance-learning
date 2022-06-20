import Header from '../Header';
import ProfileInfo from '../ProfileInfo';
import '../../styles/profilePage.css';
import { useEffect } from 'react';

const ProfilePage = () => {
  useEffect(() => {
    document.title = 'Профиль';
  }, []);

  return (
    <div>
      <Header />
      <ProfileInfo />
    </div>
  );
};

export default ProfilePage;
