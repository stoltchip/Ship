// === Config ===
const MAIL_TO = "kabanekna102@gmail.com"; // hidden in UI
const FORM_ENDPOINT = ""; // optional serverless endpoint
const STORAGE_CATALOG = "stolt_catalog_v2";
const STORAGE_ORDERS = "stolt_orders_v2";

// === Default catalog with per-size stock (can be edited in Admin) ===
const DEFAULT_CATALOG = [
  {
    id: "bodywarmer",
    naam: "Bodywarmer",
    omschrijving: "Warme bodywarmer met reflecterende strepen, ideaal voor buitenwerk in koel weer.",
img: "img/bodywarmer_hivis.webp"",
    sizes: [
      {label:"S", stock:2},
      {label:"M", stock:3},
      {label:"L", stock:3},
      {label:"XL", stock:2},
      {label:"XXL", stock:2},
    ]
  },
  {
    id: "werkjas",
    naam: "Werkjas",
    omschrijving: "Beschermende werkjas met reflectie, wind- en waterdicht.",
img: "img/werkjas_hivis.webp",
    sizes: [
      {label:"S", stock:2},
      {label:"M", stock:2},
      {label:"L", stock:3},
      {label:"XL", stock:2},
      {label:"XXL", stock:1},
    ]
  },
  {
    id: "schoenen_laag",
    naam: "Veiligheidsschoenen (laag)",
    omschrijving: "Lichte veiligheidsschoenen met stalen neus en antislip zool.",
    img: "img/schoenen_atlas_laag.jpg",
    sizes: [
      {label:"39", stock:1},{label:"40", stock:1},{label:"41", stock:1},{label:"42", stock:1},
      {label:"43", stock:2},{label:"44", stock:1},{label:"45", stock:1},{label:"46", stock:0}
    ]
  },
  {
    id: "laarzen_hoog",
    naam: "Veiligheidslaarzen (hoog)",
    omschrijving: "Waterdichte laarzen met stalen neus, geschikt voor petrochemische omgeving.",
    img: "img/laarzen_atlas_hoog.jpg",
    sizes: [
      {label:"39", stock:1},{label:"40", stock:1},{label:"41", stock:1},{label:"42", stock:1},
      {label:"43", stock:1},{label:"44", stock:1},{label:"45", stock:0},{label:"46", stock:0}
    ]
  },
  {
    id: "chemiepak",
    naam: "Chemiepak (groen)",
    omschrijving: "Volledig chemisch bestendig pak voor gebruik in risicovolle zones.",
    img: "img/chemiepak_groen.jpg",
    sizes: [
      {label:"M", stock:1},{label:"L", stock:2},{label:"XL", stock:1},{label:"XXL", stock:1}
    ]
  },
  {
    id: "chemie_laarzen",
    naam: "Chemie laarzen",
    omschrijving: "Chemisch resistente werklaarzen met versterkte zool en teen.",
    img: "img/boots_dunlop.jpg",
    sizes: [
      {label:"39", stock:1},{label:"40", stock:2},{label:"41", stock:1},{label:"42", stock:1},
      {label:"43", stock:2},{label:"44", stock:2},{label:"45", stock:1},{label:"46", stock:0}
    ]
  }
];

// Load/save helpers
function loadCatalog(){
  try{
    const raw = localStorage.getItem(STORAGE_CATALOG);
    if(!raw) return JSON.parse(JSON.stringify(DEFAULT_CATALOG));
    return JSON.parse(raw);
  }catch{ return JSON.parse(JSON.stringify(DEFAULT_CATALOG)); }
}
function saveCatalog(cat){ localStorage.setItem(STORAGE_CATALOG, JSON.stringify(cat)); }

let catalog = loadCatalog();

// Orders for current browser (1 piece per product)
let ordered = {};
try { ordered = JSON.parse(localStorage.getItem(STORAGE_ORDERS) || "{}"); } catch { ordered = {}; }
function saveOrders(){ localStorage.setItem(STORAGE_ORDERS, JSON.stringify(ordered)); }

