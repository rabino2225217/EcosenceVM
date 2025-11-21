/**
 * Automatically detects the API URL based on the current origin.
 * Works with localhost, IP addresses, and domain names.
 * Automatically replaces the frontend port with the backend port (4000).
 */
export function getApiUrl(): string {
  // In browser environment, use current origin
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    const port = window.location.port;
    
    // If there's a port, replace it with 4000 (backend port)
    if (port) {
      return `${window.location.protocol}//${window.location.hostname}:4000`;
    }
    
    // If no port (default ports 80/443), add :4000
    return `${origin}:4000`;
  }
  
  // Fallback for SSR or build time
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== 'undefined' && envUrl !== '') {
    return envUrl;
  }
  
  // Default fallback
  return 'http://localhost:4000';
}

export const API_URL = getApiUrl();

