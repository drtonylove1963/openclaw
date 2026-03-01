import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Atom,
  MessageSquare,
  Hexagon,
  GitBranch,
  Sparkles,
  Network,
  FolderKanban,
  Target,
  Wrench,
  Settings,
  Shield,
  User,
  LogIn,
  LogOut,
  Menu,
  Rocket,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { MobileDrawer } from './MobileDrawer';

interface NavItemDef {
  path: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

interface NavSidebarProps {
  isMobileMenuOpen?: boolean;
  onMobileMenuClose?: () => void;
  onMobileMenuOpen?: () => void;
}

const NAV_ITEMS: NavItemDef[] = [
  { path: '/', icon: <Atom size={20} />, label: 'Home' },
  { path: '/chat', icon: <MessageSquare size={20} />, label: 'Chat' },
  { path: '/build', icon: <Hexagon size={20} />, label: 'Build' },
  { path: '/workflows', icon: <GitBranch size={20} />, label: 'Workflows' },
  { path: '/agents', icon: <Sparkles size={20} />, label: 'Agents' },
  { path: '/swarm', icon: <Network size={20} />, label: 'Swarm' },
  { path: '/missions', icon: <Rocket size={20} />, label: 'Missions' },
  { path: '/projects', icon: <FolderKanban size={20} />, label: 'Projects' },
  { path: '/memory', icon: <Target size={20} />, label: 'Memory' },
  { path: '/tools', icon: <Wrench size={20} />, label: 'Tools' },
];

const ADMIN_ITEMS: NavItemDef[] = [
  { path: '/admin', icon: <Shield size={20} />, label: 'Admin', adminOnly: true },
];

const BOTTOM_ITEMS: NavItemDef[] = [
  { path: '/settings', icon: <Settings size={20} />, label: 'Settings' },
];

export function NavSidebar({ 
  isMobileMenuOpen = false, 
  onMobileMenuClose = () => {}, 
  onMobileMenuOpen = () => {} 
}: NavSidebarProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAdmin, isAuthenticated, user, logout } = useAuth();
  const isMobile = useBreakpoint('md');

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Render mobile navigation
  if (isMobile) {
    return (
      <>
        {/* Hamburger menu button */}
        <button
          onClick={onMobileMenuOpen}
          className="fixed top-4 left-4 z-20 p-2 rounded-md bg-gray-800 bg-opacity-50 backdrop-blur-lg ni-glass border border-gray-700"
          aria-label="Open navigation menu"
        >
          <Menu size={24} className="text-white" />
        </button>

        {/* Mobile Drawer for navigation */}
        <MobileDrawer isOpen={isMobileMenuOpen} onClose={onMobileMenuClose}>
          <nav className="flex flex-col gap-2 p-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onMobileMenuClose();
                }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] w-full text-left ${
                  isActive(item.path)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* Admin items (visible only to admins) */}
            {isAdmin && (
              <>
                <div className="h-px bg-border my-2" />
                {ADMIN_ITEMS.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      onMobileMenuClose();
                    }}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] w-full text-left ${
                      isActive(item.path)
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))}
              </>
            )}

            {/* Separator before settings */}
            <div className="h-px bg-border my-2" />

            {BOTTOM_ITEMS.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  onMobileMenuClose();
                }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] w-full text-left ${
                  isActive(item.path)
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}

            {/* User Profile / Login */}
            <div className="h-px bg-border my-2" />
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 p-3 rounded-lg min-h-[44px]">
                {/* Avatar */}
                <div
                  className="flex items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{
                    width: '24px',
                    minWidth: '24px',
                    height: '24px',
                    background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                  }}
                >
                  {user.username[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{user.username}</div>
                  <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                </div>
                <button
                  onClick={() => { logout(); onMobileMenuClose(); }}
                  className="p-2 rounded-full hover:bg-accent"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  navigate('/login');
                  onMobileMenuClose();
                }}
                className="flex items-center gap-3 p-3 rounded-lg transition-colors min-h-[44px] w-full text-left hover:bg-accent/50"
              >
                <LogIn size={20} />
                <span>Sign In</span>
              </button>
            )}
          </nav>
        </MobileDrawer>
      </>
    );
  }

  // Render desktop sidebar
  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-in-out ni-glass z-10"
      style={{
        width: isHovered ? '200px' : '60px',
        minWidth: isHovered ? '200px' : '60px',
        borderRight: '1px solid rgba(255, 255, 255, 0.06)',
        borderRadius: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Items */}
      <nav className="flex-1 py-5" style={{ padding: '20px 0' }}>
        {NAV_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            expanded={isHovered}
            onClick={() => navigate(item.path)}
          />
        ))}
      </nav>

      {/* Admin Section + Bottom Items */}
      <div style={{ padding: '20px 0' }}>
        {/* Admin items (visible only to admins) */}
        {isAdmin && (
          <>
            {/* Separator */}
            <div
              style={{
                height: '1px',
                background: 'rgba(255, 255, 255, 0.06)',
                margin: '0 16px 10px',
              }}
            />
            {ADMIN_ITEMS.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                isActive={isActive(item.path)}
                expanded={isHovered}
                onClick={() => navigate(item.path)}
              />
            ))}
          </>
        )}

        {/* Separator before settings */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.06)',
            margin: '10px 16px',
          }}
        />

        {BOTTOM_ITEMS.map((item) => (
          <NavItem
            key={item.path}
            item={item}
            isActive={isActive(item.path)}
            expanded={isHovered}
            onClick={() => navigate(item.path)}
          />
        ))}

        {/* User Profile / Login */}
        <div
          style={{
            height: '1px',
            background: 'rgba(255, 255, 255, 0.06)',
            margin: '10px 16px',
          }}
        />
        {isAuthenticated && user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="relative flex items-center w-full transition-all duration-300 ease-in-out border-0 outline-none"
              style={{
                padding: '12px 20px',
                margin: '5px 10px',
                width: 'calc(100% - 20px)',
                borderRadius: '12px',
                background: showUserMenu ? 'rgba(0, 212, 255, 0.1)' : 'transparent',
                cursor: 'pointer',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: '24px',
                  minWidth: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #00d4ff, #8b5cf6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                }}
              >
                {user.username[0].toUpperCase()}
              </div>
              {/* Username */}
              <span
                className="ml-4 font-medium whitespace-nowrap transition-opacity duration-300"
                style={{
                  fontSize: '13px',
                  color: '#f0f0f5',
                  opacity: isHovered ? 1 : 0,
                  pointerEvents: isHovered ? 'auto' : 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '110px',
                }}
              >
                {user.username}
              </span>
            </button>

            {/* Logout dropdown */}
            {showUserMenu && isHovered && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '100%',
                  left: '10px',
                  right: '10px',
                  marginBottom: '4px',
                  background: 'rgba(15, 15, 25, 0.95)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '4px',
                  backdropFilter: 'blur(20px)',
                  zIndex: 50,
                }}
              >
                <div
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                    marginBottom: '4px',
                  }}
                >
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>{user.email}</div>
                  <div style={{ fontSize: '11px', color: '#4b5563', marginTop: '2px' }}>
                    {user.role}
                  </div>
                </div>
                <button
                  onClick={() => { logout(); setShowUserMenu(false); }}
                  className="flex items-center w-full transition-all duration-200"
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'transparent',
                    border: 'none',
                    color: '#ef4444',
                    fontSize: '13px',
                    cursor: 'pointer',
                    gap: '8px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <NavItem
            item={{ path: '/login', icon: <LogIn size={20} />, label: 'Sign In' }}
            isActive={location.pathname === '/login'}
            expanded={isHovered}
            onClick={() => navigate('/login')}
          />
        )}
      </div>
    </aside>
  );
}

