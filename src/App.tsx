import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';

import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { TrackSelectionPage } from './pages/TrackSelectionPage';
import { InterviewRoomPage } from './pages/InterviewRoomPage';
import { ResultsPage } from './pages/ResultsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { CursorGridBackground } from './components/ui/CursorGridBackground';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#1A0F22] text-[#F8F4E9] flex flex-col font-sans selection:bg-[#935073] selection:text-[#F8F4E9] relative">
          {/* React Bits Cursor Grid Background (persistent across all routes) */}
          <CursorGridBackground />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<AuthPage defaultMode="login" />} />
                <Route path="/register" element={<AuthPage defaultMode="signup" />} />
                <Route path="/signup" element={<AuthPage defaultMode="signup" />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/track-selection" element={<TrackSelectionPage />} />
                <Route path="/interview/:id" element={<InterviewRoomPage />} />
                <Route path="/results/:id" element={<ResultsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/admin" element={<AdminDashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
