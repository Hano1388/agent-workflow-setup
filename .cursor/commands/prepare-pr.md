# Prepare a pull request draft
Read tools/agent-workflow/guide.md and agent-workflow.config.json.
Inspect the current branch, git status and the diff against the configured remote base. Use --no-ext-diff for diff commands. Do not fetch unless the user requests updated remote data; disclose that local remote-tracking refs may be stale.
If the remote base ref is missing, ask the user to fetch it. Include uncommitted changes in a separate clearly labeled note, not as committed work.
Draft a concise title, purpose, behavior changes, verification evidence and remaining limitations. If tests were not run in this task, say so. Do not invent results.
Return the draft in chat. Do not commit, push, open a PR or send anything.
