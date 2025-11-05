const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const OVERRIDES_KEY = 'stolt_inventory_overrides_v1';
const ADMIN_PIN = '2468'; // zmień w razie potrzeby

function loadOverrides(){ try { return JSON.parse(localStorage.getItem(OVERRIDES_KEY) || '{}'); } catch(e){ return {}; } }
function saveOverrides(obj){ localStorage.setItem(OVERRIDES_KEY, JSON.stringify(obj)); }

function readCatalog(){
  return [
    {id:'bodywarmer', name:'Bodywarmer', sizes:{S:2,M:3,L:4,XL:2,XXL:1}},
    {id:'werkjas', name:'Werkjas', sizes:{S:2,M:2,L:3,XL:2,XXL:1}},
    {id:'schoenen-laag', name:'Veiligheidsschoenen (laag)', sizes:{39:2,40:0,41:5,42:1,43:0,44:3,45:0,46:1}},
    {id:'laarzen-hoog', name:'Veiligheidslaarzen (hoog)', sizes:{39:1,40:1,41:2,42:1,43:0,44:1,45:0,46:0}},
    {id:'chemiepak', name:'Chemiepak (groen)', sizes:{M:2,L:2,XL:1,XXL:0}},
    {id:'chemie-laarzen', name:'Chemie laarzen', sizes:{39:1,40:2,41:2,42:2,43:1,44:1,45:1,46:0}},
  ];
}

function mergedSizes(prod, overrides){
  const base = {...prod.sizes};
  if(overrides[prod.id]){
    Object.entries(overrides[prod.id]).forEach(([k,v])=> base[k]=v);
  }
  return base;
}

function renderAdmin(){
  const list = $('#adminList'); list.innerHTML='';
  const overrides = loadOverrides();
  const catalog = readCatalog();

  catalog.forEach(prod => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    const title = document.createElement('div');
    title.className = 'rowx';
    title.innerHTML = `<strong>${prod.name}</strong><span class="badge">ID: ${prod.id}</span>`;
    card.appendChild(title);

    const sizes = mergedSizes(prod, overrides);
    Object.entries(sizes).forEach(([size, qty]) => {
      const row = document.createElement('div');
      row.className = 'rowx';
      row.innerHTML = `<span>Maat <b>${size}</b></span>`;

      const ctr = document.createElement('div');
      ctr.className = 'controls';
      const minus = document.createElement('button'); minus.textContent = '–';
      const inp = document.createElement('input'); inp.type='number'; inp.value = qty; inp.style.width='70px';
      const plus = document.createElement('button'); plus.textContent = '+';

      minus.onclick = ()=>{ inp.value = Number(inp.value)-1; inp.dispatchEvent(new Event('change')); };
      plus.onclick = ()=>{ inp.value = Number(inp.value)+1; inp.dispatchEvent(new Event('change')); };

      inp.addEventListener('change', ()=>{
        const o = loadOverrides();
        o[prod.id] = Object.assign({}, mergedSizes(prod, o), {[size]: Number(inp.value)});
        saveOverrides(o);
      });

      ctr.append(minus, inp, plus);
      row.appendChild(ctr);
      card.appendChild(row);
    });

    list.appendChild(card);
  });
}

function guard(){
  $('#unlock').addEventListener('click', ()=>{
    const pin = $('#pin').value.trim();
    if(pin === ADMIN_PIN){
      $('#adminPanel').style.display = 'block';
      $('#pinStatus').textContent = 'Ontgrendeld';
      renderAdmin();
    }else{
      $('#pinStatus').textContent = 'Onjuist PIN';
    }
  });

  $('#resetLocal').addEventListener('click', ()=>{
    if(confirm('Wyczyścić lokalne zmiany magazynu?')){
      localStorage.removeItem(OVERRIDES_KEY);
      renderAdmin();
    }
  });

  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', guard);