function NavItem({
  item,
  isActive,
  expanded,
  onClick,
}: {
  item: NavItemDef;
  isActive: boolean;
  expanded: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex items-center w-full transition-all duration-300 ease-in-out border-0 outline-none"
      style={{
        padding: '15px 20px',
        margin: '5px 10px',
        width: 'calc(100% - 20px)',
        borderRadius: '12px',
        background: isActive
          ? 'rgba(0, 212, 255, 0.15)'
          : hovered
          ? 'rgba(0, 212, 255, 0.1)'
          : 'transparent',
        cursor: 'pointer',
      }}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2"
          style={{
            width: '3px',
            height: '60%',
            background: 'linear-gradient(180deg, #00d4ff, #8b5cf6)',
            borderRadius: '2px',
            boxShadow: '0 0 10px #00d4ff',
          }}
        />
      )}

      {/* Icon */}
      <span
        className="flex items-center justify-center transition-all duration-300"
        style={{
          width: '24px',
          minWidth: '24px',
          height: '24px',
          color: isActive ? '#00d4ff' : hovered ? '#00d4ff' : '#6b7280',
          filter: hovered ? 'drop-shadow(0 0 8px rgba(0, 212, 255, 0.6))' : 'none',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}
      >
        {item.icon}
      </span>

      {/* Label */}
      <span
        className="ml-4 font-medium whitespace-nowrap transition-opacity duration-300"
        style={{
          fontSize: '14px',
          color: isActive || hovered ? '#f0f0f5' : '#6b7280',
          opacity: expanded ? 1 : 0,
          pointerEvents: expanded ? 'auto' : 'none',
        }}
      >
        {item.label}
      </span>
    </button>
  );
}