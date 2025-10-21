
export const validPackageManagers = ['npm', 'pnpm'] as const;
export type PackageManager = typeof validPackageManagers[number];
import { promises as fs } from 'fs';

export const prober = {
  probePackageManager: async (): Promise<PackageManager> => {
    // Check for pnpm-lock.yaml
    try {
      await fs.access('pnpm-lock.yaml');
      return 'pnpm';
    } catch {
      // File does not exist
    }
    // Default to npm if no lock file found
    return 'npm';

  }
}
