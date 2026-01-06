import { authAPI, usersAPI, clientsAPI, projectsAPI } from '../../services/api';

// Mock fetch globally
global.fetch = jest.fn();

describe('API Service Layer', () => {
  beforeEach(() => {
    fetch.mockClear();
    // Reset localStorage mock to return 'mock-token'
    global.localStorage.getItem.mockReturnValue('mock-token');
  });

  describe('authAPI', () => {
    test('login constructs correct URL and payload', async () => {
      const mockResponse = { user_info: { id: '1', username: 'test' }, token: 'abc123' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
        headers: { get: () => 'application/json' },
      });

      const result = await authAPI.login('testuser', 'password123');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: 'testuser', pass: 'password123' }),
      });
      expect(result).toEqual(mockResponse);
    });

    test('login handles errors correctly', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({ message: 'Invalid credentials' }),
      });

      await expect(authAPI.login('wrong', 'wrong')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('usersAPI', () => {
    test('getAll constructs correct URL with auth header', async () => {
      const mockUsers = [{ id: '1', username: 'user1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
        headers: { get: () => 'application/json' },
      });

      const result = await usersAPI.getAll();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        headers: { 'Authorization': 'Bearer mock-token' },
      });
      expect(result).toEqual(mockUsers);
    });

    test('create sends correct payload with username and password fields', async () => {
      const userData = { username: 'newuser', email: 'test@test.com', password: 'pass123', role: 'user' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '2', ...userData }),
        headers: { get: () => 'application/json' },
      });

      await usersAPI.create(userData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    });

    test('update sends correct payload', async () => {
      const userData = { username: 'updated', email: 'new@test.com', role: 'admin' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...userData }),
        headers: { get: () => 'application/json' },
      });

      await usersAPI.update('1', userData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
    });

    test('toggleStatus sends correct status', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      });

      await usersAPI.toggleStatus('1', false);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/users/1/status', {
        method: 'PATCH',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active: false }),
      });
    });
  });

  describe('clientsAPI', () => {
    test('getFields constructs correct URL', async () => {
      const mockFields = [{ id: '1', name: 'field1' }];
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockFields,
        headers: { get: () => 'application/json' },
      });

      const result = await clientsAPI.getFields();

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/clients/fields', {
        headers: { 'Authorization': 'Bearer mock-token' },
      });
      expect(result).toEqual(mockFields);
    });

    test('createField sends correct payload', async () => {
      const fieldData = { name: 'custom_field', label: 'Custom Field', type: 'text' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...fieldData }),
        headers: { get: () => 'application/json' },
      });

      await clientsAPI.createField(fieldData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/clients/fields', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fieldData),
      });
    });
  });

  describe('projectsAPI', () => {
    test('getById constructs correct URL with project ID', async () => {
      const mockProject = { id: '1', name: 'Project 1' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockProject,
        headers: { get: () => 'application/json' },
      });

      const result = await projectsAPI.getById('1');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/projects/1', {
        headers: { 'Authorization': 'Bearer mock-token' },
      });
      expect(result).toEqual(mockProject);
    });

    test('createTask sends correct payload', async () => {
      const taskData = { description: 'New task', status: 'pendiente', assigned_to: 'user1' };
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: '1', ...taskData }),
        headers: { get: () => 'application/json' },
      });

      await projectsAPI.createTask('proj1', taskData);

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/projects/proj1/tasks', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      });
    });

    test('updateTaskStatus sends correct status', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
        headers: { get: () => 'application/json' },
      });

      await projectsAPI.updateTaskStatus('task1', 'completada');

      expect(fetch).toHaveBeenCalledWith('http://localhost:5000/api/projects/tasks/task1/status', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer mock-token',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'completada' }),
      });
    });
  });

  describe('Error Handling', () => {
    test('handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(usersAPI.getAll()).rejects.toThrow('Network error');
    });

    test('handles non-JSON responses', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        headers: { get: () => null },
      });

      const result = await usersAPI.delete('1');
      expect(result).toBeNull();
    });
  });
});
