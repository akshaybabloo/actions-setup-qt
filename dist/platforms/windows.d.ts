import type { QtInstallerConfig } from "./common.js";
/**
 * Get the appropriate Qt online installer configuration for Windows
 */
export declare function getInstallerConfig(): QtInstallerConfig;
/**
 * Setup Windows MSVC environment
 */
export declare function setupDependencies(): Promise<void>;
/**
 * Get the default compiler for Windows
 */
export declare function getDefaultCompiler(): string;
/**
 * Prepare the installer for execution on Windows
 */
export declare function prepareInstaller(installerPath: string): Promise<string>;
//# sourceMappingURL=windows.d.ts.map