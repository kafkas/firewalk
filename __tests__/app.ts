import * as admin from 'firebase-admin';

class Application {
  public get firestore(): admin.firestore.Firestore {
    return this.firebaseApp.firestore();
  }

  public constructor(private readonly firebaseApp: admin.app.App) {}
}

let _app: Application | undefined;

export function app(): Application {
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:8080`;
  process.env.FIREBASE_STORAGE_EMULATOR_HOST = `127.0.0.1:9199`;
  process.env.FIREBASE_EMULATOR_HUB = '127.0.0.1:4400';
  const firebaseApp = admin.initializeApp();
  return _app ?? (_app = new Application(firebaseApp));
}
