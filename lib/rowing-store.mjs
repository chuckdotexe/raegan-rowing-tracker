import {GitHubStore} from './github-store.mjs';
import {REPOSITORY,validatePlan,validateQueue,appendSession} from './rowing.mjs';
export class RowingStore extends GitHubStore{
 constructor(options={}){super({...options,repository:REPOSITORY,branch:'main'});}
 async snapshot(){const ref=await this.request('/git/ref/heads/main');const head=ref.object.sha;const [plan,queue]=await Promise.all([this.readFile('next-week.json',head),this.readFile('completed.json',head)]);return {head,plan:validatePlan(plan),queue:validateQueue(queue)};}
 async submit(session){
  if(!this.token)throw Error('Connect the Raegan repository token before submitting.');
  for(let attempt=0;attempt<4;attempt++){
   try{const snap=await this.snapshot(),result=await appendSession(snap.queue,snap.plan,session);if(result.duplicate)return snap;const head=await this.writeFiles(snap.head,{'completed.json':result.queue},'Queue rowing session '+session.id);return {...snap,head,queue:result.queue};}
   catch(e){if(attempt===3||e.status&&![409,422,500,502,503,504].includes(e.status))throw e;await new Promise(r=>setTimeout(r,250*(attempt+1)));}
  }
 }
}
