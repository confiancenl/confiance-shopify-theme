/* ============================================================
   CONFIANCE SHOPIFY THEME — theme.js
   ============================================================ */

'use strict';

/* ── Header Scroll Effect ──────────────────────────────────── */
(function initHeaderScroll() {
  var header = document.querySelector('.header');
  if (!header) return;

  function onScroll() {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();

/* ── Mobile Menu ───────────────────────────────────────────── */
(function initMobileMenu() {
  var hamburger = document.getElementById('Hamburger');
  var mobileMenu = document.getElementById('MobileMenu');
  if (!hamburger || !mobileMenu) return;

  function openMenu() {
    hamburger.classList.add('is-active');
    mobileMenu.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
    mobileMenu.setAttribute('aria-hidden', 'false');
  }

  function closeMenu() {
    hamburger.classList.remove('is-active');
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
    mobileMenu.setAttribute('aria-hidden', 'true');
  }

  hamburger.addEventListener('click', function () {
    if (hamburger.classList.contains('is-active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close on ESC
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  window.closeMobileMenu = closeMenu;
})();

/* ── Search Overlay ────────────────────────────────────────── */
(function initSearch() {
  var overlay = document.getElementById('SearchOverlay');
  if (!overlay) return;

  window.openSearch = function () {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    var input = overlay.querySelector('.search-overlay__input');
    if (input) setTimeout(function () { input.focus(); }, 100);
  };

  window.closeSearch = function () {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Close on overlay click
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) closeSearch();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSearch();
  });
})();

/* ── Cart Drawer ───────────────────────────────────────────── */
(function initCartDrawer() {
  var drawer = document.getElementById('CartDrawer');
  var overlay = document.getElementById('CartOverlay');
  if (!drawer || !overlay) return;

  window.openCartDrawer = function () {
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    fetchCart();
  };

  window.closeCartDrawer = function () {
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  };

  // Close button
  var closeBtn = document.getElementById('CartDrawerClose');
  if (closeBtn) closeBtn.addEventListener('click', closeCartDrawer);

  // Close on overlay click
  overlay.addEventListener('click', closeCartDrawer);

  // ESC key
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCartDrawer();
  });

  // Header cart button
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cart-open]');
    if (btn) {
      e.preventDefault();
      openCartDrawer();
    }
  });
})();

/* ── Cart API ──────────────────────────────────────────────── */
function fetchCart() {
  var loading = document.getElementById('CartDrawerLoading');
  var itemsEl = document.getElementById('CartDrawerItems');
  var emptyEl = document.getElementById('CartDrawerEmpty');
  var footerEl = document.getElementById('CartDrawerFooter');
  var totalEl = document.getElementById('CartDrawerTotal');

  if (loading) loading.style.display = 'block';
  if (itemsEl) itemsEl.innerHTML = '';
  if (emptyEl) emptyEl.style.display = 'none';
  if (footerEl) footerEl.style.display = 'none';

  fetch('/cart.js')
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      if (loading) loading.style.display = 'none';

      if (cart.item_count === 0) {
        if (emptyEl) emptyEl.style.display = 'flex';
        return;
      }

      if (itemsEl) {
        itemsEl.innerHTML = cart.items.map(function (item) {
          return renderCartItem(item);
        }).join('');
      }

      if (totalEl) totalEl.textContent = formatMoney(cart.total_price);
      if (footerEl) footerEl.style.display = 'flex';

      updateCartCount(cart.item_count);
    })
    .catch(function () {
      if (loading) loading.style.display = 'none';
    });
}

function renderCartItem(item) {
  var image = item.image ? item.image : '';
  var variant = item.variant_title && item.variant_title !== 'Default Title'
    ? item.variant_title : '';

  return '<div class="cart-item" data-key="' + item.key + '">' +
    (image ? '<img class="cart-item__image" src="' + image + '" alt="' + item.title + '" width="80" height="106">' : '<div class="cart-item__image" style="background:var(--color-surface)"></div>') +
    '<div class="cart-item__details">' +
    '<div class="cart-item__title">' + item.product_title + '</div>' +
    (variant ? '<div class="cart-item__variant">' + variant + '</div>' : '') +
    '<div class="cart-item__price">' + formatMoney(item.final_line_price) + '</div>' +
    '<div class="cart-item__actions">' +
    '<div class="cart-item__qty">' +
    '<button class="cart-item__qty-btn" onclick="changeQty(\'' + item.key + '\', ' + (item.quantity - 1) + ')">−</button>' +
    '<span class="cart-item__qty-count">' + item.quantity + '</span>' +
    '<button class="cart-item__qty-btn" onclick="changeQty(\'' + item.key + '\', ' + (item.quantity + 1) + ')">+</button>' +
    '</div>' +
    '<button class="cart-item__remove" onclick="removeItem(\'' + item.key + '\')">Verwijder</button>' +
    '</div>' +
    '</div>' +
    '</div>';
}

function changeQty(key, qty) {
  fetch('/cart/change.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: key, quantity: qty })
  })
  .then(function (r) { return r.json(); })
  .then(function (cart) {
    fetchCart();
    updateCartCount(cart.item_count);
  });
}

function removeItem(key) {
  changeQty(key, 0);
}

