
/* ----------------- CONFIG ----------------- */
/* Vul deze 2 waarden in (README.md legt uit) */
const SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || 'https://rkuzmwmtxlwriuhumynb.supabase.co';
const SUPABASE_ANON_KEY = localStorage.getItem('SUPABASE_ANON_KEY') || '<eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrdXptd210eGx3cml1aHVteW5iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzcwNjIsImV4cCI6MjA3ODUxMzA2Mn0.E0NJZfXSZHOpg2JYWfywjNjbu5vs46Y0_aIgIKFxEGk>';
const EMAIL_ONTVANGER = localStorage.getItem('EMAIL_ONTVANGER') || 'magazijn@example.com'; // wordt gebruikt in mailto fallback

/* Admin PIN */
const ADMIN_PIN = '2468';

/* Supabase client (wordt pas gebruikt na admin login of voor lezen) */
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* Productdefinities (ID komt overeen met 'slug' in DB) */
const PRODUCTS = [
  {
    slug:'bodywarmer-hivis',
    name:'Bodywarmer Hi-Vis',
    description:'Signalisatie bodywarmer, geel/marine, met reflecterende banden; ideaal voor operators.',
    image:'img/bodywarmer_hivis.jpg',
    sizes:['S','M','L','XL','2XL','3XL']
  },
  {
    slug:'werkjas-hivis',
    name:'Werkjas Hi-Vis',
    description:'High-visibility werkjas, duurzaam en waterafstotend, met reflectie.',
    image:'img/werkjas_hivis.jpg',
    sizes:['S','M','L','XL','2XL','3XL']
  },
  {
    slug:'chemiepak-groen',
    name:'Chemiepak Groen',
    description:'Gas- en vloeistofdicht overall met capuchon, voor chemische werkzaamheden.',
    image:'img/chemiepak_groen.jpg',
    sizes:['S','M','L','XL','2XL']
  },
  {
    slug:'laarzen-dunlop',
    name:'Dunlop Laarzen (hoog)',
    description:'Dunlop Acifort werklaars, olie- en chemiebestendig, antislip zool.',
    image:'img/laarzen_dunlop.jpg',
    sizes:['39','40','41','42','43','44','45','46','47']
  },
  {
    slug:'laarzen-atlas-hoog',
    name:'Atlas Laarzen (hoog)',
    description:'Atlas veiligheidslaars, S3, waterafstotend leder en teenbescherming.',
    image:'img/laarzen_atlas_hoog.jpg',
    sizes:['39','40','41','42','43','44','45','46','47']
  },
  {
    slug:'schoenen-atlas-laag',
    name:'Atlas Schoenen (laag)',
    description:'Atlas veiligheidsschoen laag model, S3, ademende voering en stalen neus.',
    image:'img/schoenen_atlas_laag.jpg',
    sizes:['39','40','41','42','43','44','45','46','47']
  }
];

/* ----------------- UI helpers ----------------- */
const $ = (q,root=document)=>root.querySelector(q);
const $$ = (q,root=document)=>Array.from(root.querySelectorAll(q));
$('#year').textContent = new Date().getFullYear();

