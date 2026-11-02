import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { FullPageSpinner } from './components/FullPageSpinner';

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
  const { isLoggedIn, authTransition } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // During active OAuth token exchange or session establishment, render smooth spinner
  if (authTransition.isActive) {
    return (
      <FullPageSpinner
        title={authTransition.title}
        subtitle={authTransition.subtitle}
        badge={authTransition.badge}
        variant={authTransition.variant}
      />
    );
  }

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

const AppContent: React.FC = () => {
  const { authTransition } = useAuth();

  return (
    <>
      {/* Global Top-Level Smooth Transition Spinner */}
      {authTransition.isActive && (
        <FullPageSpinner
          title={authTransition.title}
          subtitle={authTransition.subtitle}
          badge={authTransition.badge}
          variant={authTransition.variant}
        />
      )}

      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/dashboard" element={<DashboardRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
