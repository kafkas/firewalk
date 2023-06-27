import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { resolve } from 'path';

class Application {
  public get firestore(): admin.firestore.Firestore {
    return this.firebaseApp.firestore();
  }

  public constructor(private readonly firebaseApp: admin.app.App) {}
}

let _app: Application | undefined;

export function app(): Application {
  const serviceAccountAsJsonString = process.env.SERVICE_ACCOUNT;
  const pathToServiceAccount = resolve(__dirname, `service-account.json`);
  const serviceAccountFileExists = fs.existsSync(pathToServiceAccount);

  let cred;

  if (typeof serviceAccountAsJsonString !== 'string' && !serviceAccountFileExists) {
    throw new Error('Could not find a service account with which to initialize the Firebase app.');
  } else if (typeof serviceAccountAsJsonString === 'string') {
    try {
      cred = JSON.parse(serviceAccountAsJsonString);
    } catch {
      throw new Error('Service account has an invalid shape.');
    }
  } else if (serviceAccountFileExists) {
    cred = pathToServiceAccount;
  }

  let [firebaseApp] = admin.apps;

  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(cred),
    });
  }

  return _app ?? (_app = new Application(firebaseApp));
}
