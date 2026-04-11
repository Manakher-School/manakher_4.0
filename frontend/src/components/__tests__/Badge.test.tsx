import React from 'react'
import { render, screen } from '@testing-library/react'
import { Badge } from '../ui/badge'

describe('Badge Component', () => {
  it('should render badge with text', () => {
    render(<Badge>Admin</Badge>)
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('should apply default variant', () => {
    const { container } = render(<Badge>Default</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-[var(--color-surface-sunken)]')
    expect(badge).toHaveClass('text-[var(--color-ink-secondary)]')
  })

  it('should apply admin variant', () => {
    const { container } = render(<Badge variant="admin">Admin</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-[var(--color-role-admin-bg)]')
    expect(badge).toHaveClass('text-[var(--color-role-admin-text)]')
  })

  it('should apply teacher variant', () => {
    const { container } = render(<Badge variant="teacher">Teacher</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-[var(--color-role-teacher-bg)]')
    expect(badge).toHaveClass('text-[var(--color-role-teacher-text)]')
  })

  it('should apply student variant', () => {
    const { container } = render(<Badge variant="student">Student</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-[var(--color-role-student-bg)]')
    expect(badge).toHaveClass('text-[var(--color-role-student-text)]')
  })

  it('should apply accent variant', () => {
    const { container } = render(<Badge variant="accent">Accent</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('bg-[var(--color-accent-subtle)]')
    expect(badge).toHaveClass('text-[var(--color-accent-text)]')
  })

  it('should have proper padding and radius', () => {
    const { container } = render(<Badge>Styled</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('px-3', 'py-1', 'rounded-[var(--radius-full)]')
  })

  it('should have semibold font for non-default variants', () => {
    const { container } = render(<Badge variant="admin">Admin</Badge>)
    const badge = container.firstChild
    expect(badge).toHaveClass('font-semibold')
  })
})