/* Tabs */
$$('.tab-btn').forEach(btn=>btn.addEventListener('click',()=>{
  $$('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  $$('.tab').forEach(s=>s.classList.remove('active'));
  $('#'+btn.dataset.tab).classList.add('active');
}));

function toast(msg){
  alert(msg);
}

/* ----------------- DB helpers ----------------- */
async function ensureSchema(){
  // tries to create tables if not exist using RPC via SQL not possible here; provide seed button for stock entries.
  return true;
}

async function fetchStock(){
  const { data, error } = await sb.from('stock').select('*');
  if(error){ console.error(error); return []; }
  return data;
}

async function upsertStock(rows){
  const { data, error } = await sb.from('stock').upsert(rows).select();
  if(error){ console.error(error); toast('Fout bij opslaan voorraad.'); }
  return data;
}

async function decrementStock(item){
  // item = {slug, size, qty:1}
  const { data, error } = await sb.rpc('decrement_stock', { p_slug:item.slug, p_size:item.size, p_qty:item.qty });
  if(error){ console.error(error); throw error; }
  return data;
}

async function insertOrder(order){
  const { data, error } = await sb.from('orders').insert(order).select().single();
  if(error){ console.error(error); throw error; }
  return data;
}

/* ----------------- Render producten ----------------- */
let STOCK_CACHE = {}; // {slug: {size: qty}}
function applyStockToCache(rows){
  STOCK_CACHE = {};
  rows.forEach(r=>{
    if(!STOCK_CACHE[r.slug]) STOCK_CACHE[r.slug]={};
    STOCK_CACHE[r.slug][r.size]=r.quantity;
  });
}

function sizeOptions(product){
  const sizes = product.sizes;
  const stock = STOCK_CACHE[product.slug] || {};
  return ['<option value="">Kies maat…</option>'].concat(
    sizes.map(s=>{
      const hasEntry = Object.prototype.hasOwnProperty.call(stock, s);
      const qty = hasEntry ? stock[s] : null; // null = stan nieznany (jeszcze nie pobrano)
      const disabled = (qty === 0) ? 'disabled' : ''; // blokuj tylko, gdy mamy pewne 0
      const label = (qty === 0)
        ? `${s} — niet op voorraad`
        : (qty > 0)
          ? `${s} — ${qty} op voorraad`
          : `${s} — voorraad onbekend`;
      return `<option ${disabled} value="${s}">${label}</option>`;
    })
  ).join('');
}


function renderProducts(){
  const grid = $('#product-grid');
  grid.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const el = document.createElement('div');
    el.className='card';
    el.innerHTML = `
      <img src="${p.image}" alt="${p.name}"/>
      <div class="content">
        <span class="badge">1 stuk per product</span>
        <h3>${p.name}</h3>
        <p class="tiny">${p.description}</p>
        <select class="size-select" data-slug="${p.slug}">
          ${sizeOptions(p)}
        </select>
        <div class="actions">
          <button class="btn add-btn" data-slug="${p.slug}">Toevoegen</button>
          <button class="btn ghost go-cart">Naar winkelwagen</button>
        </div>
      </div>
    `;
    grid.appendChild(el);
  });

  $$('.go-cart').forEach(b=>b.addEventListener('click',()=>{
    $$('.tab-btn').find(x=>x.dataset.tab==='winkelwagen').click();
  }));

  $$('.add-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const slug = btn.dataset.slug;
    const product = PRODUCTS.find(x=>x.slug===slug);
    const select = btn.closest('.card').querySelector('.size-select');
    const size = select.value;
    if(!size){ toast('Kies eerst een maat.'); return; }
    addToCart({slug, size, qty:1});
  }));
}

/* ----------------- Winkelwagen ----------------- */
let CART = []; // [{slug,size,qty}]
function saveCart(){ localStorage.setItem('CART', JSON.stringify(CART)); }
function loadCart(){ try{ CART = JSON.parse(localStorage.getItem('CART')||'[]'); }catch{ CART=[]; } }
function addToCart(item){
  // slechts één per product: vervang bestaande
  const idx = CART.findIndex(i=>i.slug===item.slug);
  if(idx>-1){ CART[idx]=item; } else { CART.push(item); }
  saveCart(); renderCart(); toast('Toegevoegd aan winkelwagen.');
}

function removeFromCart(slug){
  CART = CART.filter(i=>i.slug!==slug); saveCart(); renderCart();
}

function renderCart(){
  const list = $('#cart-list'); list.innerHTML='';
  if(CART.length===0){ list.innerHTML='<p class="tiny">Je winkelwagen is leeg.</p>'; return; }
  CART.forEach(it=>{
    const p = PRODUCTS.find(x=>x.slug===it.slug);
    const row = document.createElement('div');
    row.className='cart-item';
    row.innerHTML = `
      <img src="${p.image}" alt="${p.name}"/>
      <div style="flex:1">
        <strong>${p.name}</strong>
        <div class="tiny">Maat: ${it.size} • Aantal: ${it.qty}</div>
      </div>
      <button class="btn" data-slug="${it.slug}">Verwijderen</button>
    `;
    row.querySelector('button').addEventListener('click',()=>removeFromCart(it.slug));
    list.appendChild(row);
  });
}
$('#btn-clear-cart').addEventListener('click',()=>{ CART=[]; saveCart(); renderCart(); });

