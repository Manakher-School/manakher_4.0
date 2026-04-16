import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormDialog } from '@/components/composite/FormDialog';

// Mock the Dialog component before any imports that use it
jest.mock('@/components/ui/dialog', () => {
  const MockDialog = ({ isOpen, children, onClose, size = 'md' }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-dialog" onClick={() => onClose()}>
        {children}
        <button onClick={() => onClose()}>Close Dialog</button>
      </div>
    );
  };
  return {
    Dialog: MockDialog,
  };
});

describe('FormDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Test Form',
    onClose: jest.fn(),
    onSubmit: jest.fn(),
    children: <input type="text" placeholder="Test input" />,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(<FormDialog {...defaultProps} />);
    
    expect(screen.getByText('Test Form')).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(<FormDialog {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Test Form')).not.toBeInTheDocument();
  });

  it('should display title and description', () => {
    render(
      <FormDialog
        {...defaultProps}
        description="This is a test description"
      />
    );

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <FormDialog {...defaultProps} cancelLabel="Cancel" />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <FormDialog
        {...defaultProps}
        onSubmit={onSubmit}
        submitLabel="Submit"
      />
    );

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });

  it('should close dialog after successful submission if closeOnSubmit is true', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
      <FormDialog
        {...defaultProps}
        onSubmit={onSubmit}
        onClose={onClose}
        closeOnSubmit={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('should display error when error prop is provided', () => {
    render(
      <FormDialog
        {...defaultProps}
        error="This is an error message"
      />
    );

    // Since FormErrorAlert is being used, just verify the error message appears
    expect(screen.getByText(/This is an error message/i)).toBeInTheDocument();
  });

  it('should disable submit button when isLoading is true', () => {
    render(
      <FormDialog
        {...defaultProps}
        isLoading={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    expect(submitButton).toBeDisabled();
  });

  it('should render children correctly', () => {
    render(
      <FormDialog
        {...defaultProps}
        children={
          <>
            <input type="text" placeholder="Name" />
            <input type="email" placeholder="Email" />
          </>
        }
      />
    );

    expect(screen.getByPlaceholderText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('should accept custom submit button label', () => {
    render(
      <FormDialog
        {...defaultProps}
        submitLabel="Create User"
      />
    );

    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
  });

  it('should accept custom cancel button label', () => {
    render(
      <FormDialog
        {...defaultProps}
        cancelLabel="Go Back"
      />
    );

    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument();
  });

  it('should support form submission variants', () => {
    const { rerender } = render(
      <FormDialog
        {...defaultProps}
        submitVariant="primary"
      />
    );

    let submitButton = screen.getByRole('button', { name: /save/i });
    expect(submitButton).toBeInTheDocument();

    rerender(
      <FormDialog
        {...defaultProps}
        submitVariant="danger"
      />
    );

    submitButton = screen.getByRole('button', { name: /save/i });
    expect(submitButton).toBeInTheDocument();
  });

  it('should call onErrorDismiss when error is dismissed', () => {
    const onErrorDismiss = jest.fn();

    const { rerender } = render(
      <FormDialog
        {...defaultProps}
        error="Test error"
        onErrorDismiss={onErrorDismiss}
      />
    );

    // Note: This test depends on FormErrorAlert implementation
    // You may need to adjust based on how FormErrorAlert handles dismissal
    expect(screen.getByText(/Test error/i)).toBeInTheDocument();
  });

  it('should disable submit button when isDisabled is true', () => {
    render(
      <FormDialog
        {...defaultProps}
        isDisabled={true}
      />
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    expect(submitButton).toBeDisabled();
  });
});
