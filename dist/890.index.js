export const id = 890;
export const ids = [890];
export const modules = {

/***/ 32890:
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getDefaultCompiler: () => (/* binding */ getDefaultCompiler),
/* harmony export */   getInstallerConfig: () => (/* binding */ getInstallerConfig),
/* harmony export */   prepareInstaller: () => (/* binding */ prepareInstaller),
/* harmony export */   setupDependencies: () => (/* binding */ setupDependencies)
/* harmony export */ });
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(37484);
/* harmony import */ var _actions_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_actions_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(95236);
/* harmony import */ var _actions_exec__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_actions_exec__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _common_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(92363);



/**
 * Get the appropriate Qt online installer configuration for Linux
 */
function getInstallerConfig() {
    const arch = process.arch;
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.debug)(`Detected Linux platform, architecture: ${arch}`);
    if (arch === "arm64") {
        return {
            url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-linux-arm64-online.run",
            needsMount: false,
        };
    }
    return {
        url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-linux-x64-online.run",
        needsMount: false,
    };
}
/**
 * Install Linux dependencies required for Qt
 */
async function setupDependencies() {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Installing Linux dependencies...");
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
    ];
    try {
        // Update apt cache
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("sudo", ["apt-get", "update"]);
        // Install packages
        await (0,_actions_exec__WEBPACK_IMPORTED_MODULE_1__.exec)("sudo", ["apt-get", "install", "-y", ...packages]);
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Linux dependencies installed successfully");
    }
    catch (err) {
        (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.error)(`Failed to install Linux dependencies: ${err}`);
        throw err;
    }
}
/**
 * Get the default compiler for Linux
 */
function getDefaultCompiler() {
    return "gcc_64"; // or "gcc_arm64" for ARM
}
/**
 * Prepare the installer for execution on Linux
 * This makes the installer executable
 */
async function prepareInstaller(installerPath) {
    await (0,_common_js__WEBPACK_IMPORTED_MODULE_2__/* .makeExecutable */ .dF)(installerPath);
    return installerPath;
}


/***/ })

};