// UI helpers
const grid = document.getElementById('grid');
function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for (const [k,v] of Object.entries(attrs)){
    if (k === "class") n.className = v;
    else if (k.startsWith("on") && typeof v === "function") n.addEventListener(k.slice(2), v);
    else if (k === "html") n.innerHTML = v;
    else n.setAttribute(k,v);
  }
  for (const c of children) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  return n;
}

function totalStock(p){ return p.sizes.reduce((a,s)=>a+Number(s.stock||0),0); }

// Employee product cards
function buildCard(p){
  const select = el('select', { id:`sel-${p.id}` });
  select.appendChild(el('option', {value:"", disabled:true, selected:true}, 'Maat kiezen…'));
  p.sizes.forEach(s => {
    select.appendChild(el('option', {value:s.label, disabled: s.stock<=0}, `${s.label} (${s.stock})`));
  });

  const btn = el('button', {class:'btn', type:'button'}, 'Bestellen');

  function lockAsOrdered(maat){
    btn.classList.add('ok'); btn.textContent = '✅ Besteld'; btn.disabled = true;
    select.value = maat || ""; select.disabled = true;
  }

  if (ordered[p.id]) lockAsOrdered(ordered[p.id].maat);

  btn.addEventListener('click', () => {
    if (btn.disabled) return;
    if (!select.value){ alert('Kies eerst een maat voor ' + p.naam); return; }
    const size = p.sizes.find(s => s.label === select.value);
    if (!size || size.stock<=0){ alert('Deze maat is niet op voorraad.'); return; }
    // decrease stock in catalog and persist
    size.stock -= 1;
    ordered[p.id] = { maat: select.value, naam: p.naam };
    saveOrders(); saveCatalog(catalog);
    lockAsOrdered(select.value);
    // Update visible badge and options
    badge.textContent = `Voorraad: ${totalStock(p)} stuks`;
  });

  const badge = el('div', {class:'badge'}, `Voorraad: ${totalStock(p)} stuks`);

  const card = el('article', {class:'card', 'data-id':p.id},
    el('div', {class:'imgwrap'}, el('img', {src:p.img, alt:p.naam})),
    el('div', {class:'body'},
      el('div', {class:'hrow'},
        el('div', {class:'name'}, p.naam),
        badge,
      ),
      el('div', {class:'desc'}, p.omschrijving),
      select,
      el('div', {class:'small'}, 'Beschikbare aantallen per maat staan in het menu.'),
      btn
    )
  );
  return card;
}

function renderEmployee(){
  grid.innerHTML = "";
  catalog.forEach(p => grid.appendChild(buildCard(p)));
}

// Submit order
document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const naam = document.getElementById('naam').value.trim();
  const result = document.getElementById('result');
  if (!naam){ alert('Vul je naam in.'); return; }
  if (Object.keys(ordered).length === 0){ alert('Kies ten minste één product.'); return; }
  const items = Object.values(ordered).map(it => `- ${it.naam} — maat: ${it.maat}`).join('\n');
  const bodyText = `Naam: ${naam}\n\nBestelde producten:\n${items}`;
  const subject = encodeURIComponent('Interne bestelling – Magazijnuitgifte');
  const body = encodeURIComponent(bodyText);
  if (FORM_ENDPOINT){
    try{
      const res = await fetch(FORM_ENDPOINT, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ to: MAIL_TO, naam, bestellingen: ordered }) });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      result.textContent = '✅ Bestelling verzonden.';
    }catch(err){
      window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
      result.textContent = '📧 E-mail geopend om te verzenden.';
    }
  } else {
    window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
    result.textContent = '📧 E-mail geopend om te verzenden.';
  }
});

// === Admin panel ===
const adminTableBody = document.querySelector('#admin-panel tbody');

function renderAdminTable(){
  adminTableBody.innerHTML = "";
  catalog.forEach(p => {
    p.sizes.forEach((s, idx) => {
      const tr = el('tr', {},
        el('td', {}, idx===0 ? p.naam : ''),
        el('td', {}, s.label),
        el('td', {}, String(s.stock)),
        el('td', {},
          el('div', {class:'row'},
            el('button', {class:'btn', onclick:() => { s.stock += 1; saveCatalog(catalog); renderAdminTable(); }}, '+ 1'),
            el('button', {class:'btn danger', onclick:() => { if(s.stock>0) s.stock -= 1; saveCatalog(catalog); renderAdminTable(); }}, '− 1')
          )
        )
      );
      adminTableBody.appendChild(tr);
    });
  });
}

