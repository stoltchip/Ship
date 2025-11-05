const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CART_KEY = 'stolt_cart_v_sizes_v1';
const ORDERED_KEY = 'stolt_ordered_once_v_sizes_v1';
const OVERRIDES_KEY = 'stolt_inventory_overrides_v1';

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function loadCart(){ return load(CART_KEY, []); }
function saveCart(items){ save(CART_KEY, items); }

function isOrdered(id){ return new Set(load(ORDERED_KEY, [])).has(id); }
function addOrdered(ids){ const s = new Set(load(ORDERED_KEY, [])); ids.forEach(i=>s.add(i)); save(ORDERED_KEY, [...s]); }

function getSizeMap(card){
  const base = JSON.parse(card.getAttribute('data-sizes') || '{}');
  const overrides = load(OVERRIDES_KEY, {});
  if(overrides[card.dataset.id]){
    return {...base, ...overrides[card.dataset.id]};
  }
  return base;
}
function totalFromMap(map){ return Object.values(map).reduce((a,b)=>a+(+b||0),0); }

function renderCardSizes(card){
  const select = card.querySelector('select.size');
  const countEl = card.querySelector('.stock-count');
  const map = getSizeMap(card);
  const entries = Object.entries(map);
  select.innerHTML = '<option value="">Kies maat</option>';
  entries.forEach(([size, qty]) => {
    const opt = document.createElement('option');
    opt.value = size;
    opt.textContent = qty > 0 ? `${size} (${qty})` : `${size} (0)`;
    if(qty <= 0){ opt.disabled = true; }
    select.appendChild(opt);
  });
  countEl.textContent = String(totalFromMap(map));
}

function renderCart(){
  const items = loadCart();
  const ul = $('#cart-items'); ul.innerHTML = '';
  items.forEach(it => {
    const li = document.createElement('li');
    li.textContent = `${it.name} — maat: ${it.size}`;
    const del = document.createElement('button'); del.textContent = '✕'; del.onclick = ()=>removeItem(it.id);
    li.appendChild(del);
    ul.appendChild(li);
  });
  $('#cart-count').textContent = String(items.length);
  $('#order-products').value = items.map(i=>i.name).join(', ');
  $('#order-sizes').value = items.map(i=>i.size).join(', ');
  $('#order-total').value = String(items.length);
  $('#submit-order').disabled = items.length === 0;
}

function removeItem(id){
  saveCart(loadCart().filter(i=>i.id!==id));
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(card){
    renderCardSizes(card);
    const btn = card.querySelector('.add');
    if(!isOrdered(id)){ btn.textContent = 'Bestellen'; btn.disabled = false; }
  }
  renderCart();
}

function initProducts(){
  $$('.card').forEach(card => {
    const id = card.dataset.id;
    const btn = card.querySelector('.add');
    const select = card.querySelector('select.size');

    renderCardSizes(card);

    if(isOrdered(id) || totalFromMap(getSizeMap(card)) <= 0){
      btn.textContent = isOrdered(id) ? 'Besteld ✓' : 'Niet beschikbaar';
      btn.disabled = true;
    }

    btn.addEventListener('click', () => {
      const size = select.value;
      if(!size){ alert('Kies eerst een maat.'); return; }
      if(isOrdered(id)) return;

      const map = getSizeMap(card);
      if((map[size]||0) <= 0) { alert('Deze maat is niet beschikbaar.'); return; }

      const items = loadCart();
      if(items.find(i=>i.id===id)) return;
      items.push({ id, name: card.dataset.name, size });
      saveCart(items);

      const overrides = load(OVERRIDES_KEY, {});
      overrides[id] = {...map, [size]: (map[size]-1)};
      save(OVERRIDES_KEY, overrides);

      renderCardSizes(card);
      btn.textContent = 'Besteld ✓'; btn.disabled = true;
      renderCart();
    });
  });
}

function initForm(){
  $('#reset-cart').addEventListener('click', ()=>{
    if(confirm('Winkelwagen resetten?')){
      saveCart([]); renderCart();
      $$('.card').forEach(card => {
        if(!isOrdered(card.dataset.id)){
          const btn = card.querySelector('.add');
          btn.textContent = 'Bestellen'; btn.disabled = false;
        }
        renderCardSizes(card);
      });
    }
  });

  $('#order-form').addEventListener('submit', () => {
    addOrdered(loadCart().map(i=>i.id));
    saveCart([]);
  });
}

function init(){
  initProducts();
  initForm();
  renderCart();
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
}
document.addEventListener('DOMContentLoaded', init);
