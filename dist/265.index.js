export const id = 265;
export const ids = [265];
export const modules = {

/***/ 88265:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultCompiler: () => (/* binding */ getDefaultCompiler),
/* harmony export */   getInstallerConfig: () => (/* binding */ getInstallerConfig),
/* harmony export */   prepareInstaller: () => (/* binding */ prepareInstaller),
/* harmony export */   setupDependencies: () => (/* binding */ setupDependencies),
/* harmony export */   unmountDmg: () => (/* binding */ unmountDmg)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(37484);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(95236);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_actions_exec__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(73024);
/* harmony import */ var node_fs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(node_fs__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(76760);
/* harmony import */ var node_path__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(node_path__WEBPACK_IMPORTED_MODULE_3__);




/**
 * Get the appropriate Qt online installer configuration for macOS
 */
function getInstallerConfig() {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.debug)("Detected macOS platform");
    return {
        url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-mac-x64-online.dmg",
        needsMount: true,
    };
}
/**
 * Mount DMG file on macOS and return the mount path
 */
async function mountDmg(dmgPath) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Mounting DMG file...");
    try {
        // Mount the DMG
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("hdiutil", ["attach", dmgPath, "-nobrowse"]);
        // Find the mounted volume - it should be under /Volumes/
        const volumesDir = "/Volumes";
        const volumes = await node_fs__WEBPACK_IMPORTED_MODULE_2__.promises.readdir(volumesDir);
        // Look for the Qt installer volume (can be qt-unified-macOS or qt-online-installer-macOS)
        const qtVolume = volumes.find((vol) => vol.includes("qt-unified-macOS") ||
            vol.includes("qt-online-installer-macOS"));
        if (!qtVolume) {
            throw new Error("Could not find mounted Qt installer volume");
        }
        const mountPath = node_path__WEBPACK_IMPORTED_MODULE_3__.join(volumesDir, qtVolume);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`DMG mounted at: ${mountPath}`);
        return mountPath;
    }
    catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.error)(`Failed to mount DMG: ${err}`);
        throw err;
    }
}
/**
 * Unmount DMG file on macOS
 */
async function unmountDmg(mountPath) {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Unmounting DMG file...");
    try {
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("hdiutil", ["detach", mountPath]);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("DMG unmounted successfully");
    }
    catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.error)(`Failed to unmount DMG: ${err}`);
    }
}
/**
 * Find the Qt installer executable in the mounted DMG
 */
async function findMacInstaller(mountPath) {
    try {
        // Read the contents of the mount path
        const files = await node_fs__WEBPACK_IMPORTED_MODULE_2__.promises.readdir(mountPath);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`Files in mount path: ${files.join(", ")}`);
        // Find the .app file
        const appFile = files.find((file) => file.endsWith(".app"));
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`Found .app file: ${appFile}`);
        if (!appFile) {
            throw new Error("Could not find Qt installer .app in mounted volume");
        }
        // The actual executable is inside Contents/MacOS/
        const appPath = node_path__WEBPACK_IMPORTED_MODULE_3__.join(mountPath, appFile);
        const contentsDir = await node_fs__WEBPACK_IMPORTED_MODULE_2__.promises.readdir(node_path__WEBPACK_IMPORTED_MODULE_3__.join(appPath, "Contents", "MacOS"));
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`Contents/MacOS files: ${contentsDir.join(", ")}`);
        const executable = contentsDir.find((file) => file.includes("qt-unified-macOS") || file.includes("qt-online-installer"));
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`Found executable: ${executable}`);
        if (!executable) {
            throw new Error("Could not find Qt installer executable");
        }
        const executablePath = node_path__WEBPACK_IMPORTED_MODULE_3__.join(appPath, "Contents", "MacOS", executable);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)(`Found installer executable: ${executablePath}`);
        return executablePath;
    }
    catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.error)(`Failed to find Mac installer: ${err}`);
        throw err;
    }
}
/**
 * Install macOS dependencies required for Qt
 */
async function setupDependencies() {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Checking Xcode installation...");
    try {
        // Check if Xcode command line tools are installed
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("xcode-select", ["-p"]);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Xcode command line tools already installed");
    }
    catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Installing Xcode command line tools...");
        try {
            await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("xcode-select", ["--install"]);
            (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Xcode command line tools installed successfully");
        }
        catch (installErr) {
            (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.error)(`Failed to install Xcode command line tools: ${installErr}`);
            throw installErr;
        }
    }
}
/**
 * Get the default compiler for macOS
 */
function getDefaultCompiler() {
    return "macos";
}
/**
 * Prepare the installer for execution on macOS
 * This mounts the DMG and finds the executable
 */
async function prepareInstaller(installerPath) {
    const mountPath = await mountDmg(installerPath);
    const executablePath = await findMacInstaller(mountPath);
    return executablePath;
}


/***/ })

};
