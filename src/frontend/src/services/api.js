/**
 * API Service Layer for NEXA-Sys V.02 CRM
 *
 * Centralizes all API calls with consistent error handling,
 * authentication, and base URL configuration.
 */

// Use environment variable or relative URL for production
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Get authorization headers with current token
 */
const getAuthHeaders = (includeContentType = true) => {
    const token = localStorage.getItem('token');
    const headers = {
        'Authorization': `Bearer ${token}`
    };
    if (includeContentType) {
        headers['Content-Type'] = 'application/json';
    }
    return headers;
};

/**
 * Handle API response and errors
 */
const handleResponse = async (response) => {
    if (response.ok) {
        // Check if response has content
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            return await response.json();
        }
        return null;
    }

    // Handle error responses
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
};

// ============= AUTH API =============

export const authAPI = {
    /**
     * Login user
     * @param {string} username
     * @param {string} password
     * @returns {Promise<{user_info: Object, token: string}>}
     */
    login: async (username, password) => {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user: username, pass: password })
        });
        return handleResponse(response);
    }
};

// ============= USERS API =============

export const usersAPI = {
    /**
     * Get all users
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Create new user
     * @param {Object} userData - {username, email, password, role}
     * @returns {Promise<Object>}
     */
    create: async (userData) => {
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    /**
     * Update user
     * @param {string} userId
     * @param {Object} userData - {username, email, password?, role}
     * @returns {Promise<Object>}
     */
    update: async (userId, userData) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        return handleResponse(response);
    },

    /**
     * Delete user
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    delete: async (userId) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Toggle user active status
     * @param {string} userId
     * @param {boolean} active
     * @returns {Promise<Object>}
     */
    toggleStatus: async (userId, active) => {
        const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ active })
        });
        return handleResponse(response);
    }
};

// ============= CLIENTS API =============

export const clientsAPI = {
    /**
     * Get all clients
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Create new client
     * @param {Object} clientData
     * @returns {Promise<Object>}
     */
    create: async (clientData) => {
        const response = await fetch(`${API_BASE_URL}/clients`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(clientData)
        });
        return handleResponse(response);
    },

    /**
     * Update client
     * @param {string} clientId
     * @param {Object} clientData
     * @returns {Promise<Object>}
     */
    update: async (clientId, clientData) => {
        const response = await fetch(`${API_BASE_URL}/clients/${clientId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(clientData)
        });
        return handleResponse(response);
    },

    /**
     * Get custom fields for clients
     * @returns {Promise<Array>}
     */
    getFields: async () => {
        const response = await fetch(`${API_BASE_URL}/clients/fields`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Create custom field for clients
     * @param {Object} fieldData - {name, label, type, category, active}
     * @returns {Promise<Object>}
     */
    createField: async (fieldData) => {
        const response = await fetch(`${API_BASE_URL}/clients/fields`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(fieldData)
        });
        return handleResponse(response);
    },

    /**
     * Update custom field
     * @param {string} fieldId
     * @param {Object} fieldData
     * @returns {Promise<Object>}
     */
    updateField: async (fieldId, fieldData) => {
        const response = await fetch(`${API_BASE_URL}/clients/fields/${fieldId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(fieldData)
        });
        return handleResponse(response);
    }
};

// ============= PROJECTS API =============

export const projectsAPI = {
    /**
     * Get all projects
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Get project by ID
     * @param {string} projectId
     * @returns {Promise<Object>}
     */
    getById: async (projectId) => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Create new project
     * @param {Object} projectData
     * @returns {Promise<Object>}
     */
    create: async (projectData) => {
        const response = await fetch(`${API_BASE_URL}/projects`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(projectData)
        });
        return handleResponse(response);
    },

    /**
     * Update project
     * @param {string} projectId
     * @param {Object} projectData
     * @returns {Promise<Object>}
     */
    update: async (projectId, projectData) => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(projectData)
        });
        return handleResponse(response);
    },

    /**
     * Create task for project
     * @param {string} projectId
     * @param {Object} taskData - {description, status, assigned_to}
     * @returns {Promise<Object>}
     */
    createTask: async (projectId, taskData) => {
        const response = await fetch(`${API_BASE_URL}/projects/${projectId}/tasks`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(response);
    },

    /**
     * Update task status
     * @param {string} taskId
     * @param {string} status
     * @returns {Promise<Object>}
     */
    updateTaskStatus: async (taskId, status) => {
        const response = await fetch(`${API_BASE_URL}/projects/tasks/${taskId}/status`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ status })
        });
        return handleResponse(response);
    },

    /**
     * Update task (description and assignment)
     * @param {string} taskId
     * @param {Object} taskData - {description, assigned_to}
     * @returns {Promise<Object>}
     */
    updateTask: async (taskId, taskData) => {
        const response = await fetch(`${API_BASE_URL}/projects/tasks/${taskId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(taskData)
        });
        return handleResponse(response);
    },

    // ============= PROJECT CUSTOM FIELDS API (BUG #026) =============
    // Note: Uses /projects/meta/fields endpoint for custom field definitions

    /**
     * Get custom field definitions for projects
     * @returns {Promise<Array>}
     */
    getFields: async () => {
        const response = await fetch(`${API_BASE_URL}/projects/meta/fields`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Get all custom field definitions (including inactive)
     * @returns {Promise<Array>}
     */
    getAllFields: async () => {
        const response = await fetch(`${API_BASE_URL}/projects/meta/fields/all`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    },

    /**
     * Create custom field definition (Admin only)
     * @param {Object} fieldData - {name, label, type, category, is_required, sort_order, options}
     * @returns {Promise<Object>}
     */
    createField: async (fieldData) => {
        const response = await fetch(`${API_BASE_URL}/projects/meta/fields`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(fieldData)
        });
        return handleResponse(response);
    },

    /**
     * Update custom field definition (Admin only)
     * @param {string} fieldId
     * @param {Object} fieldData - {label, category, is_required, sort_order, options}
     * @returns {Promise<Object>}
     */
    updateField: async (fieldId, fieldData) => {
        const response = await fetch(`${API_BASE_URL}/projects/meta/fields/${fieldId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(fieldData)
        });
        return handleResponse(response);
    },

    /**
     * Delete/deactivate custom field definition (Admin only)
     * @param {string} fieldId
     * @returns {Promise<Object>}
     */
    deleteField: async (fieldId) => {
        const response = await fetch(`${API_BASE_URL}/projects/meta/fields/${fieldId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    }
};

// ============= DASHBOARD API =============

export const dashboardAPI = {
    /**
     * Get dashboard statistics
     * @returns {Promise<Object>}
     */
    getStats: async () => {
        const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
            headers: getAuthHeaders(false)
        });
        return handleResponse(response);
    }
};

// Export default object with all APIs
export default {
    auth: authAPI,
    users: usersAPI,
    clients: clientsAPI,
    projects: projectsAPI,
    dashboard: dashboardAPI
};
