import './windows-realpath.mjs';
import {createServer} from 'node:http';
import next from 'next';
const app=next({dev:false,hostname:'127.0.0.1',port:5184});await app.prepare();
const server=createServer(app.getRequestHandler());await new Promise(resolve=>server.listen(5184,'127.0.0.1',resolve));
let code=0;
try{
 const base='http://127.0.0.1:5184';const page=await fetch(base);if(page.status!==200)throw new Error('Production page failed.');
 const state=await fetch(base+'/api/workspace');if(state.status!==200)throw new Error('Production database read failed.');let workspace=await state.json();
 if(!workspace.projects.length){const seeded=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'seed'})});if(!seeded.ok)throw new Error('Production seed failed.');workspace=await (await fetch(base+'/api/workspace')).json();}
 const rejected=await fetch(base+'/api/workspace',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://foreign.invalid'},body:JSON.stringify({action:'seed'})});if(rejected.status!==403)throw new Error('Foreign-origin mutation was not rejected.');
 console.log(`Production smoke passed: HTTP 200, ${workspace.interviews.length} persisted interviews, foreign-origin mutation rejected.`);
}catch(error){console.error(error.message);code=1;}finally{server.closeAllConnections();server.close();await app.close();process.exit(code);}