/* ----------------- Bestellen ----------------- */
$('#order-form').addEventListener('submit', async (e)=>{
  e.preventDefault();
  if(CART.length===0){ return toast('Winkelwagen is leeg.'); }
  const form = new FormData(e.target);
  const order = {
    name: form.get('name'),
    email: form.get('email'),
    department: form.get('department')||null,
    notes: form.get('notes')||null,
    items: CART,
  };
  try{
    // 1) Maak bestelling in DB
    await insertOrder({ ...order });
    // 2) Verlaag voorraad per item
    for(const it of CART){ await decrementStock({ ...it }); }
    // 3) Sync en UI
    await loadAndRender();
    CART=[]; saveCart(); renderCart();
    // 4) Mailto fallback voor notificatie
    const body = encodeURIComponent(`Nieuwe bestelling:\n\n${order.name} (${order.email})\nAfdeling: ${order.department||'-'}\n\nItems:\n${order.items.map(i=>{
      const p = PRODUCTS.find(x=>x.slug===i.slug); return `- ${p.name}, maat ${i.size}, x${i.qty}`
    }).join('\n')}\n\nOpmerkingen:\n${order.notes||'-'}`);
    window.location.href = `mailto:${EMAIL_ONTVANGER}?subject=Nieuwe PBM bestelling&body=${body}`;
    toast('Bestelling geplaatst.');
  }catch(err){
    console.error(err);
    toast('Plaatsen mislukt. Controleer verbinding met Supabase.');
  }
});

/* ----------------- Admin ----------------- */
$('#btn-admin-login').addEventListener('click', async ()=>{
  const pin = $('#admin-pin').value.trim();
  if(pin !== ADMIN_PIN){ return toast('Onjuiste PIN.'); }
  $('#admin-locked').classList.add('hidden');
  $('#admin-area').classList.remove('hidden');
  await loadAndRender();
});

$('#btn-sync').addEventListener('click', loadAndRender);

$('#btn-seed').addEventListener('click', async ()=>{
  // vul stock voor alle maten met 10 (indien niet aanwezig)
  const rows=[];
  PRODUCTS.forEach(p=>p.sizes.forEach(s=>rows.push({slug:p.slug,size:s,quantity:10})));
  await upsertStock(rows);
  await loadAndRender();
  toast('Demo-data aangemaakt.');
});

function renderAdminTable(){
  const container = $('#admin-table');
  const rows=[];
  PRODUCTS.forEach(p=>{
    const stock = STOCK_CACHE[p.slug]||{};
    p.sizes.forEach(size=>{
      rows.push({slug:p.slug, name:p.name, size, qty: stock[size] ?? 0});
    });
  });
  let html = '<div class="notice tiny">Wijzig de aantallen en klik op "Opslaan" onderaan.</div>';
  html += '<table class="table"><thead><tr><th>Product</th><th>Maat</th><th>Voorraad</th></tr></thead><tbody>';
  rows.forEach(r=>{
    html += `<tr>
      <td>${r.name}</td>
      <td>${r.size}</td>
      <td><input class="qty-input" type="number" min="0" value="${r.qty}" data-slug="${r.slug}" data-size="${r.size}"/></td>
    </tr>`;
  });
  html += '</tbody></table><div style="margin-top:8px"><button id="btn-save" class="btn primary">Opslaan</button></div>';
  container.innerHTML = html;
  $('#btn-save').addEventListener('click', async ()=>{
    const inputs = $$('.qty-input');
    const updates = inputs.map(i=>({slug:i.dataset.slug, size:i.dataset.size, quantity: Number(i.value||0)}));
    await upsertStock(updates);
    await loadAndRender();
    toast('Voorraad opgeslagen.');
  });
}

/* ----------------- Load & render ----------------- */
async function loadAndRender(){
  const stock = await fetchStock();
  applyStockToCache(stock);
  renderProducts();
  renderCart();
}

/* Init */
loadCart();
loadAndRender();
