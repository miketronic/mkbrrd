// Image preloading utilities
interface PreloadOptions {
  priority?: 'high' | 'low';
  timeout?: number;
}

interface PreloadResult {
  success: boolean;
  error?: Error;
  loadTime?: number;
}

// Cache for preloaded images to avoid duplicate requests
const preloadCache = new Map<string, Promise<PreloadResult>>();

/**
 * Preload a single image
 */
export function preloadImage(
  src: string, 
  options: PreloadOptions = {}
): Promise<PreloadResult> {
  // Return cached promise if already preloading
  if (preloadCache.has(src)) {
    return preloadCache.get(src)!;
  }

  const { priority = 'low', timeout = 10000 } = options;
  const startTime = performance.now();

  const preloadPromise = new Promise<PreloadResult>((resolve) => {
    const img = new Image();
    
    // Set priority for high-priority images
    if (priority === 'high' && 'fetchPriority' in img) {
      (img as any).fetchPriority = 'high';
    }

    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: new Error('Preload timeout'),
        loadTime: performance.now() - startTime,
      });
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve({
        success: true,
        loadTime: performance.now() - startTime,
      });
    };

    img.onerror = (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: new Error('Image load failed'),
        loadTime: performance.now() - startTime,
      });
    };

    img.src = src;
  });

  // Cache the promise
  preloadCache.set(src, preloadPromise);

  // Clean up cache after a delay to prevent memory leaks
  setTimeout(() => {
    preloadCache.delete(src);
  }, 60000); // 1 minute

  return preloadPromise;
}

/**
 * Preload multiple images
 */
export function preloadImages(
  srcs: string[], 
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  return Promise.all(srcs.map(src => preloadImage(src, options)));
}

/**
 * Preload images with supported formats (AVIF, WebP)
 */
let supportsAvif: boolean | null = null;

function detectAvifSupport() {
  if (supportsAvif !== null) return supportsAvif;
  const canvas = document.createElement('canvas');
  supportsAvif = canvas.toDataURL('image/avif').startsWith('data:image/avif');
  return supportsAvif;
}

export function preloadImageFormats(
  baseSrc: string,
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  const formats = detectAvifSupport()
    ? [`${baseSrc}.avif`, `${baseSrc}.webp`]
    : [`${baseSrc}.webp`];

  return preloadImages(formats, options);
}

/**
 * Preload next/previous images in a gallery
 */
export function preloadGalleryImages(
  currentIndex: number,
  images: string[],
  options: PreloadOptions = {}
): Promise<PreloadResult[]> {
  const bases: string[] = [];

  if (currentIndex + 1 < images.length) {
    bases.push(images[currentIndex + 1]);
  }

  if (currentIndex - 1 >= 0) {
    bases.push(images[currentIndex - 1]);
  }

  return Promise.all(
    bases.map(base => preloadImageFormats(base, options))
  ).then(results => results.flat());
}

/**
 * Create a hover preloader for an element
 */
export function createHoverPreloader(
  element: HTMLElement,
  imageSrcs: string[],
  options: PreloadOptions = {}
) {
  let preloadPromise: Promise<PreloadResult[]> | null = null;
  let isPreloaded = false;

  const handleMouseEnter = () => {
    if (!isPreloaded && !preloadPromise) {
      preloadPromise = preloadImages(imageSrcs, { ...options, priority: 'high' });
      preloadPromise.then(() => {
        isPreloaded = true;
        preloadPromise = null;
      });
    }
  };

  const handleMouseLeave = () => {
    // Keep preloaded images in cache even after mouse leave
  };

  element.addEventListener('mouseenter', handleMouseEnter);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Cleanup function
  return () => {
    element.removeEventListener('mouseenter', handleMouseEnter);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}

/**
 * Preload images when they're about to enter viewport
 */
export function preloadOnIntersection(
  element: HTMLElement,
  imageSrcs: string[],
  options: PreloadOptions & { rootMargin?: string } = {}
) {
  const { rootMargin = '200px', ...preloadOptions } = options;
  let hasPreloaded = false;

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting && !hasPreloaded) {
        hasPreloaded = true;
        preloadImages(imageSrcs, preloadOptions);
        observer.disconnect();
      }
    },
    { rootMargin }
  );

  observer.observe(element);

  return () => observer.disconnect();
}

/**
 * Get preload statistics
 */
export function getPreloadStats() {
  return {
    cacheSize: preloadCache.size,
    cachedUrls: Array.from(preloadCache.keys()),
  };
}

/**
 * Clear preload cache
 */
export function clearPreloadCache() {
  preloadCache.clear();
}
