import { info, error as logError } from "@actions/core"
import { downloadTool } from "@actions/tool-cache"
import { exec } from "@actions/exec"
import { promises as fs } from "node:fs"
import * as path from "node:path"
import * as os from "node:os"

export interface QtInstallerConfig {
	url: string
	needsMount: boolean
	mountPath?: string
	executable?: string
}

/**
 * Download the Qt online installer
 */
export async function downloadInstaller(url: string): Promise<string> {
	info(`Downloading Qt installer from ${url}`)
	try {
		const installerPath = await downloadTool(url)
		info(`Installer downloaded to: ${installerPath}`)

		if (process.platform === "win32") {
			const newPath = `${installerPath}.exe`
			info(`Renaming installer to: ${newPath}`)
			await fs.rename(installerPath, newPath)
			return newPath
		}

		return installerPath
	} catch (err) {
		logError(`Failed to download installer: ${err}`)
		throw err
	}
}

/**
 * Run the Qt installer with the specified parameters
 */
export async function runInstaller(
	installerPath: string,
	username: string,
	password: string,
	qtVersion = "qt6.10.0-full-dev",
): Promise<void> {
	const homeDir = os.homedir()
	const qtRoot = path.join(homeDir, "Qt")
	
	info(`Running Qt installer...`)
	info(`Qt will be installed to: ${qtRoot}`)
	
	const args = [
		"install",
		qtVersion,
		"--email",
		username,
		"--password",
		password,
		"--root",
		qtRoot,
		"--accept-licenses",
		"--accept-obligations",
		"--default-answer",
		"--confirm-command",
		"--auto-answer",
		"telemetry-question=No",
	]
	
	try {
		await exec(installerPath, args)
		info("Qt installation completed successfully")
	} catch (err) {
		logError(`Failed to run installer: ${err}`)
		throw err
	}
}

/**
 * Generate cache key for Qt installation
 */
export function getCacheKey(qtVersion: string, compiler: string): string {
	const platform = process.platform
	const arch = process.arch
	return `qt-${qtVersion}-${platform}-${arch}-${compiler}`
}

/**
 * Make installer executable on Unix-like systems
 */
export async function makeExecutable(filePath: string): Promise<void> {
	if (process.platform !== "win32") {
		info(`Making installer executable: ${filePath}`)
		try {
			await fs.chmod(filePath, 0o755)
		} catch (err) {
			logError(`Failed to make installer executable: ${err}`)
			throw err
		}
	}
}
