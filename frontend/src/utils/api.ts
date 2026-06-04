export const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    let host = window.location.hostname;
    // Map localhost to 127.0.0.1 to avoid IPv6 connection refused issues on Windows
    if (host === 'localhost') {
      host = '127.0.0.1';
    }
    return `http://${host}:5000/api`;
  }
  
  // Fallback for SSR or static generation
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

export const getImageUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  // If it's a relative URL from the backend
  if (url.startsWith('/')) {
    const baseUrl = getApiUrl().replace('/api', '');
    return `${baseUrl}${url}`;
  }
  return url;
};
