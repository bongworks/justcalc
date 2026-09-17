import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { AdSlot } from '@/components/adsense/AdSlot';

afterEach(cleanup);

it('does not render a slot without an opt-in configuration', () => {
  render(<AdSlot />);
  expect(screen.queryByLabelText('광고')).not.toBeInTheDocument();
});

it('renders one labelled responsive manual slot with a valid configuration', () => {
  render(<AdSlot config={{ clientId: 'ca-pub-1234567890123456', resultSlotId: '1234567890' }} />);
  const ad = screen.getByLabelText('광고');
  const slot = ad.querySelector('ins');
  expect(slot).toHaveAttribute('data-ad-slot', '1234567890');
  expect(slot).toHaveAttribute('data-ad-client', 'ca-pub-1234567890123456');
  expect(slot).toHaveAttribute('data-ad-format', 'auto');
  expect(slot).toHaveAttribute('data-full-width-responsive', 'true');
});
