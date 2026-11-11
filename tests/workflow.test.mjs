import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, existsSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync, execFileSync } from 'node:child_process';
const kit=fileURLToPath(new URL('../',import.meta.url));
const git=(args,cwd)=>execFileSync('git',args,{cwd,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
const run=(script,args,cwd=kit)=>spawnSync(process.execPath,[join(kit,script),...args],{cwd,encoding:'utf8',timeout:20000});
function repo(root,name='repo'){
 const p=join(root,name);mkdirSync(p);git(['init','--initial-branch=main'],p);return p;
}
test('installer previews, preserves existing files, and supports adapters',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'workflow-install-'));
 try{
  const p=repo(tmp);
  let r=run('scripts/install.mjs',[p,'--dry-run']);assert.equal(r.status,0,r.stderr);assert.equal(existsSync(join(p,'.cursor')),false);
  r=run('scripts/install.mjs',[p]);assert.equal(r.status,0,r.stderr);
  const config=join(p,'agent-workflow.config.json');const c=JSON.parse(readFileSync(config));c.baseBranch='master';writeFileSync(config,JSON.stringify(c));
  r=run('scripts/install.mjs',[p]);assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(readFileSync(config)).baseBranch,'master');
  writeFileSync(join(p,'.cursor/commands/verify.md'),'team customization');
  r=run('scripts/install.mjs',[p]);assert.equal(r.status,1);assert.match(r.stderr,/No files copied/);assert.equal(readFileSync(join(p,'.cursor/commands/verify.md'),'utf8'),'team customization');
  for(const editor of ['vscode','claude']){
   r=run('scripts/install.mjs',[p,'--editor',editor]);assert.equal(r.status,0,r.stderr);
  }
  assert.ok(existsSync(join(p,'.github/prompts/new-feature.prompt.md')));assert.ok(existsSync(join(p,'.claude/commands/new-feature.md')));
  const linked=repo(tmp,'linked');symlinkSync(p,join(linked,'.cursor'),'dir');
  r=run('scripts/install.mjs',[linked]);assert.equal(r.status,1);assert.match(r.stderr,/symlink/);
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('new-feature fetches latest base, blocks dirty state, and rejects duplicates',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'workflow-git-'));
 try{
  const p=join(tmp,'demo');let r=run('scripts/create-demo.mjs',[p]);assert.equal(r.status,0,r.stderr);
  const script='tools/agent-workflow/new-feature.mjs';
  r=run(script,['--check','--name','trim-greeting'],p); // execute installed script, not kit script
  // Both files have the same implementation; cwd is the target repository.
  assert.equal(r.status,0,r.stderr);assert.equal(git(['branch','--show-current'],p),'main');
  writeFileSync(join(p,'unfinished.txt'),'work');r=run(script,['--create','--name','trim-greeting'],p);assert.equal(r.status,1);assert.match(r.stderr,/not clean/);rmSync(join(p,'unfinished.txt'));
  const other=join(tmp,'other');git(['clone',p+'-remote.git',other],tmp);git(['config','user.name','Test'],other);git(['config','user.email','test@example.invalid'],other);
  writeFileSync(join(other,'latest.txt'),'upstream update');git(['add','.'],other);git(['commit','-m','Upstream update'],other);git(['push'],other);const latest=git(['rev-parse','HEAD'],other);
  r=run(script,['--create','--name','trim-greeting'],p);assert.equal(r.status,0,r.stderr);
  assert.equal(git(['branch','--show-current'],p),'feature/trim-greeting');assert.equal(git(['rev-parse','HEAD'],p),latest);
  assert.notEqual(git(['rev-parse','main'],p),latest); // local main remains untouched
  r=run(script,['--create','--name','trim-greeting'],p);assert.equal(r.status,1);assert.match(r.stderr,/already exists/);
  r=run(script,['--create','--name','bad;name'],p);assert.equal(r.status,1);
  git(['switch','main'],p);const cfg=JSON.parse(readFileSync(join(p,'agent-workflow.config.json')));cfg.baseBranch='missing';writeFileSync(join(p,'agent-workflow.config.json'),JSON.stringify(cfg));git(['add','.'],p);git(['commit','-m','Set missing base for test'],p);
  r=run(script,['--create','--name','another'],p);assert.equal(r.status,1);assert.equal(git(['branch','--show-current'],p),'main');
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
test('verification distinguishes no checks, success, and failure',()=>{
 const tmp=mkdtempSync(join(tmpdir(),'workflow-verify-'));
 try{
  const p=repo(tmp);assert.equal(run('scripts/install.mjs',[p]).status,0);
  const cfg=join(p,'agent-workflow.config.json');const data=JSON.parse(readFileSync(cfg));
  assert.equal(run('tools/agent-workflow/verify.mjs',[],p).status,2);
  data.verifyCommands=[{command:process.execPath,args:['-e','process.exit(0)']}];writeFileSync(cfg,JSON.stringify(data));
  assert.equal(run('tools/agent-workflow/verify.mjs',[],p).status,0);
  data.verifyCommands=[{command:process.execPath,args:['-e','process.exit(1)']},{command:process.execPath,args:['-e','throw Error("must not run")']}];writeFileSync(cfg,JSON.stringify(data));
  const r=run('tools/agent-workflow/verify.mjs',[],p);assert.equal(r.status,1);assert.match(r.stderr,/Remaining checks were not run/);assert.doesNotMatch(r.stdout,/must not run/);
  data.verifyCommands=[{command:process.execPath,args:[],cwd:'..'}];writeFileSync(cfg,JSON.stringify(data));assert.equal(run('tools/agent-workflow/verify.mjs',[],p).status,1);
 }finally{rmSync(tmp,{recursive:true,force:true});}
});
