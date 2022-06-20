import { createContext } from 'react';

const UserRoleContext = createContext<'Студент' | 'Преподаватель' | null>(null);

export default UserRoleContext;
