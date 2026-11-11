# Verify the project
Read tools/agent-workflow/guide.md and the verifyCommands list in agent-workflow.config.json.
Show the configured commands. If empty, ask which checks the team uses and stop. Never invent a pass.
Run from the repository root: node tools/agent-workflow/verify.mjs
Summarize each check as passed, failed or not run. Explain the first useful failure without pasting the full log. Do not change code, install packages or keep retrying automatically.
