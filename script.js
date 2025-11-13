/* ---------- Global behaviors:
   - snowfall canvas animation on every page
   - parallax for hero layers
   - nav toggle (mobile with click-outside + ESC)
   - music toggle (bgMusic)
   - small product dataset + shop/product/cart flows using localStorage
*/

document.addEventListener("DOMContentLoaded", () => {
  // ---------- Snow canvas ----------
  const canvas = document.getElementById("snowCanvas");
  let ctx = null;
  if (canvas && canvas.getContext) {
    ctx = canvas.getContext("2d");
    let W = window.innerWidth,
      H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;

    const flakes = [];
    const FL_COUNT = Math.min(220, Math.floor(W / 6)); // responsive count

    for (let i = 0; i < FL_COUNT; i++) {
      flakes.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 3 + 0.8,
        d: Math.random() * FL_COUNT,
      });
    }

    let angle = 0;
    function snowDraw() {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      for (let i = 0; i < FL_COUNT; i++) {
        const f = flakes[i];
        ctx.moveTo(f.x, f.y);
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2, true);
      }
      ctx.fill();

      // move
      angle += 0.002;
      for (let i = 0; i < FL_COUNT; i++) {
        const f = flakes[i];
        f.y += Math.pow(f.d, 0.5) + 0.6;
        f.x += Math.sin(angle) * 1.2;
        if (f.y > H + 5) {
          f.y = -10;
          f.x = Math.random() * W;
        }
      }
      requestAnimationFrame(snowDraw);
    }

    window.addEventListener("resize", () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W;
      canvas.height = H;
    });

    snowDraw();
  }

  // ---------- Parallax hero ----------
  function initParallax() {
    const hero = document.querySelector(".hero");
    if (!hero) return;
    const layers = hero.querySelectorAll(".hero-layer");
    window.addEventListener(
      "scroll",
      () => {
        const sc = window.scrollY;
        layers.forEach((layer) => {
          const speed = parseFloat(layer.dataset.speed || 0.3);
          layer.style.transform = `translateY(${sc * speed}px)`;
        });
      },
      { passive: true }
    );
  }
  initParallax();

  // ---------- Nav toggle (mobile) ----------
  // Robust implementation: toggles .show on .nav, updates aria, changes icon,
  // closes on outside click or Escape key.
  (function initMobileNavToggle() {
    const navToggle = document.getElementById("navToggle");
    const nav = document.querySelector(".nav");
    if (!navToggle || !nav) return;

    const OPEN_CLASS = "show";
    const ICON_OPEN = "✖";
    const ICON_CLOSED = "☰";

    // ensure initial icon state
    if (!navToggle.textContent.trim()) navToggle.textContent = ICON_CLOSED;
    navToggle.setAttribute("aria-expanded", "false");

    function openNav() {
      nav.classList.add(OPEN_CLASS);
      navToggle.textContent = ICON_OPEN;
      navToggle.setAttribute("aria-expanded", "true");
      // optional: prevent body scroll when menu open
      document.body.classList.add("nav-open-no-scroll");
    }
    function closeNav() {
      nav.classList.remove(OPEN_CLASS);
      navToggle.textContent = ICON_CLOSED;
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open-no-scroll");
    }
    function toggleNav() {
      if (nav.classList.contains(OPEN_CLASS)) closeNav();
      else openNav();
    }

    navToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleNav();
    });

    // close when clicking outside the nav (but ignore clicks inside nav)
    document.addEventListener("click", (e) => {
      if (!nav.classList.contains(OPEN_CLASS)) return;
      const target = e.target;
      if (target === navToggle) return;
      if (!nav.contains(target)) closeNav();
    });

    // close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && nav.classList.contains(OPEN_CLASS)) {
        closeNav();
      }
    });

    // when any nav link clicked on mobile, close the nav
    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => {
        if (window.innerWidth <= 768) closeNav();
      });
    });
  })();

  // ---------- Music toggle ----------
  const music = document.getElementById("bgMusic");
  const musicBtns = document.querySelectorAll(
    "#musicBtn, .music-btn, .icon-music"
  );
  let musicPlaying = false;
  musicBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!music) return;
      if (!musicPlaying) {
        music.play().catch(() => {
          /* autoplay may block; user must interact */
        });
      } else {
        music.pause();
      }
      musicPlaying = !musicPlaying;
      // sync all music buttons appearance/text if desired
      musicBtns.forEach((b) => {
        b.textContent = musicPlaying ? "🔊" : "🔇";
        b.setAttribute("aria-pressed", String(musicPlaying));
      });
    });
  });

  // If user interacts anywhere, allow autoplay resume (some browsers block until interaction)
  ["click", "keydown", "touchstart"].forEach((ev) => {
    window.addEventListener(
      ev,
      () => {
        if (music && musicPlaying) music.play().catch(() => {});
      },
      { once: true }
    );
  });

  // ---------- Tiny product dataset ----------
  const products = [
    {
      id: 1,
      title: "Cozy Gift Box",
      price: 1499,
      img: "assets/giftbox.jpg",
      cat: "under1500",
      desc: "Candle, cocoa mix, wool socks, ribbon wrap.",
    },
    {
      id: 2,
      title: "Handmade Wreath",
      price: 899,
      img: "assets/wreath.jpg",
      cat: "decor",
      desc: "Fresh-looking handcrafted wreath.",
    },
    {
      id: 3,
      title: "Glass Ornament (set of 3)",
      price: 599,
      img: "assets/ornament.jpg",
      cat: "ornaments",
      desc: "Delicate hand-painted ornaments.",
    },
    {
      id: 4,
      title: "Holiday Candle",
      price: 349,
      img: "assets/candle.jpg",
      cat: "under1500",
      desc: "Scented soy candle — cinnamon & orange.",
    },
  ];

  // ---------- Cart helper (localStorage) ----------
  const CART_KEY = "hp_cart_v1";
  function readCart() {
    try {
      return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    } catch {
      return [];
    }
  }
  function saveCart(c) {
    localStorage.setItem(CART_KEY, JSON.stringify(c));
  }
  function updateCartCountUI() {
    const count = readCart().reduce((s, i) => s + i.qty, 0);
    document
      .querySelectorAll(".cart-count")
      .forEach((el) => (el.textContent = count));
  }
  updateCartCountUI();

  function addToCart(id, qty = 1) {
    const cart = readCart();
    const found = cart.find((i) => i.id === id);
    if (found) found.qty += qty;
    else cart.push({ id, qty });
    saveCart(cart);
    updateCartCountUI();
    // small visual confirmation
    // use a non-blocking toast instead of alert for better UX
    showToast("Added to cart");
  }

  function showToast(msg) {
    const t = document.createElement("div");
    t.textContent = msg;
    Object.assign(t.style, {
      position: "fixed",
      right: "20px",
      bottom: "20px",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      padding: ".6rem .9rem",
      borderRadius: "8px",
      zIndex: 9999,
      transition: "opacity .4s ease",
    });
    document.body.appendChild(t);
    setTimeout(() => (t.style.opacity = "0"), 1400);
    setTimeout(() => t.remove(), 2000);
  }

  // ---------- Shop rendering ----------
  function renderProducts() {
    const grid = document.getElementById("productGrid");
    if (!grid) return;
    const params = new URLSearchParams(location.search);
    const cat = params.get("cat");
    const catNameEl = document.getElementById("catName");
    if (catNameEl) catNameEl.textContent = cat || "All";
    const list = products.filter((p) => !cat || p.cat === cat);
    grid.innerHTML = list
      .map(
        (p) => `
      <article class="card product-card">
        <img src="${p.img}" alt="${escapeHtml(p.title)}">
        <h3>${escapeHtml(p.title)}</h3>
        <p class="price">₹${p.price}</p>
        <div style="display:flex;gap:.5rem;margin-top:.6rem">
          <a class="btn small" href="product.html?id=${p.id}">View</a>
          <button class="btn ghost small add-btn" data-id="${p.id}">Add</button>
        </div>
      </article>
    `
      )
      .join("");
    document.querySelectorAll(".add-btn").forEach((b) => {
      b.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        addToCart(id, 1);
      });
    });
  }
  renderProducts();

  // ---------- Product detail rendering ----------
  function renderProductDetail() {
    const pTitle = document.getElementById("pTitle");
    if (!pTitle) return;
    const params = new URLSearchParams(location.search);
    const id = parseInt(params.get("id") || "1", 10);
    const p = products.find((x) => x.id === id) || products[0];
    document.getElementById("pTitle").textContent = p.title;
    document.getElementById("pPrice").textContent = "₹" + p.price;
    document.getElementById("pDesc").textContent = p.desc;
    const img = document.getElementById("pImage");
    if (img) img.src = p.img;
    document.getElementById("addToCart") &&
      document.getElementById("addToCart").addEventListener("click", () => {
        const q = Math.max(
          1,
          parseInt(document.getElementById("qty").value || "1", 10)
        );
        addToCart(p.id, q);
      });
  }
  renderProductDetail();

  // ---------- Cart page rendering ----------
  function renderCartPage() {
    const cartArea = document.getElementById("cartItems");
    if (!cartArea) return;
    const cart = readCart();
    if (!cart || cart.length === 0) {
      cartArea.innerHTML = '<p class="muted">Your cart is empty.</p>';
      document.getElementById("cartSummary") &&
        (document.getElementById("cartSummary").innerHTML = "");
      return;
    }

    const rows = cart
      .map((item) => {
        const p = products.find((x) => x.id === item.id) || {
          title: "Item",
          price: 0,
          img: "assets/giftbox.jpg",
        };
        return `
        <div class="cart-item">
          <img src="${
            p.img
          }" width="80" height="80" style="border-radius:8px;object-fit:cover;">
          <div style="flex:1">
            <strong>${escapeHtml(p.title)}</strong>
            <div class="muted">₹${p.price} × ${item.qty}</div>
          </div>
          <div>
            <button class="btn small remove-btn" data-id="${
              p.id
            }">Remove</button>
          </div>
        </div>
      `;
      })
      .join("");
    cartArea.innerHTML = rows;

    document.querySelectorAll(".remove-btn").forEach((b) => {
      b.addEventListener("click", (e) => {
        const id = parseInt(e.currentTarget.dataset.id, 10);
        const newCart = readCart().filter((i) => i.id !== id);
        saveCart(newCart);
        renderCartPage();
        updateCartCountUI();
      });
    });

    const subtotal = cart.reduce((s, i) => {
      const p = products.find((x) => x.id === i.id);
      return s + (p ? p.price * i.qty : 0);
    }, 0);
    const shipping = subtotal > 1999 ? 0 : 99;
    const total = subtotal + shipping;
    const summary = `
      <div style="background:var(--card);padding:1rem;border-radius:10px">
        <p>Subtotal: ₹${subtotal}</p>
        <p>Shipping: ₹${shipping}</p>
        <h3>Total: ₹${total}</h3>
        <div style="margin-top:1rem"><button class="btn">Checkout</button></div>
      </div>
    `;
    document.getElementById("cartSummary") &&
      (document.getElementById("cartSummary").innerHTML = summary);
  }
  renderCartPage();

  // ---------- small helpers ----------
  function escapeHtml(str) {
    return String(str).replace(
      /[&<>"']/g,
      (s) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[s])
    );
  }

  // set year placeholders
  document
    .querySelectorAll("[id^=year]")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
});
// Toggle mobile nav
const navToggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

if (navToggle && nav) {
  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  // Optional: Close menu after clicking a link
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => nav.classList.remove("open"));
  });
}
