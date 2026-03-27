import type { QtInstallerConfig } from "./common.js";
/**
 * Platform-specific module interface
 */
export interface PreparedInstaller {
    executablePath: string;
    mountPath?: string;
}
export interface PlatformModule {
    getInstallerConfig: () => QtInstallerConfig;
    setupDependencies: () => Promise<void>;
    getDefaultCompiler: () => string;
    prepareInstaller: (installerPath: string) => Promise<PreparedInstaller>;
    unmountDmg?: (mountPath: string) => Promise<void>;
}
/**
 * Get the platform-specific module based on the current OS
 */
export declare function getPlatformModule(): Promise<PlatformModule>;
//# sourceMappingURL=index.d.ts.map