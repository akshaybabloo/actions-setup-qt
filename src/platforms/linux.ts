import { debug, info, error as logError } from "@actions/core"
import { exec } from "@actions/exec"
import { makeExecutable } from "./common.js"
import type { QtInstallerConfig } from "./common.js"

/**
 * Get the appropriate Qt online installer configuration for Linux
 */
export function getInstallerConfig(): QtInstallerConfig {
	const arch = process.arch

	debug(`Detected Linux platform, architecture: ${arch}`)

	if (arch === "arm64") {
		return {
			url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-linux-arm64-online.run",
			needsMount: false,
		}
	}
	
	return {
		url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-linux-x64-online.run",
		needsMount: false,
	}
}

/**
 * Install Linux dependencies required for Qt
 */
export async function setupDependencies(): Promise<void> {
	info("Installing Linux dependencies...")
	
	const packages = [
		"libfontconfig1-dev",
		"libfreetype-dev",
		"libgtk-3-dev",
		"libx11-dev",
		"libx11-xcb-dev",
		"libxcb-cursor-dev",
		"libxcb-glx0-dev",
		"libxcb-icccm4-dev",
		"libxcb-image0-dev",
		"libxcb-keysyms1-dev",
		"libxcb-randr0-dev",
		"libxcb-render-util0-dev",
		"libxcb-shape0-dev",
		"libxcb-shm0-dev",
		"libxcb-sync-dev",
		"libxcb-util-dev",
		"libxcb-xfixes0-dev",
		"libxcb-xkb-dev",
		"libxcb1-dev",
		"libxext-dev",
		"libxfixes-dev",
		"libxi-dev",
		"libxkbcommon-dev",
		"libxkbcommon-x11-dev",
		"libxrender-dev",
	]
	
	try {
		// Update apt cache
		await exec("sudo", ["apt-get", "update"])
		
		// Install packages
		await exec("sudo", ["apt-get", "install", "-y", ...packages])
		
		info("Linux dependencies installed successfully")
	} catch (err) {
		logError(`Failed to install Linux dependencies: ${err}`)
		throw err
	}
}

/**
 * Get the default compiler for Linux
 */
export function getDefaultCompiler(): string {
	const arch = process.arch
	
	if (arch === "arm64") {
		return "gcc_arm64"
	}
	
	return "gcc_64"
}

/**
 * Prepare the installer for execution on Linux
 * This makes the installer executable
 */
export async function prepareInstaller(installerPath: string): Promise<string> {
	await makeExecutable(installerPath)
	return installerPath
}
