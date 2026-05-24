import React from 'react';
import AuthLayout from '../components/layout/auth/AuthLayout';
import LandingPage from '../pages/auth/LandingPage';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import PublicRoute from './PublicRoute';

export const authRoutes = [
  {
    index: true,
    element: <LandingPage />, // ← trang mặc định của /
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
      { path: 'reset-password', element: <ResetPassword /> },
    ],
  },
];