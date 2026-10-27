const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Matches the backend: 07XXXXXXXX, 01XXXXXXXX, 7XXXXXXXX, 2547XXXXXXXX or +2547XXXXXXXX.
const KENYAN_PHONE = /^(?:254|\+254|0)?(7|1)\d{8}$/;

export function isEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

export function isKenyanPhone(value: string): boolean {
  return KENYAN_PHONE.test(value.replace(/\s+/g, ''));
}

export type Errors<T extends string> = Partial<Record<T, string>>;

export function validateLogin(email: string, password: string): Errors<'email' | 'password'> {
  const errors: Errors<'email' | 'password'> = {};
  if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (!password) errors.password = 'Password is required.';
  return errors;
}

export function validateRegistration(
  username: string,
  email: string,
  password: string,
): Errors<'username' | 'email' | 'password'> {
  const errors: Errors<'username' | 'email' | 'password'> = {};
  if (username.trim().length < 2) errors.username = 'Username must be at least 2 characters.';
  if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  if (password.length < 8) errors.password = 'Password must be at least 8 characters.';
  return errors;
}

export function hasErrors(errors: object): boolean {
  return Object.values(errors).some(Boolean);
}

export function validateAccount(username: string, email: string): Errors<'username' | 'email'> {
  const errors: Errors<'username' | 'email'> = {};
  if (username.trim().length < 2) errors.username = 'Username must be at least 2 characters.';
  if (!isEmail(email)) errors.email = 'Enter a valid email address.';
  return errors;
}

export function validatePasswordChange(
  current: string,
  next: string,
  confirm: string,
): Errors<'current' | 'next' | 'confirm'> {
  const errors: Errors<'current' | 'next' | 'confirm'> = {};
  if (!current) errors.current = 'Current password is required.';
  if (next.length < 8) errors.next = 'Password must be at least 8 characters.';
  else if (next === current) errors.next = 'Choose a different password.';
  if (confirm !== next) errors.confirm = 'Passwords do not match.';
  return errors;
}
