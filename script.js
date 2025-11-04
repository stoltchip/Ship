const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const KEY = 'purchased_v1';

function getPurchased() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch(e){ return []; }
}
function setPurchased(arr) {
  localStorage.setItem(KEY, JSON.stringify(arr));
}

function markAsPurchased(id, btn){
  const purchased = new Set(getPurchased());
  purchased.add(id);
  setPurchased([...purchased]);
  btn.textContent = 'Kupione ✓';
  btn.disabled = true;
  btn.classList.add('done');
  const badge = document.createElement('span');
  badge.className = 'badge';
  badge.textContent = 'Kupione';
  const h3 = btn.closest('.card').querySelector('h3');
  if(h3 && !h3.nextElementSibling?.classList?.contains('badge')){
    h3.appendChild(badge);
  }
}

function restoreState(){
  const purchased = new Set(getPurchased());
  $$('#products .card').forEach(card=>{
    const id = card.dataset.id;
    const btn = card.querySelector('.free');
    if(purchased.has(id)){
      btn.textContent = 'Kupione ✓';
      btn.disabled = true;
      const badge = document.createElement('span');
      badge.className = 'badge';
      badge.textContent = 'Kupione';
      const h3 = card.querySelector('h3');
      h3.appendChild(badge);
    }
    btn.addEventListener('click', ()=> markAsPurchased(id, btn));
  });
}

function init(){
  restoreState();
  $('#year').textContent = new Date().getFullYear();
  $('#reset').addEventListener('click', ()=>{
    if(confirm('Wyczyścić status zakupów na tym urządzeniu?')){
      localStorage.removeItem(KEY);
      location.reload();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);
