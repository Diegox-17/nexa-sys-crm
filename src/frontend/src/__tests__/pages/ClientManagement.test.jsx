import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ClientManagement from '../../pages/Clients/ClientManagement';
import { clientsAPI } from '../../services/api';

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

describe('ClientManagement Component', () => {
  const mockClients = [
    {
      id: '1',
      name: 'Acme Corp',
      contact_name: 'John Doe',
      industry: 'Technology',
      email: 'john@acme.com',
      phone: '123-456-7890',
      active: true,
    },
    {
      id: '2',
      name: 'Tech Solutions',
      contact_name: 'Jane Smith',
      industry: 'Software',
      email: 'jane@tech.com',
      phone: '098-765-4321',
      active: true,
    },
  ];

  const mockFields = [
    { id: '1', name: 'website', label: 'Website', type: 'text', category: 'Contact', active: true },
    { id: '2', name: 'linkedin', label: 'LinkedIn', type: 'url', category: 'Social', active: true },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    clientsAPI.getAll.mockResolvedValue(mockClients);
    clientsAPI.getFields.mockResolvedValue(mockFields);
    window.confirm = jest.fn(() => true);
    window.alert = jest.fn();
  });

  test('renders client list correctly', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
    });

    expect(screen.getByText('john@acme.com')).toBeInTheDocument();
    expect(screen.getByText('jane@tech.com')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    clientsAPI.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ClientManagement />);

    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
  });

  test('opens modal when "NUEVO CLIENTE" button is clicked', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const newClientButton = screen.getByRole('button', { name: /NUEVO CLIENTE/i });
    fireEvent.click(newClientButton);

    await waitFor(() => {
      expect(screen.getByText(/Registrar Nuevo Cliente/i)).toBeInTheDocument();
    });
  });

  test('creates new client with correct payload', async () => {
    clientsAPI.create.mockResolvedValue({ id: '3', name: 'New Client' });

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const newClientButton = screen.getByRole('button', { name: /NUEVO CLIENTE/i });
    fireEvent.click(newClientButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/NOMBRE DE LA EMPRESA/i)).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/NOMBRE DE LA EMPRESA/i), { target: { value: 'New Client' } });
    fireEvent.change(screen.getByLabelText(/PERSONA DE CONTACTO/i), { target: { value: 'Bob Johnson' } });
    fireEvent.change(screen.getByLabelText(/INDUSTRIA/i), { target: { value: 'Finance' } });
    fireEvent.change(screen.getByLabelText(/EMAIL/i), { target: { value: 'bob@newclient.com' } });

    const saveButton = screen.getByRole('button', { name: /GUARDAR/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(clientsAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Client',
          contact_name: 'Bob Johnson',
          industry: 'Finance',
          email: 'bob@newclient.com',
        })
      );
    });
  });

  test('filters clients by search term', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
      expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nombre o industria/i);
    fireEvent.change(searchInput, { target: { value: 'Acme' } });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.queryByText('Tech Solutions')).not.toBeInTheDocument();
  });

  test('edits existing client', async () => {
    clientsAPI.update.mockResolvedValue({ id: '1', name: 'Updated Client' });

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /EDITAR/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/NOMBRE DE LA EMPRESA/i), { target: { value: 'Updated Client' } });

    const saveButton = screen.getByRole('button', { name: /GUARDAR/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(clientsAPI.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Client',
        })
      );
    });
  });

  test('toggles client visibility', async () => {
    clientsAPI.update.mockResolvedValue({ id: '1', active: false });

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const toggleButtons = screen.getAllByRole('button', { name: /OCULTAR/i });
    fireEvent.click(toggleButtons[0]);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(clientsAPI.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          active: false,
        })
      );
    });
  });

  test('closes modal when cancel button is clicked', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const newClientButton = screen.getByRole('button', { name: /NUEVO CLIENTE/i });
    fireEvent.click(newClientButton);

    await waitFor(() => {
      expect(screen.getByText(/Registrar Nuevo Cliente/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /CANCELAR/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Registrar Nuevo Cliente/i)).not.toBeInTheDocument();
    });
  });

  test('displays custom fields correctly', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    expect(clientsAPI.getFields).toHaveBeenCalled();
  });

  test('opens field configuration modal', async () => {
    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    });

    const configButton = screen.getByRole('button', { name: /CONFIGURAR CAMPOS/i });
    fireEvent.click(configButton);

    await waitFor(() => {
      expect(screen.getByText(/Configuración de Campos Personalizados/i)).toBeInTheDocument();
    });
  });

  test('displays empty state when no clients', async () => {
    clientsAPI.getAll.mockResolvedValue([]);

    render(<ClientManagement />);

    await waitFor(() => {
      expect(screen.getByText(/No hay clientes registrados/i)).toBeInTheDocument();
    });
  });
});
