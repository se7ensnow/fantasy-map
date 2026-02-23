import axios from 'axios';
import { getToken, getTokenType } from './auth';
import { API_URL } from "../config";

export async function getMyMaps(page = 1, size = 10) {
    try {
        const response = await axios.get(`${API_URL}/maps/owned`, {
            params: { page, size },
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load maps");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching maps: " + error.message);
        }
    }
}

export async function getAllMaps(page = 1, size = 10, { q, tags, tagsMode } = {}) {
  try {
    const params = { page, size };
    if (q && q.trim()) params.q = q.trim();
    if (tags && tags.trim()) params.tags = tags.trim();
    if (tagsMode) params.tags_mode = tagsMode;

    const response = await axios.get(`${API_URL}/maps/all`, { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to load maps");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error fetching maps: " + error.message);
    }
  }
}

export async function getMapById(mapId) {
    try {
        const response = await axios.get(`${API_URL}/maps/${mapId}`, {
          headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to load map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error fetching map: " + error.message);
        }
    }
}

export async function getMapByShareId(shareId) {
  try {
    const response = await axios.get(`${API_URL}/maps/share/${shareId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to load shared map");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error fetching shared map: " + error.message);
    }
  }
}

export async function listTags(q = "", limit = 50) {
  try {
    const params = { limit };
    if (q && q.trim()) params.q = q.trim();

    const response = await axios.get(`${API_URL}/maps/tags`, { params });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to load tags");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error fetching tags: " + error.message);
    }
  }
}

export async function createMap(title, description, tags = [], visibility = "private") {
  try {
    const response = await axios.post(`${API_URL}/maps/create`, {
      title,
      description,
      tags,
      visibility,
    }, {
      headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to create map");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error creating map: " + error.message);
    }
  }
}

export async function updateMap(mapId, title, description, tags, visibility) {
  try {
    const payload = { title, description };
    if (tags !== undefined) payload.tags = tags;
    if (visibility !== undefined) payload.visibility = visibility;

    const response = await axios.put(`${API_URL}/maps/${mapId}`, payload, {
      headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
    });

    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to update map");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error updating map: " + error.message);
    }
  }
}

export async function deleteMap(mapId) {
    try {
        const response = await axios.delete(`${API_URL}/maps/${mapId}`, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`
            }
        });

        return response.status === 204;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to delete map");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error deleting map: " + error.message);
        }
    }
}

export async function uploadImage(mapId, imageFile) {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
        const response = await axios.post(`${API_URL}/maps/${mapId}/upload-image`, formData, {
            headers: {
                'Authorization': `${getTokenType()} ${getToken()}`,
                'Content-Type': 'multipart/form-data'
            }
        });

        return response.data;
    
    } catch (error) {
        if (error.response) {
            throw new Error(error.response.data?.detail || "Failed to upload image");
        } else if (error.request) {
            throw new Error("No response received from server");
        } else {
            throw new Error("Error uploading image: " + error.message);
        }
    }
}

export async function createShareId(mapId) {
  try {
    const response = await axios.post(`${API_URL}/maps/${mapId}/share`, null, {
      headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to create share link");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error creating share link: " + error.message);
    }
  }
}

export async function getShareId(mapId) {
  try {
    const response = await axios.get(`${API_URL}/maps/${mapId}/share`, {
      headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to load share link");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error loading share link: " + error.message);
    }
  }
}

export async function deleteShareId(mapId) {
  try {
    const response = await axios.delete(`${API_URL}/maps/${mapId}/share`, {
      headers: { 'Authorization': `${getTokenType()} ${getToken()}` }
    });
    return response.status === 204;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || "Failed to disable share link");
    } else if (error.request) {
      throw new Error("No response received from server");
    } else {
      throw new Error("Error disabling share link: " + error.message);
    }
  }
}