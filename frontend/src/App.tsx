import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LandingRoute: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  return (
    <>
      <LandingPage onOpenLogin={() => setIsLoginModalOpen(true)} />
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            window.location.href = '/dashboard';
          }}
        />
      )}
    </>
  );
};

const DashboardRoute: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  if (!isLoggedIn) {
    return (
      <>
        <LandingPage onOpenLogin={() => setIsLoginModalOpen(true)} />
        <LoginModal
          isOpen={true}
          onClose={() => setIsLoginModalOpen(false)}
          onSuccess={() => {
            window.location.href = '/dashboard';
          }}
        />
      </>
    );
  }

  return <DashboardPage />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/dashboard" element={<DashboardRoute />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
