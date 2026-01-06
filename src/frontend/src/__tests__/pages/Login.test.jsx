import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../../pages/Login/Login';
import { authAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
}));

const mockNavigate = jest.fn();

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require('react-router-dom').useNavigate.mockReturnValue(mockNavigate);
  });

  test('renders login form with username and password fields', () => {
    render(<Login />);

    expect(screen.getByLabelText(/ID DE ACCESO/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/CLAVE DE SEGURIDAD/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument();
  });

  test('allows user to type in username and password fields', async () => {
    render(<Login />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText(/usr_88291.../i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'password123');

    expect(usernameInput).toHaveValue('testuser');
    expect(passwordInput).toHaveValue('password123');
  });

  test('shows error message on failed login', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('Credenciales inválidas'));

    render(<Login />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText(/usr_88291.../i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    await user.type(usernameInput, 'wronguser');
    await user.type(passwordInput, 'wrongpass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Credenciales inválidas/i)).toBeInTheDocument();
    });
  });

  test('redirects to dashboard on successful login', async () => {
    const mockUserInfo = { id: '1', username: 'testuser', role: 'admin' };
    const mockToken = 'mock-token-123';

    authAPI.login.mockResolvedValueOnce({
      user_info: mockUserInfo,
      token: mockToken,
    });

    const { useAuth } = require('../../context/AuthContext');
    const mockLogin = jest.fn();
    useAuth.mockReturnValue({ login: mockLogin });

    render(<Login />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText(/usr_88291.../i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    await user.type(usernameInput, 'testuser');
    await user.type(passwordInput, 'correctpass');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(mockUserInfo, mockToken);
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  test('form validation requires both fields', async () => {
    render(<Login />);

    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });
    fireEvent.click(submitButton);

    // HTML5 validation should prevent submission
    const usernameInput = screen.getByPlaceholderText(/usr_88291.../i);
    expect(usernameInput).toBeRequired();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeRequired();
  });

  test('clears error message on new login attempt', async () => {
    authAPI.login.mockRejectedValueOnce(new Error('Error inicial'));

    render(<Login />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText(/usr_88291.../i);
    const passwordInput = screen.getByPlaceholderText(/••••••••/i);
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i });

    // First failed attempt
    await user.type(usernameInput, 'user1');
    await user.type(passwordInput, 'pass1');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error inicial/i)).toBeInTheDocument();
    });

    // Clear and try again
    authAPI.login.mockResolvedValueOnce({
      user_info: { id: '1', username: 'user1' },
      token: 'token',
    });

    await user.clear(usernameInput);
    await user.clear(passwordInput);
    await user.type(usernameInput, 'user2');
    await user.type(passwordInput, 'pass2');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText(/Error inicial/i)).not.toBeInTheDocument();
    });
  });

  test('displays branding and security information', () => {
    render(<Login />);

    expect(screen.getByAltText(/Nexa-Sys Logo/i)).toBeInTheDocument();
    expect(screen.getByText(/Laboratorio de Ingeniería de Negocios/i)).toBeInTheDocument();
    expect(screen.getByText(/CONEXIÓN SEGURA/i)).toBeInTheDocument();
    expect(screen.getByText(/ENCRIPTADO: AES-256/i)).toBeInTheDocument();
  });
});
