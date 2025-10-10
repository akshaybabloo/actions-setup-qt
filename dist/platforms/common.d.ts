export interface QtInstallerConfig {
    url: string;
    needsMount: boolean;
    mountPath?: string;
    executable?: string;
}
/**
 * Download the Qt online installer
 */
export declare function downloadInstaller(url: string): Promise<string>;
/**
 * Run the Qt installer with the specified parameters
 */
export declare function runInstaller(installerPath: string, username: string, password: string, qtVersion?: string): Promise<void>;
/**
 * Generate cache key for Qt installation
 */
export declare function getCacheKey(qtVersion: string, compiler: string): string;
/**
 * Make installer executable on Unix-like systems
 */
export declare function makeExecutable(filePath: string): Promise<void>;
//# sourceMappingURL=common.d.ts.map