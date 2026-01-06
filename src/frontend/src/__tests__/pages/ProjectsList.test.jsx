import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectsList from '../../pages/Projects/ProjectsList';
import { projectsAPI, clientsAPI, usersAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useNavigate: () => jest.fn(),
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'admin', role: 'admin' },
    logout: jest.fn(),
  }),
}));

describe('ProjectsList Component', () => {
  const mockProjects = [
    {
      id: '1',
      name: 'Project Alpha',
      client_id: 'client1',
      client_name: 'Acme Corp',
      status: 'en_progreso',
      description: 'Project description',
      start_date: '2024-01-01',
      tasks: [],
    },
    {
      id: '2',
      name: 'Project Beta',
      client_id: 'client2',
      client_name: 'Tech Solutions',
      status: 'prospectado',
      description: 'Another project',
      start_date: '2024-02-01',
      tasks: [],
    },
  ];

  const mockClients = [
    { id: 'client1', name: 'Acme Corp' },
    { id: 'client2', name: 'Tech Solutions' },
  ];

  const mockUsers = [
    { id: 'user1', username: 'admin', role: 'admin' },
    { id: 'user2', username: 'manager1', role: 'manager' },
  ];

  const mockFields = [
    {
      id: 1,
      name: 'repo_url',
      label: 'URL del Repositorio',
      type: 'url',
      category: 'General',
      is_required: false,
      sort_order: 1,
      active: true
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    projectsAPI.getAll.mockResolvedValue(mockProjects);
    clientsAPI.getAll.mockResolvedValue(mockClients);
    usersAPI.getAll.mockResolvedValue(mockUsers);
    projectsAPI.getFields.mockResolvedValue(mockFields);
    window.alert = jest.fn();
  });

  test('renders project list correctly', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions')).toBeInTheDocument();
  });

  test('displays loading state initially', () => {
    projectsAPI.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProjectsList />);

    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
  });

  test('opens modal when "NUEVO PROYECTO" button is clicked', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /NUEVO PROYECTO/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/Nuevo Proyecto/i)).toBeInTheDocument();
    });
  });

  test('creates new project with correct payload', async () => {
    projectsAPI.create.mockResolvedValue({ id: '3', name: 'New Project' });

    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /NUEVO PROYECTO/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/NOMBRE DEL PROYECTO/i)).toBeInTheDocument();
    });

    // Fill form
    fireEvent.change(screen.getByLabelText(/NOMBRE DEL PROYECTO/i), { target: { value: 'New Project' } });
    fireEvent.change(screen.getByLabelText(/CLIENTE/i), { target: { value: 'client1' } });
    fireEvent.change(screen.getByLabelText(/DESCRIPCIÓN/i), { target: { value: 'Test description' } });

    const saveButton = screen.getByRole('button', { name: /CREAR PROYECTO/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(projectsAPI.create).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New Project',
          client_id: 'client1',
          description: 'Test description',
        })
      );
    });
  });

  test('filters projects by status', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox');
    fireEvent.change(statusFilter, { target: { value: 'en_progreso' } });

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Project Beta')).not.toBeInTheDocument();
  });

  test('edits existing project', async () => {
    projectsAPI.update.mockResolvedValue({ id: '1', name: 'Updated Project' });

    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByRole('button', { name: /EDITAR/i });
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Project Alpha')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(/NOMBRE DEL PROYECTO/i), { target: { value: 'Updated Project' } });

    const saveButton = screen.getByRole('button', { name: /GUARDAR/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(projectsAPI.update).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          name: 'Updated Project',
        })
      );
    });
  });

  test('closes modal when cancel button is clicked', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const newProjectButton = screen.getByRole('button', { name: /NUEVO PROYECTO/i });
    fireEvent.click(newProjectButton);

    await waitFor(() => {
      expect(screen.getByText(/Nuevo Proyecto/i)).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: /CANCELAR/i });
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText(/Nuevo Proyecto/i)).not.toBeInTheDocument();
    });
  });

  test('displays empty table when no projects', async () => {
    projectsAPI.getAll.mockResolvedValue([]);

    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Proyectos')).toBeInTheDocument();
    });

    // Verify table is empty (no rows with project data)
    const rows = screen.queryAllByRole('row');
    // Header row + 0 data rows
    expect(rows.length).toBe(1);
  });

  test('navigates to project detail when "VER" button is clicked', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByRole('link', { name: /VER/i });
    expect(viewButtons[0]).toHaveAttribute('href', '/projects/1');
  });

  test('displays project status badges correctly', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    });

    const badges = screen.getAllByText(/EN_PROGRESO|PROSPECTADO/i);
    expect(badges.length).toBeGreaterThan(0);
  });

  test('shows all projects when "all" filter is selected', async () => {
    render(<ProjectsList />);

    await waitFor(() => {
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
    });

    const statusFilter = screen.getByRole('combobox');
    fireEvent.change(statusFilter, { target: { value: 'all' } });

    expect(screen.getByText('Project Alpha')).toBeInTheDocument();
    expect(screen.getByText('Project Beta')).toBeInTheDocument();
  });
});
