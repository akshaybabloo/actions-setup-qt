import { info, error as logError, exportVariable, addPath } from "@actions/core"
import { restoreCache, saveCache } from "@actions/cache"
import { promises as fs } from "node:fs"
import * as path from "node:path"
import * as os from "node:os"
import { downloadInstaller, runInstaller, getCacheKey } from "./platforms/common.js"
import { getPlatformModule } from "./platforms/index.js"

/**
 * Extract the version number from various Qt version string formats
 */
function extractVersionNumber(qtVersion: string): string {
	// Handle package format: qt.qt6.6100.win64_msvc2022_64 -> 6.10.0
	if (qtVersion.startsWith("qt.qt6.")) {
		const match = qtVersion.match(/qt\.qt6\.(\d+)\./)
		if (match && match[1]) {
			const versionNum = match[1]
			// Convert 6100 to 6.10.0
			if (versionNum.length === 4) {
				return `${versionNum[0]}.${versionNum.substring(1, 3)}.${versionNum[3]}`
			}
			// Convert 610 to 6.10.0
			if (versionNum.length === 3) {
				return `${versionNum[0]}.${versionNum.substring(1, 3)}.0`
			}
		}
	}
	
	// Handle simple format: qt6.10.0-full-dev -> 6.10.0
	if (qtVersion.startsWith("qt")) {
		const versionParts = qtVersion.replace(/^qt/, "").split("-")
		return versionParts[0] ?? qtVersion
	}
	
	return qtVersion
}

/**
 * Extract the compiler from the version string if present
 */
function extractCompiler(qtVersion: string): string | undefined {
	// Handle package format: qt.qt6.6100.win64_msvc2022_64 -> msvc2022_64
	// or qt.qt6.6100.win64_mingw_64 -> mingw_64
	if (qtVersion.includes("msvc")) {
		const match = qtVersion.match(/(msvc\d+_\d+)/)
		if (match && match[1]) {
			return match[1]
		}
	}
	
	if (qtVersion.includes("mingw")) {
		const match = qtVersion.match(/(mingw_\d+)/)
		if (match && match[1]) {
			return match[1]
		}
	}
	
	return undefined
}

/**
 * Export Qt to PATH
 */
async function exportQtPath(version: string, compiler: string): Promise<void> {
	const homeDir = os.homedir()
	const qtRoot = path.join(homeDir, "Qt")

	info(`Looking for Qt version ${version} in ${qtRoot}`)

	// Find the actual version directory, e.g., 6.10.0, 6.10, or a variation
	const majorVersion = version.split(".").slice(0, 2).join(".") // e.g., "6.10"
	const qtVersionDirs = await fs.readdir(qtRoot)
	info(`Available Qt directories: ${qtVersionDirs.join(", ")}`)
	info(`Looking for directory starting with: ${majorVersion}`)
	
	const actualVersionDir = qtVersionDirs.find((dir) => dir.startsWith(majorVersion))

	if (!actualVersionDir) {
		throw new Error(`Could not find Qt installation directory for version ${version} in ${qtRoot}. Available directories: ${qtVersionDirs.join(", ")}`)
	}

	info(`Found Qt version directory: ${actualVersionDir}`)
	
	// List available compilers in the version directory
	const versionPath = path.join(qtRoot, actualVersionDir)
	const availableCompilers = await fs.readdir(versionPath)
	info(`Available items in ${actualVersionDir}: ${availableCompilers.join(", ")}`)
	
	const qtBinPath = path.join(qtRoot, actualVersionDir, compiler, "bin")

	info(`Looking for Qt bin path: ${qtBinPath}`)

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
		logError(`Path does not exist: ${qtBinPath}`)
		logError(`Available items in version directory: ${availableCompilers.join(", ")}`)
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
		
		// Extract compiler from version string if present (for package format like qt.qt6.6100.win64_msvc2022_64)
		const versionCompiler = extractCompiler(qtVersion)
		
		// Get effective compiler: user-specified > extracted from version > platform default
		const effectiveCompiler = compiler ?? versionCompiler ?? platform.getDefaultCompiler()
		info(`Using compiler: ${effectiveCompiler}`)
		
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
		const versionNumber = extractVersionNumber(qtVersion)
		info(`Extracted version number: ${versionNumber} from ${qtVersion}`)
		await exportQtPath(versionNumber, effectiveCompiler)
		
		info("Qt setup completed successfully!")
	} catch (err) {
		logError(`Qt setup failed: ${err}`)
		throw err
	}
}
