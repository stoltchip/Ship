// Admin – logowanie + edycja magazynu w Firebase
const app = firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

const $ = s => document.querySelector(s);

function signedInUI(user){
  document.getElementById('authState').textContent = user ? `Zalogowano: ${user.email}` : 'Niezalogowany';
  document.getElementById('loginBtn').style.display = user ? 'none' : 'inline-block';
  document.getElementById('logoutBtn').style.display = user ? 'inline-block' : 'none';
  document.getElementById('adminPanel').style.display = user ? 'block' : 'none';
}

document.getElementById('loginBtn').addEventListener('click', async ()=>{
  const email = document.getElementById('email').value.trim();
  const pass  = document.getElementById('pass').value;
  try{
    await auth.signInWithEmailAndPassword(email, pass);
  }catch(e){
    alert('Logowanie nieudane'); console.error(e);
  }
});
document.getElementById('logoutBtn').addEventListener('click', async ()=>{
  await auth.signOut();
});

auth.onAuthStateChanged(async user => {
  signedInUI(user);
  if(user){
    // render panel from DB
    const snap = await db.ref('inventory').get();
    const items = snap.val() || {};
    renderAdmin(items);
  }
});

function renderAdmin(items){
  const root = document.getElementById('adminList'); root.innerHTML='';
  Object.values(items).forEach(p => {
    const div = document.createElement('div');
    div.className = 'admin-card';
    div.innerHTML = `<div class="rowx"><strong>${p.name}</strong><span class="badge">ID: ${p.id}</span></div>`;
    const sizes = p.sizes || {};
    Object.entries(sizes).forEach(([size, qty])=>{
      const row = document.createElement('div'); row.className = 'rowx';
      row.innerHTML = `<span>Maat <b>${size}</b></span>`;
      const ctr = document.createElement('div'); ctr.className = 'controls';
      const minus = document.createElement('button'); minus.textContent = '–';
      const inp = document.createElement('input'); inp.type='number'; inp.value = qty; inp.style.width='80px';
      const plus = document.createElement('button'); plus.textContent = '+';
      minus.onclick = ()=>{ inp.value = Number(inp.value)-1; inp.dispatchEvent(new Event('change')); };
      plus.onclick = ()=>{ inp.value = Number(inp.value)+1; inp.dispatchEvent(new Event('change')); };
      inp.addEventListener('change', async ()=>{
        const newQty = Math.max(0, Number(inp.value));
        await db.ref(`inventory/${p.id}/sizes/${size}`).set(newQty);
      });
      ctr.append(minus, inp, plus);
      row.appendChild(ctr);
      div.appendChild(row);
    });
    root.appendChild(div);
  });
}

document.addEventListener('DOMContentLoaded', ()=>{
  const y = document.getElementById('year'); if(y) y.textContent = new Date().getFullYear();
});
