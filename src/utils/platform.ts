export const isWebPlatform = (): boolean => {
  if (typeof window === 'undefined') return false;
  const isCapacitorPresent = (window as any).Capacitor !== undefined;
  const host = window.location?.hostname || '';
  // 개발 서버(Localhost)에서는 항상 웹로 처리
  if (host === 'localhost' || host === '127.0.0.1') return true;
  // Capacitor 객체가 없으면 웹
  return !isCapacitorPresent;
};

export const isNativePlatform = (): boolean => !isWebPlatform();


