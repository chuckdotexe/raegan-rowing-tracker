import {validatePlan,validateQueue,hashSession,sheetRow,HEADERS} from './rowing.mjs';
export async function prepareBatch(queue,plan,processedAt){validateQueue(queue);validatePlan(plan);return {revision:plan.revision,sessions:await Promise.all(queue.sessions.map(async s=>({id:s.id,workoutId:s.workoutId,hash:await hashSession(s),row:sheetRow(s,processedAt)})))};}
export async function finalizeVerified(currentQueue,currentPlan,nextPlan,batch,verified){
 validateQueue(currentQueue);validatePlan(currentPlan);validatePlan(nextPlan);
 if(currentPlan.revision!==batch.revision)throw Error('Plan changed. Re-read and review again.');
 if(nextPlan.revision===currentPlan.revision)throw Error('A new plan revision is required.');
 const ids=new Set();const receipts=[...currentPlan.receipts];
 for(const item of batch.sessions){
  if(ids.has(item.id))throw Error('Duplicate batch ID.');ids.add(item.id);
  const session=currentQueue.sessions.find(s=>s.id===item.id);
  if(!session||await hashSession(session)!==item.hash)throw Error('Queued session changed.');
  const proof=verified.find(v=>v.id===item.id);
  if(!proof||proof.hash!==item.hash||JSON.stringify(proof.row)!==JSON.stringify(item.row)||!Number.isInteger(proof.sheetRow)||proof.sheetRow<2)throw Error('Full Sheets readback is required.');
  if(!receipts.some(r=>r.sessionId===item.id))receipts.push({sessionId:item.id,workoutId:item.workoutId,hash:item.hash,sheetRow:proof.sheetRow,processedAt:item.row[HEADERS.length-1]});
 }
 if(nextPlan.workouts.length!==currentPlan.workouts.length||nextPlan.workouts.some((w,i)=>w.id!==currentPlan.workouts[i].id||w.date!==currentPlan.workouts[i].date))throw Error('Processing must preserve workout IDs, dates and order.');
 const completedIds=new Set([...currentPlan.receipts.map(r=>r.workoutId),...batch.sessions.map(s=>s.workoutId)]);
 for(const old of currentPlan.workouts)if(completedIds.has(old.id)&&JSON.stringify(nextPlan.workouts.find(w=>w.id===old.id))!==JSON.stringify(old))throw Error('Do not rewrite completed prescriptions.');
 return {queue:{...currentQueue,sessions:currentQueue.sessions.filter(s=>!ids.has(s.id))},plan:{...nextPlan,receipts}};
}
