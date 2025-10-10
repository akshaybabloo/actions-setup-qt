import { debug, info } from "@actions/core"
import type { QtInstallerConfig } from "./common.js"

/**
 * Get the appropriate Qt online installer configuration for Windows
 */
export function getInstallerConfig(): QtInstallerConfig {
	const arch = process.arch

	debug(`Detected Windows platform, architecture: ${arch}`)

	if (arch === "arm64") {
		return {
			url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-windows-arm64-online.exe",
			needsMount: false,
		}
	}
	
	return {
		url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-windows-x64-online.exe",
		needsMount: false,
	}
}

/**
 * Setup Windows MSVC environment
 */
export async function setupDependencies(): Promise<void> {
	info("Windows MSVC environment will be set up separately using TheMrMilchmann/setup-msvc-dev@v4")
	info("Please ensure you have added the setup-msvc-dev action before this action in your workflow")
}

/**
 * Get the default compiler for Windows
 */
export function getDefaultCompiler(): string {
	return "msvc2022_64" // or "msvc2022_arm64" for ARM
}

/**
 * Prepare the installer for execution on Windows
 */
export async function prepareInstaller(installerPath: string): Promise<string> {
	// Windows executables don't need special preparation
	return installerPath
}
