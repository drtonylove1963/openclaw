/**
 * PlusMenu - Popover menu for the "+" button in the chat input bar.
 *
 * Actions: Upload File, Slash Commands, Voice Input, Browse Agents.
 * Appears above the button; closes on outside click or item selection.
 */

import { useEffect, useRef, useState } from 'react';

export interface PlusMenuProps {
  /** Whether the menu is currently visible */
  open: boolean;
  /** Close the menu */
  onClose: () => void;
  /** Trigger the hidden file input */
  onUploadFile: () => void;
  /** Insert "/" into chat input */
  onSlashCommands: () => void;
  /** Navigate to voice page */
  onVoiceInput: () => void;
  /** Navigate to agents page */
  onBrowseAgents: () => void;
}

interface MenuItem {
  label: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

export function PlusMenu({
  open,
  onClose,
  onUploadFile,
  onSlashCommands,
  onVoiceInput,
  onBrowseAgents,
}: PlusMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(0);

  // Reset focus to first item whenever the menu opens
  useEffect(() => {
    if (open) {setFocusedIndex(0);}
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) {return;}
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  // Keyboard navigation: Escape, ArrowUp, ArrowDown, Enter
  useEffect(() => {
    if (!open) {return;}
    const ITEM_COUNT = 4;
    const handler = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex((prev) => (prev + 1) % ITEM_COUNT);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex((prev) => (prev - 1 + ITEM_COUNT) % ITEM_COUNT);
          break;
        case 'Enter':
          // Action is resolved at render time via the items array;
          // we fire a synthetic click on the focused button instead of
          // duplicating the action logic here.
          e.preventDefault();
          (menuRef.current?.querySelectorAll('[role="menuitem"]')[focusedIndex] as HTMLButtonElement | undefined)?.click();
          break;
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose, focusedIndex]);

  if (!open) {return null;}

  const items: MenuItem[] = [
    {
      label: 'Upload File',
      description: 'Attach a file to the conversation',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="cyan-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
        </svg>
      ),
      action: onUploadFile,
    },
    {
      label: 'Slash Commands',
      description: 'Browse available commands',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-grad-2)" strokeWidth="2.5" strokeLinecap="round">
          <defs>
            <linearGradient id="cyan-grad-2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <line x1="7" y1="20" x2="17" y2="4" />
        </svg>
      ),
      action: onSlashCommands,
    },
    {
      label: 'Voice Input',
      description: 'Talk to Athena',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-grad-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="cyan-grad-3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      ),
      action: onVoiceInput,
    },
    {
      label: 'Browse Agents',
      description: 'Select a specialized agent',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="url(#cyan-grad-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <defs>
            <linearGradient id="cyan-grad-4" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      ),
      action: onBrowseAgents,
    },
  ];

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Chat actions menu"
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        marginBottom: '8px',
        minWidth: '240px',
        background: 'rgba(15, 15, 25, 0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 212, 255, 0.08)',
        padding: '6px',
        zIndex: 100,
        animation: 'plusMenuIn 0.15s ease-out',
      }}
    >
      {items.map((item, index) => {
        const isFocused = index === focusedIndex;
        return (
        <button
          key={item.label}
          type="button"
          role="menuitem"
          aria-selected={isFocused}
          className="w-full flex items-center gap-3 text-left cursor-pointer border-0"
          style={{
            padding: '10px 12px',
            background: isFocused ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
            borderRadius: '8px',
            transition: 'background 0.15s',
            outline: isFocused ? '2px solid rgba(0, 212, 255, 0.4)' : 'none',
            outlineOffset: '-2px',
          }}
          onClick={() => {
            item.action();
            onClose();
          }}
          onMouseEnter={(e) => {
            setFocusedIndex(index);
            (e.currentTarget as HTMLElement).style.background = 'rgba(0, 212, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background =
              focusedIndex === index ? 'rgba(0, 212, 255, 0.15)' : 'transparent';
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              minWidth: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 212, 255, 0.08)',
              borderRadius: '8px',
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ color: '#f0f0f5', fontSize: '13px', fontWeight: 500, lineHeight: 1.3 }}>
              {item.label}
            </div>
            <div style={{ color: '#6b7280', fontSize: '11px', lineHeight: 1.3 }}>
              {item.description}
            </div>
          </div>
        </button>
        );
      })}

      {/* Keyframe animation injected via style tag (scoped) */}
      <style>{`
        @keyframes plusMenuIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1); }
        }
      `}</style>
    </div>
  );
}
