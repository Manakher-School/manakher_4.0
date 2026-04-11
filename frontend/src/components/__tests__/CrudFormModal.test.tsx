import { render, screen, fireEvent } from '@testing-library/react'
import { CrudFormModal } from '../composite/CrudFormModal'

describe('CrudFormModal', () => {
  const mockOnClose = jest.fn()
  const mockOnSubmit = jest.fn()
  const mockOnErrorDismiss = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should not render when isOpen is false', () => {
    render(
      <CrudFormModal
        isOpen={false}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" placeholder="Test field" />
      </CrudFormModal>
    )

    expect(screen.queryByText('Test Form')).not.toBeInTheDocument()
  })

  it('should render when isOpen is true', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" placeholder="Test field" />
      </CrudFormModal>
    )

    expect(screen.getByText('Test Form')).toBeInTheDocument()
  })

  it('should display title and subtitle', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Create User"
        subtitle="Fill in the details below"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" />
      </CrudFormModal>
    )

    expect(screen.getByText('Create User')).toBeInTheDocument()
    expect(screen.getByText('Fill in the details below')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" />
      </CrudFormModal>
    )

    const closeButton = screen.getByLabelText('Cancel')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onSubmit when form is submitted', () => {
    const { container } = render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" />
      </CrudFormModal>
    )

    const form = container.querySelector('form')
    fireEvent.submit(form!)

    expect(mockOnSubmit).toHaveBeenCalled()
  })

  it('should display error message when error prop is provided', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        error="Something went wrong"
        onErrorDismiss={mockOnErrorDismiss}
        onSubmit={mockOnSubmit}
      >
        <input type="text" />
      </CrudFormModal>
    )

    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
  })

  it('should render custom submit and cancel labels', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
        submitLabel="Create"
        cancelLabel="Discard"
      >
        <input type="text" />
      </CrudFormModal>
    )

    expect(screen.getByText('Create')).toBeInTheDocument()
    expect(screen.getByText('Discard')).toBeInTheDocument()
  })

  it('should disable submit button when isLoading is true', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={true}
        onSubmit={mockOnSubmit}
      >
        <input type="text" />
      </CrudFormModal>
    )

    const submitButton = screen.getByText('Save') as HTMLButtonElement
    expect(submitButton.disabled).toBe(true)
  })

  it('should render children content', () => {
    render(
      <CrudFormModal
        isOpen={true}
        onClose={mockOnClose}
        title="Test Form"
        isLoading={false}
        onSubmit={mockOnSubmit}
      >
        <input type="text" placeholder="Test input" />
        <textarea placeholder="Test textarea"></textarea>
      </CrudFormModal>
    )

    expect(screen.getByPlaceholderText('Test input')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Test textarea')).toBeInTheDocument()
  })
})
