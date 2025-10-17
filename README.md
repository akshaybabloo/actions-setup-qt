# Setup Qt for GitHub Actions

A GitHub Action to install Qt using the official Qt online installer. This action supports multiple platforms (Linux, macOS, Windows) and architectures (x64, ARM64).

> [!NOTE]
> This action requires a Qt account (username and password) and uses the official Qt online installer. If you prefer a solution that doesn't require authentication, consider using [jurplel/install-qt-action](https://github.com/jurplel/install-qt-action).

## Features

- Supports Linux (x64, ARM64), macOS (x64, ARM64), and Windows (x64, ARM64)
- Automatic architecture detection
- Automatic compiler detection (or manual override)
- Caching support to speed up subsequent runs
- Flexible version specification (simple or package format)
- Optional dependency installation

## Usage

### Basic Example

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Qt
    uses: akshaybabloo/actions-setup-qt@v1
    with:
      username: ${{ secrets.QT_USERNAME }}
      password: ${{ secrets.QT_PASSWORD }}
      version: 'qt6.10.0-full-dev'

  - name: Verify installation
    run: qmake --version
```

### Windows with MSVC

```yaml
steps:
  - name: Setup MSVC
    uses: TheMrMilchmann/setup-msvc-dev@v4
    with:
      arch: x64

  - name: Setup Qt
    uses: akshaybabloo/actions-setup-qt@v1
    with:
      username: ${{ secrets.QT_USERNAME }}
      password: ${{ secrets.QT_PASSWORD }}
      version: 'qt.qt6.6100.win64_msvc2022_64'
```

### macOS with Dependencies

```yaml
steps:
  - name: Setup Qt
    uses: akshaybabloo/actions-setup-qt@v1
    with:
      username: ${{ secrets.QT_USERNAME }}
      password: ${{ secrets.QT_PASSWORD }}
      version: 'qt6.10.0-full-dev'
      install-deps: 'true'
```

### Without Caching

```yaml
steps:
  - name: Setup Qt
    uses: akshaybabloo/actions-setup-qt@v1
    with:
      username: ${{ secrets.QT_USERNAME }}
      password: ${{ secrets.QT_PASSWORD }}
      version: 'qt6.10.0-full-dev'
      cache: 'false'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `username` | Qt Account username/email | Yes | - |
| `password` | Qt Account password | Yes | - |
| `version` | Qt version to install (see [Version Formats](#version-formats)) | No | `qt6.10.0-full-dev` |
| `compiler` | Compiler to use (see [Compilers](#compilers)) | No | Auto-detected |
| `install-deps` | Install platform-specific dependencies | No | `false` |
| `cache` | Enable caching of Qt installation | No | `true` |

## Version Formats

The action supports two version formats:

### Simple Format

```yaml
version: 'qt6.10.0-full-dev'
```

This installs a predefined Qt package. The compiler will be auto-detected based on your platform and architecture.

### Package Format

```yaml
version: 'qt.qt6.6100.win64_msvc2022_64'
```

This installs a specific Qt package. The compiler is automatically extracted from the version string.

Common package formats:

- Windows MSVC: `qt.qt6.6100.win64_msvc2022_64`
- Windows MinGW: `qt.qt6.6100.win64_mingw_64`
- Windows ARM64: `qt.qt6.6100.win64_msvc2022_arm64`

## Compilers

The action automatically detects the appropriate compiler based on your platform and architecture:

| Platform | Architecture | Default Compiler |
|----------|--------------|------------------|
| Linux | x64 | `gcc_64` |
| Linux | ARM64 | `gcc_arm64` |
| macOS | x64/ARM64 | `macos` |
| Windows | x64 | `msvc2022_64` |
| Windows | ARM64 | `msvc2022_arm64` |

### Compiler Detection Priority

The action determines which compiler to use in the following order:

1. **Explicitly specified** via the `compiler` input
2. **Extracted from version string** (for package format like `qt.qt6.6100.win64_msvc2022_64`)
3. **Platform default** (based on OS and architecture)

### When to Specify the Compiler

> [!IMPORTANT]
> When using the simple version format (e.g., `qt6.10.0-full`), the Qt installer may install a different compiler than the platform default. For example, on Windows, `qt6.10.0-full` typically installs MinGW instead of MSVC.

**If the installed compiler doesn't match the default**, you must explicitly specify it:

```yaml
- name: Setup Qt
  uses: akshaybabloo/actions-setup-qt@v1
  with:
    username: ${{ secrets.QT_USERNAME }}
    password: ${{ secrets.QT_PASSWORD }}
    version: 'qt6.10.0-full'
    compiler: 'mingw_64'  # Explicitly specify since the default would be msvc2022_64
```

**Recommended**: Use the package format for explicit control:

```yaml
- name: Setup Qt (MSVC)
  uses: akshaybabloo/actions-setup-qt@v1
  with:
    username: ${{ secrets.QT_USERNAME }}
    password: ${{ secrets.QT_PASSWORD }}
    version: 'qt.qt6.6100.win64_msvc2022_64'  # Compiler is automatically detected from version

- name: Setup Qt (MinGW)
  uses: akshaybabloo/actions-setup-qt@v1
  with:
    username: ${{ secrets.QT_USERNAME }}
    password: ${{ secrets.QT_PASSWORD }}
    version: 'qt.qt6.6100.win64_mingw_64'  # Compiler is automatically detected from version
```

## Caching

By default, the action caches the Qt installation to speed up subsequent workflow runs. The cache key is based on:
- Qt version
- Platform (Linux, macOS, Windows)
- Architecture (x64, ARM64)
- Compiler

To disable caching:

```yaml
- name: Setup Qt
  uses: akshaybabloo/actions-setup-qt@v1
  with:
    username: ${{ secrets.QT_USERNAME }}
    password: ${{ secrets.QT_PASSWORD }}
    version: 'qt6.10.0-full-dev'
    cache: 'false'
```

## Platform-Specific Notes

### Linux

- Dependencies are **automatically installed** on Linux (required for the installer to run)
- Common packages include: `libfontconfig1-dev`, `libfreetype-dev`, `libgtk-3-dev`, etc.

### macOS

- Xcode command line tools are checked and installed if needed
- Use `install-deps: 'true'` to force dependency installation

### Windows

- For MSVC builds, use [TheMrMilchmann/setup-msvc-dev](https://github.com/TheMrMilchmann/setup-msvc-dev) before this action
- MinGW builds don't require additional setup

## Secrets

Store your Qt credentials as GitHub secrets:

1. Go to your repository → Settings → Secrets and variables → Actions
2. Add two secrets:
   - `QT_USERNAME`: Your Qt account email
   - `QT_PASSWORD`: Your Qt account password

## Examples

### Multi-Platform Build Matrix

```yaml
name: Build

on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup MSVC (Windows only)
        if: runner.os == 'Windows'
        uses: TheMrMilchmann/setup-msvc-dev@v4
        with:
          arch: x64
      
      - name: Setup Qt
        uses: akshaybabloo/actions-setup-qt@v1
        with:
          username: ${{ secrets.QT_USERNAME }}
          password: ${{ secrets.QT_PASSWORD }}
          version: 'qt6.10.0-full-dev'
      
      - name: Build
        run: |
          qmake
          make
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

