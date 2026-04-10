// Centralized API configuration
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_URL = isLocal ? 'http://localhost:8000' : 'https://agentic-healthcare-ai-2.onrender.com';
