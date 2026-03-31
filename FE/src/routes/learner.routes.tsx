import { RouteObject, Navigate } from 'react-router-dom';
import LearnerLayout from '../components/layout/learner/LearnerLayout';
import PrivateRoute from './PrivateRoute';

// Analytics
import Leaderboard from '../pages/learner/Analytics/Leaderboard';
import LearningStatistics from '../pages/learner/Analytics/LearningStatistics';
import WeaknessAnalysis from '../pages/learner/Analytics/WeaknessAnalysis';
// Dashboard
import LearnerDashboard from '../pages/learner/Dashboard/Home';
// Skill Learning
import PracticeResultPage from '../pages/learner/Skills/PracticeResultPage';
import SkillFilterPage from '../pages/learner/Skills/SkillFilterPage';
import SkillHubPage from '../pages/learner/Skills/SkillHubPage';
import SkillPracticeView from '../pages/learner/Skills/SkillPracticeView';
// Flashcards
import DeckListPage from '../pages/learner/Flashcards/DeckListPage';
import FlashcardReviewPage from '../pages/learner/Flashcards/FlashcardReviewPage';
import DeckDetailPage from '../pages/learner/Flashcards/DeckDetailPage';
import DeckCreatePage from '../pages/learner/Flashcards/DeckCreatePage';
// History
import ExamHistory from '../pages/learner/History/ExamHistory';
// Roadmap
import RoadmapOverview from '../pages/learner/Roadmap/RoadmapOverview';
import RoadmapDetail from '../pages/learner/Roadmap/RoadmapDetail';
// Study
import LessonDetail from '../pages/learner/Study/LessonDetail';
import ReviewList from '../pages/learner/Study/ReviewList';
import VideoPlayer from '../pages/learner/Study/VideoPlayer';
// Placement Test
import Intro from '../pages/learner/PlacementTest/Intro';
import Testing from '../pages/learner/PlacementTest/Testing';
import Success from '../pages/learner/PlacementTest/Success';
// Quiz
import Exam from '../pages/learner/Quiz/Exam';
import Practice from '../pages/learner/Quiz/Practice';
import Result from '../pages/learner/Quiz/Result';
// Chat Support
import LearnerChatPage from '../pages/learner/Support/LearnerChatPage';

export const learnerRoutes: RouteObject = {
  path: '/learner',
  element: <PrivateRoute role="learner"></PrivateRoute>,
  children: [
    {
    element: <LearnerLayout />,
    children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <LearnerDashboard /> },
    { path: 'leaderboard', element: <Leaderboard /> },
    { path: 'analytics/statistics', element: <LearningStatistics /> },
    { path: 'analytics/weakness', element: <WeaknessAnalysis /> },
    { path: 'history', element: <ExamHistory /> },
    // Placement Test
    { path: 'placement-test/intro', element: <Intro /> },
    { path: 'placement-test/testing', element: <Testing /> },
    { path: 'placement-test/success', element: <Success /> },
    // Quiz
    { path: 'quiz/exam', element: <Exam /> },
    { path: 'quiz/practice', element: <Practice /> },
    { path: 'quiz/result', element: <Result /> },
    // Roadmap
    { path: 'roadmap', element: <RoadmapOverview /> },
    { path: 'roadmap/:level', element: <RoadmapDetail /> },
    // Study
    { path: 'study/lesson/:id', element: <LessonDetail /> },
    { path: 'study/reviews', element: <ReviewList /> },
    { path: 'study/video', element: <VideoPlayer /> },
    // Skill Learning
    { path: 'skill-learning/:skillType', element: <SkillHubPage /> },
    { path: 'skill-learning/:skillType/select', element: <SkillFilterPage /> },
    { path: 'skill-learning/:skillType/practice', element: <SkillPracticeView /> },
    { path: 'skill-learning/:skillType/practice/result', element: <PracticeResultPage sessionData={[]} skillType={''} /> },
    // Flashcards
    { path: 'flashcards', element: <DeckListPage /> },
    { path: 'flashcards/review/:deckID', element: <FlashcardReviewPage /> },
    { path: 'flashcards/deck/:deckID', element: <DeckDetailPage /> },
    { path: 'flashcards/create', element: <DeckCreatePage /> },
    { path: 'support', element: <LearnerChatPage /> },
      ]
    }
  ],
};