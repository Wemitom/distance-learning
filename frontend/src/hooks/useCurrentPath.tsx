import { matchRoutes, useLocation } from 'react-router-dom';

const routes = [
  { path: '/class/:classId' },
  { path: '/class/:classId/grades' },
  { path: '/class/:classId/settings' },
  { path: '/class/:classId/chat' },
  { path: '/class/:classId/chat/:dialogId' },
];

const useCurrentPath = () => {
  const location = useLocation();
  const match = matchRoutes(routes, location);
  if (match !== null) {
    const [{ route }] = match;
    return route.path;
  } else {
    return null;
  }
};

export default useCurrentPath;
