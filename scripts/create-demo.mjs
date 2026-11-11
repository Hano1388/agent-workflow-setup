#!/usr/bin/env node
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const kit=fileURLToPath(new URL('../',import.meta.url));
const target=resolve(process.argv[2] || '../agent-workflow-demo');
const git=(args,cwd)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']});
try {
  if(existsSync(target))throw Error('Choose a new directory. The demo never overwrites an existing directory.');
  const remote=target+'-remote.git';if(existsSync(remote))throw Error('The demo remote path already exists. Choose a new name.');
  mkdirSync(target,{recursive:true});git(['init','--initial-branch=main'],target);
  // This identity applies only to disposable demo commits, not global Git settings.
  git(['config','user.name','Workflow Demo'],target);git(['config','user.email','workflow-demo@example.invalid'],target);
  for(const d of ['apps/web','apps/api','tests'])mkdirSync(join(target,d),{recursive:true});
  writeFileSync(join(target,'apps/web/greeting.mjs'),`export function greet(name) {\n  return 'Hello, ' + name + '!';\n}\n`);
  writeFileSync(join(target,'apps/api/health.mjs'),`export function health() { return { status: 'ok' }; }\n`);
  writeFileSync(join(target,'tests/greeting.test.mjs'),`import test from 'node:test';\nimport assert from 'node:assert/strict';\nimport { greet } from '../apps/web/greeting.mjs';\ntest('greets a named visitor', () => assert.equal(greet('Sam'), 'Hello, Sam!'));\n`);
  writeFileSync(join(target,'README.md'),'# Local workflow demo\n\nTwo tiny app folders and one test. No dependencies or running server required.\n');
  execFileSync(process.execPath,[join(kit,'scripts/install.mjs'),target],{stdio:'inherit'});
  writeFileSync(join(target,'agent-workflow.config.json'),JSON.stringify({version:1,remote:'origin',baseBranch:'main',branchPrefix:'feature',verifyCommands:[{command:'node',args:['--test','tests/greeting.test.mjs'],cwd:'.'}]},null,2)+'\n');
  git(['add','.'],target);git(['commit','-m','Add disposable workflow demo'],target);
  git(['init','--bare','--initial-branch=main',remote],kit);
  git(['remote','add','origin',remote],target);git(['push','-u','origin','main'],target);
  console.log(`\nReady: ${target}\nLocal remote: ${remote}\nOpen the demo root in Cursor. No external service was contacted.`);
} catch(e){console.error(e.status!==undefined?'Demo setup failed. Use a fresh directory and check Git availability.':e.message);process.exitCode=1;}
