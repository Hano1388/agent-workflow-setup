#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';

function git(args, cwd, timeout = 15000) {
  return execFileSync('git', args, { cwd, encoding: 'utf8', timeout, maxBuffer: 1024 * 1024, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' }, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Use: node tools/agent-workflow/new-feature.mjs --check|--create --name short-suffix');
  } else {
    const mode = args[0];
    if (!['--check', '--create'].includes(mode) || args.length !== 3 || args[1] !== '--name') throw Error('Specify --check or --create and --name SUFFIX.');
    const suffix = args[2];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(suffix) || suffix.length > 80) throw Error('Use a lowercase hyphenated suffix of at most 80 characters.');
    const root = git(['rev-parse', '--show-toplevel'], process.cwd());
    if (realpathSync(process.cwd()) !== realpathSync(root)) throw Error('Run this command from the Git repository root.');
    const cfg = JSON.parse(readFileSync(resolve(root, 'agent-workflow.config.json'), 'utf8'));
    const { remote, baseBranch, branchPrefix } = cfg;
    if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(remote || '')) throw Error('Set a valid remote name in agent-workflow.config.json.');
    if (typeof baseBranch !== 'string' || baseBranch.startsWith('-')) throw Error('Set the team baseBranch in agent-workflow.config.json.');
    git(['check-ref-format', '--branch', baseBranch], root);
    if (!/^[a-z0-9][a-z0-9/-]*$/.test(branchPrefix || '')) throw Error('Set a lowercase branchPrefix in the config.');
    const name = `${branchPrefix}/${suffix}`;
    git(['check-ref-format', '--branch', name], root);
    git(['rev-parse', '--verify', 'HEAD'], root);
    git(['remote', 'get-url', remote], root);
    function clean() {
      if (git(['status', '--porcelain=v1', '--untracked-files=normal'], root)) throw Error('Working tree is not clean. Commit or save your changes yourself, then retry.');
      for (const state of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer', 'index.lock']) {
        if (existsSync(resolve(root, git(['rev-parse', '--git-path', state], root)))) throw Error('A Git operation is in progress. Finish it before creating a branch.');
      }
    }
    clean();
    const branches = git(['for-each-ref', '--format=%(refname:short)', 'refs/heads/'], root).split('\n');
    if (branches.includes(name)) throw Error(`Branch already exists: ${name}`);
    if (mode === '--check') {
      console.log(`Ready: ${name} from ${remote}/${baseBranch}. No fetch or branch change performed.`);
    } else {
      git(['fetch', '--no-tags', '--', remote, `+refs/heads/${baseBranch}:refs/remotes/${remote}/${baseBranch}`], root, 60000);
      clean();
      git(['switch', '--no-track', '-c', name, `${remote}/${baseBranch}`], root);
      console.log(`Created ${name} from the fetched ${remote}/${baseBranch}. No local base branch was changed.`);
    }
  }
} catch (e) {
  console.error(e.status !== undefined ? 'Git could not complete the operation. Check your remote, base branch, authentication and repository state. No reset or stash was attempted.' : e.message);
  process.exitCode = 1;
}
