import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProjectDetail from '../../pages/Projects/ProjectDetail';
import { projectsAPI, usersAPI } from '../../services/api';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('react-router-dom', () => ({
  useParams: () => ({ id: 'proj1' }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: { username: 'testuser', role: 'manager' },
    logout: jest.fn(),
  }),
}));
jest.mock('../../components/KanbanBoard', () => {
  return function MockKanbanBoard({ tasks, projectId, onStatusChange, userRole }) {
    return (
      <div data-testid="kanban-board">
        <div>ProjectID: {projectId}</div>
        <div>UserRole: {userRole}</div>
        <div>Tasks: {tasks?.length || 0}</div>
        {tasks?.map(task => (
          <div key={task.id} data-testid={`task-${task.id}`}>
            {task.description}
            <button onClick={() => onStatusChange(task.id, 'completada')}>Change Status</button>
          </div>
        ))}
      </div>
    );
  };
});

describe('ProjectDetail Component', () => {
  const mockProject = {
    id: 'proj1',
    name: 'Test Project',
    status: 'en_progreso',
    client_id: 'client1',
    tasks: [
      { id: 'task1', description: 'Task 1', status: 'pendiente', assigned_to: 'user1' },
      { id: 'task2', description: 'Task 2', status: 'aprobada', assigned_to: 'user2' },
      { id: 'task3', description: 'Task 3', status: 'en_progreso', assigned_to: 'user1' },
    ],
  };

  const mockUsers = [
    { id: 'user1', username: 'john', role: 'user' },
    { id: 'user2', username: 'jane', role: 'manager' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    projectsAPI.getById.mockResolvedValue(mockProject);
    usersAPI.getAll.mockResolvedValue(mockUsers);
    window.alert = jest.fn();
  });

  test('renders project information correctly', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    expect(screen.getByText(/EN_PROGRESO/i)).toBeInTheDocument();
    expect(screen.getAllByText(/PROGRESO/i)[0]).toBeInTheDocument();
    expect(screen.getByText(/TAREAS/i)).toBeInTheDocument();
  });

  test('calculates and displays progress correctly', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // 1 out of 3 tasks is aprobada = 33%
    expect(screen.getByText(/33%/i)).toBeInTheDocument();
  });

  test('renders KanbanBoard with correct props', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    expect(screen.getByText('ProjectID: proj1')).toBeInTheDocument();
    expect(screen.getByText('UserRole: manager')).toBeInTheDocument();
    expect(screen.getByText('Tasks: 3')).toBeInTheDocument();
  });

  test('"NUEVA TAREA" button opens modal', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newTaskButton = screen.getByRole('button', { name: /NUEVA TAREA/i });
    fireEvent.click(newTaskButton);

    await waitFor(() => {
      expect(screen.getByText(/Nueva Tarea/i)).toBeInTheDocument();
    });
  });

  test('task modal has description and assigned_to fields', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newTaskButton = screen.getByRole('button', { name: /NUEVA TAREA/i });
    fireEvent.click(newTaskButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/DESCRIPCIÓN/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ASIGNAR A/i)).toBeInTheDocument();
    });

    // Check that users are listed in the dropdown
    expect(screen.getByText(/john \(user\)/i)).toBeInTheDocument();
    expect(screen.getByText(/jane \(manager\)/i)).toBeInTheDocument();
  });

  test('creates new task with correct payload', async () => {
    projectsAPI.createTask.mockResolvedValue({ id: 'task4', description: 'New Task' });

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newTaskButton = screen.getByRole('button', { name: /NUEVA TAREA/i });
    fireEvent.click(newTaskButton);

    await waitFor(() => {
      expect(screen.getByLabelText(/DESCRIPCIÓN/i)).toBeInTheDocument();
    });

    // Fill form
    const descriptionInput = screen.getByLabelText(/DESCRIPCIÓN/i);
    fireEvent.change(descriptionInput, { target: { value: 'Complete testing setup' } });

    const assignSelect = screen.getByLabelText(/ASIGNAR A/i);
    fireEvent.change(assignSelect, { target: { value: 'user1' } });

    const createButton = screen.getByRole('button', { name: /CREAR TAREA/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(projectsAPI.createTask).toHaveBeenCalledWith('proj1', {
        description: 'Complete testing setup',
        status: 'pendiente',
        assigned_to: 'user1',
      });
    });
  });

  test('handles task status change from KanbanBoard', async () => {
    projectsAPI.updateTaskStatus.mockResolvedValue({ success: true });

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    // Simulate status change from KanbanBoard
    const changeButton = screen.getAllByText('Change Status')[0];
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(projectsAPI.updateTaskStatus).toHaveBeenCalledWith('task1', 'completada');
    });
  });

  test('shows error alert when task status change fails', async () => {
    projectsAPI.updateTaskStatus.mockRejectedValue(new Error('Permission denied'));

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    });

    const changeButton = screen.getAllByText('Change Status')[0];
    fireEvent.click(changeButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Permission denied');
    });
  });

  test('closes modal and clears form after task creation', async () => {
    projectsAPI.createTask.mockResolvedValue({ id: 'task4' });

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    const newTaskButton = screen.getByRole('button', { name: /NUEVA TAREA/i });
    fireEvent.click(newTaskButton);

    await waitFor(() => {
      const descriptionInput = screen.getByLabelText(/DESCRIPCIÓN/i);
      expect(descriptionInput).toBeInTheDocument();
    });

    const descriptionInput = screen.getByLabelText(/DESCRIPCIÓN/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test task' } });

    const createButton = screen.getByRole('button', { name: /CREAR TAREA/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.queryByText(/Nueva Tarea/i)).not.toBeInTheDocument();
    });
  });

  test('displays loading state initially', () => {
    projectsAPI.getById.mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<ProjectDetail />);

    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
  });

  test('displays error when project not found', async () => {
    projectsAPI.getById.mockResolvedValue(null);

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText(/Proyecto no encontrado/i)).toBeInTheDocument();
    });
  });

  test('displays correct KPI values', async () => {
    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });

    // Check KPI cards
    const kpiTitles = screen.getAllByText(/PROGRESO|TAREAS|CLIENTE ID/i);
    expect(kpiTitles.length).toBeGreaterThan(0);

    expect(screen.getByText('3')).toBeInTheDocument(); // Task count
    expect(screen.getByText('client1')).toBeInTheDocument(); // Client ID
  });

  test('refreshes project data after task creation', async () => {
    projectsAPI.createTask.mockResolvedValue({ id: 'task4' });
    projectsAPI.getById.mockResolvedValueOnce(mockProject).mockResolvedValueOnce({
      ...mockProject,
      tasks: [...mockProject.tasks, { id: 'task4', description: 'New Task', status: 'pendiente' }],
    });

    render(<ProjectDetail />);

    await waitFor(() => {
      expect(screen.getByText('Tasks: 3')).toBeInTheDocument();
    });

    // Create a task
    const newTaskButton = screen.getByRole('button', { name: /NUEVA TAREA/i });
    fireEvent.click(newTaskButton);

    const descriptionInput = await screen.findByLabelText(/DESCRIPCIÓN/i);
    fireEvent.change(descriptionInput, { target: { value: 'New Task' } });

    const createButton = screen.getByRole('button', { name: /CREAR TAREA/i });
    fireEvent.click(createButton);

    // Wait for refresh
    await waitFor(() => {
      expect(projectsAPI.getById).toHaveBeenCalledTimes(2);
    });
  });
});
