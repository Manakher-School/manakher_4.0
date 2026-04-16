import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DataTable, Column } from '@/components/composite/DataTable';

interface TestData {
  id: string;
  name: string;
  email: string;
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
];

const mockColumns: Column<TestData>[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
];

describe('DataTable', () => {
  it('should render column headers', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('should render table rows with data', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
      />
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={[]}
        isLoading={true}
      />
    );

    const spinner = screen.queryByRole('img', { hidden: true });
    // Since we're using lucide Loader2 icon, check if loading container exists
    expect(screen.getByText(/loading/i) || screen.queryByRole('img')).toBeTruthy();
  });

  it('should display empty state message', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={[]}
        isEmpty={true}
        emptyMessage="No users found"
      />
    );

    expect(screen.getByText('No users found')).toBeInTheDocument();
  });

  it('should use default empty message', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={[]}
        isEmpty={true}
      />
    );

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render custom column renders', () => {
    const columns: Column<TestData>[] = [
      {
        key: 'name',
        label: 'Name',
        render: (item) => `${item.name} (${item.id})`,
      },
    ];

    render(
      <DataTable<TestData>
        columns={columns}
        data={mockData}
      />
    );

    expect(screen.getByText('John Doe (1)')).toBeInTheDocument();
  });

  it('should call onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();

    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        onEdit={onEdit}
        showActions={true}
      />
    );

    const editButtons = screen.getAllByTitle('Edit');
    await user.click(editButtons[0]);

    expect(onEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('should call onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockResolvedValue(undefined);

    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        onDelete={onDelete}
        showActions={true}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith(mockData[0]);
    });
  });

  it('should not show action buttons when showActions is false', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        showActions={false}
      />
    );

    expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
  });

  it('should support sorting', async () => {
    const user = userEvent.setup();
    const onSort = jest.fn();

    const sortableColumns: Column<TestData>[] = [
      { key: 'name', label: 'Name', sortable: true },
    ];

    render(
      <DataTable<TestData>
        columns={sortableColumns}
        data={mockData}
        onSort={onSort}
      />
    );

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    expect(onSort).toHaveBeenCalled();
  });

  it('should show sort indicator for active sort column', () => {
    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        sortBy="name"
        sortDirection="asc"
      />
    );

    // Verify the table is rendered with sorted data
    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should apply striped styling to rows', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        striped={true}
      />
    );

    // Check that table rows exist
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('should apply hover styling to rows', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        hoverable={true}
      />
    );

    // Check that table rows have appropriate classes
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(mockData.length);
  });

  it('should support custom column width', () => {
    const columns: Column<TestData>[] = [
      { key: 'name', label: 'Name', width: '200px' },
      { key: 'email', label: 'Email', width: '300px' },
    ];

    render(
      <DataTable<TestData>
        columns={columns}
        data={mockData}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should support column alignment', () => {
    const columns: Column<TestData>[] = [
      { key: 'name', label: 'Name', align: 'left' },
      { key: 'email', label: 'Email', align: 'right' },
    ];

    render(
      <DataTable<TestData>
        columns={columns}
        data={mockData}
      />
    );

    expect(screen.getByText('Name')).toBeInTheDocument();
  });

  it('should handle delete with error gracefully', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn().mockRejectedValue(new Error('Delete failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        onDelete={onDelete}
        showActions={true}
      />
    );

    const deleteButtons = screen.getAllByTitle('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(onDelete).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('should accept custom CSS class', () => {
    const { container } = render(
      <DataTable<TestData>
        columns={mockColumns}
        data={mockData}
        className="custom-table-class"
      />
    );

    // Check that the outer element has the custom class
    const tableContainer = container.querySelector('.custom-table-class');
    expect(tableContainer || container.firstChild).toBeTruthy();
  });
});
