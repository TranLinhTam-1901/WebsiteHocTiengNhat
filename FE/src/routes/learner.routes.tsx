import { RouteObject, Navigate } from 'react-router-dom';
import LearnerLayout from '../components/layout/learner/LearnerLayout';
import PrivateRoute from './PrivateRoute';

// Import Pages
import Leaderboard from '../pages/learner/Analytics/Leaderboard';
import Home from '../pages/learner/Dashboard/Home';
import ExamHistory from '../pages/learner/History/ExamHistory';
import Intro from '../pages/learner/PlacementTest/Intro';
import Success from '../pages/learner/PlacementTest/Success';
import Testing from '../pages/learner/PlacementTest/Testing';
import Exam from '../pages/learner/Quiz/Exam';
import Practice from '../pages/learner/Quiz/Practice';
import Result from '../pages/learner/Quiz/Result';
import RoadmapDetail from '../pages/learner/Roadmap/RoadmapDetail';
import RoadmapOverview from '../pages/learner/Roadmap/RoadmapOverview';
import LessonDetail from '../pages/learner/Study/LessonDetail';
import ReviewList from '../pages/learner/Study/ReviewList';
import VideoPlayer from '../pages/learner/Study/VideoPlayer';
import LearnerChatPage from '../pages/learner/Support/LearnerChatPage';

export const learnerRoutes: RouteObject = {
  path: '/learner',
  element: <PrivateRoute role="learner"></PrivateRoute>,
  children: [
    {
    element: <LearnerLayout />,
    children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <Home /> },
    { path: 'leaderboard', element: <Leaderboard /> },
    { path: 'history', element: <ExamHistory /> },
    // // Placement Test
    { path: 'placement-test/intro', element: <Intro /> },
    { path: 'placement-test/testing', element: <Testing /> },
    { path: 'placement-test/success', element: <Success /> },
    // // Quiz
    { path: 'quiz/exam', element: <Exam /> },
    { path: 'quiz/practice', element: <Practice /> },
    { path: 'quiz/result', element: <Result /> },
    // // Roadmap
    { path: 'roadmap', element: <RoadmapOverview /> },
    { path: 'roadmap/:level', element: <RoadmapDetail /> },
    // // Study
    { path: 'study/lesson/:id', element: <LessonDetail /> },
    { path: 'study/reviews', element: <ReviewList /> },
    { path: 'study/video', element: <VideoPlayer /> },
    { path: 'support', element: <LearnerChatPage /> },
      ]
    }
  ],
};