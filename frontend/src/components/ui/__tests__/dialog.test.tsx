import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from '@/components/ui/dialog';

describe('Dialog', () => {
  it('should not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={jest.fn()}>
        Dialog content
      </Dialog>
    );
    
    expect(screen.queryByText('Dialog content')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()}>
        Dialog content
      </Dialog>
    );
    
    expect(screen.getByText('Dialog content')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()} title="Test Dialog">
        Dialog content
      </Dialog>
    );
    
    expect(screen.getByText('Test Dialog')).toBeInTheDocument();
  });

  it('should not render title when not provided', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()}>
        Dialog content
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    const title = dialog.querySelector('h2');
    expect(title).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    const onClose = jest.fn();
    render(
      <Dialog isOpen={true} onClose={onClose} title="Test">
        Content
      </Dialog>
    );
    
    const closeButton = screen.getByLabelText('Close dialog');
    await userEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when Escape key is pressed', async () => {
    const onClose = jest.fn();
    render(
      <Dialog isOpen={true} onClose={onClose}>
        Content
      </Dialog>
    );
    
    await userEvent.keyboard('{Escape}');
    
    expect(onClose).toHaveBeenCalled();
  });

  it('should render action buttons', async () => {
    const onAction = jest.fn();
    render(
      <Dialog 
        isOpen={true} 
        onClose={jest.fn()}
        actions={[
          { label: 'Cancel', onClick: jest.fn() },
          { label: 'Save', onClick: onAction },
        ]}
      >
        Content
      </Dialog>
    );
    
    const saveButton = screen.getByText('Save');
    await userEvent.click(saveButton);
    
    expect(onAction).toHaveBeenCalled();
  });

  it('should call onClose when backdrop is clicked', async () => {
    const onClose = jest.fn();
    const { container } = render(
      <Dialog isOpen={true} onClose={onClose}>
        Content
      </Dialog>
    );
    
    const backdrop = container.querySelector('[role="presentation"]');
    if (backdrop) {
      await userEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it('should have proper dialog role and attributes', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()} title="Test Dialog">
        Content
      </Dialog>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
  });

  it('should render children content', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()}>
        <div>Custom Content</div>
        <input placeholder="Test input" />
      </Dialog>
    );
    
    expect(screen.getByText('Custom Content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument();
  });

  it('should support different sizes', () => {
    const { container: smContainer } = render(
      <Dialog isOpen={true} onClose={jest.fn()} size="sm">
        Small
      </Dialog>
    );
    
    let dialog = smContainer.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('max-w-sm');
    
    const { container: mdContainer } = render(
      <Dialog isOpen={true} onClose={jest.fn()} size="md">
        Medium
      </Dialog>
    );
    
    dialog = mdContainer.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('max-w-md');
    
    const { container: lgContainer } = render(
      <Dialog isOpen={true} onClose={jest.fn()} size="lg">
        Large
      </Dialog>
    );
    
    dialog = lgContainer.querySelector('[role="dialog"]');
    expect(dialog).toHaveClass('max-w-lg');
  });

  it('should disable action button when loading', async () => {
    const onClick = jest.fn();
    render(
      <Dialog 
        isOpen={true} 
        onClose={jest.fn()}
        actions={[
          { label: 'Save', onClick, loading: true },
        ]}
      >
        Content
      </Dialog>
    );
    
    const button = screen.getByText('...');
    expect(button).toBeDisabled();
  });

  it('should disable action button when disabled prop is true', async () => {
    render(
      <Dialog 
        isOpen={true} 
        onClose={jest.fn()}
        actions={[
          { label: 'Delete', onClick: jest.fn(), disabled: true },
        ]}
      >
        Content
      </Dialog>
    );
    
    const button = screen.getByText('Delete');
    expect(button).toBeDisabled();
  });

  it('should render multiple action buttons', () => {
    render(
      <Dialog 
        isOpen={true} 
        onClose={jest.fn()}
        actions={[
          { label: 'Cancel', onClick: jest.fn() },
          { label: 'Save', onClick: jest.fn() },
          { label: 'Delete', onClick: jest.fn(), variant: 'danger' },
        ]}
      >
        Content
      </Dialog>
    );
    
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('should prevent body scroll when open', () => {
    render(
      <Dialog isOpen={true} onClose={jest.fn()}>
        Content
      </Dialog>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('should restore body scroll when closed', () => {
    const { rerender } = render(
      <Dialog isOpen={true} onClose={jest.fn()}>
        Content
      </Dialog>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <Dialog isOpen={false} onClose={jest.fn()}>
        Content
      </Dialog>
    );
    
    expect(document.body.style.overflow).toBe('unset');
  });
});
