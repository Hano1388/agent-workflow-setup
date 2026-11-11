# Shared workflow guide

- Read repository instructions and agent-workflow.config.json before acting. Resolve a conflict with the user rather than overriding team rules.
- Confirm the task and what success means. Ask only for details that block progress.
- Search filenames or symbols before reading files. Read the relevant package, not the whole monorepo.
- Use scripts for predictable work. No parallel agents unless requested.
- Keep changes focused. Do not reset, stash, discard, commit, push, or publish automatically.
- Do not print secrets or read .env files unless the task requires specific settings.
- Review dependencies, migrations and public API changes with the user before changing them.
- Report findings and verification briefly. A check not run is not a pass.
- Follow normal editor tool approvals. Prompt instructions do not enforce permissions.
