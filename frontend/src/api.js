const API_BASE = '/api';

async function handleResponse(response) {
  if (response.status === 204) {
    return null;
  }
  if (!response.ok) {
    let errorDetail = `Request failed with status ${response.status}`;
    try {
      const errorJson = await response.json();
      if (errorJson && errorJson.detail) {
        if (typeof errorJson.detail === 'string') {
          errorDetail = errorJson.detail;
        } else if (Array.isArray(errorJson.detail)) {
          errorDetail = errorJson.detail.map(d => d.msg || JSON.stringify(d)).join(', ');
        }
      }
    } catch {
      // Non-JSON error response
    }
    const error = new Error(errorDetail);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

export const api = {
  async getTasks() {
    const res = await fetch(`${API_BASE}/tasks`);
    return handleResponse(res);
  },

  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData),
    });
    return handleResponse(res);
  },

  async updateTask(taskId, updates) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'DELETE',
    });
    return handleResponse(res);
  },

  async getPeople() {
    const res = await fetch(`${API_BASE}/people`);
    return handleResponse(res);
  },

  async addPerson(name) {
    const res = await fetch(`${API_BASE}/people`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    return handleResponse(res);
  },
};
