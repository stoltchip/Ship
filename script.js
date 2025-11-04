const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CART_KEY = 'stolt_cart_v3';
const ORDERED_KEY = 'stolt_ordered_once_v3';

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function loadCart(){ return load(CART_KEY, []); }
function saveCart(items){ save(CART_KEY, items); }

function isOrdered(id){ return new Set(load(ORDERED_KEY, [])).has(id); }
function addOrdered(ids){ const s = new Set(load(ORDERED_KEY, [])); ids.forEach(i=>s.add(i)); save(ORDERED_KEY, [...s]); }

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
    const base = Number(card.getAttribute('data-stock'));
    const countEl = card.querySelector('.stock-count');
    countEl.textContent = String(Number(countEl.textContent)+1);
    const btn = card.querySelector('.add');
    btn.textContent = 'Bestellen'; btn.disabled = false;
  }
  renderCart();
}

function initProducts(){
  $$('.card').forEach(card => {
    const id = card.dataset.id;
    const btn = card.querySelector('.add');
    const select = card.querySelector('select.size');
    const countEl = card.querySelector('.stock-count');
    countEl.textContent = card.getAttribute('data-stock') || '0';

    if(isOrdered(id) || Number(countEl.textContent) <= 0){
      btn.textContent = isOrdered(id) ? 'Besteld ✓' : 'Niet beschikbaar';
      btn.disabled = true;
    }

    btn.addEventListener('click', () => {
      const size = select.value;
      if(!size){ alert('Kies eerst een maat.'); return; }
      const stock = Number(countEl.textContent);
      if(stock <= 0 || isOrdered(id)) return;

      const items = loadCart();
      if(items.find(i=>i.id===id)) return; // 1 sztuka
      items.push({ id, name: card.dataset.name, size });
      saveCart(items);
      countEl.textContent = String(stock - 1);
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
        const base = Number(card.getAttribute('data-stock'));
        card.querySelector('.stock-count').textContent = String(base);
        const btn = card.querySelector('.add');
        btn.textContent = isOrdered(card.dataset.id) ? 'Besteld ✓' : 'Bestellen';
        btn.disabled = isOrdered(card.dataset.id);
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
