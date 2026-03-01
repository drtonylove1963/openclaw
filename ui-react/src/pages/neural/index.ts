import { lazy } from 'react';

// Lazy-loaded page components for code splitting
export const HomePage = lazy(() =>
  import('./HomePage').then((m) => ({ default: m.HomePage }))
);
export const ChatPage = lazy(() =>
  import('./ChatPage').then((m) => ({ default: m.ChatPage }))
);
export const BuildPage = lazy(() =>
  import('./BuildPage').then((m) => ({ default: m.BuildPage }))
);
export const WorkflowsPage = lazy(() =>
  import('./WorkflowsPage').then((m) => ({ default: m.WorkflowsPage }))
);
export const AgentsPage = lazy(() =>
  import('./AgentsPage').then((m) => ({ default: m.AgentsPage }))
);
export const SwarmPage = lazy(() =>
  import('./SwarmPage').then((m) => ({ default: m.SwarmPage }))
);
export const MissionsPage = lazy(() =>
  import('./MissionsPage').then((m) => ({ default: m.MissionsPage }))
);
export const ProjectsPage = lazy(() =>
  import('./ProjectsPage').then((m) => ({ default: m.ProjectsPage }))
);
export const MemoryPage = lazy(() =>
  import('./MemoryPage').then((m) => ({ default: m.MemoryPage }))
);
export const ToolsPage = lazy(() =>
  import('./ToolsPage').then((m) => ({ default: m.ToolsPage }))
);
export const VoicePage = lazy(() =>
  import('./VoicePage').then((m) => ({ default: m.VoicePage }))
);
export const SettingsPage = lazy(() =>
  import('./SettingsPage').then((m) => ({ default: m.SettingsPage }))
);
export const AdminPage = lazy(() =>
  import('./AdminPage').then((m) => ({ default: m.AdminPage }))
);
