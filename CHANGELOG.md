# Changelog

All notable changes to opencode-obsidian are documented here.

## [Unreleased]

### Changed
- README now instructs installation via `oo-setup` CLI wizard
- Vault README simplified to minimal reference pointer
- Removed deprecated multi-platform installer references from documentation

## v1.1.0 (2026-02-XX)

### Added
- Azure DevOps shortcuts: `>oo azure`, `>oo deliver`, `>oo comment`, `>oo subtask`, `>oo hours`
- `oo-setup` CLI wizard with XDG config support
- Command prefix migration to `>oo` (e.g., `>oo help`, `>oo cap`, `>oo find`)
- Full Azure DevOps integration with delivery documents, task creation, and time tracking

### Removed
- Legacy installer scripts (use `oo-setup` instead)

## v1.0.0 (2026-02-06)

### Added
- Initial release with RAG capabilities (LanceDB)
- 7 pre-defined templates for various workflows
- Obsidian vault integration
