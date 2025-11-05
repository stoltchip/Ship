
// Config (email versturen):
// Standaard wordt 'mailto:' gebruikt (opent emailclient).
// Als je een serverloze endpoint hebt (bijv. Formspree), vul hieronder in:
const FORM_ENDPOINT = ""; // bv. "https://formspree.io/f/xxxxxx"
const MAIL_TO = "kabanekna102@gmail.com"; // verborgen in UI

const CATALOG = [
  {
    id: "bodywarmer",
    categorie: "werkkleding",
    naam: "Bodywarmer",
    omschrijving: "Warme bodywarmer met reflecterende strepen, ideaal voor buitenwerk in koel weer.",
    maat: ["S","M","L","XL","XXL"],
    voorraad: 12,
    img: "img/bodywarmer_geel.png"
  },
  {
    id: "werkjas",
    categorie: "werkkleding",
    naam: "Werkjas",
    omschrijving: "Beschermende werkjas met reflectie, wind- en waterdicht.",
    maat: ["S","M","L","XL","XXL"],
    voorraad: 10,
    img: "img/werkjas_geel.png"
  },
  {
    id: "schoenen_laag",
    categorie: "veiligheid",
    naam: "Veiligheidsschoenen (laag)",
    omschrijving: "Lichte veiligheidsschoenen met stalen neus en antislip zool.",
    maat: ["39","40","41","42","43","44","45","46"],
    voorraad: 8,
    img: "img/atlas_schoenen_laag.png"
  },
  {
    id: "laarzen_hoog",
    categorie: "veiligheid",
    naam: "Veiligheidslaarzen (hoog)",
    omschrijving: "Waterdichte laarzen met stalen neus, geschikt voor petrochemische omgeving.",
    maat: ["39","40","41","42","43","44","45","46"],
    voorraad: 6,
    img: "img/atlas_laarzen_hoog.png"
  },
  {
    id: "chemiepak",
    categorie: "chemie",
    naam: "Chemiepak (groen)",
    omschrijving: "Volledig chemisch bestendig pak voor gebruik in risicovolle zones.",
    maat: ["M","L","XL","XXL"],
    voorraad: 5,
    img: "img/chemiepak_groen.png"
  },
  {
    id: "chemie_laarzen",
    categorie: "chemie",
    naam: "Chemie laarzen",
    omschrijving: "Chemisch resistente werklaarzen met versterkte zool en teen.",
    maat: ["39","40","41","42","43","44","45","46"],
    voorraad: 10,
    img: "img/dunlop_chem_laarzen.png"
  }
];

const state = {}; // id -> { maat }
const grids = {
  werkkleding: document.getElementById('grid-werkkleding'),
  veiligheid: document.getElementById('grid-veiligheid'),
  chemie: document.getElementById('grid-chemie'),
};

function el(tag, attrs={}, ...children){
  const n = document.createElement(tag);
  for(const [k,v] of Object.entries(attrs)){
    if(k === 'class') n.className = v;
    else if(k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if(k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  }
  for(const c of children){
    if(c==null) continue;
    n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return n;
}

function productCard(p){
  const select = el('select', { required: true });
  select.appendChild(el('option', {value:"", disabled:true, selected:true}, 'Maat kiezen...'));
  p.maat.forEach(m => select.appendChild(el('option', {value:m}, m)));

  const btn = el('button', {class:'btn', type:'button', onclick:() => {
    if(btn.disabled) return;
    if(!select.value){
      alert('Kies eerst een maat voor ' + p.naam);
      return;
    }
    state[p.id] = { maat: select.value, naam: p.naam };
    btn.classList.add('ok');
    btn.innerHTML = '✅ Besteld';
    btn.disabled = true;
    select.disabled = true;
  }}, 'Bestellen');

  const card = el('article', {class:'card', 'data-id':p.id},
    el('div', {class:'imgwrap'}, el('img', {src:p.img, alt:p.naam})),
    el('div', {class:'body'},
      el('div', {class:'hdr'},
        el('div', {class:'name'}, p.naam),
        el('div', {class:'badge'}, 'Voorraad: ' + p.voorraad)
      ),
      el('div', {class:'desc'}, p.omschrijving),
      el('div', {class:'row'},
        el('label', {for:'sel-'+p.id, class:'small'}, 'Maat'),
        ),
      select,
      btn
    )
  );
  select.id = 'sel-'+p.id;
  return card;
}

function mount(){
  for(const p of CATALOG){
    const card = productCard(p);
    grids[p.categorie].appendChild(card);
  }
}

function buildOrderBody(naam){
  const items = Object.entries(state).map(([id, data]) => `- ${data.naam} — maat: ${data.maat}`);
  const body = [
    `Naam: ${naam}`,
    ``,
    `Bestelde producten:`,
    ...items
  ].join('\n');
  return body;
}

document.getElementById('order-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const naam = document.getElementById('naam').value.trim();
  const result = document.getElementById('result');
  const items = Object.keys(state).length;
  if(!naam){ alert('Vul je naam in.'); return; }
  if(items === 0){ alert('Kies ten minste één product.'); return; }

  const subject = encodeURIComponent('Interne bestelling – Magazijnuitgifte');
  const body = encodeURIComponent(buildOrderBody(naam));

  if(FORM_ENDPOINT){
    // Optional: POST naar serverloze endpoint
    try{
      const res = await fetch(FORM_ENDPOINT, {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ naam, to: MAIL_TO, items: state })
      });
      if(!res.ok) throw new Error('Versturen mislukt');
      result.textContent = '✅ Bestelling verzonden.';
    }catch(err){
      // fallback naar mailto
      window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
      result.textContent = '📧 E-mail geopend om te verzenden.';
    }
  }else{
    // mailto fallback (geen email zichtbaar in UI)
    window.location.href = `mailto:${MAIL_TO}?subject=${subject}&body=${body}`;
    result.textContent = '📧 E-mail geopend om te verzenden.';
  }
});

mount();
