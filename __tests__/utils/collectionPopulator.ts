import type { firestore } from 'firebase-admin';

interface CollectionPopulatorBuilder<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> {
  withData(
    dataOrGetData: AppModelType | (() => AppModelType)
  ): CollectionPopulator<AppModelType, DbModelType>;
}

interface CollectionPopulator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
> {
  populate(opts: {
    count: number;
  }): Promise<firestore.DocumentReference<AppModelType, DbModelType>[]>;
}

export function collectionPopulator<
  AppModelType = firestore.DocumentData,
  DbModelType extends firestore.DocumentData = firestore.DocumentData
>(
  collectionRef: firestore.CollectionReference<AppModelType, DbModelType>
): CollectionPopulatorBuilder<AppModelType, DbModelType> {
  return {
    withData: (dataOrGetData) => {
      return {
        populate: async ({ count: docCount }) => {
          const promises = new Array(docCount).fill(null).map(async () => {
            const data =
              typeof dataOrGetData === 'function'
                ? (dataOrGetData as () => AppModelType)()
                : dataOrGetData;
            return await collectionRef.add(data);
          });

          return await Promise.all(promises);
        },
      };
    },
  };
}
