import { render, screen, fireEvent } from '@testing-library/react';
import { NavSidebar } from '../NavSidebar';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import { useAuth } from '../../contexts/AuthContext';

// Mock the hooks
jest.mock('../../hooks/useBreakpoint');
jest.mock('../../contexts/AuthContext');
jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/' }),
  useNavigate: () => jest.fn(),
}));

// Mock the MobileDrawer component
jest.mock('../MobileDrawer', () => ({
  MobileDrawer: ({ children, isOpen }: { children: React.ReactNode; isOpen: boolean }) => 
    isOpen ? <div data-testid="mobile-drawer">{children}</div> : null,
}));

describe('NavSidebar', () => {
  const mockUseBreakpoint = useBreakpoint as jest.Mock;
  const mockUseAuth = useAuth as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      isAuthenticated: false,
      user: null,
      logout: jest.fn(),
    });
  });

  describe('Desktop behavior', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue(false); // Not mobile
    });

    it('should render desktop sidebar when not mobile', () => {
      render(<NavSidebar />);
      
      // Should not show hamburger button
      expect(screen.queryByLabelText('Open navigation menu')).not.toBeInTheDocument();
      
      // Should show desktop navigation items
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('should not show mobile drawer', () => {
      render(<NavSidebar />);
      
      expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
    });
  });

  describe('Mobile behavior', () => {
    beforeEach(() => {
      mockUseBreakpoint.mockReturnValue(true); // Is mobile
    });

    it('should show hamburger button on mobile', () => {
      render(<NavSidebar />);
      
      expect(screen.getByLabelText('Open navigation menu')).toBeInTheDocument();
    });

    it('should call onMobileMenuOpen when hamburger button is clicked', () => {
      const onMobileMenuOpen = jest.fn();
      render(<NavSidebar onMobileMenuOpen={onMobileMenuOpen} />);
      
      const hamburgerButton = screen.getByLabelText('Open navigation menu');
      fireEvent.click(hamburgerButton);
      
      expect(onMobileMenuOpen).toHaveBeenCalledTimes(1);
    });

    it('should show mobile drawer when isMobileMenuOpen is true', () => {
      render(<NavSidebar isMobileMenuOpen={true} />);
      
      expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Chat')).toBeInTheDocument();
    });

    it('should not show mobile drawer when isMobileMenuOpen is false', () => {
      render(<NavSidebar isMobileMenuOpen={false} />);
      
      expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
    });

    it('should call onMobileMenuClose when navigation item is clicked', () => {
      const onMobileMenuClose = jest.fn();
      render(<NavSidebar isMobileMenuOpen={true} onMobileMenuClose={onMobileMenuClose} />);
      
      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);
      
      expect(onMobileMenuClose).toHaveBeenCalledTimes(1);
    });

    it('should render admin items when user is admin', () => {
      mockUseAuth.mockReturnValue({
        isAdmin: true,
        isAuthenticated: true,
        user: { username: 'testuser', email: 'test@example.com', role: 'admin' },
        logout: jest.fn(),
      });
      
      render(<NavSidebar isMobileMenuOpen={true} />);
      
      expect(screen.getByText('Admin')).toBeInTheDocument();
    });

    it('should render login button when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAdmin: false,
        isAuthenticated: false,
        user: null,
        logout: jest.fn(),
      });
      
      render(<NavSidebar isMobileMenuOpen={true} />);
      
      expect(screen.getByText('Sign In')).toBeInTheDocument();
    });

    it('should render user profile when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAdmin: false,
        isAuthenticated: true,
        user: { username: 'testuser', email: 'test@example.com', role: 'user' },
        logout: jest.fn(),
      });
      
      render(<NavSidebar isMobileMenuOpen={true} />);
      
      expect(screen.getByText('testuser')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });
});