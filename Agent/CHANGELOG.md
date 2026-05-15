# Changelog

All notable changes to sentinel-logs-agent will be documented in this file.

## [1.0.4] - 2026-05-14

### Added
- **Diagnostic tool** (`siem-agent-diagnose`) for troubleshooting connectivity issues
  - Tests network connectivity (ping, port checks)
  - Tests backend API health
  - Tests authentication with API key
  - Tests log ingestion endpoint
  - Shows pending logs count
  - Provides actionable troubleshooting steps
- Comprehensive connectivity troubleshooting guide

### Improved
- Better error messages for connectivity issues
- Enhanced documentation for remote agent deployment

## [1.0.3] - 2026-05-13

### Changed
- Updated repository URLs to correct GitHub organization
- Updated NPM package name references
- Improved README documentation

## [1.0.2] - 2026-05-12

### Fixed
- SSL certificate handling for self-signed certificates
- Authentication header changed from `Authorization: Bearer` to `x-api-key`

## [1.0.1] - 2026-05-12

### Added
- Initial NPM release
- Cross-platform support (Linux, Windows, macOS)
- Real-time log monitoring
- Offline log caching and retry mechanism
- Heartbeat functionality
- Systemd service support

## [1.0.0] - 2026-05-10

### Added
- Initial release
- Basic log collection functionality
- File watching with chokidar
- HTTP/HTTPS log transmission
- Configuration management
