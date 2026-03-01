import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'dark' | 'light' | 'system';
  sidebarExpanded: boolean;
  chatLeftPanelWidth: number;
  chatRightPanelWidth: number;
  chatLeftPanelCollapsed: boolean;
  chatRightPanelCollapsed: boolean;
}

interface UIActions {
  setTheme: (theme: UIState['theme']) => void;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setChatPanelWidth: (panel: 'left' | 'right', width: number) => void;
  toggleChatPanel: (panel: 'left' | 'right') => void;
}

export const useUIStore = create<UIState & UIActions>()(
  persist(
    (set) => ({
      theme: 'dark',
      sidebarExpanded: false,
      chatLeftPanelWidth: 280,
      chatRightPanelWidth: 300,
      chatLeftPanelCollapsed: false,
      chatRightPanelCollapsed: false,

      setTheme: (theme) => set({ theme }),

      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

      setChatPanelWidth: (panel, width) => {
        if (panel === 'left') {
          set({ chatLeftPanelWidth: Math.max(280, Math.min(400, width)) });
        } else {
          set({ chatRightPanelWidth: Math.max(280, Math.min(400, width)) });
        }
      },

      toggleChatPanel: (panel) => {
        if (panel === 'left') {
          set((state) => ({
            chatLeftPanelCollapsed: !state.chatLeftPanelCollapsed,
          }));
        } else {
          set((state) => ({
            chatRightPanelCollapsed: !state.chatRightPanelCollapsed,
          }));
        }
      },
    }),
    {
      name: 'pronetheia-ui',
    }
  )
);
