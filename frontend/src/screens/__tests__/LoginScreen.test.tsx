import { screen, userEvent } from '@testing-library/react-native';

import { ApiError } from '@/api';
import { useAuth } from '@/context/AuthContext';
import { renderScreen } from '@/test/render';

import { LoginScreen } from '../LoginScreen';
import { RegisterScreen } from '../RegisterScreen';

jest.mock('@/context/AuthContext', () => ({ useAuth: jest.fn() }));

const signIn = jest.fn();
const signUp = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    status: 'signedOut',
    user: null,
    signIn,
    signUp,
    signOut: jest.fn(),
    updateUser: jest.fn(),
  });
});

describe('LoginScreen', () => {
  it('validates before submitting', async () => {
    const user = userEvent.setup();
    await renderScreen(LoginScreen, { name: 'Login' });

    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter a valid email address.')).toBeOnTheScreen();
    expect(screen.getByText('Password is required.')).toBeOnTheScreen();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('signs in with the entered credentials', async () => {
    const user = userEvent.setup();
    signIn.mockResolvedValue(undefined);
    await renderScreen(LoginScreen, { name: 'Login' });

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(signIn).toHaveBeenCalledWith('jane@example.com', 'password123');
  });

  it('shows server errors', async () => {
    const user = userEvent.setup();
    signIn.mockRejectedValue(
      new ApiError('Invalid email or password.', 401, 'invalid_credentials'),
    );
    await renderScreen(LoginScreen, { name: 'Login' });

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid email or password.')).toBeOnTheScreen();
  });
});

describe('RegisterScreen', () => {
  it('maps server field errors onto inputs', async () => {
    const user = userEvent.setup();
    signUp.mockRejectedValue(
      new ApiError('Validation failed.', 422, 'validation_error', {
        email: ['Email is already taken.'],
      }),
    );
    await renderScreen(RegisterScreen, { name: 'Register' });

    await user.type(screen.getByLabelText('Username'), 'jane');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.press(screen.getByRole('button', { name: 'Create account' }));

    expect(signUp).toHaveBeenCalledWith('jane', 'jane@example.com', 'password123');
    expect(await screen.findByText('Email is already taken.')).toBeOnTheScreen();
  });
});
