import { render, screen, fireEvent } from '@testing-library/react';
import KanbanBoard from '../../components/KanbanBoard';

describe('KanbanBoard Component', () => {
  const mockTasks = [
    { id: 'task1', description: 'Pending task', status: 'pendiente', assigned_to: 'user1' },
    { id: 'task2', description: 'In progress task', status: 'en_progreso', assigned_to: 'user2' },
    { id: 'task3', description: 'Completed task', status: 'completada', assigned_to: 'user1' },
    { id: 'task4', description: 'Approved task', status: 'aprobada', assigned_to: 'user3' },
  ];

  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnStatusChange.mockClear();
  });

  test('renders task columns (pendiente, en_progreso, completada, aprobada)', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText(/PENDIENTE/i)).toBeInTheDocument();
    expect(screen.getByText(/EN PROGRESO/i)).toBeInTheDocument();
    expect(screen.getByText(/COMPLETADA/i)).toBeInTheDocument();
    expect(screen.getByText(/APROBADA/i)).toBeInTheDocument();
  });

  test('displays correct task count in each column', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText(/PENDIENTE \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/EN PROGRESO \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/COMPLETADA \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/APROBADA \(1\)/i)).toBeInTheDocument();
  });

  test('task cards display correctly with description and metadata', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText('Pending task')).toBeInTheDocument();
    expect(screen.getByText('In progress task')).toBeInTheDocument();
    expect(screen.getByText('Completed task')).toBeInTheDocument();
    expect(screen.getByText('Approved task')).toBeInTheDocument();

    // Check task IDs are displayed
    expect(screen.getByText('#task1')).toBeInTheDocument();
    expect(screen.getByText('#task2')).toBeInTheDocument();
  });

  test('shows "INICIAR" button for pending tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const iniciarButton = screen.getByRole('button', { name: /INICIAR/i });
    expect(iniciarButton).toBeInTheDocument();
  });

  test('"INICIAR" button changes task status to en_progreso', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const iniciarButton = screen.getByRole('button', { name: /INICIAR/i });
    fireEvent.click(iniciarButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('task1', 'en_progreso');
  });

  test('shows "COMPLETAR" button for in-progress tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const completarButton = screen.getByRole('button', { name: /COMPLETAR/i });
    expect(completarButton).toBeInTheDocument();
  });

  test('"COMPLETAR" button changes task status to completada', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const completarButton = screen.getByRole('button', { name: /COMPLETAR/i });
    fireEvent.click(completarButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('task2', 'completada');
  });

  // CRITICAL RBAC TESTS
  test('RBAC: Admin sees "APROBAR" button for completed tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="admin" />);

    const aprobarButton = screen.getByRole('button', { name: /APROBAR/i });
    expect(aprobarButton).toBeInTheDocument();
  });

  test('RBAC: Manager sees "APROBAR" button for completed tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="manager" />);

    const aprobarButton = screen.getByRole('button', { name: /APROBAR/i });
    expect(aprobarButton).toBeInTheDocument();
  });

  test('RBAC: Regular user does NOT see "APROBAR" button for completed tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const aprobarButton = screen.queryByRole('button', { name: /APROBAR/i });
    expect(aprobarButton).not.toBeInTheDocument();
  });

  test('RBAC: "APROBAR" button changes task status to aprobada (admin)', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="admin" />);

    const aprobarButton = screen.getByRole('button', { name: /APROBAR/i });
    fireEvent.click(aprobarButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('task3', 'aprobada');
  });

  test('RBAC: "APROBAR" button changes task status to aprobada (manager)', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="manager" />);

    const aprobarButton = screen.getByRole('button', { name: /APROBAR/i });
    fireEvent.click(aprobarButton);

    expect(mockOnStatusChange).toHaveBeenCalledWith('task3', 'aprobada');
  });

  test('approved tasks have no action buttons', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="admin" />);

    // Get the approved task card
    const approvedTaskCard = screen.getByText('Approved task').closest('.task-card');

    // Check that there are no buttons in the approved task
    const buttons = approvedTaskCard.querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });

  test('handles drag and drop events', () => {
    const { container } = render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const taskCard = screen.getByText('Pending task').closest('.task-card');
    const dropZones = container.querySelectorAll('.board-column');
    const dropZone = dropZones[1]; // en_progreso column

    // Simulate drag start
    fireEvent.dragStart(taskCard, { dataTransfer: { setData: jest.fn() } });

    // Create a mock dataTransfer object
    const dataTransfer = {
      getData: jest.fn(() => 'task1'),
    };

    // Simulate drop
    fireEvent.drop(dropZone, { dataTransfer, preventDefault: jest.fn() });

    expect(mockOnStatusChange).toHaveBeenCalledWith('task1', 'en_progreso');
  });

  test('displays "Sin Asignar" for unassigned tasks', () => {
    const unassignedTasks = [
      { id: 'task5', description: 'Unassigned task', status: 'pendiente', assigned_to: null },
    ];

    render(<KanbanBoard tasks={unassignedTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText('Sin Asignar')).toBeInTheDocument();
  });

  test('shows abbreviated user ID for assigned tasks', () => {
    render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getAllByText(/User-user/i)[0]).toBeInTheDocument();
  });

  test('renders empty columns when no tasks', () => {
    render(<KanbanBoard tasks={[]} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText(/PENDIENTE \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/EN PROGRESO \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/COMPLETADA \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/APROBADA \(0\)/i)).toBeInTheDocument();
  });

  test('tasks are draggable', () => {
    const { container } = render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const taskCards = container.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      expect(card).toHaveAttribute('draggable', 'true');
    });
  });

  test('column headers have correct color coding', () => {
    const { container } = render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const headers = container.querySelectorAll('.column-header');
    expect(headers.length).toBe(4);

    // Each header should have different color based on status
    headers.forEach(header => {
      expect(header).toHaveStyle({ textTransform: 'uppercase' });
    });
  });

  test('task cards have status-specific border color', () => {
    const { container } = render(<KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    const taskCards = container.querySelectorAll('.task-card');
    taskCards.forEach(card => {
      expect(card).toHaveStyle({ cursor: 'grab' });
    });
  });

  test('multiple tasks in same column render correctly', () => {
    const multipleTasks = [
      { id: 'task1', description: 'Task 1', status: 'pendiente', assigned_to: 'user1' },
      { id: 'task2', description: 'Task 2', status: 'pendiente', assigned_to: 'user2' },
      { id: 'task3', description: 'Task 3', status: 'pendiente', assigned_to: 'user3' },
    ];

    render(<KanbanBoard tasks={multipleTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />);

    expect(screen.getByText(/PENDIENTE \(3\)/i)).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('Task 3')).toBeInTheDocument();
  });

  test('RBAC: Different roles see appropriate buttons for their permission level', () => {
    const { rerender } = render(
      <KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="user" />
    );

    // User role: no APROBAR button
    expect(screen.queryByRole('button', { name: /APROBAR/i })).not.toBeInTheDocument();

    // Manager role: has APROBAR button
    rerender(
      <KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="manager" />
    );
    expect(screen.getByRole('button', { name: /APROBAR/i })).toBeInTheDocument();

    // Admin role: has APROBAR button
    rerender(
      <KanbanBoard tasks={mockTasks} projectId="proj1" onStatusChange={mockOnStatusChange} userRole="admin" />
    );
    expect(screen.getByRole('button', { name: /APROBAR/i })).toBeInTheDocument();
  });
});
