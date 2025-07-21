import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export const useSafeArea = () => {
  const [safeAreaInsets, setSafeAreaInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0
  });

  const [isNativePlatform, setIsNativePlatform] = useState(false);

  useEffect(() => {
    const isNative = Capacitor.isNativePlatform();
    setIsNativePlatform(isNative);

    const getSafeAreaInsets = () => {
      const top = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sat') || '0');
      const bottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sab') || '0');
      const left = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sal') || '0');
      const right = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--sar') || '0');

      return {
        top: top || (isNative ? 44 : 0), // Default to 44px for native, 0 for web
        bottom: bottom || (isNative ? 34 : 0), // Default to 34px for native, 0 for web
        left: left || 0,
        right: right || 0
      };
    };

    // Set CSS custom properties for safe areas
    const updateSafeAreaCSS = () => {
      const insets = getSafeAreaInsets();
      document.documentElement.style.setProperty('--sat', `${insets.top}px`);
      document.documentElement.style.setProperty('--sab', `${insets.bottom}px`);
      document.documentElement.style.setProperty('--sal', `${insets.left}px`);
      document.documentElement.style.setProperty('--sar', `${insets.right}px`);
      setSafeAreaInsets(insets);
    };

    // Initial update
    updateSafeAreaCSS();

    // Update on resize (for orientation changes)
    window.addEventListener('resize', updateSafeAreaCSS);

    // Update on focus (for when app comes back from background)
    window.addEventListener('focus', updateSafeAreaCSS);

    return () => {
      window.removeEventListener('resize', updateSafeAreaCSS);
      window.removeEventListener('focus', updateSafeAreaCSS);
    };
  }, []);

  return {
    safeAreaInsets,
    isNativePlatform,
    statusBarHeight: safeAreaInsets.top,
    bottomSafeArea: safeAreaInsets.bottom
  };
}; 