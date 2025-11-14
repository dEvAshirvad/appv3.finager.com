import axios from "axios";

const BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND}/api`;

// Create axios instance with default config
const api = axios.create({
	baseURL: BASE_URL,
	withCredentials: true, // Include cookies for session
	headers: {
		"Content-Type": "application/json",
	},
});

export default api;
