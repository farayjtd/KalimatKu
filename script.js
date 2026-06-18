/* ══════════════════════════════════════
   THEME TOGGLE
══════════════════════════════════════ */
const html = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('kalimatku-theme') || 'light';

html.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme');
    const next = current === 'light' ? 'dark' : 'light';
    html.setAttribute('data-theme', next);
    localStorage.setItem('kalimatku-theme', next);
    initParticles();
});

/* ══════════════════════════════════════
   PARTICLE SYSTEM
══════════════════════════════════════ */
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animFrame;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function getParticleColor() {
    return html.getAttribute('data-theme') === 'dark'
        ? 'rgba(91,163,245,'
        : 'rgba(47,128,237,';
}

class Particle {
    constructor() { this.reset(); }
    reset() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = (Math.random() - 0.5) * 0.4;
        this.speedY = (Math.random() - 0.5) * 0.4;
        this.opacity = Math.random() * 0.4 + 0.1;
        this.life = 0;
        this.maxLife = Math.random() * 300 + 200;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life++;
        if (this.life > this.maxLife) this.reset();
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
    }
    draw() {
        const alpha = this.opacity * (1 - this.life / this.maxLife);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = getParticleColor() + alpha + ')';
        ctx.fill();
    }
}

function initParticles() {
    if (animFrame) cancelAnimationFrame(animFrame);
    const count = window.innerWidth < 768 ? 40 : 80;
    particles = Array.from({ length: count }, () => new Particle());
    animateParticles();
}

function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
                const alpha = (1 - dist / maxDist) * 0.12;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = getParticleColor() + alpha + ')';
                ctx.lineWidth = 0.5;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    animFrame = requestAnimationFrame(animateParticles);
}

initParticles();
window.addEventListener('resize', initParticles);

/* ══════════════════════════════════════
   SCROLL PROGRESS BAR
══════════════════════════════════════ */
const progressBar = document.createElement('div');
progressBar.id = 'scrollProgress';
document.body.prepend(progressBar);

/* ══════════════════════════════════════
   SECTION TOAST
══════════════════════════════════════ */
const sectionToast = document.createElement('div');
sectionToast.id = 'sectionToast';
document.body.appendChild(sectionToast);

/* ══════════════════════════════════════
   NAVBAR — active section tracker + sliding pill
══════════════════════════════════════ */
const navbar = document.getElementById('navbar');
const navLinksList = document.getElementById('navLinks');

const sectionLabels = {
    home: 'Beranda',
    masalah: 'Masalah',
    fitur: 'Fitur',
    'cara-kerja': 'Cara Kerja',
    usecase: 'Untuk Siapa',
    testimoni: 'Testimoni',
    harga: 'Harga',
    faq: 'FAQ',
};

const sections = Object.keys(sectionLabels)
    .map(id => document.getElementById(id))
    .filter(Boolean);

const navAnchors = navLinksList.querySelectorAll('a[href^="#"]');

// Sliding pill element
const navPill = document.createElement('div');
navPill.id = 'navPill';
navLinksList.appendChild(navPill);

function updatePill(activeLink) {
    if (!activeLink || window.innerWidth <= 768) {
        navPill.style.opacity = '0';
        return;
    }
    if (activeLink.classList.contains('nav-cta')) {
        navPill.style.opacity = '0';
        return;
    }
    const listRect = navLinksList.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    navPill.style.left = (linkRect.left - listRect.left) + 'px';
    navPill.style.width = linkRect.width + 'px';
    navPill.style.opacity = '1';
}

let toastTimer;
let lastActiveId = '';

function onScroll() {
    // Progress bar
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progressBar.style.width = pct + '%';

    // Navbar shadow
    navbar.classList.toggle('scrolled', scrollTop > 20);

    // Detect active section
    let currentId = 'home';
    sections.forEach(sec => {
        if (sec.getBoundingClientRect().top <= 110) currentId = sec.id;
    });

    if (currentId === lastActiveId) return;
    lastActiveId = currentId;

    // Update link states + pill
    navAnchors.forEach(a => {
        const href = a.getAttribute('href').replace('#', '');
        const isActive = href === currentId;
        a.classList.toggle('active', isActive);
        if (isActive) updatePill(a);
    });

    // Toast
    if (sectionLabels[currentId]) {
        sectionToast.textContent = '📍 ' + sectionLabels[currentId];
        sectionToast.classList.add('visible');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => sectionToast.classList.remove('visible'), 1800);
    }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ══════════════════════════════════════
   HAMBURGER MENU
══════════════════════════════════════ */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navLinks.classList.remove('open');
    });
});

/* ══════════════════════════════════════
   SCROLL ANIMATION
══════════════════════════════════════ */
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-up').forEach(el => observer.observe(el));

/* ══════════════════════════════════════
   PARALLAX SCROLL
══════════════════════════════════════ */
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    document.querySelectorAll('.parallax-layer').forEach(layer => {
        const speed = parseFloat(layer.dataset.speed) || 0.3;
        layer.style.transform = `translateY(${scrollY * speed}px)`;
    });

    document.querySelectorAll('.parallax-bg').forEach(bg => {
        const speed = parseFloat(bg.dataset.speed) || 0.15;
        const rect = bg.parentElement.getBoundingClientRect();
        const offset = (window.innerHeight / 2 - rect.top) * speed;
        bg.style.transform = `translateY(${offset}px)`;
    });
});

/* ══════════════════════════════════════
   TILT EFFECT
══════════════════════════════════════ */
document.querySelectorAll('[data-tilt]').forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        const rotateX = ((y - cy) / cy) * -8;
        const rotateY = ((x - cx) / cx) * 8;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
    });
    card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    });
    card.addEventListener('mouseenter', () => {
        card.style.transition = 'transform 0.1s ease';
    });
});