function addToCart(variantId, quantity, properties) {
  quantity = quantity || 1;
  properties = properties || {};

  return fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: variantId, quantity: quantity, properties: properties })
  }).then(function (r) { return r.json(); });
}

function updateCartCount(count) {
  var badges = document.querySelectorAll('.header__cart-count');
  badges.forEach(function (badge) {
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  });
}

function formatMoney(cents) {
  var amount = (cents / 100).toFixed(2).replace('.', ',');
  return '€' + amount;
}

/* ── Add to Cart Form ──────────────────────────────────────── */
(function initAddToCart() {
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches('[data-product-form]')) return;
    e.preventDefault();

    var btn = form.querySelector('[data-add-to-cart-btn]');
    var variantInput = form.querySelector('[name="id"]');
    if (!variantInput) return;

    var variantId = variantInput.value;
    if (!variantId) {
      alert('Selecteer een variant');
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Toevoegen...';
    }

    addToCart(variantId, 1)
      .then(function () {
        if (btn) {
          btn.textContent = 'Toegevoegd ✓';
          setTimeout(function () {
            btn.disabled = false;
            btn.textContent = 'Toevoegen aan winkelwagen';
          }, 2000);
        }
        openCartDrawer();
        fetchCart();
      })
      .catch(function (err) {
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'Toevoegen aan winkelwagen';
        }
        alert(err.description || 'Er is iets misgegaan. Probeer opnieuw.');
      });
  });
})();

/* ── Product Page: Variant Selection ──────────────────────── */
(function initVariantSelection() {
  var sizeButtons = document.querySelectorAll('.size-btn');
  var variantIdInput = document.querySelector('[name="id"][data-variant-input]');

  sizeButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (btn.classList.contains('is-unavailable')) return;

      sizeButtons.forEach(function (b) { b.classList.remove('is-selected'); });
      btn.classList.add('is-selected');

      var variantId = btn.dataset.variantId;
      if (variantIdInput && variantId) {
        variantIdInput.value = variantId;
      }

      // Update price
      var priceEl = document.querySelector('.product-page__price-amount');
      if (priceEl && btn.dataset.price) {
        priceEl.textContent = formatMoney(parseInt(btn.dataset.price));
      }
    });
  });

  // Color swatches
  var swatches = document.querySelectorAll('.color-swatch');
  swatches.forEach(function (swatch) {
    swatch.addEventListener('click', function () {
      swatches.forEach(function (s) { s.classList.remove('is-selected'); });
      swatch.classList.add('is-selected');
    });
  });
})();

/* ── Product Page: Image Gallery ──────────────────────────── */
(function initGallery() {
  var mainImage = document.querySelector('.product-page__main-img');
  var thumbs = document.querySelectorAll('.product-page__thumb');
  if (!mainImage || !thumbs.length) return;

  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      mainImage.src = thumb.dataset.full || thumb.src;
      mainImage.srcset = '';
      thumbs.forEach(function (t) { t.classList.remove('is-active'); });
      thumb.classList.add('is-active');
    });
  });
})();

/* ── Newsletter ────────────────────────────────────────────── */
(function initNewsletter() {
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (!form.matches('[data-newsletter-form]')) return;
    // Shopify handles newsletter via contact form — let default submit happen
    // But show success message if using customer email signup
    var successEl = form.parentElement.querySelector('[data-newsletter-success]');
    if (successEl) {
      e.preventDefault();
      var email = form.querySelector('input[type="email"]');
      if (!email || !email.value) return;

      fetch('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          form_type: 'customer',
          'contact[email]': email.value,
          'contact[tags]': 'newsletter'
        })
      }).finally(function () {
        form.style.display = 'none';
        successEl.style.display = 'block';
      });
    }
  });
})();

/* ── Cart Page: Quantity Update ────────────────────────────── */
(function initCartPageQty() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cart-qty-btn]');
    if (!btn) return;

    var key = btn.dataset.key;
    var delta = parseInt(btn.dataset.delta);
    var currentEl = document.querySelector('[data-qty-count="' + key + '"]');
    if (!currentEl) return;

    var current = parseInt(currentEl.textContent);
    var newQty = current + delta;
    if (newQty < 0) return;

    changeQty(key, newQty);
  });
})();

/* ── Filter Pills ──────────────────────────────────────────── */
(function initFilterPills() {
  var pills = document.querySelectorAll('.filter-pill');
  pills.forEach(function (pill) {
    pill.addEventListener('click', function () {
      var tag = pill.dataset.tag;
      var url = new URL(window.location.href);
      if (tag === 'all') {
        url.searchParams.delete('tag');
      } else {
        url.searchParams.set('tag', tag);
      }
      window.location.href = url.toString();
    });
  });
})();

/* ── Marquee duplicate ─────────────────────────────────────── */
(function initMarquee() {
  var track = document.querySelector('.marquee-track');
  if (!track) return;
  // Duplicate content for seamless loop
  track.innerHTML += track.innerHTML;
})();

/* ── Init on DOM ready ─────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Initialize cart count on load
  fetch('/cart.js')
    .then(function (r) { return r.json(); })
    .then(function (cart) {
      updateCartCount(cart.item_count);
    })
    .catch(function () {});
});
