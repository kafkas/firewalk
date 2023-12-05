import * as admin from 'firebase-admin';

class Application {
  public get firestore(): admin.firestore.Firestore {
    return this.firebaseApp.firestore();
  }

  public constructor(private readonly firebaseApp: admin.app.App) {}
}

let _app: Application | undefined;

export function app(): Application {
  const firebaseApp = admin.initializeApp();
  return _app ?? (_app = new Application(firebaseApp));
}
