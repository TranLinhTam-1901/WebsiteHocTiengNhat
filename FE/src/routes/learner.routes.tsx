import { RouteObject, Navigate } from 'react-router-dom';
import LearnerLayout from '../components/layout/learner/LearnerLayout';
import PrivateRoute from './PrivateRoute';
import React from 'react';

// Analytics
import Leaderboard from '../pages/learner/Analytics/Leaderboard';
import LearningStatistics from '../pages/learner/Analytics/LearningStatistics';
import WeaknessAnalysis from '../pages/learner/Analytics/WeaknessAnalysis';
// Dashboard
import LearnerDashboard from '../pages/learner/Dashboard/Home';
// Skill Learning
import SkillPracticeListPage from '../pages/learner/Exam/Skills/SkillPracticeListPage';
import SkillHubPage from '../pages/learner/Exam/Skills/SkillHubPage';
import LearnerProfile from '../pages/learner/Profile/LearnerProfile';
// Flashcards
import DeckListPage from '../pages/learner/Flashcards/DeckListPage';
import FlashcardReviewPage from '../pages/learner/Flashcards/FlashcardReviewPage';
import DeckDetailPage from '../pages/learner/Flashcards/DeckDetailPage';
import DeckCreatePage from '../pages/learner/Flashcards/DeckCreatePage';
// History
import ExamHistory from '../pages/learner/History/ExamHistory';
// import Practice from '../pages/learner/Exam/Practice';
import Result from '../pages/learner/Exam/Skills/Result';
// Chat Support
import LearnerChatPage from '../pages/learner/Support/LearnerChatPage';
// Courses (học theo khóa)
import CourseListPage from '../pages/learner/Courses/CourseListPage';
import CourseDetailPage from '../pages/learner/Courses/CourseDetailPage';
import LessonLearnPage from '../pages/learner/Courses/LessonLearnPage';
import AiTutorPage from '../pages/learner/Support/AiTutorPage';
// Study resources (vocabulary & kanji)
import StudyVocabularyListPage from '../pages/learner/StudyResource/Vocabulary/VocabularyListPage';
import StudyVocabularyDetailPage from '../pages/learner/StudyResource/Vocabulary/VocabularyDetailPage';
import StudyKanjiListPage from '../pages/learner/StudyResource/Kanji/KanjiListPage';
import StudyKanjiDetailPage from '../pages/learner/StudyResource/Kanji/KanjiDetailPage';
import ExamDetailPage from '../pages/learner/Exam/Skills/ExamDetailPage';
//JLPT Exam
import JLPTExamListPage from '../pages/learner/Exam/JLPT/JLPTExamListPage';
import JLPTExamSummaryPage from '../pages/learner/Exam/JLPT/JLPTExamSummaryPage';
import JLPTExamTakingPage from '../pages/learner/Exam/JLPT/JLPTExamTakingPage';
import JLPTResultPage from '../pages/learner/Exam/JLPT/JLPTResultPage';

export const learnerRoutes: RouteObject = {
  path: '/learner',
  element: <PrivateRoute role="learner"></PrivateRoute>,
  children: [
    {
    element: <LearnerLayout />,
    children: [
    { index: true, element: <Navigate to="dashboard" replace /> },
    { path: 'dashboard', element: <LearnerDashboard /> },
    { path: 'courses', element: <CourseListPage /> },
    { path: 'courses/:courseId', element: <CourseDetailPage /> },
    { path: 'lessons/:lessonId/learn', element: <LessonLearnPage /> },
    { path: 'profile', element: <LearnerProfile /> },
    { path: 'leaderboard', element: <Leaderboard /> },
    { path: 'analytics/statistics', element: <LearningStatistics /> },
    { path: 'analytics/weakness', element: <WeaknessAnalysis /> },
    { path: 'history', element: <ExamHistory /> },
     // Exam(Lesson)
    { path: 'quiz/exam/:id', element: <ExamDetailPage /> },
    { path: 'quiz/result/:resultId', element: <Result /> },
    // JLPT Mock Test
    { path: 'exams/jlpt-exams', element: <JLPTExamListPage /> },
    { path: 'exams/jlpt-exams/:id/summary', element: <JLPTExamSummaryPage /> },
    { path: 'exams/jlpt-exams/:id/take', element: <JLPTExamTakingPage /> },
    { path: 'exams/jlpt-exams/result/:resultId', element: <JLPTResultPage /> },
    { path: 'exams/history', element: <ExamHistory /> },


    // Skill Learning
    { path: 'skill-learning/:skillType', element: <SkillHubPage /> },
    { path: 'skill-learning/:skillType/practice-list', element: <SkillPracticeListPage /> },
    { path: 'skill-learning/:skillType/practice/:id', element: <ExamDetailPage /> },
    { path: 'skill-learning/:skillType/result/:resultId', element: <Result /> },
    // Flashcards
    { path: 'flashcards', element: <DeckListPage /> },
    { path: 'flashcards/review/:deckID', element: <FlashcardReviewPage /> },
    { path: 'flashcards/deck/:deckID', element: <DeckDetailPage /> },
    { path: 'flashcards/create', element: <DeckCreatePage /> },
    // AI Tutor
    { path: 'ai-tutor', element: <AiTutorPage /> },
    { path: 'support', element: <LearnerChatPage /> },
    // Study Resources
    { path: 'studyresource/vocabulary', element: <StudyVocabularyListPage /> },
    { path: 'studyresource/vocabulary/:id', element: <StudyVocabularyDetailPage /> },
    { path: 'studyresource/kanji', element: <StudyKanjiListPage /> },
    { path: 'studyresource/kanji/:id', element: <StudyKanjiDetailPage /> },
      ]
    }
  ],
};