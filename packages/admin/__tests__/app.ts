import * as admin from 'firebase-admin';
import { resolve } from 'path';

class Application {
  public constructor() {
    this.safelyInitFirebaseApp();
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

  private safelyInitFirebaseApp(): void {
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
