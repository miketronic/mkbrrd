console.log('🔥 getWorks.ts LOADED FROM:', import.meta.url);

import { getCollection, type CollectionEntry } from 'astro:content';
import path from 'path';
import { handleAsyncError, createError } from './errorHandler';

type WorkEntry = CollectionEntry<'works'> & {
  data: {
    base: string;
    members: unknown;
    imageBasePath: string;
  };
};

export const getWorks = async () => {
  return handleAsyncError(
    async () => {
      const imageInfo = await getCollection('imageInfo');
      const worksData = await getCollection('works');

      if (!imageInfo.length) {
        throw createError('No image info found', 'CONTENT_NOT_FOUND', 404);
      }

      if (!worksData.length) {
        throw createError('No works data found', 'CONTENT_NOT_FOUND', 404);
      }

      const works = imageInfo.reduce<WorkEntry[]>((ans, item) => {
        const imageSlug = path.posix.basename(
          item.id.replace(/\\/g, '/')
        );

        // ✅ slug safety check (NOW IN SCOPE)
        if (imageSlug.includes('/') || imageSlug.includes('\\')) {
          throw new Error(`Invalid slug generated: ${imageSlug}`);
        }

        const work = worksData.find(
          it => path.posix.basename(it.data.base) === imageSlug
        );

        if (!work) {
          if (import.meta.env.DEV) {
            console.warn(`Work page not found for: ${imageSlug}`);
          }
          return ans;
        }

        const imageBasePath = `/images/works/${imageSlug}`;

        ans.push({
          ...work,
          id: imageSlug,
          data: {
            ...work.data,
            members: item.data,
            imageBasePath,
          },
        });

        return ans;
      }, []);

      return works;
    },
    [],
    'Failed to load works data'
  );
};

export default getWorks;
