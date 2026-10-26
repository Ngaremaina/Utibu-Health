import { screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';

import { api, ApiError } from '@/api';
import { renderScreen } from '@/test/render';

import { ProfileScreen } from '../ProfileScreen';

jest.mock('@/api', () => ({
  ...jest.requireActual('@/api'),
  api: { profile: { get: jest.fn(), update: jest.fn() } },
}));

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
