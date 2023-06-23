import * as admin from 'firebase-admin';
import * as fs from 'fs';
import { resolve } from 'path';

class Application {
  public constructor() {
    this.#safelyInitFirebaseApp();
  }

  public get pathToServiceAccountKey(): string {
    return resolve(__dirname, `service-account.json`);
  }

  public get pathToEnvConfig(): string {
    return resolve(__dirname, `env.json`);
  }

  public get admin(): typeof admin {
    return admin;
  }

  #safelyInitFirebaseApp(): void {
    if (!fs.existsSync(this.pathToServiceAccountKey)) {
      throw new Error(
        'Could not find a service account key with which to initialize the Firebase app.'
      );
    }

    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(this.pathToServiceAccountKey),
      });
    }
  }
}

let _app: Application | undefined;

export function app(): Application {
  return _app ?? (_app = new Application());
}
