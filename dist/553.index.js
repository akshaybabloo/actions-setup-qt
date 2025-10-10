export const id = 553;
export const ids = [553];
export const modules = {

/***/ 84553:
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

/**
 * Get the appropriate Qt online installer configuration for Windows
 */
function getInstallerConfig() {
    const arch = process.arch;
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.debug)(`Detected Windows platform, architecture: ${arch}`);
    if (arch === "arm64") {
        return {
            url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-windows-arm64-online.exe",
            needsMount: false,
        };
    }
    return {
        url: "https://download.qt.io/official_releases/online_installers/qt-online-installer-windows-x64-online.exe",
        needsMount: false,
    };
}
/**
 * Setup Windows MSVC environment
 */
async function setupDependencies() {
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Windows MSVC environment will be set up separately using TheMrMilchmann/setup-msvc-dev@v4");
    (0,_actions_core__WEBPACK_IMPORTED_MODULE_0__.info)("Please ensure you have added the setup-msvc-dev action before this action in your workflow");
}
/**
 * Get the default compiler for Windows
 */
function getDefaultCompiler() {
    return "msvc2022_64"; // or "msvc2022_arm64" for ARM
}
/**
 * Prepare the installer for execution on Windows
 */
async function prepareInstaller(installerPath) {
    // Windows executables don't need special preparation
    return installerPath;
}


/***/ })

};
