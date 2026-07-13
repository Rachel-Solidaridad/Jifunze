import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// StatDrilldown -> queries -> ../firebase initializes Firestore (IndexedDB) at
// import time, which hangs under jsdom. Stub it; the drawer never queries.
vi.mock('../firebase', () => ({ db: {} }));

import StatDrilldown from './StatDrilldown';

const ts = ms => ({ toDate: () => new Date(ms) });
const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;

const users = [
  { uid: 'u1', displayName: 'Alice', email: 'a@x.org', role: 'learner', profileCompletedAt: 'x', country: 'Kenya', jobTitle: 'Agronomist', lastActiveAt: ts(NOW - 1 * DAY) },
  { uid: 'u2', displayName: 'Bob', email: 'b@x.org', role: 'manager', profileCompletedAt: null, lastActiveAt: ts(NOW - 10 * DAY) },
];
const liveCourses = [{ id: 'c1', title: 'Course One', duration: '2 hours' }];
const allProgress = { u1: { c1: { pct: 100 } } };
const computeCompletion = (_c, p) => p.pct;

const base = {
  users, allProgress, liveCourses, computeCompletion,
  certificates: [], achievements: [], votes: [],
  onClose: () => {},
};

const renderDrill = (props) => render(<StatDrilldown {...base} {...props} />);

describe('StatDrilldown', () => {
  it('renders nothing for an unknown key', () => {
    const { container } = renderDrill({ drilldown: 'nope' });
    expect(container).toBeEmptyDOMElement();
  });

  it('totalUsers lists every user in an accessible dialog', () => {
    renderDrill({ drilldown: 'totalUsers' });
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(within(dialog).getByText('Alice')).toBeInTheDocument();
    expect(within(dialog).getByText('Bob')).toBeInTheDocument();
  });

  it('active shows only users active in the last 7 days', () => {
    renderDrill({ drilldown: 'active' });
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.queryByText('Bob')).toBeNull(); // Bob last active 10 days ago
  });

  it('enrollments shows the course and completion %', () => {
    renderDrill({ drilldown: 'enrollments' });
    expect(screen.getByText('Course One')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows an empty state for a record type with no data', () => {
    renderDrill({ drilldown: 'certificates' });
    expect(screen.getByText('No certificates issued yet.')).toBeInTheDocument();
  });

  it('closes on the Close button, Escape, and backdrop click', () => {
    const onClose = vi.fn();
    const { container } = render(<StatDrilldown {...base} drilldown="totalUsers" onClose={onClose} />);

    fireEvent.click(screen.getByLabelText('Close'));
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    fireEvent.click(container.firstChild); // the overlay/backdrop

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
