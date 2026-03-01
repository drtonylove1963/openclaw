/**
 * TeamSelector Component
 * Dropdown selector for choosing a saved team configuration
 * Displays team name, member count, and allows deselection
 */

import React, { useState, useRef, useEffect } from 'react';
import { COLORS } from '../../styles/colors';
import type { SavedTeam } from '../../types/agentTeams';

interface TeamSelectorProps {
  teams: SavedTeam[];
  selectedTeamId: string | null;
  onSelect: (teamId: string | null) => void;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  teams,
  selectedTeamId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find selected team
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (teamId: string | null) => {
    onSelect(teamId);
    setIsOpen(false);
  };

  // Container
  const containerStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-block',
    fontFamily: "'Libre Franklin', 'Helvetica Neue', sans-serif",
  };

  // Button
  const buttonStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '8px',
    border: `1px solid ${COLORS.border}`,
    backgroundColor: COLORS.bgPanel,
    color: selectedTeam ? COLORS.text : COLORS.textMuted,
    fontSize: '14px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '180px',
    opacity: disabled ? 0.5 : 1,
    outline: 'none',
  };

  const buttonHoverStyle: React.CSSProperties = {
    ...buttonStyle,
    borderColor: COLORS.borderFocus,
    backgroundColor: COLORS.bgHover,
  };

  // Dropdown
  const dropdownStyle: React.CSSProperties = {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: '300px',
    overflowY: 'auto',
    backgroundColor: COLORS.bgPanel,
    border: `1px solid ${COLORS.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 1000,
    display: isOpen ? 'block' : 'none',
  };

  // Dropdown item
  const itemStyle = (isSelected: boolean): React.CSSProperties => ({
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    borderBottom: `1px solid ${COLORS.borderLight}`,
    backgroundColor: isSelected ? `${COLORS.purple}15` : 'transparent',
  });

  const itemHoverStyle: React.CSSProperties = {
    backgroundColor: COLORS.bgHover,
  };

  // Team name
  const teamNameStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 500,
    color: COLORS.text,
    marginBottom: '2px',
  };

  // Member count
  const memberCountStyle: React.CSSProperties = {
    fontSize: '12px',
    color: COLORS.textMuted,
  };

  // Chevron icon
  const ChevronIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );

  // Team icon
  const TeamIcon = () => (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );

  return (
    <div ref={dropdownRef} style={containerStyle}>
      {/* Dropdown button */}
      <button
        style={buttonStyle}
        onClick={handleToggle}
        disabled={disabled}
        onMouseEnter={(e) => {
          if (!disabled) {
            Object.assign(e.currentTarget.style, buttonHoverStyle);
          }
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, buttonStyle);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <TeamIcon />
        <span style={{ flex: 1, textAlign: 'left' }}>
          {selectedTeam ? selectedTeam.name : 'Select Team...'}
        </span>
        <ChevronIcon />
      </button>

      {/* Dropdown list */}
      <div style={dropdownStyle} role="listbox">
        {/* No team option */}
        <div
          style={itemStyle(selectedTeamId === null)}
          onClick={() => handleSelect(null)}
          onMouseEnter={(e) => {
            if (selectedTeamId !== null) {
              Object.assign(e.currentTarget.style, itemHoverStyle);
            }
          }}
          onMouseLeave={(e) => {
            Object.assign(e.currentTarget.style, itemStyle(selectedTeamId === null));
          }}
          role="option"
          aria-selected={selectedTeamId === null}
        >
          <div style={teamNameStyle}>No Team</div>
          <div style={memberCountStyle}>Single agent mode</div>
        </div>

        {/* Team list */}
        {teams.map((team) => {
          const isSelected = team.id === selectedTeamId;
          return (
            <div
              key={team.id}
              style={itemStyle(isSelected)}
              onClick={() => handleSelect(team.id)}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  Object.assign(e.currentTarget.style, itemHoverStyle);
                }
              }}
              onMouseLeave={(e) => {
                Object.assign(e.currentTarget.style, itemStyle(isSelected));
              }}
              role="option"
              aria-selected={isSelected}
            >
              <div style={teamNameStyle}>{team.name}</div>
              <div style={memberCountStyle}>
                {team.members.length} {team.members.length === 1 ? 'member' : 'members'}
              </div>
            </div>
          );
        })}

        {/* Empty state */}
        {teams.length === 0 && (
          <div
            style={{
              padding: '20px',
              textAlign: 'center',
              color: COLORS.textMuted,
              fontSize: '13px',
            }}
          >
            No saved teams. Create one in the Teams Manager.
          </div>
        )}
      </div>
    </div>
  );
};
