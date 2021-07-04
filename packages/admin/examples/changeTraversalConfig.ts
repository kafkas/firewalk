import { firestore } from 'firebase-admin';
import { createMigrator } from '@firecode/admin';

const walletsWithNegativeBalance = firestore().collection('wallets').where('money', '<', 0);
const migrator = createMigrator(walletsWithNegativeBalance, {
  // We want each batch to have 500 docs. The size of the very last batch may be less than 500
  batchSize: 500,
  // We want to wait before moving to the next batch
  sleepBetweenBatches: true,
  // We want to wait 500ms before moving to the next batch
  sleepTimeBetweenBatches: 500,
});
// Wipe out their debts!
const { migratedDocCount } = await migrator.set({ money: 0 });
console.log(`Updated ${migratedDocCount} wallets!`);
