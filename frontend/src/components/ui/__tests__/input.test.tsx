import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input', () => {
  it('should render input with label', () => {
    render(<Input label="Email" />);
    
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should accept text input', async () => {
    render(<Input label="Name" />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'John Doe');
    
    expect(input).toHaveValue('John Doe');
  });

  it('should call onChange callback on input change', async () => {
    const onChange = jest.fn();
    render(<Input label="Test" onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'test');
    
    expect(onChange).toHaveBeenCalled();
  });

  it('should support placeholder', () => {
    render(<Input label="Email" placeholder="Enter email" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('placeholder', 'Enter email');
  });

  it('should support type attribute', () => {
    render(<Input label="Password" type="password" />);
    
    const input = screen.getByLabelText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('should support disabled state', async () => {
    const onChange = jest.fn();
    render(<Input label="Disabled" disabled onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    
    await userEvent.type(input, 'test');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should support readOnly state', async () => {
    const onChange = jest.fn();
    render(<Input label="Read Only" value="Static" readOnly onChange={onChange} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('readonly');
  });

  it('should support required attribute', () => {
    render(<Input label="Required Field" required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
  });

  it('should associate label with input', () => {
    const { container } = render(<Input label="Associated" />);
    
    const label = screen.getByText('Associated');
    const input = screen.getByRole('textbox');
    
    // Check if label has htmlFor matching input id
    expect(label.tagName).toBe('LABEL');
  });

  it('should support maxLength attribute', () => {
    render(<Input label="Limited" maxLength={10} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('maxLength', '10');
  });

  it('should support custom className', () => {
    const { container } = render(
      <Input label="Custom" className="custom-class" />
    );
    
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('custom-class');
  });

  it('should handle value prop', () => {
    render(<Input label="Controlled" value="Controlled value" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('Controlled value');
  });

  it('should support different input types', () => {
    const { rerender } = render(<Input label="Email" type="email" />);
    let input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
    
    rerender(<Input label="Number" type="number" />);
    input = screen.getByLabelText('Number');
    expect(input).toHaveAttribute('type', 'number');
    
    rerender(<Input label="Date" type="date" />);
    input = screen.getByLabelText('Date');
    expect(input).toHaveAttribute('type', 'date');
  });

  it('should be keyboard accessible', async () => {
    render(<Input label="Keyboard Test" />);
    
    const input = screen.getByRole('textbox');
    input.focus();
    expect(input).toHaveFocus();
    
    await userEvent.type(input, 'Hello');
    expect(input).toHaveValue('Hello');
  });

  it('should support aria-label', () => {
    render(<Input label="Accessible" aria-label="Custom aria label" />);
    
    const input = screen.getByLabelText('Custom aria label');
    expect(input).toBeInTheDocument();
  });

  it('should support aria-describedby for error messages', () => {
    render(
      <div>
        <Input 
          label="Email" 
          aria-describedby="email-error"
        />
        <span id="email-error">Invalid email format</span>
      </div>
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
  });

  it('should handle numeric input', async () => {
    render(<Input label="Age" type="number" />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '25');
    
    expect(input).toHaveValue('25');
  });

  it('should clear input value', async () => {
    render(<Input label="Clear Test" />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'Test');
    expect(input).toHaveValue('Test');
    
    await userEvent.clear(input);
    expect(input).toHaveValue('');
  });
});
