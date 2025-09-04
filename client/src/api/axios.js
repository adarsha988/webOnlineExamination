// Get auth token for requests
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Handle auth errors
export const handleAuthError = (error) => {
  if (error.message.includes('401')) {
    // Token is invalid or expired
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  throw error;
};

// API request helper that works with TanStack Query
export const apiRequest = async (method, url, data) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error = new Error(`${response.status}: ${errorText}`);
      if (response.status === 401) {
        handleAuthError(error);
      }
      throw error;
    }

    return response;
  } catch (error) {
    if (error.message.includes('401')) {
      handleAuthError(error);
    }
    throw error;
  }
};

export default { apiRequest, getAuthToken, handleAuthError };
