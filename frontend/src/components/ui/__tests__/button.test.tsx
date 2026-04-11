import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should be clickable and call onClick handler', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click me</Button>);
    
    const button = screen.getByText('Click me');
    await userEvent.click(button);
    
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByText('Disabled Button');
    expect(button).toBeDisabled();
  });

  it('should not call onClick when disabled', async () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>
        Disabled Button
      </Button>
    );
    
    const button = screen.getByText('Disabled Button');
    await userEvent.click(button);
    
    expect(onClick).not.toHaveBeenCalled();
  });

  it('should render with primary variant (default)', () => {
    const { container } = render(<Button>Primary Button</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--color-accent)]');
  });

  it('should render with ghost variant', () => {
    const { container } = render(<Button variant="ghost">Ghost Button</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-transparent');
  });

  it('should render with danger variant', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--color-danger-subtle)]');
  });

  it('should render with secondary variant', () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('bg-[var(--color-accent-subtle)]');
  });

  it('should render with default size', () => {
    const { container } = render(<Button>Default Size</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-4', 'py-2.5', 'text-sm');
  });

  it('should render with small size', () => {
    const { container } = render(<Button size="sm">Small Button</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-3', 'py-1.5', 'text-xs');
  });

  it('should render with large size', () => {
    const { container } = render(<Button size="lg">Large Button</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('px-6', 'py-3', 'text-base');
  });

  it('should render with icon size', () => {
    const { container } = render(<Button size="icon">🔍</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('p-2');
  });

  it('should accept custom className', () => {
    const { container } = render(
      <Button className="custom-class">Custom</Button>
    );
    
    const button = container.querySelector('button');
    expect(button).toHaveClass('custom-class');
  });

  it('should render children correctly', () => {
    render(
      <Button>
        <span>Icon</span>
        <span>Text</span>
      </Button>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByText('Text')).toBeInTheDocument();
  });

  it('should support aria-label for accessibility', () => {
    render(<Button aria-label="Delete item">Delete</Button>);
    
    const button = screen.getByLabelText('Delete item');
    expect(button).toBeInTheDocument();
  });

  it('should support type attribute', () => {
    const { container } = render(<Button type="submit">Submit</Button>);
    
    const button = container.querySelector('button');
    expect(button).toHaveAttribute('type', 'submit');
  });

  it('should be keyboard accessible', async () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Keyboard Button</Button>);
    
    const button = screen.getByText('Keyboard Button');
    button.focus();
    expect(button).toHaveFocus();
    
    await userEvent.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalled();
  });
});
