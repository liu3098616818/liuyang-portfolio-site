import http from 'http'
const PORT = +process.env.CDP_PORT || 9350
const get = (p) => new Promise((res, rej) => {
  http.get({ host:'127.0.0.1', port:PORT, path:p }, r => { let b=''; r.on('data',c=>b+=c); r.on('end',()=>res(JSON.parse(b))) }).on('error', rej)
})
const sleep = ms => new Promise(r=>setTimeout(r,ms))
;(async()=>{
  let t=[]; for(let i=0;i<20;i++){try{t=await get('/json/list'); if(t.length)break}catch{}; await sleep(500)}
  const ws = new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl)
  await new Promise(r=>{ if(ws.readyState===1) return r(); ws.addEventListener('open',r); ws.addEventListener('error',r) })
  let id=0; const w=new Map()
  ws.addEventListener('message', e=>{const m=JSON.parse(e.data); if(m.id&&w.has(m.id)){w.get(m.id)(m); w.delete(m.id)}})
  const send=(m,p={})=>new Promise(r=>{const i=++id; w.set(i,r); ws.send(JSON.stringify({id:i,method:m,params:p}))})
  const ev=async s=>(await send('Runtime.evaluate',{expression:s,awaitPromise:true,returnByValue:true})).result?.result?.value
  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride',{width:1700,height:1000,deviceScaleFactor:1,mobile:false})
  await send('Page.navigate',{url:process.argv[2]})
  await sleep(8000)
  console.log('初始卡片:', await ev(`document.querySelectorAll('.work-card').length`))
  await ev(`(()=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('增加视频模块')); if(b)b.click(); return 1})()`)
  await sleep(2000)
  await ev(`(()=>{
    const inputs=[...document.querySelectorAll('.edp-form input')];
    const set=(el,v,tag)=>{el.value=v; el.dispatchEvent(new Event(tag,{bubbles:true}))};
    if(inputs[0]) set(inputs[0],'自动化测试模块','input');
    const fmt=[...document.querySelectorAll('.edp-form select')].find(s=>[...s.options].some(o=>o.textContent.includes('16:9')));
    if(fmt) set(fmt,'h','change');
    return 1
  })()`)
  await sleep(1200)
  console.log('点击添加:', await ev(`(()=>{const b=[...document.querySelectorAll('.edp-form button')].find(x=>x.textContent.trim()==='添加'); if(b){b.click();return true} return false})()`))
  await sleep(6000)
  console.log('结果:', await ev(`JSON.stringify({卡片数:document.querySelectorAll('.work-card').length, 含新标题:document.body.innerText.includes('自动化测试模块'), 面板条数:document.querySelectorAll('.edp-list li').length})`))
  ws.close(); process.exit(0)
})()
