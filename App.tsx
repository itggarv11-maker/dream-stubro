import React from 'react';
import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import NewSessionPage from './pages/NewSessionPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import { AuthProvider } from './contexts/AuthContext';
import QuestionPaperPage from './pages/QuestionPaperPage';
import ProfilePage from './pages/ProfilePage';
import GroupQuizPage from './pages/GroupQuizPage';
import CareerGuidancePage from './pages/CareerGuidancePage';
import StudyPlannerPage from './pages/StudyPlannerPage';
import MindMapPage from './pages/MindMapPage';
import GeminiLivePage from './pages/GeminiLivePage';
import VivaPage from './pages/VivaPage';
import AboutPage from './pages/AboutPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import PremiumPage from './pages/PremiumPage';
import VisualExplanationPage from './pages/VisualExplanationPage';
import LiveDebatePage from './pages/LiveDebatePage';
import { ContentProvider } from './contexts/ContentContext';
import ChapterConquestPage from './pages/ChapterConquestPage';
import SearchStatusIndicator from './components/app/SearchStatusIndicator';
import DashboardPage from './pages/DashboardPage';
import AILabAssistantPage from './pages/AILabAssistantPage';
import HistoricalChatPage from './pages/HistoricalChatPage';
import PoetryProseAnalysisPage from './pages/PoetryProseAnalysisPage';
import ConceptAnalogyPage from './pages/ConceptAnalogyPage';
import EthicalDilemmaPage from './pages/EthicalDilemmaPage';
import WhatIfHistoryPage from './pages/WhatIfHistoryPage';
import ExamPredictorPage from './pages/ExamPredictorPage';
import RealWorldApplicationPage from './pages/RealWorldApplicationPage';
import PersonalizedLearningPathPage from './pages/PersonalizedLearningPathPage';
import DigitalLabPage from './pages/DigitalLabPage';
import ProtectedRoute from './components/common/ProtectedRoute';

const AppContent: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <Header />
      <main className="flex-grow w-full py-20">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          
          {/* SECURED COMMAND ROUTES */}
          <Route path="/app" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          <Route path="/new-session" element={<ProtectedRoute><NewSessionPage /></ProtectedRoute>} />
          <Route path="/question-paper" element={<ProtectedRoute><QuestionPaperPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/group-quiz" element={<ProtectedRoute><GroupQuizPage /></ProtectedRoute>} />
          <Route path="/career-guidance" element={<ProtectedRoute><CareerGuidancePage /></ProtectedRoute>} />
          <Route path="/study-planner" element={<ProtectedRoute><StudyPlannerPage /></ProtectedRoute>} />
          <Route path="/mind-map" element={<ProtectedRoute><MindMapPage /></ProtectedRoute>} />
          <Route path="/gemini-live" element={<ProtectedRoute><GeminiLivePage /></ProtectedRoute>} />
          <Route path="/viva" element={<ProtectedRoute><VivaPage /></ProtectedRoute>} />
          <Route path="/visual-explanation" element={<ProtectedRoute><VisualExplanationPage /></ProtectedRoute>} />
          <Route path="/live-debate" element={<ProtectedRoute><LiveDebatePage /></ProtectedRoute>} />
          <Route path="/chapter-conquest" element={<ProtectedRoute><ChapterConquestPage /></ProtectedRoute>} />
          <Route path="/digital-lab" element={<ProtectedRoute><DigitalLabPage /></ProtectedRoute>} />
          
          <Route path="/ai-lab-assistant" element={<ProtectedRoute><AILabAssistantPage /></ProtectedRoute>} />
          <Route path="/historical-chat" element={<ProtectedRoute><HistoricalChatPage /></ProtectedRoute>} />
          <Route path="/poetry-prose-analysis" element={<ProtectedRoute><PoetryProseAnalysisPage /></ProtectedRoute>} />
          <Route path="/concept-analogy" element={<ProtectedRoute><ConceptAnalogyPage /></ProtectedRoute>} />
          <Route path="/ethical-dilemma" element={<ProtectedRoute><EthicalDilemmaPage /></ProtectedRoute>} />
          <Route path="/what-if-history" element={<ProtectedRoute><WhatIfHistoryPage /></ProtectedRoute>} />
          <Route path="/exam-predictor" element={<ProtectedRoute><ExamPredictorPage /></ProtectedRoute>} />
          <Route path="/real-world-applications" element={<ProtectedRoute><RealWorldApplicationPage /></ProtectedRoute>} />
          <Route path="/personalized-learning-path" element={<ProtectedRoute><PersonalizedLearningPathPage /></ProtectedRoute>} />
          
          <Route path="/contact" element={<div className="container mx-auto px-4"><ContactPage /></div>} />
          <Route path="/about" element={<div className="container mx-auto px-4"><AboutPage /></div>} />
          <Route path="/privacy-policy" element={<div className="container mx-auto px-4"><PrivacyPolicyPage /></div>} />
          <Route path="/premium" element={<div className="container mx-auto px-4"><PremiumPage /></div>} />
        </Routes>
      </main>
      <Footer />
      <SearchStatusIndicator />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
          <ContentProvider>
            <AppContent />
          </ContentProvider>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;