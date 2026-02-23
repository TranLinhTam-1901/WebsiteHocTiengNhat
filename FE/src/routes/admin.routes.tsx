import { RouteObject, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/admin/AdminLayout';
import PrivateRoute from './PrivateRoute';

// Import Pages
import Overview from '../pages/admin/Dashboard/Overview';
import LearnerList from '../pages/admin/UserManagement/LearnerList';
export const adminRoutes: RouteObject[] = [
 {
  element: <PrivateRoute role="admin"></PrivateRoute>,
  children: [
    {
      element: <AdminLayout />,
      children:
      [
        { index: true, element: <Navigate to="dashboard" replace /> },
        { path: 'dashboard', element: <Overview /> }, 
        { path: 'learners', element: <LearnerList /> },
      ],
    }
  ],
},
];