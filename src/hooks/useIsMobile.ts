import { useEffect, useState } from 'react';

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    
    // Check for real mobile device using multiple methods
    const isRealMobile = () => {
      // Method 1: User agent detection
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      
      // Method 2: Touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Method 3: Screen width
      const isSmallScreen = window.innerWidth < 768;
      
      // Method 4: Platform detection
      const isMobilePlatform = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.platform);
      
      // Method 5: Check for mobile-specific features
      const isMobileFeatures = 'orientation' in window || 'devicePixelRatio' in window;
      
      console.log('Mobile detection:', {
        userAgent: userAgent,
        isMobileUA,
        hasTouch,
        isSmallScreen,
        isMobilePlatform,
        isMobileFeatures,
        screenWidth: window.innerWidth,
        platform: navigator.platform
      });
      
      // Return true if it's likely a real mobile device
      return isMobileUA || (hasTouch && isSmallScreen) || isMobilePlatform;
    };
    
    return isRealMobile();
  });

  useEffect(() => {
    const updateMobileStatus = () => {
      if (typeof window === 'undefined') return;
      
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth < 768;
      const isMobilePlatform = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.platform);
      
      const newIsMobile = isMobileUA || (hasTouch && isSmallScreen) || isMobilePlatform;
      setIsMobile(newIsMobile);
      
      console.log('Mobile status updated:', {
        isMobile: newIsMobile,
        userAgent: userAgent,
        hasTouch,
        screenWidth: window.innerWidth,
        platform: navigator.platform
      });
    };

    // Update on resize and orientation change
    window.addEventListener('resize', updateMobileStatus);
    window.addEventListener('orientationchange', updateMobileStatus);
    
    // Initial update
    updateMobileStatus();
    
    return () => {
      window.removeEventListener('resize', updateMobileStatus);
      window.removeEventListener('orientationchange', updateMobileStatus);
    };
  }, []);

  return isMobile;
};

export default useIsMobile; 