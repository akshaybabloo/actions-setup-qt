# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A GitHub Action that installs Qt using the official Qt online installer. It supports Linux (x64/ARM64), macOS (x64/ARM64), and Windows (x64/ARM64) with automatic architecture/compiler detection, caching, and optional module installation.

## Build & Development Commands

- **Build**: `npm run build` — uses `@vercel/ncc` to bundle `src/index.ts` into `dist/index.js`
- **Format**: `npm run fmt` — runs Biome formatter
- **No test suite** — the `test` script is a placeholder. Testing is done via the CI workflow (`.github/workflows/test.yml`) which runs the action on all supported platforms.

The `dist/` directory is committed and must be rebuilt (`npm run build`) after any source changes.

## Architecture

Entry point: `src/index.ts` reads action inputs and calls `setupQt()`.

Core logic in `src/setup-qt.ts`:
- Parses two version formats: simple (`qt6.10.0-full-dev`) and package (`qt.qt6.6100.win64_msvc2022_64`)
- Compiler resolution priority: user-specified > extracted from version string > platform default
- Handles cache restore/save around installation
- Exports environment variables (`QT_ROOT_DIR`, `IQTA_TOOLS`, `QT_PLUGIN_PATH`, `QML2_IMPORT_PATH`) and adds Qt bin to PATH
- Supports post-install module installation via `MaintenanceTool`

Platform modules (`src/platforms/`): each platform exports the `PlatformModule` interface (defined in `index.ts`) with: `getInstallerConfig`, `setupDependencies`, `getDefaultCompiler`, `prepareInstaller`, and optionally `unmountDmg` (macOS only). Platform is selected at runtime via dynamic import in `getPlatformModule()`.

Key platform differences:
- **Linux**: downloads `.run` file, makes it executable
- **macOS**: downloads `.dmg`, mounts it, finds the `.app` executable inside, unmounts after install
- **Windows**: downloads `.exe` directly, renames downloaded file to add `.exe` extension

## Code Style

- Biome with tabs, double quotes, no semicolons (ASI)
- TypeScript with ESM (`"type": "module"`, `.js` extensions in imports)
- Strict TypeScript (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
