// Pracownik – widok live z Realtime Database
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const CART_KEY = 'stolt_cart_fb_v1';
const ORDERED_KEY = 'stolt_ordered_fb_v1';

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
    ul.appendChild(li);
  });
  $('#cart-count').textContent = String(items.length);
  $('#order-products').value = items.map(i=>i.name).join(', ');
  $('#order-sizes').value = items.map(i=>i.size).join(', ');
  $('#order-total').value = String(items.length);
  $('#submit-order').disabled = items.length === 0;
}

function renderProducts(data){
  const grid = $('#products'); grid.innerHTML = '';
  Object.values(data).forEach(p => {
    const total = Object.values(p.sizes||{}).reduce((a,b)=>a+(+b||0),0);
    const card = document.createElement('article');
    card.className = 'card';
    card.dataset.id = p.id;
    card.dataset.name = p.name;
    card.innerHTML = `
      <img src="${p.image||'logo_stolt.png'}" alt="${p.name}">
      <h3>${p.name}</h3>
      <p>${p.desc||''}</p>
      <div class="meta">
        <span class="stock">Voorraad: <b class="stock-count">${total}</b> stuks</span>
        <label class="maat">
          <span>Maat</span>
          <select class="size"><option value="">Kies maat</option></select>
        </label>
      </div>
      <button class="add">Bestellen</button>
    `;
    const sel = card.querySelector('select.size');
    Object.entries(p.sizes||{}).forEach(([size, qty])=>{
      const opt = document.createElement('option');
      opt.value = size;
      opt.textContent = qty>0 ? `${size} (${qty})` : `${size} (0)`;
      if(qty<=0) opt.disabled = true;
      sel.appendChild(opt);
    });
    const btn = card.querySelector('.add');
    if(isOrdered(p.id) || total<=0){ btn.textContent = isOrdered(p.id)?'Besteld ✓':'Niet beschikbaar'; btn.disabled = true; }
    btn.onclick = async () => {
      const size = sel.value;
      if(!size){ alert('Kies eerst een maat.'); return; }
      if(isOrdered(p.id)) return;
      try {
        await firebase.database().ref(`inventory/${p.id}/sizes/${size}`).transaction(cur => {
          cur = Number(cur||0);
          if(cur <= 0) return; // abort
          return cur - 1;
        });
        if(!loadCart().find(i=>i.id===p.id)){
          saveCart([...loadCart(), {id:p.id, name:p.name, size}]);
        }
        btn.textContent = 'Besteld ✓'; btn.disabled = true;
        renderCart();
      } catch(e){
        alert('Niet beschikbaar.');
      }
    };
    grid.appendChild(card);
  });
}

function boot(){
  firebase.database().ref('inventory').on('value', snap => {
    const val = snap.val() || {};
    renderProducts(val);
  });
  renderCart();
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
}
document.addEventListener('DOMContentLoaded', boot);

document.getElementById('reset-cart')?.addEventListener('click', ()=>{
  localStorage.removeItem(CART_KEY);
  renderCart();
});
