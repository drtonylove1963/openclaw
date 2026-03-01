import { render, screen, fireEvent } from '@testing-library/react';
import { MobileDrawer } from '../MobileDrawer';

describe('MobileDrawer', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    onCloseMock.mockClear();
  });

  it('does not render when isOpen is false', () => {
    render(
      <MobileDrawer isOpen={false} onClose={onCloseMock}>
        <div>Test Content</div>
      </MobileDrawer>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders when isOpen is true', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div data-testid="test-content">Test Content</div>
      </MobileDrawer>
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div>Test Content</div>
      </MobileDrawer>
    );

    const backdrop = screen.getByRole('dialog').firstChild as HTMLElement;
    fireEvent.click(backdrop);

    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when ESC key is pressed', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div>Test Content</div>
      </MobileDrawer>
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when other keys are pressed', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div>Test Content</div>
      </MobileDrawer>
    );

    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('renders children correctly', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div data-testid="child-content">Child Content</div>
      </MobileDrawer>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('has correct accessibility attributes', () => {
    render(
      <MobileDrawer isOpen={true} onClose={onCloseMock}>
        <div>Test Content</div>
      </MobileDrawer>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });
});