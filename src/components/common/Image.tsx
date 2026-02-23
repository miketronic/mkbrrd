import React, { useState, useMemo, useCallback } from 'react';
import clsx from 'clsx';
import { Skeleton } from '@heroui/react';
import { useImageLazyLoading } from '@/lib/useIntersectionObserver';
import { preloadImageFormats } from '@/lib/imagePreloader';

interface ImageProps {
  src: string; // base path WITHOUT extension
  alt?: string;
  classNames?: {
    skeleton?: string;
    img?: string;
  };
  onClick?: () => void;
  imageInfo: {
    width: number;
    height: number;
  };
  workTitle?: string;
  lazy?: boolean;
  preloadOnHover?: boolean;
}

export default function Image({
  src,
  alt,
  classNames = {},
  onClick,
  imageInfo,
  workTitle,
  lazy = true,
  preloadOnHover = false,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const { ref, hasIntersected } = useImageLazyLoading({ skip: !lazy });

  const ratio = useMemo(
    () => imageInfo.width / imageInfo.height,
    [imageInfo]
  );

  const altText = useMemo(() => {
    if (alt) return alt;
    const imageName = src.split('/').pop();
    const workName = workTitle || src.split('/').slice(-2, -1)[0];
    return `${workName} - image ${imageName}`;
  }, [alt, src, workTitle]);

  const handleMouseEnter = useCallback(() => {
    if (preloadOnHover && !loaded) {
      preloadImageFormats(src, { priority: 'high' });
    }
  }, [preloadOnHover, src, loaded]);

  if (lazy && !hasIntersected) {
    return (
      <Skeleton
        ref={ref}
        classNames={{ base: clsx('w-full', classNames.skeleton) }}
        style={{ aspectRatio: ratio }}
      />
    );
  }

  return (
    <Skeleton
      isLoaded={loaded}
      classNames={{ base: clsx('w-full', classNames.skeleton) }}
      style={{ aspectRatio: ratio }}
      onMouseEnter={handleMouseEnter}
    >
      <picture>
        <source srcSet={`${src}.avif`} type="image/avif" />
        <source srcSet={`${src}.webp`} type="image/webp" />
        <img
          loading={lazy ? 'lazy' : 'eager'}
          className={clsx('w-full', classNames.img)}
          src={`${src}.webp`}
          alt={altText}
          onLoad={() => setLoaded(true)}
          onClick={onClick}
          onContextMenu={e => e.preventDefault()}
          {...props}
        />
      </picture>
    </Skeleton>
  );
}
