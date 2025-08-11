
// Utils
const formatBRL = (n) => n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const qs = (s,c=document)=>c.querySelector(s);
const qsa = (s,c=document)=>[...c.querySelectorAll(s)];

const state = {
  products: [],
  cart: JSON.parse(localStorage.getItem('fitela-cart')||'[]')
};

function saveCart(){
  localStorage.setItem('fitela-cart', JSON.stringify(state.cart));
  renderCart();
}

async function loadProducts(){
  const res = await fetch('products.json');
  state.products = await res.json();
  renderProducts(state.products);
  renderCart();
  document.getElementById('year').textContent = new Date().getFullYear();
}

function productCard(p){
  const badge = p.badge==='novo' ? `<span class="badge badge-new position-absolute top-0 start-0 m-2">Novo</span>` :
                 p.badge==='best' ? `<span class="badge badge-best position-absolute top-0 start-0 m-2">Best</span>` : '';
  const sizes = p.sizes.map((s,i)=>`
    <div class="size-pill">
      <input type="radio" class="btn-check" name="size-${p.id}" id="size-${p.id}-${i}" value="${s}" ${i===0?'checked':''}>
      <label class="btn" for="size-${p.id}-${i}">${s}</label>
    </div>`).join('');
  return `
  <div class="col-6 col-md-4 col-xl-3">
    <div class="card border-0 card-product h-100 shadow-sm">
      <div class="position-relative">
        ${badge}
        <img src="assets/${p.image}" class="card-img-top" alt="${p.name}" style="aspect-ratio: 4/5; object-fit: cover">
      </div>
      <div class="card-body d-flex flex-column">
        <h3 class="h6 fw-semibold">${p.name}</h3>
        <p class="price mb-3">${formatBRL(p.price)}</p>
        <div class="d-flex flex-wrap gap-2 mb-3">${sizes}</div>
        <button class="btn btn-dark w-100 mt-auto" data-id="${p.id}">Adicionar à sacola</button>
      </div>
    </div>
  </div>`;
}

function renderProducts(list){
  const grid = qs('#product-grid');
  grid.innerHTML = list.map(productCard).join('');
  // add listeners
  qsa('[data-id]', grid).forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const id = e.currentTarget.dataset.id;
      const p = state.products.find(x=>x.id===id);
      const sizeChecked = qs(`input[name="size-${id}"]:checked`);
      const size = sizeChecked ? sizeChecked.value : p.sizes[0];
      const itemKey = id+'-'+size;
      const existing = state.cart.find(i=>i.key===itemKey);
      if(existing){ existing.qty += 1; }
      else {
        state.cart.push({ key:itemKey, id, size, qty:1 });
      }
      saveCart();
      // open drawer
      const drawer = new bootstrap.Offcanvas('#cartDrawer');
      drawer.show();
    });
  });
}

function renderCart(){
  const wrap = qs('#cartItems');
  const total = state.cart.reduce((acc,i)=>{
    const p = state.products.find(x=>x.id===i.id);
    return acc + (p?p.price:0) * i.qty;
  },0);
  qs('.cart-count').textContent = state.cart.reduce((a,i)=>a+i.qty,0);
  qs('#cartTotal').textContent = formatBRL(total);

  if(state.cart.length===0){
    wrap.innerHTML = `<p class="text-secondary">Sua sacola está vazia.</p>`;
  }else{
    wrap.innerHTML = state.cart.map(i=>{
      const p = state.products.find(x=>x.id===i.id);
      return `
      <div class="d-flex align-items-center justify-content-between border-bottom py-2">
        <div class="d-flex align-items-center gap-2">
          <img src="assets/${p.thumb || p.image}" width="56" height="56" class="rounded object-fit-cover" alt="${p.name}">
          <div>
            <div class="small fw-semibold">${p.name}</div>
            <div class="small text-secondary">Tamanho ${i.size}</div>
            <div class="small">${formatBRL(p.price)}</div>
          </div>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-dark" data-action="dec" data-key="${i.key}">-</button>
          <span class="small fw-semibold">${i.qty}</span>
          <button class="btn btn-sm btn-outline-dark" data-action="inc" data-key="${i.key}">+</button>
          <button class="btn btn-sm btn-link text-danger" data-action="rm" data-key="${i.key}">remover</button>
        </div>
      </div>`;
    }).join('');
  }

  // events
  qsa('[data-action]', wrap).forEach(btn=>{
    btn.onclick = (e)=>{
      const key = e.currentTarget.dataset.key;
      const action = e.currentTarget.dataset.action;
      const ix = state.cart.findIndex(i=>i.key===key);
      if(ix<0) return;
      if(action==='inc') state.cart[ix].qty+=1;
      if(action==='dec') state.cart[ix].qty = Math.max(1, state.cart[ix].qty-1);
      if(action==='rm') state.cart.splice(ix,1);
      saveCart();
    };
  });

  // checkout message (WhatsApp)
  const msg = state.cart.map(i=>{
    const p = state.products.find(x=>x.id===i.id);
    return `• ${p.name} (Tam ${i.size}) x${i.qty} — ${formatBRL(p.price*i.qty)}`;
  }).join('%0A');
  const totalStr = formatBRL(total);
  const text = `Olá, quero finalizar meu pedido na FITELA:%0A${msg}%0A%0ATotal: ${totalStr}`;
  qs('#checkoutBtn').href = `https://wa.me/5527997675796?text=${text}`;
}

document.addEventListener('DOMContentLoaded', loadProducts);

// Filtering (demo)
qsa('[data-filter]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    qsa('[data-filter]').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const type = btn.dataset.filter;
    // As we only have shorts in this demo, filtering is simple:
    renderProducts(state.products);
  });
});
