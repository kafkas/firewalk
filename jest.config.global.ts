export default function globalJestSetup(): void {
  process.env.FIRESTORE_EMULATOR_HOST = `127.0.0.1:8080`;
}
