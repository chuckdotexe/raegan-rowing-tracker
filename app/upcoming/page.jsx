'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';
import initial from '../../data/rowing-plan.json';
import {RowingStore} from '../../lib/rowing-store.mjs';
import {STORAGE,upcoming,totalMinutes,clockLabel,effortLabel,validatePlan,validateQueue} from '../../lib/rowing.mjs';
export default function Upcoming(){
 const [s,setS]=useState({plan:initial,queue:{schemaVersion:1,sessions:[]}}),[error,setError]=useState(''),[cached,setCached]=useState(true);
 async function refresh(){try{const auth=localStorage.getItem(STORAGE.token)||'';setS(await new RowingStore({token:auth}).snapshot());setCached(false);setError('');}catch(e){setError('Refresh failed. Showing saved plan. '+e.message);}}
 useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem(STORAGE.snapshot)||'null');if(saved){validatePlan(saved.plan);validateQueue(saved.queue);setS(saved);}}catch{}refresh();},[]);
 return <main className="rowing-page"><Link href="/">← Back to rowing</Link><h1>Upcoming workouts</h1><p>{cached?'Saved starting plan':'Published plan'} · Submitted workouts are excluded.</p><button className="secondary" onClick={refresh}>Refresh</button>{error&&<p role="alert">{error}</p>}{upcoming(s.plan,s.queue).length===0&&<p>No remaining workouts are published. Ask ChatGPT to review the next training block.</p>}{upcoming(s.plan,s.queue).map(w=><section className="card" key={w.id}><p className="muted">{w.date} · Week {w.week}</p><h2>{w.title}</h2><p>{totalMinutes(w)} min total</p><ol className="segment-list">{w.segments.map((x,i)=><li key={i}><strong>{x.label}</strong><span>{clockLabel(x.seconds)} · Effort {effortLabel(x.effort)} · {x.rate} spm</span></li>)}</ol><details><summary>Why this workout?</summary><p>{w.reason}</p></details></section>)}</main>;
}
