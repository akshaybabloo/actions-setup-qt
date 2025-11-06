import { info, error as logError, exportVariable, addPath } from "@actions/core"
import { restoreCache, saveCache } from "@actions/cache"
import { exec } from "@actions/exec"
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
 * Install additional modules using MaintenanceTool
 */
async function installAdditionalModules(
	qtRoot: string,
	username: string,
	password: string,
	modules: string,
): Promise<void> {
	info(`Installing additional modules: ${modules}`)
	
	// Determine MaintenanceTool path based on platform
	let maintenanceToolPath: string
	
	if (process.platform === "win32") {
		maintenanceToolPath = path.join(qtRoot, "MaintenanceTool.exe")
	} else if (process.platform === "darwin") {
		// On macOS, MaintenanceTool is an .app bundle
		maintenanceToolPath = path.join(qtRoot, "MaintenanceTool.app", "Contents", "MacOS", "MaintenanceTool")
	} else {
		// Linux and other Unix-like systems
		maintenanceToolPath = path.join(qtRoot, "MaintenanceTool")
	}
	
	// Check if MaintenanceTool exists
	try {
		await fs.access(maintenanceToolPath)
	} catch (err) {
		throw new Error(`MaintenanceTool not found at ${maintenanceToolPath}. Ensure Qt is installed first.`)
	}
	
	// Split modules by comma or space
	const moduleList = modules.split(/[,\s]+/).filter((m) => m.length > 0)
	
	if (moduleList.length === 0) {
		info("No modules to install")
		return
	}
	
	// Build arguments for MaintenanceTool
	const args = [
		"install",
		...moduleList,
		"--email",
		username,
		"--password",
		password,
		"--accept-licenses",
		"--accept-obligations",
		"--default-answer",
		"--confirm-command",
		"--auto-answer",
		"telemetry-question=No",
	]
	
	try {
		info(`Running MaintenanceTool to install: ${moduleList.join(", ")}`)
		await exec(maintenanceToolPath, args)
		info("Additional modules installed successfully")
		
		// Add Qt Tools to PATH if modules were installed
		await addQtToolsToPATH(qtRoot, moduleList)
	} catch (err) {
		logError(`Failed to install additional modules: ${err}`)
		throw err
	}
}

/**
 * Add Qt Tools to PATH (e.g., for QtIFW binarycreator)
 */
async function addQtToolsToPATH(qtRoot: string, modules: string[]): Promise<void> {
	const toolsPath = path.join(qtRoot, "Tools")
	
	try {
		await fs.access(toolsPath)
	} catch (err) {
		info(`Tools directory not found at ${toolsPath}, skipping PATH addition`)
		return
	}
	
	// Check if any IFW modules were installed
	const ifwModules = modules.filter((m) => m.includes("ifw"))
	
	if (ifwModules.length > 0) {
		try {
			const toolsDirs = await fs.readdir(toolsPath)
			const ifwDir = toolsDirs.find((dir) => dir.startsWith("QtInstallerFramework"))
			
			if (ifwDir) {
				// QtInstallerFramework has version subdirectories like 4.10, 4.8, etc.
				const ifwBasePath = path.join(toolsPath, ifwDir)
				const versionDirs = await fs.readdir(ifwBasePath)
				
				// Find the first version directory (should typically be just one)
				for (const versionDir of versionDirs) {
					const ifwBinPath = path.join(ifwBasePath, versionDir, "bin")
					
					try {
						await fs.access(ifwBinPath)
						addPath(ifwBinPath)
						info(`Added QtInstallerFramework to PATH: ${ifwBinPath}`)
						break // Only add the first valid bin path found
					} catch (err) {
						// Try next version directory
						continue
					}
				}
			}
		} catch (err) {
			info(`Could not read Tools directory: ${err}`)
		}
	}
}

/**
 * Export Qt to PATH and set Qt environment variables
 */
async function exportQtPath(version: string, compiler: string, qtRoot: string): Promise<void> {
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
	
	// Build paths
	const qtInstallDir = path.join(qtRoot, actualVersionDir, compiler)
	const qtBinPath = path.join(qtInstallDir, "bin")
	const qtToolsPath = path.join(qtRoot, "Tools")
	const qtPluginPath = path.join(qtInstallDir, "plugins")
	const qmlImportPath = path.join(qtInstallDir, "qml")

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

		// Export Qt-specific environment variables
		exportVariable("IQTA_TOOLS", qtToolsPath)
		exportVariable("QT_ROOT_DIR", qtInstallDir)
		exportVariable("QT_PLUGIN_PATH", qtPluginPath)
		exportVariable("QML2_IMPORT_PATH", qmlImportPath)

		info("Qt successfully added to PATH")
		info(`Exported environment variables:`)
		info(`  IQTA_TOOLS: ${qtToolsPath}`)
		info(`  QT_ROOT_DIR: ${qtInstallDir}`)
		info(`  QT_PLUGIN_PATH: ${qtPluginPath}`)
		info(`  QML2_IMPORT_PATH: ${qmlImportPath}`)
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
	enableCache = true,
	installDir?: string,
	modules?: string,
): Promise<void> {
	try {
		info("Starting Qt setup...")
		
		const homeDir = os.homedir()
		const qtRoot = installDir || path.join(homeDir, "Qt")
		
		info(`Qt will be installed to: ${qtRoot}`)
		
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
		
		// Install platform-specific dependencies first
		if (installDeps) {
			// For other platforms, only install if explicitly requested
			await platform.setupDependencies()
		}
		
		// Try to restore from cache
		let cacheRestored = false
		if (enableCache) {
			cacheRestored = (await restoreCache([qtRoot], cacheKey)) !== undefined
		} else {
			info("Cache is disabled, skipping cache restoration")
		}
		
		if (cacheRestored) {
			info("Qt installation restored from cache")
		} else {
			info("Qt installation not found in cache, proceeding with installation...")
			
			// Get installer configuration
			const config = platform.getInstallerConfig()
			
			// Download installer
			const installerPath = await downloadInstaller(config.url)
			
			// Prepare installer for execution (platform-specific)
			const executablePath = await platform.prepareInstaller(installerPath)
			
			// Run installer
			await runInstaller(executablePath, username, password, qtVersion, qtRoot)
			
			// Cleanup: Unmount DMG if on macOS
			if (process.platform === "darwin" && platform.unmountDmg) {
				// We need to extract the mount path from the executable path
				// Executable path is like: /Volumes/qt-unified-macOS/Qt Unified.app/Contents/MacOS/qt-unified-macOS
				// Mount path is: /Volumes/qt-unified-macOS
				const mountPath = executablePath.split("/").slice(0, 3).join("/")
				await platform.unmountDmg(mountPath)
			}
			
			// Install additional modules if specified (before caching)
			if (modules && modules.trim().length > 0) {
				await installAdditionalModules(qtRoot, username, password, modules)
			}
			
			// Save to cache
			if (enableCache) {
				try {
					info("Saving Qt installation to cache...")
					await saveCache([qtRoot], cacheKey)
					info("Qt installation cached successfully")
				} catch (err) {
					logError(`Failed to cache Qt installation: ${err}`)
					// Don't fail the action if caching fails
				}
			} else {
				info("Cache is disabled, skipping cache save")
			}
		}
		
		// Export Qt to PATH
		const versionNumber = extractVersionNumber(qtVersion)
		info(`Extracted version number: ${versionNumber} from ${qtVersion}`)
		await exportQtPath(versionNumber, effectiveCompiler, qtRoot)
		
		info("Qt setup completed successfully!")
	} catch (err) {
		logError(`Qt setup failed: ${err}`)
		throw err
	}
}
