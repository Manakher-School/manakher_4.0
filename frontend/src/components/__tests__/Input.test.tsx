import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../ui/input'

describe('Input Component', () => {
  it('should render input with label', () => {
    render(<Input label="Username" id="username" />)
    const label = screen.getByText('Username')
    expect(label).toBeInTheDocument()
  })

  it('should render input field', () => {
    render(<Input label="Email" id="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toBeInTheDocument()
  })

  it('should handle text input', async () => {
    const user = userEvent.setup()
    render(<Input label="Name" id="name" />)
    const input = screen.getByRole('textbox')

    await user.type(input, 'John Doe')
    expect(input).toHaveValue('John Doe')
  })

  it('should support required attribute', () => {
    render(<Input label="Required field" id="required" required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('should support placeholder', () => {
    render(<Input label="Email" id="email" placeholder="john@example.com" />)
    const input = screen.getByPlaceholderText('john@example.com')
    expect(input).toBeInTheDocument()
  })

  it('should support type attribute', () => {
    render(<Input label="Password" id="password" type="password" />)
    const input = screen.getByRole('textbox', { hidden: true }) || screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'password')
  })

  it('should have focus ring for accessibility', () => {
    render(<Input label="Accessible input" id="accessible" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('focus:ring-2')
  })

  it('should be disabled when disabled prop is true', () => {
    render(<Input label="Disabled" id="disabled" disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('should associate label with input via id', () => {
    render(<Input label="Email" id="email-input" />)
    const label = screen.getByText('Email')
    expect(label).toHaveAttribute('for', 'email-input')
  })
})

