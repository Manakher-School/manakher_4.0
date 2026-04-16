import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InlineForm, FormField } from '@/components/composite/InlineForm';

describe('InlineForm', () => {
  const baseFields: FormField[] = [
    { name: 'email', label: 'Email', type: 'email', required: true },
  ];

  const defaultProps = {
    fields: baseFields,
    onSubmit: jest.fn().mockResolvedValue(undefined),
    onCancel: jest.fn(),
    isLoading: false,
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    className: '',
    initialValues: {},
    onValidationError: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<InlineForm {...defaultProps} />);
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument();
  });

  it('should display required field indicator', () => {
    render(<InlineForm {...defaultProps} />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('should call onSubmit when form is submitted', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(defaultProps.onSubmit).toHaveBeenCalled());
  });

  it('should not submit when validation fails', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should display validation error when field is touched', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    const emailInput = screen.getByRole('textbox', { name: /Email/i });
    await user.click(emailInput);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should clear error when user starts typing', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    const emailInput = screen.getByRole('textbox', { name: /Email/i });
    await user.click(emailInput);
    await user.click(screen.getByRole('button', { name: /save/i }));
    await user.type(emailInput, 'test@example.com');
    expect(screen.queryByText('Email is required')).not.toBeInTheDocument();
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    expect(defaultProps.onCancel).toHaveBeenCalled();
  });

  it('should show loading state when isLoading is true', () => {
    render(<InlineForm {...defaultProps} isLoading={true} />);
    const submitButton = screen.getByRole('button', { name: /save/i });
    expect(submitButton).toBeDisabled();
  });

  it('should render textarea field when type is textarea', () => {
    const fields: FormField[] = [
      { name: 'message', label: 'Message', type: 'textarea' },
    ];
    render(<InlineForm {...defaultProps} fields={fields} />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('should render hidden field and not display it', () => {
    const fields: FormField[] = [
      { name: 'id', type: 'hidden' },
      { name: 'email', label: 'Email', type: 'email' },
    ];
    const { queryByName } = render(<InlineForm {...defaultProps} fields={fields} />);
    expect(queryByName('id')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Email/i })).toBeInTheDocument();
  });

  it('should pre-fill initial values', () => {
    const fields: FormField[] = [
      { name: 'email', label: 'Email', type: 'email', defaultValue: 'default@example.com' },
    ];
    render(<InlineForm {...defaultProps} fields={fields} />);
    expect(screen.getByDisplayValue('default@example.com')).toBeInTheDocument();
  });

  it('should support custom submit and cancel labels', () => {
    render(
      <InlineForm
        {...defaultProps}
        submitLabel="Create User"
        cancelLabel="Discard"
      />
    );
    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /discard/i })).toBeInTheDocument();
  });

  it('should call onValidationError when validation fails', async () => {
    const user = userEvent.setup();
    render(<InlineForm {...defaultProps} />);
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => expect(defaultProps.onValidationError).toHaveBeenCalled());
  });

  it('should validate email pattern when validate is provided', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        name: 'email',
        label: 'Email',
        type: 'email',
        required: true,
        validate: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        errorMessage: 'Invalid email format',
      },
    ];
    const { getByRole, getByText } = render(
      <InlineForm {...defaultProps} fields={fields} />
    );
    await user.type(getByRole('textbox', { name: /Email/i }), 'invalid-email');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(getByText('Invalid email format')).toBeInTheDocument();
  });

  it('should apply custom CSS class', () => {
    const { container } = render(
      <InlineForm {...defaultProps} className="custom-form-class" />
    );
    const formElement = container.querySelector('form');
    expect(formElement).toHaveClass('custom-form-class');
  });

  it('should validate multiple fields and show error on touch', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'password', label: 'Password', type: 'password', required: true },
    ];
    const { getByRole } = render(
      <InlineForm {...defaultProps} fields={fields} />
    );
    const emailInput = getByRole('textbox', { name: /Email/i });
    await user.click(emailInput);
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByText('Email is required')).toBeInTheDocument();
  });

  it('should handle textarea with placeholder', () => {
    const fields: FormField[] = [
      { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Enter details' },
    ];
    render(<InlineForm {...defaultProps} fields={fields} />);
    expect(screen.getByPlaceholderText('Enter details')).toBeInTheDocument();
  });

  it('should apply readOnly to all fields', () => {
    const fields: FormField[] = [
      { name: 'id', label: 'ID', type: 'text', readOnly: true },
    ];
    render(<InlineForm {...defaultProps} fields={fields} />);
    const idInput = screen.getByRole('textbox', { name: /ID/i });
    expect(idInput).toBeDisabled();
  });

  it('should validate custom validate function', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      {
        name: 'username',
        label: 'Username',
        type: 'text',
        required: true,
        validate: (value: string) => value.length >= 3 || 'Username must be at least 3 characters',
      },
    ];
    const { getByRole, getByText } = render(
      <InlineForm {...defaultProps} fields={fields} />
    );
    const usernameInput = getByRole('textbox', { name: /Username/i });
    await user.type(usernameInput, 'ab');
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(getByText('Username must be at least 3 characters')).toBeInTheDocument();
  });

  it('should handle helper text for fields', () => {
    const fields: FormField[] = [
      { name: 'email', label: 'Email', type: 'email', helperText: 'We will never share your email' },
    ];
    render(<InlineForm {...defaultProps} fields={fields} />);
    expect(screen.getByText('We will never share your email')).toBeInTheDocument();
  });

  it('should call onSubmit with correct form data', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'name', label: 'Name', type: 'text', required: true },
    ];
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const { getByRole } = render(
      <InlineForm {...defaultProps} fields={fields} onSubmit={onSubmit} />
    );
    await user.click(getByRole('textbox', { name: /Email/i }));
    await user.type(getByRole('textbox', { name: /Email/i }), 'test@example.com');
    await user.click(getByRole('textbox', { name: /Name/i }));
    await user.type(getByRole('textbox', { name: /Name/i }), 'Test User');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ email: 'test@example.com', name: 'Test User' })
    );
  });

  it('should not submit when form has errors', async () => {
    const user = userEvent.setup();
    const fields: FormField[] = [
      { name: 'email', label: 'Email', type: 'email', required: true },
    ];
    const onSubmit = jest.fn();
    const { getByRole } = render(
      <InlineForm {...defaultProps} fields={fields} onSubmit={onSubmit} />
    );
    await user.click(screen.getByRole('button', { name: /save/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
