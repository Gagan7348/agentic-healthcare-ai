// Centralized API configuration (VERIFIED V10 PRODUCTION SYNC)
const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

// FORCED PRODUCTION OVERRIDE: Direct connectivity to the stable Render backend
export const API_URL = isLocal ? 'http://localhost:8000' : 'https://agentic-healthcare-ai-2.onrender.com';
