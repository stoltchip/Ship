async function fetchData(){
  try{
    const res = await fetch(API_URL);
    const data = await res.json();
    renderProducts(data);
  }catch(e){
    alert('Kan gegevens uit het blad niet ophalen.');
  }
}
function safeParseSizes(v){
  if (v == null) return {};
  if (typeof v !== 'string') v = String(v);
  try { return JSON.parse(v); }
  catch(e){ console.warn('Fout in sizes_json:', v); return {}; }
}
function renderProducts(rows){
  const grid=document.getElementById('products'); grid.innerHTML='';
  rows.forEach(r=>{
    const sizes=safeParseSizes(r.sizes_json);
    const total=Object.values(sizes).reduce((a,b)=>a+(+b||0),0);
    const el=document.createElement('article'); el.className='card';
    el.innerHTML=`<img src="${r.image||'logo_stolt.png'}"><h3>${r.name||r.id}</h3><p>${r.desc||''}</p>
    <div class='meta'><span>Beschikbaar: <b>${total}</b></span>
    <label>Maat<select class='size'><option value=''>Kies</option></select></label></div>
    <button class='add'>Bestel</button>`;
    const sel=el.querySelector('select.size');
    Object.entries(sizes).forEach(([s,q])=>{
      const o=document.createElement('option');
      o.value=s; o.textContent=`${s} (${q})`; if(q<=0)o.disabled=true; sel.appendChild(o);
    });
    el.querySelector('.add').onclick=async()=>{
      const size=sel.value;
      if(!size){alert('Kies een maat');return;}
      if((sizes[size]||0)<=0){alert('Niet op voorraad');return;}
      const newSizes={...sizes,[size]:sizes[size]-1};
      const res=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({token:ADMIN_TOKEN,id:r.id,sizes:newSizes})});
      const txt=await res.text();
      if(txt!=='OK'){alert('Opslaan mislukt');return;}
      fetchData();
    };
    grid.appendChild(el);
  });
}
fetchData();