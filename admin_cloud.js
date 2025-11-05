const $ = s => document.querySelector(s);

function parseSizes(s){
  const out={}; s.split(',').map(x=>x.trim()).filter(Boolean).forEach(p=>{
    const [k,v]=p.split(':').map(t=>t.trim()); if(k && !isNaN(v)) out[k]=Number(v);
  }); return out;
}

function renderAdmin(rows){
  const root = document.getElementById('adminList'); root.innerHTML='';
  rows.forEach(r=>{
    const sizes = JSON.parse(r.sizes_json||'{}');
    const card = document.createElement('div');
    card.className='admin-card';
    card.innerHTML = `<div class="rowx"><strong>${r.name}</strong><span>ID: ${r.id}</span></div>`;
    Object.entries(sizes).forEach(([size,qty])=>{
      const row = document.createElement('div'); row.className='rowx';
      const controls = document.createElement('div'); controls.className='controls';
      const minus = document.createElement('button'); minus.textContent='–';
      const input = document.createElement('input'); input.type='number'; input.value=qty; input.style.width='80px';
      const plus  = document.createElement('button'); plus.textContent='+';
      minus.onclick=()=>{ input.value=Number(input.value)-1; input.dispatchEvent(new Event('change')); };
      plus.onclick =()=>{ input.value=Number(input.value)+1; input.dispatchEvent(new Event('change')); };
      input.addEventListener('change', async ()=>{
        sizes[size] = Math.max(0, Number(input.value));
        await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ token: ADMIN_TOKEN, id:r.id, sizes }) });
      });
      controls.append(minus,input,plus);
      row.append(document.createTextNode(`Rozmiar ${size}`), controls);
      card.appendChild(row);
    });
    root.appendChild(card);
  });
}

async function loadData(){
  const res = await fetch(API_URL);
  return await res.json();
}

document.getElementById('unlock').addEventListener('click', async ()=>{
  if(document.getElementById('pin').value !== '2468'){ alert('Zły PIN'); return; }
  document.getElementById('lock').style.display='none';
  document.getElementById('panel').style.display='block';
  renderAdmin(await loadData());
});

document.getElementById('np_add').addEventListener('click', async ()=>{
  const id  = $('#np_id').value.trim();
  const name= $('#np_name').value.trim();
  const image=$('#np_image').value.trim();
  const type= $('#np_type').value.trim();
  const desc= $('#np_desc').value.trim();
  const sizes = parseSizes($('#np_sizes').value.trim());
  if(!id||!name||Object.keys(sizes).length===0){ alert('Uzupełnij ID, nazwę i rozmiary.'); return; }

  await fetch(API_URL, { method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ token: ADMIN_TOKEN, id, sizes }) });

  ['np_id','np_name','np_image','np_type','np_desc','np_sizes'].forEach(id=>$('#'+id).value='');
  renderAdmin(await loadData());
});

document.addEventListener('DOMContentLoaded', ()=>{ const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear(); });
