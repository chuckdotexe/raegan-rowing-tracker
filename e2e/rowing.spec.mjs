import {test,expect} from '@playwright/test';import fs from 'node:fs';
const plan=JSON.parse(fs.readFileSync('next-week.json','utf8'));
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64');
test('rower can restore a draft and safely retry a failed save',async({page})=>{
 let queue={schemaVersion:1,sessions:[]},writes=0,fail=true;
 await page.addInitScript(()=>{localStorage.setItem('raegan-rowing-token-v1','test-token');localStorage.setItem('awt-github-token','lifting-token');});
 await page.route('https://api.github.com/repos/**',async route=>{
  const req=route.request(),url=req.url();expect(url).toContain('/raegan-rowing-tracker/');
  if(req.method()==='GET'){
   if(url.includes('/contents/'))return route.fulfill({json:{encoding:'base64',content:encode(url.includes('completed.json')?queue:plan)}});
   if(url.includes('/git/ref/'))return route.fulfill({json:{object:{sha:'head'}}});
   return route.fulfill({json:{tree:{sha:'tree'}}});
  }
  if(fail)return route.fulfill({status:403,json:{message:'denied'}});
  if(url.endsWith('/git/trees')){const body=req.postDataJSON();queue=JSON.parse(body.tree[0].content);writes++;return route.fulfill({json:{sha:'new-tree'}});}
  return route.fulfill({json:{sha:'new-commit'}});
 });
 await page.goto('/');await expect(page.getByText('Published plan',{exact:false}).first()).toBeVisible();
 await page.getByRole('button',{name:'Start workout',exact:true}).click();
 await page.getByLabel('Actual minutes',{exact:true}).fill('30');await page.getByLabel('Distance (m)',{exact:true}).fill('5000');await page.getByLabel('Session effort (0–10)',{exact:true}).fill('4');await page.getByLabel('Completed as prescribed?').selectOption('yes');
 await page.reload();await expect(page.getByLabel('Actual minutes',{exact:true})).toHaveValue('30');await page.getByRole('button',{name:'Finish & save workout'}).click();await expect(page.locator('p[role=alert]')).toContainText('retained');await expect(page.getByLabel('Actual minutes',{exact:true})).toBeDisabled();
 const first=await page.evaluate(()=>JSON.parse(localStorage.getItem('raegan-rowing-draft-v1')).submission.id);
 fail=false;await page.getByRole('button',{name:'Retry save'}).click();await expect(page.getByRole('status')).toContainText('Workout saved');expect(queue.sessions[0].id).toBe(first);expect(writes).toBe(1);expect(await page.evaluate(()=>localStorage.getItem('awt-github-token'))).toBe('lifting-token');
 await page.goto('/upcoming/');await expect(page.getByRole('heading',{name:'Controlled intervals'})).toBeVisible();await expect(page.getByRole('heading',{name:'Starting capacity'})).toHaveCount(0);
});
