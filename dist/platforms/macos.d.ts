import type { QtInstallerConfig } from "./common.js";
/**
 * Get the appropriate Qt online installer configuration for macOS
 */
export declare function getInstallerConfig(): QtInstallerConfig;
/**
 * Unmount DMG file on macOS
 */
export declare function unmountDmg(mountPath: string): Promise<void>;
/**
 * Install macOS dependencies required for Qt
 */
export declare function setupDependencies(): Promise<void>;
/**
 * Get the default compiler for macOS
 */
export declare function getDefaultCompiler(): string;
/**
 * Prepare the installer for execution on macOS
 * This mounts the DMG and finds the executable
 */
export declare function prepareInstaller(installerPath: string): Promise<string>;
//# sourceMappingURL=macos.d.ts.map