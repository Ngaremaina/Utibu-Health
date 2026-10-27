import { screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { api, ApiError } from '@/api';
import { renderScreen } from '@/test/render';

import { ProfileScreen } from '../ProfileScreen';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  api: {
    profile: { get: jest.fn(), update: jest.fn() },
    auth: { updateAccount: jest.fn(), changePassword: jest.fn() },
  },
}));

const mockAuth = { signOut: jest.fn(), updateUser: jest.fn() };
jest.mock('@/context/AuthContext', () => ({ useAuth: () => mockAuth }));

const user = {
  id: 1,
  email: 'jane@example.com',
  username: 'jane',
  is_admin: false,
  created_at: '',
};
const profile = {
  first_name: 'Jane',
  last_name: null,
  phone_number: null,
  address: null,
  city: 'Nairobi',
  country: null,
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  jest.mocked(api.profile.get).mockResolvedValue({ user, profile });
});

it('prefills and saves the profile', async () => {
  const u = userEvent.setup();
  jest.mocked(api.profile.update).mockResolvedValue({
    user,
    profile: { ...profile, last_name: 'Doe' },
  });
  await renderScreen(ProfileScreen, { name: 'Profile' });

  expect(await screen.findByDisplayValue('Jane')).toBeOnTheScreen();
  expect(screen.getByText('jane@example.com')).toBeOnTheScreen();

  await u.type(screen.getByLabelText('Last name'), 'Doe');
  await u.press(screen.getByRole('button', { name: 'Save profile' }));

  expect(api.profile.update).toHaveBeenCalledWith({
    first_name: 'Jane',
    last_name: 'Doe',
    phone_number: null,
    address: null,
    city: 'Nairobi',
    country: null,
  });
  expect(Alert.alert).toHaveBeenCalledWith('Profile saved');
});

it('shows field errors from the server', async () => {
  const u = userEvent.setup();
  jest.mocked(api.profile.update).mockRejectedValue(
    new ApiError('Validation failed.', 422, 'validation_error', {
      phone_number: ['Enter a valid Safaricom phone number.'],
    }),
  );
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.type(await screen.findByLabelText('Phone number'), '123');
  await u.press(screen.getByRole('button', { name: 'Save profile' }));

  expect(await screen.findByText('Enter a valid Safaricom phone number.')).toBeOnTheScreen();
});

it('shows an error when the profile cannot load', async () => {
  jest
    .mocked(api.profile.get)
    .mockRejectedValue(new ApiError('Server down', 500, 'internal_error'));
  await renderScreen(ProfileScreen, { name: 'Profile' });
  expect(await screen.findByText('Server down')).toBeOnTheScreen();
});

it('updates the username and email', async () => {
  const u = userEvent.setup();
  const updated = { ...user, username: 'janed', email: 'janed@example.com' };
  jest.mocked(api.auth.updateAccount).mockResolvedValue(updated);
  await renderScreen(ProfileScreen, { name: 'Profile' });

  const username = await screen.findByLabelText('Username');
  await u.clear(username);
  await u.type(username, 'janed');
  await u.clear(screen.getByLabelText('Email'));
  await u.type(screen.getByLabelText('Email'), 'janed@example.com');
  await u.press(screen.getByRole('button', { name: 'Update account' }));

  expect(api.auth.updateAccount).toHaveBeenCalledWith({
    username: 'janed',
    email: 'janed@example.com',
  });
  expect(mockAuth.updateUser).toHaveBeenCalledWith(updated);
  expect(await screen.findByText('janed@example.com')).toBeOnTheScreen();
});

it('shows a taken email under the email field', async () => {
  const u = userEvent.setup();
  jest
    .mocked(api.auth.updateAccount)
    .mockRejectedValue(new ApiError('An account with this email already exists.', 409, 'conflict'));
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.clear(await screen.findByLabelText('Email'));
  await u.type(screen.getByLabelText('Email'), 'taken@example.com');
  await u.press(screen.getByRole('button', { name: 'Update account' }));

  expect(await screen.findByText('An account with this email already exists.')).toBeOnTheScreen();
});

it('changes the password after validating it', async () => {
  const u = userEvent.setup();
  jest.mocked(api.auth.changePassword).mockResolvedValue(undefined);
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.type(await screen.findByLabelText('Current password'), 'password123');
  await u.type(screen.getByLabelText('New password'), 'new-password-456');
  await u.type(screen.getByLabelText('Confirm new password'), 'mismatch');
  await u.press(screen.getByRole('button', { name: 'Change password' }));
  expect(screen.getByText('Passwords do not match.')).toBeOnTheScreen();
  expect(api.auth.changePassword).not.toHaveBeenCalled();

  await u.clear(screen.getByLabelText('Confirm new password'));
  await u.type(screen.getByLabelText('Confirm new password'), 'new-password-456');
  await u.press(screen.getByRole('button', { name: 'Change password' }));
  expect(api.auth.changePassword).toHaveBeenCalledWith('password123', 'new-password-456');
  expect(Alert.alert).toHaveBeenCalledWith('Password changed');
});

it('shows a wrong current password from the server', async () => {
  const u = userEvent.setup();
  jest.mocked(api.auth.changePassword).mockRejectedValue(
    new ApiError('Current password is incorrect.', 422, 'validation_error', {
      current_password: ['Current password is incorrect.'],
    }),
  );
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.type(await screen.findByLabelText('Current password'), 'wrong-password');
  await u.type(screen.getByLabelText('New password'), 'new-password-456');
  await u.type(screen.getByLabelText('Confirm new password'), 'new-password-456');
  await u.press(screen.getByRole('button', { name: 'Change password' }));

  expect(await screen.findByText('Current password is incorrect.')).toBeOnTheScreen();
});

it('logs out after confirmation', async () => {
  const u = userEvent.setup();
  jest.mocked(Alert.alert).mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.style === 'destructive')?.onPress?.();
  });
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.press(await screen.findByRole('button', { name: 'Log out' }));
  expect(mockAuth.signOut).toHaveBeenCalled();
});

it('stays signed in when logout is cancelled', async () => {
  const u = userEvent.setup();
  jest.mocked(Alert.alert).mockImplementation((_title, _message, buttons) => {
    buttons?.find((b) => b.style === 'cancel')?.onPress?.();
  });
  await renderScreen(ProfileScreen, { name: 'Profile' });

  await u.press(await screen.findByRole('button', { name: 'Log out' }));
  expect(mockAuth.signOut).not.toHaveBeenCalled();
});
