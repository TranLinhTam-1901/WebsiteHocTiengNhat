import { RouteObject, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/admin/AdminLayout';
import PrivateRoute from './PrivateRoute';

// Import Pages
import Overview from '../pages/admin/Dashboard/Overview';
import LearnerList from '../pages/admin/UserManagement/LearnerList';
import QuestionCreatePage from '../pages/admin/QuestionBank/QuestionCreatePage';
import QuestionListView from '../pages/admin/QuestionBank/Index'; 
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
        // { 
        //     path: 'question-bank/create/:lessonId?', 
        //     element: <QuestionCreatePage /> 
        // },
        { 
            path: 'question-bank', 
            children: [
                { index: true, element: <QuestionListView /> }, // URL: /admin/question-bank -> Hiển thị View 1
                { path: 'create/:lessonId?', element: <QuestionCreatePage /> }, // URL: /admin/question-bank/create -> Hiển thị View 2
                { path: 'edit/:id', element: <QuestionCreatePage /> } // Tái sử dụng View 2 cho việc sửa
            ]
        },
        // Sau này khi bạn làm View 1 (Danh sách), hãy thêm vào đây:
        // { path: 'question-bank', element: <QuestionListPage /> },
      ],
    }
  ],
},
];