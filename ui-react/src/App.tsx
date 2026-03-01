import { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AppShell } from './components/layout/index';
import { AdminRoute } from './components/layout/AdminRoute';
import { UpdateBanner } from './hooks/useVersionCheck';
import {
  HomePage,
  ChatPage,
  BuildPage,
  WorkflowsPage,
  AgentsPage,
  ProjectsPage,
  MemoryPage,
  ToolsPage,
  VoicePage,
  SwarmPage,
  MissionsPage,
  SettingsPage,
  AdminPage,
} from './pages/neural';

import { LoginPage } from './pages/LoginPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

function LoadingFallback() {
  return (
    <div
      className="flex items-center justify-center h-full"
      style={{
        background: 'linear-gradient(180deg, #05050a 0%, #0a0a1a 100%)',
        color: '#6b7280',
        fontSize: '14px',
      }}
    >
      Loading...
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <UpdateBanner />
          <BrowserRouter>
            <Suspense fallback={<LoadingFallback />}>
              <Routes>
                {/* Neural Interface routes (new UI) */}
                <Route element={<AppShell />}>
                  <Route index element={<HomePage />} />
                  <Route path="chat" element={<ChatPage />} />
                  <Route path="chat/:conversationId" element={<ChatPage />} />
                  <Route path="build" element={<BuildPage />} />
                  <Route path="workflows" element={<WorkflowsPage />} />
                  <Route path="agents" element={<AgentsPage />} />
                  <Route path="swarm" element={<SwarmPage />} />
                  <Route path="missions" element={<MissionsPage />} />
                  <Route path="projects" element={<ProjectsPage />} />
                  <Route path="memory" element={<MemoryPage />} />
                  <Route path="tools" element={<ToolsPage />} />
                  <Route path="voice" element={<VoicePage />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route
                    path="admin/*"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="admin"
                    element={
                      <AdminRoute>
                        <AdminPage />
                      </AdminRoute>
                    }
                  />
                </Route>

                {/* Auth routes */}
                <Route path="login" element={<LoginPage />} />

                {/* Legacy redirect: send old /legacy URLs to home */}
                <Route path="legacy/*" element={<Navigate to="/" replace />} />

                {/* Fallback: redirect unknown routes to home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
