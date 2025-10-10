import type { QtInstallerConfig } from "./common.js";
/**
 * Get the appropriate Qt online installer configuration for Linux
 */
export declare function getInstallerConfig(): QtInstallerConfig;
/**
 * Install Linux dependencies required for Qt
 */
export declare function setupDependencies(): Promise<void>;
/**
 * Get the default compiler for Linux
 */
export declare function getDefaultCompiler(): string;
/**
 * Prepare the installer for execution on Linux
 * This makes the installer executable
 */
export declare function prepareInstaller(installerPath: string): Promise<string>;
//# sourceMappingURL=linux.d.ts.map