import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UserManagement from '../../pages/Users/UserManagement';
import { usersAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', role: 'admin' },
    logout: jest.fn(),
  }),
}));

describe('UserManagement Component', () => {
  const mockUsers = [
    { id: '1', username: 'john', email: 'john@test.com', role: 'admin', active: true },
    { id: '2', username: 'jane', email: 'jane@test.com', role: 'manager', active: true },
    { id: '3', username: 'bob', email: 'bob@test.com', role: 'user', active: false },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    usersAPI.getAll.mockResolvedValue(mockUsers);
  });

  test('renders user table correctly', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
      expect(screen.getByText('jane')).toBeInTheDocument();
      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    expect(screen.getByText('john@test.com')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('MANAGER')).toBeInTheDocument();
  });

  test('opens modal when "NUEVO USUARIO" button is clicked', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    const newUserButton = screen.getByRole('button', { name: /NUEVO USUARIO/i });
    fireEvent.click(newUserButton);

    await waitFor(() => {
      expect(screen.getByText(/Registrar Nuevo Operador/i)).toBeInTheDocument();
    });
  });

  test('CRITICAL - form sends correct payload with username and password fields (BUG #023 regression test)', async () => {
    usersAPI.create.mockResolvedValue({ id: '4', username: 'newuser', email: 'new@test.com' });

    render(<UserManagement />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    // Open modal
    const newUserButton = screen.getByRole('button', { name: /NUEVO USUARIO/i });
    await user.click(newUserButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/NOMBRE DE USUARIO/i)).toBeInTheDocument();
    });

    // Fill form
    await user.type(screen.getByLabelText(/NOMBRE DE USUARIO/i), 'newuser');
    await user.type(screen.getByLabelText(/EMAIL CORPORATIVO/i), 'new@test.com');
    await user.type(screen.getByLabelText(/CLAVE TEMPORAL/i), 'password123');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /DAR DE ALTA/i });
    await user.click(submitButton);

    // CRITICAL: Verify the API was called with correct field names
    await waitFor(() => {
      expect(usersAPI.create).toHaveBeenCalledWith({
        username: 'newuser',  // NOT "user"
        email: 'new@test.com',
        password: 'password123',  // NOT "pass"
        role: 'user',
      });
    });
  });

  test('edit button populates form correctly with username and password fields', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    // Click edit button for first user
    const editButtons = screen.getAllByTitle('Editar');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('john')).toBeInTheDocument();
      expect(screen.getByDisplayValue('john@test.com')).toBeInTheDocument();
    });

    // Verify password field is empty (security best practice)
    const passwordInput = screen.getByLabelText(/CLAVE TEMPORAL/i);
    expect(passwordInput).toHaveValue('');
  });

  test('admin sees all role options in dropdown', async () => {
    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    const newUserButton = screen.getByRole('button', { name: /NUEVO USUARIO/i });
    fireEvent.click(newUserButton);

    await waitFor(() => {
      const roleSelect = screen.getByLabelText(/ASIGNAR ROL/i);
      expect(roleSelect).toBeInTheDocument();

      // Check that all options are available
      expect(screen.getByRole('option', { name: /User/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Manager/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Admin/i })).toBeInTheDocument();
    });
  });

  test('filters users by search term', async () => {
    render(<UserManagement />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o email.../i);
    await user.type(searchInput, 'jane');

    await waitFor(() => {
      expect(screen.getByText('jane')).toBeInTheDocument();
      expect(screen.queryByText('john')).not.toBeInTheDocument();
      expect(screen.queryByText('bob')).not.toBeInTheDocument();
    });
  });

  test('filters users by role', async () => {
    render(<UserManagement />);
    const user = userEvent.setup();

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    });

    const roleFilter = screen.getByDisplayValue(/Todos los Roles/i);
    await user.selectOptions(roleFilter, 'admin');

    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
      expect(screen.queryByText('jane')).not.toBeInTheDocument();
      expect(screen.queryByText('bob')).not.toBeInTheDocument();
    });
  });

  test('toggles user status correctly', async () => {
    usersAPI.toggleStatus.mockResolvedValue({ success: true });
    usersAPI.getAll.mockResolvedValue([
      ...mockUsers.slice(0, 2),
      { ...mockUsers[2], active: true },
    ]);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    // Find and click the activate button for bob (inactive user)
    const activateButtons = screen.getAllByTitle('Activar');
    fireEvent.click(activateButtons[0]);

    await waitFor(() => {
      expect(usersAPI.toggleStatus).toHaveBeenCalledWith('3', true);
    });
  });

  test('deletes user with confirmation', async () => {
    window.confirm = jest.fn(() => true);
    usersAPI.delete.mockResolvedValue({ success: true });
    usersAPI.getAll.mockResolvedValueOnce(mockUsers).mockResolvedValueOnce(mockUsers.slice(0, 2));

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[2]); // Delete bob

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalledWith('¿Estás seguro de eliminar este usuario?');
      expect(usersAPI.delete).toHaveBeenCalledWith('3');
    });
  });

  test('does not delete user if confirmation is cancelled', async () => {
    window.confirm = jest.fn(() => false);

    render(<UserManagement />);

    await waitFor(() => {
      expect(screen.getByText('bob')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Eliminar');
    fireEvent.click(deleteButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(usersAPI.delete).not.toHaveBeenCalled();
  });

  test('updates existing user with correct fields', async () => {
    // Mock the update API first
    usersAPI.update.mockResolvedValue({ success: true });
    // Also ensure getAll returns our mock data
    usersAPI.getAll.mockResolvedValue(mockUsers);

    render(<UserManagement />);
    const user = userEvent.setup();

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('john')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Click edit button
    const editButtons = screen.getAllByTitle('Editar');
    fireEvent.click(editButtons[0]);

    // Wait for modal
    await waitFor(() => {
      expect(screen.getByDisplayValue('john')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Change email using keyboard events
    const emailInput = screen.getByDisplayValue('john@test.com');
    fireEvent.change(emailInput, { target: { value: 'john.updated@test.com' } });

    // Click submit button
    const saveButton = screen.getByRole('button', { name: /GUARDAR CAMBIOS/i });
    fireEvent.click(saveButton);

    // Verify the API was called - give it time to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(usersAPI.update).toHaveBeenCalledTimes(1);
    
    // Verify call arguments
    const callArgs = usersAPI.update.mock.calls[0];
    expect(callArgs[0]).toBe('1');
    expect(callArgs[1].username).toBe('john');
    expect(callArgs[1].email).toBe('john.updated@test.com');
    expect(callArgs[1].role).toBe('admin');
  });
});
