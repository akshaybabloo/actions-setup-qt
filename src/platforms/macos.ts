import { debug, info, error as logError } from "@actions/core"
import { exec } from "@actions/exec"
import { promises as fs } from "node:fs"
import * as path from "node:path"
import type { QtInstallerConfig } from "./common.js"

/**
 * Get the appropriate Qt online installer configuration for macOS
 */
export function getInstallerConfig(): QtInstallerConfig {
	debug("Detected macOS platform")

	return {
		url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-mac-x64-online.dmg",
		needsMount: true,
	}
}

/**
 * Mount DMG file on macOS and return the mount path
 */
async function mountDmg(dmgPath: string): Promise<string> {
	info("Mounting DMG file...")
	
	try {
		// Mount the DMG
		await exec("hdiutil", ["attach", dmgPath, "-nobrowse"])
		
		// Find the mounted volume - it should be under /Volumes/
		const volumesDir = "/Volumes"
		const volumes = await fs.readdir(volumesDir)
		
		// Look for the Qt installer volume (can be qt-unified-macOS or qt-online-installer-macOS)
		const qtVolume = volumes.find((vol) => 
			vol.includes("qt-unified-macOS") || 
			vol.includes("qt-online-installer-macOS")
		)
		
		if (!qtVolume) {
			throw new Error("Could not find mounted Qt installer volume")
		}
		
		const mountPath = path.join(volumesDir, qtVolume)
		info(`DMG mounted at: ${mountPath}`)
		
		return mountPath
	} catch (err) {
		logError(`Failed to mount DMG: ${err}`)
		throw err
	}
}

/**
 * Unmount DMG file on macOS
 */
export async function unmountDmg(mountPath: string): Promise<void> {
	info("Unmounting DMG file...")
	try {
		await exec("hdiutil", ["detach", mountPath])
		info("DMG unmounted successfully")
	} catch (err) {
		logError(`Failed to unmount DMG: ${err}`)
	}
}

/**
 * Find the Qt installer executable in the mounted DMG
 */
async function findMacInstaller(mountPath: string): Promise<string> {
	try {
		// Read the contents of the mount path
		const files = await fs.readdir(mountPath)
		info(`Files in mount path: ${files.join(", ")}`)

		// Find the .app file
		const appFile = files.find((file) => file.endsWith(".app"))
        info(`Found .app file: ${appFile}`)
		
		if (!appFile) {
			throw new Error("Could not find Qt installer .app in mounted volume")
		}
		
		// The actual executable is inside Contents/MacOS/
		const appPath = path.join(mountPath, appFile)
		const contentsDir = await fs.readdir(path.join(appPath, "Contents", "MacOS"))
        info(`Contents/MacOS files: ${contentsDir.join(", ")}`)
		const executable = contentsDir.find(
			(file) => file.includes("qt-unified-macOS") || file.includes("qt-online-installer"),
		)
        info(`Found executable: ${executable}`)
		
		if (!executable) {
			throw new Error("Could not find Qt installer executable")
		}
		
		const executablePath = path.join(appPath, "Contents", "MacOS", executable)
		info(`Found installer executable: ${executablePath}`)
		
		return executablePath
	} catch (err) {
		logError(`Failed to find Mac installer: ${err}`)
		throw err
	}
}

/**
 * Install macOS dependencies required for Qt
 */
export async function setupDependencies(): Promise<void> {
	info("Checking Xcode installation...")
	
	try {
		// Check if Xcode command line tools are installed
		await exec("xcode-select", ["-p"])
		info("Xcode command line tools already installed")
	} catch (err) {
		info("Installing Xcode command line tools...")
		try {
			await exec("xcode-select", ["--install"])
			info("Xcode command line tools installed successfully")
		} catch (installErr) {
			logError(`Failed to install Xcode command line tools: ${installErr}`)
			throw installErr
		}
	}
}

/**
 * Get the default compiler for macOS
 */
export function getDefaultCompiler(): string {
	return "macos"
}

/**
 * Prepare the installer for execution on macOS
 * This mounts the DMG and finds the executable
 */
export async function prepareInstaller(installerPath: string): Promise<string> {
	const mountPath = await mountDmg(installerPath)
	const executablePath = await findMacInstaller(mountPath)
	return executablePath
}
