#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync, lstatSync, mkdirSync, writeFileSync, realpathSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
const kit = fileURLToPath(new URL('../', import.meta.url));
try {
  const args = process.argv.slice(2);
  if (args.includes('--help') || !args.length) {
    console.log('Use: node scripts/install.mjs /path/to/monorepo [--editor cursor|vscode|claude] [--dry-run]');
  } else {
    let target, editor = 'cursor', dry = false;
    for (let i=0;i<args.length;i++) {
      if (args[i]==='--editor') editor=args[++i];
      else if (args[i]==='--dry-run') dry=true;
      else if (!args[i].startsWith('-') && !target) target=args[i];
      else throw Error('Unknown argument. Use --help.');
    }
    if (!target || !['cursor','vscode','claude'].includes(editor)) throw Error('Provide a target and a supported editor.');
    const root = realpathSync(resolve(target));
    const gitRoot = execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
    if (root !== realpathSync(gitRoot)) throw Error('Target must be the monorepo Git root.');
    const files = [];
    const add = (name, body) => files.push({name,body});
    for (const name of ['guide.md','new-feature.mjs','verify.mjs']) add(`tools/agent-workflow/${name}`,readFileSync(join(kit,'tools/agent-workflow',name)));
    add('agent-workflow.config.json',readFileSync(join(kit,'agent-workflow.config.json')));
    for(const name of readdirSync(join(kit,'.cursor/commands')).sort()) {
      const body=readFileSync(join(kit,'.cursor/commands',name),'utf8');
      if(editor==='cursor') add(`.cursor/commands/${name}`,Buffer.from(body));
      if(editor==='vscode') add(`.github/prompts/${name.replace('.md','.prompt.md')}`,Buffer.from(`---\nagent: agent\ndescription: "${name.replace('.md','').replaceAll('-',' ')} workflow"\n---\n${body}`));
      if(editor==='claude') add(`.claude/commands/${name}`,Buffer.from(body));
    }
    if(editor==='cursor')add('.cursor/rules/team-workflow.mdc',readFileSync(join(kit,'.cursor/rules/team-workflow.mdc')));
    const conflicts=[];
    for(const file of files) {
      const parts=file.name.split('/');let current=root;
      for(const part of parts) {
        current=join(current,part);
        if(existsSync(current) || (()=>{try{lstatSync(current);return true;}catch{return false;}})()) {
          const stat=lstatSync(current);
          if(stat.isSymbolicLink())throw Error(`Refusing a symlink path: ${file.name}`);
          if(current!==join(root,...parts) && !stat.isDirectory())throw Error(`Parent is not a directory: ${file.name}`);
        }
      }
      const path=join(root,file.name);
      if(existsSync(path)) {
        if(!lstatSync(path).isFile())throw Error(`Destination is not a regular file: ${file.name}`);
        if(file.name==='agent-workflow.config.json'){file.action='KEEP';continue;}
        if(readFileSync(path).equals(file.body)){file.action='SAME';continue;}
        conflicts.push(file.name);
      } else file.action='ADD';
    }
    if(conflicts.length)throw Error('Existing files differ. No files copied. Compare and merge these manually:\n'+conflicts.join('\n'));
    for(const file of files){
      console.log(`${dry?'PREVIEW ':''}${file.action} ${file.name}`);
      if(!dry && file.action==='ADD'){
        const path=join(root,file.name);mkdirSync(dirname(path),{recursive:true});writeFileSync(path,file.body,{flag:'wx'});
      }
    }
    console.log(dry?'Preview only. Nothing changed.':'Installed. Review config and commit the kit files before /new-feature.');
  }
} catch(e){console.error(e.status!==undefined?'Could not locate the target Git root. Check the path and initialize Git first.':e.message);process.exitCode=1;}
