// Display labels remain independent of persisted workflow status values.
const statusLabel=s=>({'待 HR 复核':'待处理','已接受':'待邀约'}[s]||s);
let matchSort='default',resetPrompt=false;
function candidateOrder(a,b){if(matchSort==='default')return 0;let sa=jdAssessment(a,job()).score,sb=jdAssessment(b,job()).score;if(sa===null)return sb===null?0:1;if(sb===null)return -1;return matchSort==='desc'?sb-sa:sa-sb;}
function changeMatchSort(value){matchSort=value;render()}
if(!data.requestExamplesV2){
 [['解决方案顾问','企业服务事业部','王经理','负责企业客户需求沟通，设计软件解决方案，协调售前与交付团队。'],['渠道销售经理','销售事业部','王经理','负责渠道伙伴开发和管理，推动企业客户销售，完成季度销售目标。'],['测试开发工程师','研发中心','张经理','负责自动化测试开发，推动质量改进，参与持续集成建设。'],['增长产品经理','产品中心','刘经理','负责增长产品规划，开展用户研究与数据分析，推动跨部门实验落地。']].forEach(([name,dept,owner,jd],i)=>{if(!data.jobs.some(j=>j.id===301+i))data.jobs.push({id:301+i,name,dept,owner,jd,criteria:jd.split(/[，。]/).filter(Boolean),version:1,confirmed:true,people:[],history:[],draft:null,recruitState:'待 HR 接收'})});data.requestExamplesV2=true;
}
function resetDemoData(){localStorage.setItem('tongpin-v3',JSON.stringify(initial()));location.reload()}
if(!data.statusExamplesSeeded){
 const j=data.jobs.find(j=>j.id===1);
 const examples=[
  {id:601,name:'沈悦',status:'待 HR 复核',text:'独立负责企业客户，推动跨部门项目交付，具备企业软件服务经验。',title:'客户成功经理 · 5 年'},
  {id:602,name:'顾辰',status:'暂缓推荐',text:'负责企业客户支持，参与跨部门项目交付。',title:'客户支持主管 · 4 年',feedback:'HR 暂缓：等待补充独立交付项目的具体职责。'},
  {id:603,name:'苏禾',status:'已推荐',text:'独立负责企业客户，推动跨部门项目交付，具备企业软件服务经验。',title:'客户成功经理 · 6 年',hrNote:'简历有企业软件交付经历，建议进一步核实项目结果。'},
  {id:604,name:'陆宁',status:'已接受',text:'独立负责企业客户，推动跨部门项目交付，具备企业软件服务经验。\n电话：+1 202-555-0146\n邮箱：luning@example.com',title:'高级客户成功经理 · 7 年',demoContact:true},
  {id:605,name:'方可',status:'已驳回',text:'参与客户培训，协助整理客户问题与培训资料。',title:'客户运营专员 · 2 年',feedback:'业务退回：缺少独立负责企业客户和交付项目的经历。'}
 ];
 if(j)examples.forEach(p=>{if(!j.people.some(x=>x.id===p.id))j.people.push({...p,analyzed:true,matches:p.text.split(/[，。\n]/).filter(t=>/负责|推动|具备/.test(t)),questions:['需核实个人负责范围及项目结果。'],concerns:['简历自述尚需面试验证。'],demo:true})});
 data.statusExamplesSeeded=true;
}
function jdAssessment(p,j){
 const groups=[['独立','负责'],['企业','客户'],['跨部门','项目','交付'],['企业软件','软件','SaaS'],['管理','团队'],['客户','沟通'],['开发','前端'],['数据','分析']];
 const text=p.text||'';
 const rows=j.criteria.map(criterion=>{let keys=[...new Set(groups.flat().filter(k=>criterion.toLowerCase().includes(k.toLowerCase())))];let found=keys.filter(k=>text.toLowerCase().includes(k.toLowerCase()));let match=criterion&&text.includes(criterion)||keys.length>=2&&found.length===keys.length;return {criterion,match,found};});
 const hits=rows.filter(r=>r.match).length;
 return {rows,hits,total:rows.length,score:rows.length?Math.round(hits/rows.length*100):null};
}
function scoreChip(p,j){let a=jdAssessment(p,j);return `<details class="matchscore"><summary>JD 匹配 ${a.score===null?'待补充 JD':a.score+' 分'} <small>· 演示规则</small></summary><div class="scoreexplain"><p>标签关键词覆盖 ${a.hits} / ${a.total}，按覆盖比例换算为 100 分制。不是能力评定或录用建议。</p>${a.rows.map(r=>`<p>${r.match?'✓':'待核实'} · ${esc(r.criterion)}${r.found.length?'（命中：'+esc(r.found.join('、'))+'）':''}</p>`).join('')}</div></details>`}
function extractContacts(text){return {phone:(text.match(/(?:\+?86[ -]?)?1[3-9]\d{9}|\+\d{1,3}[ -]\d{3}[ -]\d{3}[ -]\d{4}/)||[])[0]||'',email:(text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)||[])[0]||''}}
function contactPanel(p,j){let c=extractContacts(p.text||'');return `<section class="contactpanel"><b>简历联系方式</b> <small class="muted">${p.demoContact?'虚构示例，仅演示提取':'提取自简历原文，联系前请核对'}</small>${c.phone?`<div>电话 <strong>${esc(c.phone)}</strong> <button onclick="copyContact(${j.id},${p.id},'phone')">复制电话</button></div>`:''}${c.email?`<div>邮箱 <strong>${esc(c.email)}</strong> <button onclick="copyContact(${j.id},${p.id},'email')">复制邮箱</button></div>`:''}${!c.phone&&!c.email?'<p class="muted">简历中未识别到电话或邮箱，请向候选人或简历来源补充。</p>':''}<details><summary>核对简历原文</summary><blockquote>${esc(p.text)}</blockquote></details></section>`}
async function copyContact(jid,pid,type){let j=data.jobs.find(x=>x.id===jid),p=j?.people.find(x=>x.id===pid);if(session!=='HR'||!p)return;let value=extractContacts(p.text||'')[type];if(!value)return;try{await navigator.clipboard.writeText(value);toast('联系方式已复制')}catch{toast('复制失败，请选择上方联系方式手动复制')}}
const refinedJobView=jobView;
jobView=function(){let html=refinedJobView();if(session==='HR'){job().people.forEach(p=>{html=html.replace(`<h3>${esc(p.name)} ${tag(p.status==='已驳回'?'不合适':p.status)}</h3>`,`<h3>${esc(p.name)} ${tag(statusLabel(p.status))}</h3>`);let action=p.status==='已接受'?"nav('interviews')":`openPerson(${p.id})`,button=`<button onclick="${action}">${p.status==='已接受'?'安排面试':'查看与补充'} →</button>`,score=jdAssessment(p,job()).score;html=html.replace(button,`<div class="candidate-actions"><span class="score-number" title="匹配度 / 100 · 演示规则评分" aria-label="匹配度 ${score===null?'暂无评分':score+' 分'}">${score??'—'}</span>${button}</div>`)});html=html.replace('<p class="metricnote">',`<div class="candidate-list-header"><span>候选人</span><label>匹配度 <select aria-label="按匹配度排序" onchange="changeMatchSort(this.value)">${[['default','默认顺序'],['desc','从高到低 ↓'],['asc','从低到高 ↑']].map(([v,t])=>`<option value="${v}" ${matchSort===v?'selected':''}>${t}</option>`).join('')}</select></label></div><p class="metricnote">`);}return html};
const refinedInterviews=interviewsView;
interviewsView=function(){let html=refinedInterviews();if(session==='HR')data.jobs.forEach(j=>j.people.filter(p=>['已接受','已安排面试'].includes(p.status)).forEach(p=>{const marker=`<h2>${esc(p.name)} · ${esc(j.name)}</h2>${tag(p.status==='已接受'?'待联系安排':'已安排面试')}</div><p class="muted">面试负责人：${esc(j.owner)}</p>`;html=html.replace(marker,marker+contactPanel(p,j))}));return html};
const refinedRender=render;
render=function(){refinedRender();let html=$('root').innerHTML.split(/(<[^>]+>)/).map((part,i)=>i%2?part:part.replaceAll('待 HR 复核','待处理').replaceAll('待我复核 / 补充','待处理 / 补充').replaceAll('待复核','待处理').replaceAll('不合适','已驳回')).join('');if(session)html=html.replace('<div class="asidebottom">',`<div class="asidebottom">${resetPrompt?'<div class="reset-confirm"><p>恢复全部示例，清除当前浏览器中的导入材料和测试操作，并返回登录页。</p><button onclick="resetDemoData()">确认重置</button><button onclick="resetPrompt=false;render()">取消</button></div>':'<button class="reset-button" onclick="resetPrompt=true;render()">↺ 重置演示数据</button><br>'}`);$('root').innerHTML=html;};
render();
