// Vitest global setup: extend `expect` with @testing-library/jest-dom matchers
// (toBeInTheDocument, toHaveAttribute, …) and auto-clean the DOM between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
