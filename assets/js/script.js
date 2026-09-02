document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initHeaderShrink();
  initLightbox();
});

/* === Mobile Menu === */
function initMobileMenu() {
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.getElementById('site-menu');

  if (!toggle || !menu) return;

  function openMenu() {
    menu.classList.add('open');
    document.body.classList.add('nav-open');
    toggle.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    menu.classList.remove('open');
    document.body.classList.remove('nav-open');
    toggle.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu(e) {
    if (e) e.stopPropagation();
    menu.classList.contains('open') ? closeMenu() : openMenu();
  }

  toggle.addEventListener('click', toggleMenu);
  
  toggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleMenu(e);
    }
    if (e.key === 'Escape') closeMenu();
  });

  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeMenu();
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !toggle.contains(e.target)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

/* === Header Shrink on Scroll === */
function initHeaderShrink() {
  const header = document.querySelector(".header");
  if (!header) return;

  const root = document.documentElement;

  function setHeaderHeight(shrink) {
    const isMobile = window.matchMedia("(max-width: 768px)").matches;
    const normalH = isMobile ? 56 : 64;
    const shrinkH = isMobile ? 50 : 56;
    root.style.setProperty("--header-h", (shrink ? shrinkH : normalH) + "px");
  }

  function onScroll() {
    const shrink = window.scrollY > 20;
    header.classList.toggle("header--shrink", shrink);
    setHeaderHeight(shrink);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => {
    onScroll();
  });

  // Init
  onScroll();
}

/* === Lightbox === */
function initLightbox() {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const links = document.querySelectorAll('.lightbox-link');

  if (!lightbox || !lightboxImg) return;

  links.forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const href = link.getAttribute('href');
      if (href) {
        lightboxImg.src = href;
        lightbox.style.display = 'flex';
        lightbox.setAttribute('aria-hidden', 'false');
      }
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
  });
}
