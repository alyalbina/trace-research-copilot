import {spawn} from 'node:child_process';
const url='http://127.0.0.1:5173';
for(let attempt=0;attempt<180;attempt++){
  try{
    const response=await fetch(url+'/api/workspace',{signal:AbortSignal.timeout(1500)});
    if(response.ok){
      const browser=spawn('explorer.exe',[url],{windowsHide:true,detached:true,stdio:'ignore'});
      browser.unref();
      console.log('TRACE is ready: '+url);
      process.exit(0);
    }
  }catch{}
  await new Promise(resolve=>setTimeout(resolve,500));
}
console.log('Open '+url+' after the server prints Ready.');
