import { getInput, warning } from "@actions/core"

function getArchCandidates(): string[] {
	// Detect the system architecture and prioritize it
	const systemArch = process.arch

	if (systemArch === "arm64") {
		// On ARM64 systems, try arm64 first, then fallback to x86_64 via emulation
		return ["arm64", "aarch64", "x86_64", "x86"]
	} else if (systemArch === "x64") {
		// On x86_64 systems, try x86_64 first, then x86 for older packages
		return ["x86_64", "x86", "arm64"]
	} else if (systemArch === "ia32") {
		// On 32-bit x86 systems, only try x86
		return ["x86", "x86_64"]
	} else {
		// For other architectures, try in order of likelihood
		warning(`Unknown architecture ${systemArch}, defaulting to standard order`)
		return ["x86_64", "arm64", "x86"]
	}
}

function run() {}

run()
