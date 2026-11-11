#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { resolve, relative, isAbsolute } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
try {
  const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
  if (realpathSync(process.cwd()) !== realpathSync(root)) throw Error('Run from the Git repository root.');
  const cfg = JSON.parse(readFileSync(resolve(root, 'agent-workflow.config.json'), 'utf8'));
  if (!Array.isArray(cfg.verifyCommands) || !cfg.verifyCommands.length) {
    console.error('No checks configured. Add the team commands to verifyCommands. Nothing was verified.');
    process.exitCode = 2;
  } else {
    // Validate the full list before executing any command.
    const checks = cfg.verifyCommands.map(c => {
      if (!c || typeof c.command !== 'string' || !c.command || c.command.startsWith('-') || !Array.isArray(c.args) || !c.args.every(a => typeof a === 'string') || (c.cwd !== undefined && typeof c.cwd !== 'string')) throw Error('Each check needs command, string args[], and optional cwd.');
      const cwd = realpathSync(resolve(root, c.cwd || '.'));
      const rel = relative(realpathSync(root), cwd);
      if (rel === '..' || rel.startsWith('..'+(process.platform === 'win32' ? '\\' : '/')) || isAbsolute(rel)) throw Error('Check cwd must stay inside the repository.');
      return { ...c, cwd };
    });
    for (const c of checks) {
      console.log(`\nRunning: ${JSON.stringify([c.command, ...c.args])}`);
      const r = spawnSync(c.command, c.args, { cwd: c.cwd, shell: false, encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 });
      const output = `${r.stdout || ''}${r.stderr || ''}`.trim().split('\n');
      if (output.length > 40) console.log('(Showing the final 40 output lines)');
      console.log(output.slice(-40).join('\n'));
      if (r.error || r.status !== 0) {
        console.error(`FAIL: ${c.command}${r.error ? ' ('+r.error.code+')' : ''}. Remaining checks were not run.`);
        process.exitCode = 1; break;
      }
      console.log(`PASS: ${c.command}`);
    }
  }
} catch (e) { console.error(e.message); process.exitCode = 1; }
