import { getCollection, type CollectionEntry } from 'astro:content';
import path from 'path';
import { handleAsyncError, createError } from './errorHandler';

type WorkEntry = CollectionEntry<'works'> & {
  data: {
    base: string;
    members?: unknown;
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
        const imageSlug = path.basename(item.id);

        const work = worksData.find(it => {
          const baseSlug = path.basename(it.data.base);
          return baseSlug === imageSlug;
        });

        if (!work) {
          // Dev-only logging without violating ESLint
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn(`Work page not found for: ${imageSlug}`);
          }
          return ans;
        }

        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log(
            'COMPARE:',
            'imageSlug =',
            imageSlug,
            'works bases =',
            worksData.map(w => w.data.base)
          );
        }

        ans.push({
          ...work,
          id: imageSlug,
          data: {
            ...work.data,
            members: item.data,
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
