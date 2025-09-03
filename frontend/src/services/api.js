import axios from "axios";

const API_BASE_URL = "http://localhost:5001/api";

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle token expiration
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            window.location.reload();
        }
        return Promise.reject(error);
    }
);

// Auth API functions
export const authAPI = {
    // Sign up new user
    signup: async (userData) => {
        try {
            const response = await api.post("/auth/signup", userData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Login user
    login: async (credentials) => {
        try {
            const response = await api.post("/auth/login", credentials);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Verify token and get user data
    verifyToken: async () => {
        try {
            const response = await api.get("/auth/verify");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },
};

// Token management
export const tokenManager = {
    setToken: (token) => {
        localStorage.setItem("token", token);
    },

    getToken: () => {
        return localStorage.getItem("token");
    },

    removeToken: () => {
        localStorage.removeItem("token");
    },
};

// User management
export const userManager = {
    setUser: (user) => {
        localStorage.setItem("user", JSON.stringify(user));
    },

    getUser: () => {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    },

    removeUser: () => {
        localStorage.removeUser("user");
    },
};

// Strategy API functions
export const strategyAPI = {
    // Get all strategies for the user
    getStrategies: async () => {
        try {
            const response = await api.get("/strategies");
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Get a single strategy by ID
    getStrategy: async (id) => {
        try {
            const response = await api.get(`/strategies/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Create a new strategy
    createStrategy: async (strategyData) => {
        try {
            const response = await api.post("/strategies", strategyData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Update a strategy
    updateStrategy: async (id, strategyData) => {
        try {
            const response = await api.put(`/strategies/${id}`, strategyData);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Delete a strategy
    deleteStrategy: async (id) => {
        try {
            const response = await api.delete(`/strategies/${id}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Add a notification to a strategy
    addNotification: async (id, notificationData) => {
        try {
            const response = await api.post(
                `/strategies/${id}/notifications`,
                notificationData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Respond to a notification
    respondToNotification: async (strategyId, notificationId, responseData) => {
        try {
            const response = await api.post(
                `/strategies/${strategyId}/notifications/${notificationId}/respond`,
                responseData
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || { message: "Network error" };
        }
    },
};

// AI Recommendations API functions
export const aiRecommendationAPI = {
    // Request AI recommendation for a strategy
    requestRecommendation: async (strategyId) => {
        try {
            const response = await api.post(
                `/ai-recommendations/${strategyId}/request`
            );
            return response.data;
        } catch (error) {
            console.error("AI recommendation request error:", error);
            if (error.response?.status === 401) {
                throw new Error("Authentication failed - please log in again");
            }
            throw error.response?.data || { message: "Network error" };
        }
    },

    // Get AI recommendation status for a strategy
    getRecommendationStatus: async (strategyId) => {
        try {
            const response = await api.get(
                `/ai-recommendations/${strategyId}/status`
            );
            return response.data;
        } catch (error) {
            console.error("AI recommendation status error:", error);
            if (error.response?.status === 401) {
                throw new Error("Authentication failed - please log in again");
            }
            throw error.response?.data || { message: "Network error" };
        }
    },
};

export default api;
