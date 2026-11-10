'use client';
import {useEffect,useState,useRef} from 'react';
import Link from 'next/link';
import initialPlan from '../data/rowing-plan.json';
import {RowingStore} from '../lib/rowing-store.mjs';
import {STORAGE,REPOSITORY,SHEET_ID,totalMinutes,clockLabel,effortLabel,validateSession,validatePlan,validateQueue,upcoming} from '../lib/rowing.mjs';
const localDate=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
function NumberField({label,value,onChange,min=0,max,step='any'}){return <label>{label}<input type="number" min={min} max={max} step={step} value={value} onChange={e=>onChange(e.target.value)}/></label>;}
export default function Home(){
 const [snapshot,setSnapshot]=useState({plan:initialPlan,queue:{schemaVersion:1,sessions:[]}}),[cached,setCached]=useState(true),[selected,setSelected]=useState(initialPlan.workouts[0].id),[draft,setDraft]=useState(null),[token,setToken]=useState(''),[credential,setCredential]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false),[ready,setReady]=useState(false),[now,setNow]=useState(Date.now()),[online,setOnline]=useState(true);
 const pending=useRef(false),saving=useRef(false);
 const workout=draft?.prescription||snapshot.plan.workouts.find(w=>w.id===selected)||snapshot.plan.workouts[0];
 const segment=draft&&workout.segments[draft.segment];
 const remaining=draft?.deadline?Math.max(0,Math.ceil((draft.deadline-now)/1000)):draft?.remaining;
 const queued=snapshot.queue.sessions.length;
 function persist(value){try{localStorage.setItem(STORAGE.draft,JSON.stringify(value));setDraft(value);}catch{throw Error('Device storage failed. Keep this page open; your draft could not be saved.');}}
 async function refresh(auth=token){
  setBusy(true);setError('');
  try{const s=await new RowingStore({token:auth}).snapshot();setSnapshot(s);setCached(false);try{localStorage.setItem(STORAGE.snapshot,JSON.stringify(s));}catch{}return true;}catch(e){setError('Refresh failed: '+e.message+' The saved plan remains available.');return false;}finally{setBusy(false);}
 }
 useEffect(()=>{
  try{const auth=localStorage.getItem(STORAGE.token)||'';setToken(auth);const raw=JSON.parse(localStorage.getItem(STORAGE.draft)||'null');if(raw){if(!raw.prescription?.segments||!raw.id)throw Error('Saved workout is invalid.');setDraft(raw);setSelected(raw.workoutId);pending.current=!!raw.submission;}
   const s=JSON.parse(localStorage.getItem(STORAGE.snapshot)||'null');if(s){validatePlan(s.plan);validateQueue(s.queue);setSnapshot(s);}refresh(auth);
  }catch(e){setError('Recovery: '+e.message);}
  setReady(true);setOnline(navigator.onLine);const status=()=>setOnline(navigator.onLine);window.addEventListener('online',status);window.addEventListener('offline',status);
  if('serviceWorker'in navigator)navigator.serviceWorker.register((process.env.NEXT_PUBLIC_BASE_PATH||'')+'/sw.js',{updateViaCache:'none'}).catch(()=>{});
  return()=>{window.removeEventListener('online',status);window.removeEventListener('offline',status);};
 },[]);
 useEffect(()=>{const t=setInterval(()=>setNow(Date.now()),500);return()=>clearInterval(t);},[]);
 useEffect(()=>{if(draft)return;const next=upcoming(snapshot.plan,snapshot.queue)[0];if(next)setSelected(next.id);},[snapshot,draft]);
 useEffect(()=>{if(!draft)return;const warn=e=>{e.preventDefault();e.returnValue='';};window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[!!draft]);
 function update(patch){if(pending.current)return;try{persist({...draft,...patch});setError('');}catch(e){setError(e.message);}}
 function begin(){try{const d={id:crypto.randomUUID(),workoutId:workout.id,date:localDate(),prescription:structuredClone(workout),planRevision:snapshot.plan.revision,startedAt:new Date().toISOString(),segment:0,remaining:workout.segments[0].seconds,deadline:null,minutes:'',distance:'',rate:'',effort:'',completed:'',notes:'',fatigue:'',soreness:'',pain:'',intervalDistances:{}};persist(d);setMessage('');}catch(e){setError(e.message);}}
 function timer(){if(draft.deadline)update({remaining,deadline:null});else update({deadline:Date.now()+remaining*1000});}
 function advance(){const i=draft.segment+1;if(i<workout.segments.length)update({segment:i,remaining:workout.segments[i].seconds,deadline:null});else update({deadline:null,remaining:0});}
 async function connect(e){e.preventDefault();const value=credential.trim();if(!value){setError('Enter a token restricted to '+REPOSITORY+'.');return;}if(await refresh(value)){try{localStorage.setItem(STORAGE.token,value);setToken(value);setCredential('');setMessage('Connection saved on this device.');}catch{setError('Could not remember the connection.');}}}
 async function finish(){
  if(saving.current)return;saving.current=true;setBusy(true);setError('');
  try{
   let submission=draft.submission;
   if(!submission){submission=validateSession({id:draft.id,workoutId:draft.workoutId,date:draft.date,startedAt:draft.startedAt,finishedAt:new Date().toISOString(),planRevision:draft.planRevision,prescription:draft.prescription,minutes:draft.minutes===''?null:+draft.minutes,distance:draft.distance===''?null:+draft.distance,rate:draft.rate===''?null:+draft.rate,effort:draft.effort===''?null:+draft.effort,completed:draft.completed===''?null:draft.completed==='yes',notes:draft.notes,fatigue:draft.fatigue===''?null:+draft.fatigue,soreness:draft.soreness===''?null:+draft.soreness,pain:draft.pain,intervals:Object.entries(draft.intervalDistances).filter(([,v])=>v!=='').map(([k,v])=>({segment:+k,distance:+v}))});persist({...draft,deadline:null,remaining,submission});pending.current=true;}
   const saved=await new RowingStore({token}).submit(submission);setSnapshot(saved);setCached(false);try{localStorage.setItem(STORAGE.snapshot,JSON.stringify(saved));}catch{}
   persist(null);pending.current=false;setMessage('Workout saved to Raegan’s repository. Ask ChatGPT to process her rowing workouts into her Sheet.');
  }catch(e){setError(e.message+' Your workout is retained on this device. Retry uses the same session ID.');}finally{setBusy(false);saving.current=false;}
 }
 const done=new Set([...snapshot.queue.sessions.map(s=>s.workoutId),...snapshot.plan.receipts.map(r=>r.workoutId)]);
 return <main className="rowing-page">
  <header><p className="eyebrow">NOVEMBER PREPARATION</p><h1>Raegan Rowing</h1><p className="muted">Build toward winter training · December 1</p></header>
  <p className="connection-status">{online?'Online':'Offline'} · {token?'Connection saved':'GitHub not connected'} · {cached?'Saved starting plan':'Published plan'}</p>
  <div className="row"><button className="secondary" onClick={()=>refresh()} disabled={busy}>Refresh plan</button><Link href="/upcoming/" target="_blank">Upcoming workouts ↗</Link></div>
  {error&&<p role="alert">{error}</p>}{message&&<p role="status" className="card">{message}</p>}
  {!draft&&<label>Choose workout<select value={selected} onChange={e=>setSelected(e.target.value)}>{snapshot.plan.workouts.map(w=><option value={w.id} key={w.id}>{w.date} · {w.title}{done.has(w.id)?' · Submitted':''}</option>)}</select></label>}
  <section className="card"><p className="muted">{workout.date} · Week {workout.week}</p><h2>{workout.title}</h2><p className="workout-target">{totalMinutes(workout)} minutes total</p><p>{workout.instructions}</p><details className="target-rationale"><summary>Why this workout?</summary><p>{workout.reason}</p></details>
   <ol className="segment-list">{workout.segments.map((s,i)=><li key={i} className={draft?.segment===i?'current':''}><strong>{s.label}</strong><span>{clockLabel(s.seconds)} · Effort {effortLabel(s.effort)} · {s.rate} spm</span></li>)}</ol>
   {!draft&&<button className="wide" onClick={begin} disabled={!ready||busy||done.has(workout.id)}>Start workout</button>}
  </section>
  {draft&&<>
   <section className="card"><h2>{segment.label}</h2><p className="timer-big" aria-live="off">{clockLabel(remaining)}</p><p>Effort {effortLabel(segment.effort)} · {segment.rate} spm</p><p className="muted">The timer pauses between segments. It does not measure meters. Use the PM5 for actual results.</p>
    <fieldset disabled={!!draft.submission||busy}><div className="row"><button onClick={timer} disabled={remaining===0}>{draft.deadline?'Pause timer':'Start timer'}</button><button className="secondary" onClick={()=>update({deadline:null,remaining:segment.seconds})}>Reset segment</button></div>
    {segment.kind==='work'&&<NumberField label="Segment distance (m, optional)" value={draft.intervalDistances[draft.segment]??''} onChange={v=>update({intervalDistances:{...draft.intervalDistances,[draft.segment]:v}})}/>}
    <button className="wide secondary" onClick={advance} disabled={draft.segment===workout.segments.length-1&&remaining===0}>{draft.segment===workout.segments.length-1?'End timer':'Next segment'}</button></fieldset>
   </section>
   <section className="card"><h2>Record actual results</h2><p className="muted">Use total PM5 time and meters including warm-up, recovery and cooldown. Never enter planned minutes as actuals.</p><fieldset disabled={!!draft.submission||busy}>
    <div className="two-col"><NumberField label="Actual minutes" value={draft.minutes} onChange={v=>update({minutes:v})}/><NumberField label="Distance (m)" value={draft.distance} onChange={v=>update({distance:v})}/><NumberField label="Average rate (spm, optional)" value={draft.rate} onChange={v=>update({rate:v})} max={60}/><NumberField label="Session effort (0–10)" value={draft.effort} onChange={v=>update({effort:v})} max={10}/></div>
    {+draft.minutes>0&&+draft.distance>0&&<p>Average split: {clockLabel(+draft.minutes*60/+draft.distance*500)} /500m</p>}
    <label>Completed as prescribed?<select value={draft.completed} onChange={e=>update({completed:e.target.value})}><option value="">Choose…</option><option value="yes">Yes</option><option value="no">No, shortened or changed</option></select></label>
    <label>Technique / notes<textarea value={draft.notes} onChange={e=>update({notes:e.target.value})}/></label>
    <label>Pain / symptoms (optional)<textarea value={draft.pain} onChange={e=>update({pain:e.target.value})}/></label>
   </fieldset>
   {draft.submission&&<p>The submitted results are locked until the save is confirmed. Retry safely if the connection failed.</p>}
   {!draft.submission&&<button className="secondary wide" disabled={busy} onClick={()=>{if(window.confirm('Discard this unsubmitted workout?')){try{persist(null);setMessage('Draft discarded.');}catch(e){setError(e.message);}}}}>Discard unsubmitted draft</button>}
   <button className="wide" disabled={busy} onClick={finish}>{busy?'Saving…':draft.submission?'Retry save':'Finish & save workout'}</button></section>
  </>}
  <details className="card"><summary>GitHub connection</summary><p>Use a fine-grained token restricted to <strong>{REPOSITORY}</strong>, Contents: read and write. It is saved only in this browser. This app never uses your lifting tracker’s token.</p><form onSubmit={connect}><label>Repository token<input type="password" autoComplete="off" value={credential} onChange={e=>setCredential(e.target.value)}/></label><button disabled={busy}>Save connection</button></form>{token&&<button className="secondary" onClick={()=>{localStorage.removeItem(STORAGE.token);setToken('');setMessage('Disconnected. Saved workout retained.');}}>Disconnect</button>}</details>
  <details className="card"><summary>Training and processing notes</summary><p>No November lifting. Rest Tuesday, Thursday, Sunday and November 30. Easy work: full sentences. Intervals: controlled, no sprinting. If the first 20-minute main row is not manageable with sound technique, replace Wednesday’s intervals with easy rowing and review the plan.</p><p>Stop for sharp or worsening pain, dizziness, chest pain or unusual breathlessness. Persistent symptoms need evaluation.</p><p>{queued} session(s) awaiting ChatGPT processing. Saving here queues the workout; it does not write the Sheet immediately. Records in this public repository are public.</p><a href={'https://docs.google.com/spreadsheets/d/'+SHEET_ID+'/edit'} target="_blank" rel="noreferrer">Open rowing Sheet ↗</a></details>
 </main>;
}
