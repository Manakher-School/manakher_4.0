import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../ui/button'

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = jest.fn()

    render(<Button onClick={handleClick}>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })

    await user.click(button)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeDisabled()
  })

  it('should render with aria-label', () => {
    render(<Button aria-label="Submit form">Submit</Button>)
    const button = screen.getByRole('button', { name: /submit form/i })
    expect(button).toHaveAttribute('aria-label', 'Submit form')
  })

  it('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>)
    let button = screen.getByRole('button', { name: /primary/i })
    expect(button).toHaveClass('bg-[var(--color-role-admin-bold)]')

    rerender(<Button variant="ghost">Ghost</Button>)
    button = screen.getByRole('button', { name: /ghost/i })
    expect(button).toHaveClass('bg-transparent')
  })

  it('should have focus ring for accessibility', () => {
    render(<Button>Accessible Button</Button>)
    const button = screen.getByRole('button', { name: /accessible button/i })
    expect(button).toHaveClass('focus:outline-none', 'focus:ring-2')
  })
})