/* ══════════════════════════════════════
   COUNTER ANIMATION
══════════════════════════════════════ */
function animateCounter(el, target, duration = 1800) {
    let start = 0;
    const step = target / (duration / 16);
    const isFloat = target < 10;
    const timer = setInterval(() => {
        start += step;
        if (start >= target) { start = target; clearInterval(timer); }
        el.textContent = isFloat
            ? start.toFixed(1)
            : Math.floor(start).toLocaleString('id-ID');
    }, 16);
}

let counterStarted = false;
const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !counterStarted) {
        counterStarted = true;
        document.querySelectorAll('.stat-number').forEach(el => {
            animateCounter(el, parseFloat(el.dataset.target));
        });
    }
}, { threshold: 0.3 });

const statsSection = document.querySelector('.stats');
if (statsSection) statsObserver.observe(statsSection);

/* ══════════════════════════════════════
   FAQ ACCORDION
══════════════════════════════════════ */
document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
        const item = btn.parentElement;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    });
});

/* ══════════════════════════════════════
   SMOOTH SCROLL
══════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            e.preventDefault();
            window.scrollTo({
                top: target.getBoundingClientRect().top + window.scrollY - 80,
                behavior: 'smooth'
            });
        }
    });
});

/* ══════════════════════════════════════
   LOAD CONTENT FROM ADMIN (localStorage)
══════════════════════════════════════ */
function loadContent() {
  const data = JSON.parse(localStorage.getItem('kalimatku_content') || '{}');

  const set = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.textContent = val;
  };
  const setHtml = (id, val) => {
    const el = document.getElementById(id);
    if (el && val !== undefined) el.innerHTML = val;
  };

  // Hero
  set('heroBadge',    data.heroBadge);
  set('heroSub',      data.heroSub);
  set('heroCta1Text', data.heroCta1);
  set('heroCta2Text', data.heroCta2);
  set('heroNote',     data.heroNote);

  if (data.heroTitle) {
    const el = document.getElementById('heroTitle');
    if (el) {
      el.innerHTML = data.heroTitle + '<br><em class="glitch" id="heroGlitch" data-text="' + (data.heroGlitch || 'Kurang Profesional?') + '">' + (data.heroGlitch || 'Kurang Profesional?') + '</em>';
    }
  }

  // Stats
  const stats = ['stat1','stat2','stat3','stat4'];
  stats.forEach(s => {
    set(s + 'Lab', data[s + 'Lab']);
    set(s + 'Suf', data[s + 'Suf']);
    if (data[s + 'Num'] !== undefined) {
      const el = document.getElementById(s + 'Num');
      if (el) el.dataset.target = data[s + 'Num'];
    }
  });

  // Pain
  set('painTitle',  data.painTitle);
  set('pain1Title', data.pain1Title);
  set('pain1Desc',  data.pain1Desc);
  set('pain2Title', data.pain2Title);
  set('pain2Desc',  data.pain2Desc);
  set('pain3Title', data.pain3Title);
  set('pain3Desc',  data.pain3Desc);
  set('painQuote',  data.painQuote);

  // Features
  set('featTitle', data.featTitle);
  if (data.features && Array.isArray(data.features)) {
    const grid = document.getElementById('featuresGrid');
    if (grid) {
      grid.innerHTML = data.features.map((f, i) => `
        <div class="feature-card animate-up delay-${(i%3)+1}" data-tilt>
          <div class="feature-icon-wrap"><span>${f.icon}</span></div>
          <h3>${f.title}</h3>
          <p>${f.desc}</p>
          <div class="feature-line"></div>
        </div>`).join('');
    }
  }

  // Steps
  set('step1Title', data.step1Title);
  set('step1Desc',  data.step1Desc);
  set('step2Title', data.step2Title);
  set('step2Desc',  data.step2Desc);
  set('step3Title', data.step3Title);
  set('step3Desc',  data.step3Desc);

  // Testimoni
  if (data.testimonials && Array.isArray(data.testimonials)) {
    const grid = document.getElementById('testiGrid');
    if (grid) {
      grid.innerHTML = data.testimonials.map((t, i) => `
        <div class="testi-card animate-up delay-${i+1}" data-tilt>
          <div class="testi-stars">${'★'.repeat(t.stars || 5)}</div>
          <p class="testi-quote">"${t.quote}"</p>
          <div class="testi-author">
            <div class="testi-avatar">${t.initials}</div>
            <div><strong>${t.name}</strong><span>${t.role}</span></div>
          </div>
        </div>`).join('');
    }
  }

  // Pricing
  set('price1Name',  data.price1Name);
  set('price1Price', data.price1Price);
  set('price2Name',  data.price2Name);
  set('price2Price', data.price2Price);
  set('price3Name',  data.price3Name);
  set('price3Price', data.price3Price);

  // CTA
  set('ctaTitle',    data.ctaTitle);
  set('ctaSubtitle', data.ctaSubtitle);
  set('ctaBtn',      data.ctaBtn);

  // Footer
  set('footerTagline', data.footerTagline);
  set('footerCopy',    data.footerCopy);

  // Warna
  if (data.colorBlue)  document.documentElement.style.setProperty('--blue',  data.colorBlue);
  if (data.colorGold)  document.documentElement.style.setProperty('--gold',  data.colorGold);
  if (data.colorNavy)  document.documentElement.style.setProperty('--navy',  data.colorNavy);
}

loadContent();