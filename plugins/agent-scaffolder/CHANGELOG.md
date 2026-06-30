# Changelog

## 1.0.0
- Initial agent-scaffolder skill packaged as a plugin (templates + references included; evals/ excluded).

## 1.1.0

- **ATP Integration:** Added `artemis_transmission_protocol` skill to AgentScaffolder plugins, creating a functional bridge between agent creation and the ATP for standardized communication.
- **Cloud Code Compatibility:** Enhanced compatibility with Claude Code IDE (added `CLAUDE.md` and `GEMINI.md`), ensuring proper plugin loading and user-facing documentation in the IDE.
- **Agent Card System:** Updated `AGENTS.md` to introduce the "Agent Card" system, providing a standardized, human-readable reference for all plugins in the marketplace.
- **Plugin Metadata:** Refined `plugin.json` and `README.md` for clarity, versioning, and marketplace presentation.
- **File Structure:** Added `CHANGELOG.md` for version tracking and `AGENTS.md` for the Agent Card system.

### Changes
- Created `artemis_transmission_protocol` skill directory.
- Modified `plugin.json` to include new dependencies and metadata.
- Updated `README.md` with compatibility information and project overview.
- Created `AGENTS.md` for the Agent Card system.
- Created `CHANGELOG.md` for version tracking.
