import { render, screen, fireEvent } from '@testing-library/react'
import { CrudListHeader } from '../composite/CrudListHeader'
import { Users } from 'lucide-react'

describe('CrudListHeader', () => {
  const mockOnAddClick = jest.fn()
  const mockOnSearchChange = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render title and icon', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        onAddClick={mockOnAddClick}
        addButtonLabel="Add User"
      />
    )

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add User' })).toBeInTheDocument()
  })

  it('should call onAddClick when add button is clicked', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        onAddClick={mockOnAddClick}
        addButtonLabel="Add User"
      />
    )

    const addButton = screen.getByRole('button', { name: 'Add User' })
    fireEvent.click(addButton)

    expect(mockOnAddClick).toHaveBeenCalled()
  })

  it('should render search input when searchValue is provided', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        searchValue="test"
        onSearchChange={mockOnSearchChange}
        searchPlaceholder="Search users..."
      />
    )

    const searchInput = screen.getByPlaceholderText('Search users...') as HTMLInputElement
    expect(searchInput).toBeInTheDocument()
    expect(searchInput.value).toBe('test')
  })

  it('should call onSearchChange when search input changes', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        searchValue=""
        onSearchChange={mockOnSearchChange}
        searchPlaceholder="Search users..."
      />
    )

    const searchInput = screen.getByPlaceholderText('Search users...')
    fireEvent.change(searchInput, { target: { value: 'john' } })

    expect(mockOnSearchChange).toHaveBeenCalledWith('john')
  })

  it('should not render search input when searchValue is not provided', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        onAddClick={mockOnAddClick}
      />
    )

    expect(screen.queryByPlaceholderText('Search...')).not.toBeInTheDocument()
  })

  it('should render custom add button label', () => {
    render(
      <CrudListHeader
        title="Items"
        icon={<Users />}
        onAddClick={mockOnAddClick}
        addButtonLabel="Create Item"
      />
    )

    expect(screen.getByRole('button', { name: 'Create Item' })).toBeInTheDocument()
  })

  it('should render right content when provided', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        rightContent={<span>Custom Content</span>}
      />
    )

    expect(screen.getByText('Custom Content')).toBeInTheDocument()
  })

  it('should prioritize onAddClick over rightContent', () => {
    render(
      <CrudListHeader
        title="Users"
        icon={<Users />}
        onAddClick={mockOnAddClick}
        addButtonLabel="Add"
        rightContent={<span>Should not appear</span>}
      />
    )

    expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument()
    expect(screen.queryByText('Should not appear')).not.toBeInTheDocument()
  })
})
