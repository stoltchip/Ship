const $ = s => document.querySelector(s);
const CART_KEY = 'stolt_cart_v1';

const load = (k,f)=>{ try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch(e){return f}};
const save = (k,v)=> localStorage.setItem(k, JSON.stringify(v));

function renderCart(){
  const items = load(CART_KEY, []);
  const ul = document.getElementById('cart-items'); ul.innerHTML='';
  items.forEach(it=>{
    const li=document.createElement('li');
    li.textContent = `${it.name} — rozmiar: ${it.size}`;
    ul.appendChild(li);
  });
  document.getElementById('cart-count').textContent = items.length;
  document.getElementById('order-products').value = items.map(i=>i.name).join(', ');
  document.getElementById('order-sizes').value    = items.map(i=>i.size).join(', ');
  document.getElementById('order-total').value    = items.length;
  document.getElementById('submit-order').disabled = items.length===0;
}

function renderProducts(rows){
  const grid = document.getElementById('products'); grid.innerHTML='';
  rows.forEach(r=>{
    const sizes = JSON.parse(r.sizes_json||'{}');
    const total = Object.values(sizes).reduce((a,b)=>a+(+b||0),0);
    const el = document.createElement('article');
    el.className='card';
    el.innerHTML = `
      <img src="${r.image||'logo_stolt.png'}" alt="${r.name}">
      <h3>${r.name}</h3>
      <p>${r.desc||''}</p>
      <div class="meta">
        <span class="stock">Dostępne: <b>${total}</b></span>
        <label class="maat">
          <span>Rozmiar</span>
          <select class="size"><option value="">Wybierz</option></select>
        </label>
      </div>
      <button class="add">Zamów</button>
    `;
    const sel = el.querySelector('select.size');
    Object.entries(sizes).forEach(([size,qty])=>{
      const o = document.createElement('option');
      o.value=size; o.textContent = `${size} (${qty})`; if(qty<=0) o.disabled=true;
      sel.appendChild(o);
    });

    const btn = el.querySelector('.add');
    btn.disabled = total<=0;
    btn.onclick = async ()=>{
      const size = sel.value; if(!size) { alert('Wybierz rozmiar'); return; }
      if((sizes[size]||0)<=0){ alert('Brak na stanie'); return; }

      const newSizes = {...sizes, [size]: (sizes[size]-1)};
      const res = await fetch(API_URL, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ token: ADMIN_TOKEN, id: r.id, sizes: newSizes })
      });
      const txt = await res.text();
      if(txt!=='OK'){ alert('Nie udało się zapisać'); return; }

      save(CART_KEY, [...load(CART_KEY, []), {id:r.id, name:r.name, size}]);
      renderCart();
      sel.querySelectorAll('option').forEach(o=>{
        const s=o.value; if(!s) return;
        const q=newSizes[s]||0; o.textContent = `${s} (${q})`; o.disabled = q<=0;
      });
    };

    grid.appendChild(el);
  });
}

async function boot(){
  const y=document.getElementById('year'); if(y) y.textContent=new Date().getFullYear();
  document.getElementById('reset-cart')?.addEventListener('click', ()=>{ localStorage.removeItem(CART_KEY); renderCart(); });

  try{
    const res = await fetch(API_URL);
    const rows = await res.json();
    renderProducts(rows);
  }catch(e){
    alert('Nie mogę pobrać danych z arkusza.');
  }
  renderCart();
}
document.addEventListener('DOMContentLoaded', boot);
