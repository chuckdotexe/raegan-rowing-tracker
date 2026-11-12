export const REPOSITORY='chuckdotexe/raegan-rowing-tracker';
export const SHEET_ID='1-pVOc2nrw72E9CFZ9Jh77GjhTmhLcOBu9--E07JbREk';
export const STORAGE={draft:'raegan-rowing-draft-v1',token:'raegan-rowing-token-v1',snapshot:'raegan-rowing-snapshot-v1'};
export const HEADERS=['Session ID','Workout ID','Completed date','Actual minutes','Distance m','Avg split sec/500m','Avg rate spm','Effort /10','Completed as prescribed','Technique / notes','Pain / symptoms','Adjustment decision','Adjustment reason','Processed at'];
export function validatePlan(plan){
 if(plan?.schemaVersion!==1||!Array.isArray(plan.workouts)||!Array.isArray(plan.receipts)||typeof plan.revision!=='string')throw Error('Invalid rowing plan.');
 const ids=new Set();
 for(const w of plan.workouts){
  if(!w.id||ids.has(w.id)||!/^\d{4}-\d{2}-\d{2}$/.test(w.date)||!Array.isArray(w.segments)||!w.segments.length||typeof w.reason!=='string')throw Error('Invalid workout prescription.');
  ids.add(w.id);
  for(const s of w.segments)if(!s.label||!Number.isFinite(s.seconds)||s.seconds<=0||s.seconds>3600||typeof s.effort!=='string'||typeof s.rate!=='string')throw Error('Invalid workout segment.');
 }
 const receiptIds=new Set();for(const r of plan.receipts){if(!r.sessionId||receiptIds.has(r.sessionId)||!r.hash||!r.workoutId)throw Error('Invalid processing receipt.');receiptIds.add(r.sessionId);}
 return plan;
}
export const totalMinutes=w=>w.segments.reduce((n,s)=>n+s.seconds,0)/60;
export const clockLabel=s=>`${Math.floor(Math.max(0,s)/60)}:${String(Math.floor(Math.max(0,s)%60)).padStart(2,'0')}`;
export function validateSession(s){
 if(!s?.id||!s.workoutId||!/^\d{4}-\d{2}-\d{2}$/.test(s.date)||!s.prescription||s.prescription.id!==s.workoutId)throw Error('Invalid rowing session.');
 if(!Number.isFinite(s.minutes)||s.minutes<=0||s.minutes>240)throw Error('Enter actual minutes (greater than 0, up to 240).');
 if(!Number.isFinite(s.distance)||s.distance<=0||s.distance>100000)throw Error('Enter actual distance in meters.');
 if(!Number.isFinite(s.effort)||s.effort<0||s.effort>10)throw Error('Effort must be between 0 and 10.');
 if(s.rate!==null&&(!Number.isFinite(s.rate)||s.rate<1||s.rate>60))throw Error('Stroke rate must be between 1 and 60.');
 if(typeof s.completed!=='boolean')throw Error('Choose whether you completed the prescription.');
 if(!Array.isArray(s.intervals)||!s.intervals.every(x=>Number.isInteger(x.segment)&&x.segment>=0&&x.segment<s.prescription.segments.length&&Number.isFinite(x.distance)&&x.distance>0))throw Error('Invalid interval results.');
 if(new Set(s.intervals.map(x=>x.segment)).size!==s.intervals.length)throw Error('Duplicate interval results.');
 return s;
}
export function validateQueue(q){if(q?.schemaVersion!==1||!Array.isArray(q.sessions))throw Error('Invalid rowing queue.');const ids=new Set();for(const s of q.sessions){validateSession(s);if(ids.has(s.id))throw Error('Duplicate session ID.');ids.add(s.id);}return q;}
function canonical(value){if(Array.isArray(value))return value.map(canonical);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])]));return value;}
export async function hashSession(s){const data=new TextEncoder().encode(JSON.stringify(canonical(s)));return [...new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',data))].map(x=>x.toString(16).padStart(2,'0')).join('');}
export async function appendSession(queue,plan,session){
 validateQueue(queue);validatePlan(plan);validateSession(session);
 const hash=await hashSession(session),receipt=plan.receipts.find(r=>r.sessionId===session.id),existing=queue.sessions.find(s=>s.id===session.id);
 if(receipt){if(receipt.hash!==hash)throw Error('Session ID conflicts with a processed workout.');return {queue,duplicate:true};}
 if(existing){if(await hashSession(existing)!==hash)throw Error('Session ID conflicts with a queued workout.');return {queue,duplicate:true};}
 if(!plan.workouts.some(w=>w.id===session.workoutId))throw Error('Workout is not in the published rowing plan.');
 return {queue:{...queue,sessions:[...queue.sessions,session]},duplicate:false};
}
export function sheetRow(s,processedAt){validateSession(s);return [s.id,s.workoutId,s.date,s.minutes,s.distance,Math.round(s.minutes*60/s.distance*500*10)/10,s.rate??'',s.effort,s.completed?'Yes':'No',s.notes||'',s.pain||'','','',processedAt];}
export function upcoming(plan,queue){const done=new Set([...queue.sessions.map(s=>s.workoutId),...plan.receipts.map(r=>r.workoutId)]);return plan.workouts.filter(w=>!done.has(w.id));}

export const effortLabel=value=>/^\d+(?:[–-]\d+)?$/.test(String(value))?`${value} out of 10`:String(value);
