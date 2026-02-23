import { useRoutes, Navigate } from 'react-router-dom';

import { authRoutes } from './auth.routes';
import { learnerRoutes } from './learner.routes';
import { adminRoutes } from './admin.routes';
import PublicRoute from './PublicRoute';
import PrivateRoute from './PrivateRoute';
// import NotFound from '../components/shared/NotFound';
// import Unauthorized from '../components/shared/Unauthorized';
import Unauthorized from "../pages/auth/Unauthorized";
export default function AppRouter() {
  return useRoutes([
  {
    path: '/',
    element: <PublicRoute />,
    children: authRoutes,
  },
  {
    path: '/learner',
    element: <PrivateRoute role="learner" />,
    children: learnerRoutes.children,
  },
  {
    path: '/admin',
    element: <PrivateRoute role="admin" />,
    children: adminRoutes,
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />
  },
]);

}