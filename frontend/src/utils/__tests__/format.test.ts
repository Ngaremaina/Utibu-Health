import { formatDate, formatKES, ORDER_STATUS_LABELS } from '../format';

describe('formatKES', () => {
  it('formats whole shillings with grouping', () => {
    expect(formatKES(1250)).toBe('KES 1,250');
    expect(formatKES(0)).toBe('KES 0');
  });
});

describe('formatDate', () => {
  it('handles empty and invalid input', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });

  it('formats ISO dates', () => {
    expect(formatDate('2027-12-31T12:00:00Z')).toMatch(/2027/);
  });
});

it('has a label for every order status', () => {
  expect(Object.keys(ORDER_STATUS_LABELS)).toHaveLength(6);
});
