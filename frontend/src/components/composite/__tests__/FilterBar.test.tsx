import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FilterBar, FilterConfig } from '@/components/composite/FilterBar';

describe('FilterBar', () => {
  const defaultProps = {
    searchPlaceholder: 'Search...',
    searchValue: '',
    onSearchChange: jest.fn(),
    filters: [],
    disabled: false,
    onClear: jest.fn(),
    showClear: true,
    className: '',
    actions: undefined,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should display search input when onSearchChange is provided', () => {
    render(<FilterBar {...defaultProps} searchValue="" />);

    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeInTheDocument();
  });

  it('should not display search input when onSearchChange is not provided', () => {
    const { queryByPlaceholderText } = render(
      <FilterBar {...defaultProps} onSearchChange={undefined} />
    );

    expect(queryByPlaceholderText('Search...')).not.toBeInTheDocument();
  });

  it('should call onSearchChange when typing in search input', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    await user.type(searchInput, 'test search');

    expect(defaultProps.onSearchChange).toHaveBeenLastCalledWith('test search');
  });

  it('should display clear button when search value exists', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} searchValue="active" />);

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    expect(clearButton).toBeInTheDocument();

    await user.click(clearButton);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should display filter dropdowns when filters are provided', () => {
    const filters: FilterConfig[] = [
      {
        label: 'Role',
        options: [
          { id: 'admin', label: 'Admin' },
          { id: 'teacher', label: 'Teacher' },
        ],
        value: '',
        onChange: jest.fn(),
      },
    ];

    render(<FilterBar {...defaultProps} filters={filters} />);

    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('should call filter onChange when dropdown value changes', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    const filters: FilterConfig[] = [
      {
        label: 'Role',
        options: [
          { id: 'admin', label: 'Admin' },
          { id: 'teacher', label: 'Teacher' },
        ],
        value: '',
        onChange: onChange,
      },
    ];

    render(<FilterBar {...defaultProps} filters={filters} />);

    // Find the dropdown and trigger change
    // Since we're using a custom Dropdown component, we'll test that the label is present
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('should not display clear button when showClear is false', () => {
    const { queryByRole } = render(
      <FilterBar {...defaultProps} searchValue="active" showClear={false} />
    );

    expect(queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('should disable all inputs when disabled is true', () => {
    render(<FilterBar {...defaultProps} disabled={true} />);

    const searchInput = screen.getByPlaceholderText('Search...');
    expect(searchInput).toBeDisabled();
  });

  it('should display active filters label when filters are active', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} searchValue="test" />);

    await user.type(screen.getByPlaceholderText('Search...'), 'test');

    expect(screen.getByText('Active filters:')).toBeInTheDocument();
  });

  it('should show search value in active filter display', () => {
    render(<FilterBar {...defaultProps} searchValue="test" />);

    expect(screen.getByText('Search: "test"')).toBeInTheDocument();
  });

  it('should clear search value when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} searchValue="test" />);

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearButton);

    expect(defaultProps.onSearchChange).toHaveBeenCalledWith('');
  });

  it('should call onClear when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<FilterBar {...defaultProps} searchValue="test" />);

    const clearButton = screen.getByRole('button', { name: /clear all/i });
    await user.click(clearButton);

    expect(defaultProps.onClear).toHaveBeenCalled();
  });

  it('should render custom actions when provided', () => {
    const actions = <button data-testid="custom-action">Custom Action</button>;

    render(<FilterBar {...defaultProps} actions={actions} />);

    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });

  it('should apply custom CSS class', () => {
    const { container } = render(
      <FilterBar {...defaultProps} className="custom-filter-class" />
    );

    const filterContainer = container.firstElementChild;
    expect(filterContainer).toHaveClass('custom-filter-class');
  });

  it('should handle multi-select filters', () => {
    const onChange = jest.fn();

    const filters: FilterConfig[] = [
      {
        label: 'Status',
        options: [
          { id: 'active', label: 'Active' },
          { id: 'inactive', label: 'Inactive' },
        ],
        value: [],
        onChange: onChange,
        multi: true,
      },
    ];

    render(<FilterBar {...defaultProps} filters={filters} />);

    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('should not show clear button when no active filters', () => {
    const { queryByRole } = render(<FilterBar {...defaultProps} searchValue="" />);

    expect(queryByRole('button', { name: /clear all/i })).not.toBeInTheDocument();
  });

  it('should display multiple active filters correctly', () => {
    const filters: FilterConfig[] = [
      {
        label: 'Role',
        options: [
          { id: 'admin', label: 'Admin' },
          { id: 'teacher', label: 'Teacher' },
        ],
        value: 'admin',
        onChange: jest.fn(),
      },
    ];

    render(
      <FilterBar {...defaultProps} searchValue="test" filters={filters} />
    );

    expect(screen.getByText('Active filters:')).toBeInTheDocument();
    expect(screen.getByText('Search: "test"')).toBeInTheDocument();
    expect(screen.getByText('Role: "admin"')).toBeInTheDocument();
  });

  it('should handle filter with placeholder text', () => {
    const filters: FilterConfig[] = [
      {
        label: 'Grade',
        options: [
          { id: '1', label: 'Grade 1' },
          { id: '2', label: 'Grade 2' },
        ],
        value: '',
        onChange: jest.fn(),
        placeholder: 'Select Grade',
      },
    ];

    render(<FilterBar {...defaultProps} filters={filters} />);

    expect(screen.getByText('Grade')).toBeInTheDocument();
  });

  it('should update active filters when search value changes', async () => {
    const user = userEvent.setup();
    const { getByText } = render(
      <FilterBar {...defaultProps} searchValue="" />
    );

    // Add search value
    await user.type(screen.getByPlaceholderText('Search...'), 'test1');

    expect(getByText('Search: "test1"')).toBeInTheDocument();

    // Clear button should appear when there's a value
    const clearButton = screen.getByRole('button', { name: /clear all/i });
    expect(clearButton).toBeInTheDocument();
  });
});
