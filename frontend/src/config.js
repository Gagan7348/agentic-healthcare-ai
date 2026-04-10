// Centralized API configuration
// Uses environment variable in production (Netlify/Render), falls back to localhost for development
export const API_URL = import.meta.env.VITE_API_URL || 'https://agentic-healthcare-ai-2.onrender.com';
