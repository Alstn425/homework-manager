import { Capacitor } from '@capacitor/core';

export const isNativePlatform = (): boolean => {
  try {
    // Capacitor가 제공하는 플랫폼 식별 사용: 'web' | 'android' | 'ios'
    return Capacitor.getPlatform() !== 'web';
  } catch (_e) {
    // 폴백: Capacitor 글로벌 존재 여부로 판단
    if (typeof window === 'undefined') return false;
    const isCapacitorPresent = (window as any).Capacitor !== undefined;
    return isCapacitorPresent;
  }
};

export const isWebPlatform = (): boolean => !isNativePlatform();


