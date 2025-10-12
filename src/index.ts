import { getInput, setFailed, info } from "@actions/core"
import { setupQt } from "./setup-qt.js"

async function run(): Promise<void> {
	try {
		// Get inputs from action.yml
		const username = getInput("username", { required: true })
		const password = getInput("password", { required: true })
		const qtVersion = getInput("version") || "qt6.10.0-full-dev"
		const compiler = getInput("compiler") // Optional compiler specification
		const installDeps = getInput("install-deps") === "true"
		
		info(`Setting up Qt ${qtVersion}`)
		
		// Run the Qt setup
		await setupQt(username, password, qtVersion, compiler || undefined, installDeps)
	} catch (error) {
		if (error instanceof Error) {
			setFailed(error.message)
		} else {
			setFailed("An unknown error occurred during Qt setup")
		}
	}
}

run()
