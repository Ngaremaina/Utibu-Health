import {
  hasErrors,
  isEmail,
  isKenyanPhone,
  validateAccount,
  validateLogin,
  validatePasswordChange,
  validateRegistration,
} from '../validation';

describe('isKenyanPhone', () => {
  it.each([
    '0712345678',
    '712345678',
    '254712345678',
    '+254712345678',
    '0112345678',
    '0712 345 678',
  ])('accepts %s', (phone) => expect(isKenyanPhone(phone)).toBe(true));

  it.each(['12345', '0812345678', '25471234567', 'abc'])('rejects %s', (phone) =>
    expect(isKenyanPhone(phone)).toBe(false),
  );
});

describe('isEmail', () => {
  it('validates email shape', () => {
    expect(isEmail(' jane@example.com ')).toBe(true);
    expect(isEmail('jane@')).toBe(false);
  });
});

describe('form validation', () => {
  it('validates login', () => {
    expect(validateLogin('bad', '')).toEqual({
      email: expect.any(String),
      password: expect.any(String),
    });
    expect(hasErrors(validateLogin('a@b.co', 'secret'))).toBe(false);
  });

  it('validates registration', () => {
    const errors = validateRegistration('a', 'bad', 'short');
    expect(Object.keys(errors).sort()).toEqual(['email', 'password', 'username']);
    expect(hasErrors(validateRegistration('jane', 'jane@example.com', 'password123'))).toBe(false);
  });
});

describe('validateAccount', () => {
  it('requires a username and a valid email', () => {
    expect(Object.keys(validateAccount(' a ', 'bad')).sort()).toEqual(['email', 'username']);
    expect(hasErrors(validateAccount('jane', 'jane@example.com'))).toBe(false);
  });
});

describe('validatePasswordChange', () => {
  it('checks length, reuse and confirmation', () => {
    expect(validatePasswordChange('', 'short', 'other')).toEqual({
      current: 'Current password is required.',
      next: 'Password must be at least 8 characters.',
      confirm: 'Passwords do not match.',
    });
    expect(validatePasswordChange('password123', 'password123', 'password123').next).toBe(
      'Choose a different password.',
    );
    expect(hasErrors(validatePasswordChange('password123', 'new-pass-456', 'new-pass-456'))).toBe(
      false,
    );
  });
});
