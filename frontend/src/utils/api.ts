const envUrl = process.env.NEXT_PUBLIC_API_URL;

export const getApiUrl = (): string => {
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
    if (isLocal) {
      return 'http://127.0.0.1:5000/api';
    }
    const protocol = window.location.protocol;
    return `${protocol}//${host}:5000/api`;
  }

  return 'http://localhost:5000/api';
};

export const getImageUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) return url;

  if (url.startsWith('/')) {
    const baseUrl = getApiUrl().replace(/\/api$/, '');
    return `${baseUrl}${url}`;
  }
  return url;
};
