async function fetchInventory(){
  const res=await fetch(API_URL);
  const data=await res.json();
  const inv=document.getElementById('inventory');
  inv.innerHTML='';
  data.forEach(r=>{
    const sizes=JSON.parse(r.sizes_json||'{}');
    const div=document.createElement('div');
    div.className='item';
    div.innerHTML=`<h3>${r.name}</h3>`;
    Object.entries(sizes).forEach(([s,q])=>{
      const line=document.createElement('div');
      line.innerHTML=`${s}: <button onclick="update('${r.id}','${s}',-1)">-</button>
      <span id="${r.id}-${s}">${q}</span>
      <button onclick="update('${r.id}','${s}',1)">+</button>`;
      div.appendChild(line);
    });
    inv.appendChild(div);
  });
}
async function update(id,size,delta){
  const span=document.getElementById(`${id}-${size}`);
  let q=parseInt(span.textContent)+delta;
  if(q<0)q=0;
  span.textContent=q;
  const all=document.querySelectorAll(`[id^='${id}-']`);
  const sizes={};
  all.forEach(s=>{
    const parts=s.id.split('-'); sizes[parts[1]]=parseInt(s.textContent);
  });
  await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({token:ADMIN_TOKEN,id:id,sizes:sizes})});
}
function checkPIN(){
  const pin=document.getElementById('pin').value;
  if(pin==='2468'){
    document.getElementById('login').style.display='none';
    document.getElementById('panel').style.display='block';
    fetchInventory();
  }else alert('Verkeerde PIN');
}