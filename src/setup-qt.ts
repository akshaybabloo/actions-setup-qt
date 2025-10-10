import { info, error as logError, exportVariable, addPath } from "@actions/core"
import { restoreCache, saveCache } from "@actions/cache"
import { promises as fs } from "node:fs"
import * as path from "node:path"
import * as os from "node:os"
import { downloadInstaller, runInstaller, getCacheKey } from "./platforms/common.js"
import { getPlatformModule } from "./platforms/index.js"

/**
 * Export Qt to PATH
 */
async function exportQtPath(version: string, compiler: string): Promise<void> {
	const homeDir = os.homedir()
	const qtBinPath = path.join(homeDir, "Qt", version, compiler, "bin")
	
	info(`Adding Qt to PATH: ${qtBinPath}`)
	
	try {
		// Check if the path exists
		await fs.access(qtBinPath)
		
		// Add to PATH for this action
		addPath(qtBinPath)
		
		// Also export as environment variable for subsequent steps
		const currentPath = process.env.PATH || ""
		const newPath = `${qtBinPath}${path.delimiter}${currentPath}`
		exportVariable("PATH", newPath)
		
		info("Qt successfully added to PATH")
	} catch (err) {
		logError(`Failed to add Qt to PATH: ${err}`)
		throw err
	}
}

/**
 * Main setup function to install Qt
 */
export async function setupQt(
	username: string,
	password: string,
	qtVersion = "qt6.10.0-full-dev",
	compiler?: string,
	installDeps = false,
): Promise<void> {
	try {
		info("Starting Qt setup...")
		
		const homeDir = os.homedir()
		const qtRoot = path.join(homeDir, "Qt")
		
		// Get platform-specific module
		const platform = await getPlatformModule()
		
		// Get default compiler if not specified
		const effectiveCompiler = compiler ?? platform.getDefaultCompiler()
		
		// Generate cache key
		const cacheKey = getCacheKey(qtVersion, effectiveCompiler)
		info(`Cache key: ${cacheKey}`)
		
		// Try to restore from cache
		const cacheRestored = await restoreCache([qtRoot], cacheKey)
		
		if (cacheRestored) {
			info("Qt installation restored from cache")
		} else {
			info("Qt installation not found in cache, proceeding with installation...")
			
			// Install platform-specific dependencies
			// On Linux, dependencies are required for the installer to run
			if (process.platform === "linux") {
				await platform.setupDependencies()
			} else if (installDeps) {
				// For other platforms, only install if explicitly requested
				await platform.setupDependencies()
			}
			
			// Get installer configuration
			const config = platform.getInstallerConfig()
			
			// Download installer
			const installerPath = await downloadInstaller(config.url)
			
			// Prepare installer for execution (platform-specific)
			const executablePath = await platform.prepareInstaller(installerPath)
			
			// Run installer
			await runInstaller(executablePath, username, password, qtVersion)
			
			// Cleanup: Unmount DMG if on macOS
			if (process.platform === "darwin" && platform.unmountDmg) {
				// We need to extract the mount path from the executable path
				// Executable path is like: /Volumes/qt-unified-macOS/Qt Unified.app/Contents/MacOS/qt-unified-macOS
				// Mount path is: /Volumes/qt-unified-macOS
				const mountPath = executablePath.split("/").slice(0, 3).join("/")
				await platform.unmountDmg(mountPath)
			}
			
			// Save to cache
			try {
				info("Saving Qt installation to cache...")
				await saveCache([qtRoot], cacheKey)
				info("Qt installation cached successfully")
			} catch (err) {
				logError(`Failed to cache Qt installation: ${err}`)
				// Don't fail the action if caching fails
			}
		}
		
		// Export Qt to PATH
		const versionParts = qtVersion.replace("qt", "").split("-")
		const versionNumber = versionParts[0] ?? qtVersion
		await exportQtPath(versionNumber, effectiveCompiler)
		
		info("Qt setup completed successfully!")
	} catch (err) {
		logError(`Qt setup failed: ${err}`)
		throw err
	}
}
