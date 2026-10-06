import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it, vi } from 'vitest';
import { ColorPicker } from './ColorPicker';
it('exposes every API color with an accessible name and selected state', async () => {
  const onChange = vi.fn();
  render(<ColorPicker value="yellow" onChange={onChange} />);
  expect(screen.getByRole('button', { name: 'Yellow color' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await userEvent.click(screen.getByRole('button', { name: 'Blue color' }));
  expect(onChange).toHaveBeenCalledWith('blue');
  expect(screen.getAllByRole('button')).toHaveLength(10);
});