document.getElementById('add-form').addEventListener('submit', e => {
  e.preventDefault();
  const naam = document.getElementById('add-naam').value.trim();
  const img = document.getElementById('add-img').value.trim();
  const oms = document.getElementById('add-oms').value.trim();
  const maten = document.getElementById('add-maten').value.trim().split(',').map(s=>s.trim()).filter(Boolean);
  const qty = Math.max(0, parseInt(document.getElementById('add-qty').value||'0',10));
  if(!naam || !img || !oms || maten.length===0){ alert('Uzupełnij pola.'); return; }
  const id = naam.toLowerCase().replace(/[^a-z0-9]+/g,'_').slice(0,32);
  const sizes = maten.map(m => ({label:m, stock:qty}));
  catalog.push({ id, naam, omschrijving: oms, img: img.match(/^img\//) ? img : 'img/'+img, sizes });
  saveCatalog(catalog);
  renderAdminTable();
  alert('Produkt dodany. Możesz teraz korygować ilości w tabeli.');
  e.target.reset();
});

// Tabs switching
const tabEmp = document.getElementById('tab-employee');
const tabAdm = document.getElementById('tab-admin');
const employeePanel = document.getElementById('employee-panel');
const adminPanel = document.getElementById('admin-panel');

function activate(tab){
  if(tab==='emp'){
    tabEmp.classList.add('active'); tabAdm.classList.remove('active');
    employeePanel.classList.add('show'); adminPanel.classList.remove('show');
  }else{
    tabAdm.classList.add('active'); tabEmp.classList.remove('active');
    adminPanel.classList.add('show'); employeePanel.classList.remove('show');
    renderAdminTable();
  }
}
tabEmp.addEventListener('click', ()=>activate('emp'));
tabAdm.addEventListener('click', ()=>activate('adm'));
activate('emp'); // default
renderEmployee();


// =====================================================
// === FILES GRID: generowane z katalogu (Admin)     ===
// =====================================================

// Rozpoznawanie obrazków
const FILES_IMAGE_EXTS = [".png",".jpg",".jpeg",".webp",".gif",".avif",".bmp",".svg"];
const isImagePath = p => FILES_IMAGE_EXTS.some(ext => (p||"").toLowerCase().endsWith(ext));

// Ujednolicenie ścieżki (ładujemy względnie od strony głównej)
function normalizePath(p){
  if (!p) return "";
  if (p.startsWith("./") || p.startsWith("/")) return p;
  return "./" + p;
}

function makeFileCardFromProduct(prod){
  const file = normalizePath(prod.img || "");
  const title = prod.naam || prod.id || file;

  const thumb = isImagePath(file)
    ? el('img', { src:file, alt:title, class:'file-thumb', loading:'lazy', decoding:'async' })
    : el('div', { class:'file-thumb', style:'display:grid;place-items:center' }, 'Podgląd niedostępny');

  const name = el('div', { class:'file-name' }, `${title}${prod.img ? ` (${prod.img})` : ""}`);

  const open = el('a', { class:'btn', href:file, target:'_blank', rel:'noopener' }, 'Otwórz');
  const dl   = el('a', { class:'btn', href:file, download:'' }, 'Pobierz');

  const actions = el('div', { class:'file-actions' }, open, dl);
  return el('div', { class:'file-card' }, thumb, name, actions);
}

function renderFilesGridFromCatalog(){
  const wrap = document.getElementById('files-grid');
  if(!wrap) return;

  // unikalne obrazki wg prod.img (żeby nie dublować)
  const seen = new Set();
  wrap.innerHTML = "";
  catalog.forEach(prod => {
    const key = (prod && prod.img || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    wrap.appendChild(makeFileCardFromProduct(prod));
  });
}

// wyrenderuj listę plików po załadowaniu DOM
document.addEventListener('DOMContentLoaded', renderFilesGridFromCatalog);
