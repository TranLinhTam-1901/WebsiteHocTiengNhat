import { RouteObject, Navigate } from 'react-router-dom';
import AdminLayout from '../components/layout/admin/AdminLayout';
import PrivateRoute from './PrivateRoute';
import React from 'react';

// Import Pages hiện có
import Overview from '../pages/admin/Dashboard/Overview';
import LearnerList from '../pages/admin/UserManagement/LearnerList';
import QuestionCreatePage from '../pages/admin/QuestionBank/QuestionCreatePage';
import QuestionListView from '../pages/admin/QuestionBank/Index';
// Import 10 trang Content Management mới
import GrammarListPage from '../pages/admin/LearningResource/Grammar/GrammarListPage';
import GrammarForm from '../pages/admin/LearningResource/Grammar/GrammarForm';

import KanjiListPage from '../pages/admin/LearningResource/Kanji/KanjiListPage';
import KanjiForm from '../pages/admin/LearningResource/Kanji/KanjiForm';

import ListeningListPage from '../pages/admin/LearningResource/Listening/ListeningListPage';
import ListeningForm from '../pages/admin/LearningResource/Listening/ListeningForm';

import ReadingListPage from '../pages/admin/LearningResource/Reading/ReadingListPage';
import ReadingForm from '../pages/admin/LearningResource/Reading/ReadingForm';

import VocabListPage from '../pages/admin/LearningResource/Vocabulary/VocabListPage';
import VocabForm from '../pages/admin/LearningResource/Vocabulary/VocabForm';
import ExamListPage from '../pages/admin/ExamManagement/ExamListPage'; 
import ExamDetailPage from '../pages/admin/ExamManagement/ExamDetailPage';
import ExamForgePage from '../pages/admin/ExamManagement/ExamForgePage';
import SupportChatPage from '../pages/admin/Support/SupportChatPage';

import TopicListPage from '../pages/admin/LearningResource/Topic/TopicListPage';
import TopicForm from '../pages/admin/LearningResource/Topic/TopicForm';

import GrammarGroupListPage from '../pages/admin/LearningResource/GrammarGroup/GrammarGroupListPage';
import GrammarGroupForm from '../pages/admin/LearningResource/GrammarGroup/GrammarGroupForm';
import EditExamPage from '../pages/admin/ExamManagement/EditExamPage';

export const adminRoutes: RouteObject[] = [
  {
    element: <PrivateRoute role="admin"></PrivateRoute>,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard', element: <Overview /> },
          { path: 'support', element: <SupportChatPage /> },
          { path: 'learners', element: <LearnerList /> },
          
          // --- Quản lý Nội dung (Learning Resource) ---
          {
            path: 'resource',
            children: [
              // Grammar
              { path: 'grammar', element: <GrammarListPage /> },
              { path: 'grammar/create', element: <GrammarForm /> },
              { path: 'grammar/edit/:id', element: <GrammarForm /> },

              // Kanji
              { path: 'kanji', element: <KanjiListPage /> },
              { path: 'kanji/create', element: <KanjiForm /> },
              { path: 'kanji/edit/:id', element: <KanjiForm /> },

              // Listening
              { path: 'listening', element: <ListeningListPage /> },
              { path: 'listening/create', element: <ListeningForm /> },
              { path: 'listening/edit/:id', element: <ListeningForm /> },

              // Reading
              { path: 'reading', element: <ReadingListPage /> },
              { path: 'reading/create', element: <ReadingForm /> },
              { path: 'reading/edit/:id', element: <ReadingForm /> },

              // Vocabulary
              { path: 'vocabulary', element: <VocabListPage /> },
              { path: 'vocabulary/create', element: <VocabForm /> },
              { path: 'vocabulary/edit/:id', element: <VocabForm /> },

              // Topic
              { path: 'topic', element: <TopicListPage /> },
              { path: 'topic/create', element: <TopicForm /> },
              { path: 'topic/edit/:id', element: <TopicForm /> },

              // GrammarGroup
              { path: 'grammar-group', element: <GrammarGroupListPage /> },
              { path: 'grammar-group/create', element: <GrammarGroupForm /> },
              { path: 'grammar-group/edit/:id', element: <GrammarGroupForm /> },
            ]
          },

          // --- Question Bank ---
          { 
            path: 'question-bank', 
            children: [
                { index: true, element: <QuestionListView /> }, // URL: /admin/question-bank -> Hiển thị View 1
                { path: 'create/:lessonId?', element: <QuestionCreatePage /> }, // URL: /admin/question-bank/create -> Hiển thị View 2
                { path: 'edit/:id', element: <QuestionCreatePage /> } // Tái sử dụng View 2 cho việc sửa
            ]
         },
         
          {
            path: 'exams',
            children: [
               // Trang danh sách đề đã tạo (Ví dụ: /admin/exams/list)
              {  index : true, element: <ExamListPage /> },

              // Khi vào /admin/exams, trang này sẽ hiện đầu tiên
              { path :"add", element: <ExamForgePage /> }, 
              
              // Trang chi tiết đề thi (Ví dụ: /admin/exams/123/details)
              { path: ':id/details', element: <ExamDetailPage /> },

              { path: 'edit/:id', element: <EditExamPage /> },
            ]
          },
        ],
      }
    ],
  },
];