import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
const source=[];
function scan(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const file=join(dir,entry.name);if(entry.isDirectory())scan(file);else if(entry.name.endsWith('.js'))source.push([file,readFileSync(file,'utf8')]);}}
scan('dist/server');
const unsupported=source.filter(([,text])=>text.includes('node:sqlite')||text.includes('.trace-data/trace.sqlite'));
if(unsupported.length)throw new Error('Hosted bundle contains local SQLite code: '+unsupported.map(([file])=>file).join(', '));
if(!source.some(([,text])=>text.includes('Apply the D1 migration')))throw new Error('Hosted D1 adapter is missing from the bundle.');
console.log('Worker database check passed: D1 adapter present; local SQLite code absent.');
