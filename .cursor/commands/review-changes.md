# Review current changes
Read tools/agent-workflow/guide.md.
Start with git status --short, git diff --stat, git diff and git diff --cached. Use --no-ext-diff for diff commands.
Review staged and unstaged tracked changes. List untracked files and open only task-related text files, excluding secrets, binaries and generated files.
If the user asks for the whole feature branch, compare against the configured base instead and state that scope explicitly.
Read surrounding code only where needed. Prioritize real bugs, missed cases and missing tests. Report at most five actionable findings with file and line references, reasoning and a suggested fix. If none, say so and identify testing gaps.
Do not modify files or repeat the entire diff in chat.
