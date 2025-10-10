import type { QtInstallerConfig } from "./common.js"

/**
 * Platform-specific module interface
 */
export interface PlatformModule {
	getInstallerConfig: () => QtInstallerConfig
	setupDependencies: () => Promise<void>
	getDefaultCompiler: () => string
	prepareInstaller: (installerPath: string) => Promise<string>
	unmountDmg?: (mountPath: string) => Promise<void>
}

/**
 * Get the platform-specific module based on the current OS
 */
export async function getPlatformModule(): Promise<PlatformModule> {
	const platform = process.platform

	switch (platform) {
		case "win32":
			return await import("./windows.js")
		case "darwin":
			return await import("./macos.js")
		case "linux":
			return await import("./linux.js")
		default:
			throw new Error(`Unsupported platform: ${platform}`)
	}
}
