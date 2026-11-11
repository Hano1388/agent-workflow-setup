# AI Workflow Kit

Reusable editor commands for starting features, reviewing changes and preparing PR drafts.
The prompts work across programming languages. Git and verification use small Node.js scripts.
You need Git, Node.js 22 or newer, and a signed-in AI editor. No npm install is needed.
This is a starter kit, not an official Cursor product.

## Start here

## Use the kit in your monorepo

Keep this kit **beside** your monorepo. From the kit folder:

```sh
node scripts/install.mjs ../your-monorepo --editor <your-editor-option> --dry-run
node scripts/install.mjs ../your-monorepo
```

Replace `../your-monorepo` with its real path. Open the monorepo root in Cursor.
Edit `agent-workflow.config.json` for the team's base branch and check commands.
Review and commit the installed files before `/new-feature`, which requires a clean working tree.

Type `/` in Cursor Agent chat and choose a command. Example: `/new-feature add-invoice-search`.
These are AI chat commands, not terminal commands. Cursor may request permission to use its tools.
If a command is not listed, start a new chat or reload the editor. You can also attach its Markdown
file from `.cursor/commands` and ask Agent to follow it. See `docs/setup.md` for version notes.

## Commands

| Command | Purpose |
| --- | --- |
| `/new-feature` | Confirm a branch name, check Git state, fetch the configured base and create a branch. |
| `/plan-feature` | Find relevant files and propose up to five steps. No edits. |
| `/review-changes` | Review current staged, unstaged and relevant untracked changes. No edits. |
| `/verify` | Run the checks configured by the team. |
| `/prepare-pr` | Draft a PR title and description. No pushing or publishing. |
| `/debug-issue` | Investigate evidence and propose a focused fix. |

## Installed structure (Cursor)

```text
your-monorepo/
  .cursor/
    commands/
      new-feature.md
      plan-feature.md
      review-changes.md
      verify.md
      prepare-pr.md
      debug-issue.md
    rules/
      team-workflow.mdc
  tools/agent-workflow/
    guide.md
    new-feature.mjs
    verify.mjs
  agent-workflow.config.json
```

