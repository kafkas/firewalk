import type { firestore } from 'firebase-admin';

interface CollectionPopulatorBuilder<D> {
  withData(dataOrGetData: D | (() => D)): CollectionPopulator<D>;
}

interface CollectionPopulator<D> {
  populate(opts: { count: number }): Promise<firestore.DocumentReference<D>[]>;
}

export function collectionPopulator<D>(
  collectionRef: firestore.CollectionReference<D>
): CollectionPopulatorBuilder<D> {
  return {
    withData: (dataOrGetData) => {
      return {
        populate: async ({ count: docCount }) => {
          const promises = new Array(docCount).fill(null).map(async () => {
            const data =
              typeof dataOrGetData === 'function' ? (dataOrGetData as () => D)() : dataOrGetData;
            return await collectionRef.add(data);
          });

          return await Promise.all(promises);
        },
      };
    },
  };
}
