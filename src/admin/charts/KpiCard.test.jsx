import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import KpiCard from './KpiCard';

describe('KpiCard', () => {
  it('renders label/value and is not a button without onClick', () => {
    render(<KpiCard label="Total users" value={15} sublabel="15 total" />);
    expect(screen.getByText('Total users')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('becomes a dialog-opening button when given onClick', () => {
    const onClick = vi.fn();
    render(<KpiCard label="Active" value={11} onClick={onClick} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-haspopup', 'dialog');
    expect(card).toHaveAttribute('tabindex', '0');
    fireEvent.click(card);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('activates on Enter and Space keys', () => {
    const onClick = vi.fn();
    render(<KpiCard label="Active" value={11} onClick={onClick} />);
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
