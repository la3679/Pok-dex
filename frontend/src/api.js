const apiOrigin = (process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');
const apiBaseUrl = `${apiOrigin}/api`;

export default apiBaseUrl;
