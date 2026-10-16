import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {resolve} from 'node:path';
const config=JSON.parse(readFileSync('dist/server/wrangler.json','utf8'));
config.main=resolve('dist/server/index.js');config.assets.directory=resolve('dist/client');
for(const binding of config.d1_databases)binding.migrations_dir=resolve('drizzle');
mkdirSync('.sites-runtime',{recursive:true});writeFileSync('.sites-runtime/migration-config.json',JSON.stringify(config));
// Apply migrations through Wrangler's migration tracker; never replay CREATE statements.
const result=spawnSync(process.execPath,['--import','./scripts/windows-realpath.mjs','--import','./scripts/sites-env.mjs','./node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','DB','--local','--config','.sites-runtime/migration-config.json','--persist-to','.wrangler/state'],{stdio:'inherit'});
if(result.error)throw result.error;process.exitCode=result.status??1;
