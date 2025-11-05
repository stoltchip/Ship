const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

// Klant-side limieten / opslag
const CART_KEY = 'stolt_cart_v1';
const ORDERED_KEY = 'stolt_ordered_once_v1'; // zapamiętuje co użytkownik już kiedyś zamówił (1 sztuka / artykuł)

function load(key, fallback){ try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); } catch(e){ return fallback; } }
function save(key, value){ localStorage.setItem(key, JSON.stringify(value)); }

function loadCart(){ return load(CART_KEY, []); }
function saveCart(items){ save(CART_KEY, items); }

function isAlreadyOrdered(id){
  const set = new Set(load(ORDERED_KEY, []));
  return set.has(id);
}
function markOrdered(ids){
  const set = new Set(load(ORDERED_KEY, []));
  ids.forEach(id => set.add(id));
  save(ORDERED_KEY, [...set]);
}

// Render winkelwagen + payload do formularza
function renderCart(){
  const items = loadCart();
  const list = $('#cart-items');
  list.innerHTML = '';
  let totalCount = 0;
  items.forEach(it => {
    const li = document.createElement('li');
    const left = document.createElement('div');
    left.textContent = `${it.name}`;
    const right = document.createElement('div');
    right.className = 'qty';
    // limit 1 sztuka — nie pokazujemy +/- tylko usuń
    const del = document.createElement('button'); del.textContent = '✕';
    del.title = 'Verwijderen';
    del.onclick = ()=> removeItem(it.id);
    right.append(del);
    li.append(left, right);
    list.append(li);
    totalCount += 1;
  });
  $('#cart-count').textContent = totalCount;

  // payload
  $('#order-products').value = items.map(i => i.name).join(', ');
  $('#order-qty').value = items.map(_ => 1).join(', ');
  $('#order-total').value = String(totalCount);
  $('#order-notes-hidden').value = $('#order-notes').value || '';

  $('#submit-order').disabled = items.length === 0;
}

function addToCart(prod){
  const items = loadCart();
  if(items.find(i => i.id === prod.id)) return; // już w koszyku
  items.push(prod);
  saveCart(items);
  renderCart();
}

function removeItem(id){
  let items = loadCart().filter(i => i.id !== id);
  saveCart(items);
  renderCart();
  // Przywróć przycisk i "oddaj" 1 sztukę do lokalnego stanu
  const card = document.querySelector(`.card[data-id="${id}"]`);
  if(card){
    const btn = card.querySelector('button.add');
    const stockEl = card.querySelector('.stock-count');
    btn.textContent = 'Bestellen';
    btn.disabled = false;
    stockEl.textContent = String(Number(stockEl.textContent) + 1);
  }
}

function initCatalog(){
  $$('.card').forEach(card => {
    const btn = card.querySelector('button.add');
    const stockEl = card.querySelector('.stock-count');
    const id = card.dataset.id;
    const name = card.dataset.name;

    // zablokuj jeśli 0 lub jeśli wcześniej zamówiono
    if(Number(stockEl.textContent) <= 0 || isAlreadyOrdered(id)){
      btn.textContent = isAlreadyOrdered(id) ? 'Besteld ✓' : 'Niet beschikbaar';
      btn.disabled = true;
    }

    btn.addEventListener('click', () => {
      const stock = Number(stockEl.textContent);
      if(stock <= 0) return;
      // dodaj 1 sztukę i zmniejsz lokalny stan
      addToCart({ id, name });
      stockEl.textContent = String(stock - 1);
      btn.textContent = 'Besteld ✓';
      btn.disabled = true;
    });
  });
}

function initForm(){
  renderCart();

  $('#order-notes').addEventListener('input', ()=>{
    $('#order-notes-hidden').value = $('#order-notes').value || '';
  });

  $('#reset-cart').addEventListener('click', ()=>{
    if(confirm('Winkelwagen resetten?')){
      localStorage.removeItem(CART_KEY);
      renderCart();
      // przywróć guziki i lokalny stock
      $$('.card').forEach(card => {
        const btn = card.querySelector('button.add');
        const base = Number(card.getAttribute('data-stock'));
        card.querySelector('.stock-count').textContent = String(base);
        btn.textContent = isAlreadyOrdered(card.dataset.id) ? 'Besteld ✓' : 'Bestellen';
        btn.disabled = isAlreadyOrdered(card.dataset.id);
      });
    }
  });

  // Po wysłaniu — oznacz produkty jako "zamówione" (1 sztuka / artykuł) i wyczyść koszyk
  $('#order-form').addEventListener('submit', () => {
    const ids = loadCart().map(i => i.id);
    markOrdered(ids);
    saveCart([]);
  });
}

function init(){
  // Ustaw wstępne liczniki zgodnie z data-stock
  $$('.card').forEach(card => {
    const base = Number(card.getAttribute('data-stock') || '0');
    card.querySelector('.stock-count').textContent = String(base);
  });
  initCatalog();
  initForm();
  $('#year').textContent = new Date().getFullYear();
}

document.addEventListener('DOMContentLoaded', init);
