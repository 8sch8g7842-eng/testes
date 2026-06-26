/* ============================================================
   HAPPY BIRTHDAY ARDIAN — script.js
   ============================================================ */

// ── Persistent Music ──
const MKEY = 'ardian_bday_playing';
const TKEY = 'ardian_bday_time';
let audio = null, isPlaying = false;

function initMusic() {
  audio = new Audio();
  audio.loop = true;
  audio.src  = 'asset/music.mp3';
  audio.addEventListener('error', () => {
    audio.src = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3';
  });
  const t = parseFloat(sessionStorage.getItem(TKEY) || '0');
  if (t > 0) audio.currentTime = t;
  setInterval(() => { if (audio && !audio.paused) sessionStorage.setItem(TKEY, audio.currentTime); }, 1000);
  if (sessionStorage.getItem(MKEY) === 'true') playMusic();
  updateMusicUI();
}

function playMusic()  {
  if (!audio) return;
  audio.play().then(() => { isPlaying = true; sessionStorage.setItem(MKEY, 'true'); updateMusicUI(); })
              .catch(() => { isPlaying = false; updateMusicUI(); });
}
function pauseMusic() { if (!audio) return; audio.pause(); isPlaying = false; sessionStorage.setItem(MKEY, 'false'); updateMusicUI(); }
function toggleMusic(){ isPlaying ? pauseMusic() : playMusic(); }
function updateMusicUI() {
  const btn  = document.getElementById('music-btn');
  const wave = document.querySelector('.music-wave');
  if (!btn) return;
  btn.innerHTML = isPlaying ? '⏸' : '♪';
  if (wave) wave.classList.toggle('paused', !isPlaying);
}

// ── Navigation with fade ──
function navigateTo(url) {
  if (audio && !audio.paused) { sessionStorage.setItem(TKEY, audio.currentTime); sessionStorage.setItem(MKEY, 'true'); }
  const ov = document.getElementById('page-transition');
  if (ov) { ov.classList.add('fade-in'); setTimeout(() => location.href = url, 480); }
  else location.href = url;
}
function setupNavLinks() {
  document.querySelectorAll('a[data-nav]').forEach(a => {
    a.addEventListener('click', e => { e.preventDefault(); navigateTo(a.href); });
  });
}

function pageLoad() {
  const ov = document.getElementById('page-transition');
  if (ov) ov.classList.remove('fade-in');
  document.body.style.opacity = '0';
  document.body.style.transition = 'opacity .5s ease';
  setTimeout(() => document.body.style.opacity = '1', 50);
}

// ── Global Starfield Canvas ──
function initStarfield() {
  const canvas = document.getElementById('starfield');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], mouse = { x: null, y: null };

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', () => { resize(); buildStars(); });

  function buildStars() {
    const count = Math.floor((W * H) / 5000);
    stars = Array.from({ length: count }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  .3 + Math.random() * 1.8,
      ox: 0, oy: 0,             // offset from mouse gravity
      speed: .2 + Math.random() * .5,
      alpha: .2 + Math.random() * .8,
      da:   (Math.random() - .5) * .012,
    }));
  }
  buildStars();

  document.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  document.addEventListener('touchmove', e => { mouse.x = e.touches[0].clientX; mouse.y = e.touches[0].clientY; }, { passive: true });

  function draw() {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(s => {
      // Subtle gravity toward mouse
      if (mouse.x !== null) {
        const dx = mouse.x - s.x, dy = mouse.y - s.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 180) {
          const force = (180 - dist) / 180 * 1.5;
          s.ox += (dx / dist * force - s.ox) * .06;
          s.oy += (dy / dist * force - s.oy) * .06;
        } else {
          s.ox *= .94; s.oy *= .94;
        }
      }
      s.alpha += s.da;
      if (s.alpha > 1 || s.alpha < .15) s.da *= -1;

      ctx.beginPath();
      ctx.arc(s.x + s.ox, s.y + s.oy, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(142,200,255,${s.alpha})`;
      ctx.fill();

      // Occasional gold star
      if (s.r > 1.4) {
        ctx.beginPath();
        ctx.arc(s.x + s.ox, s.y + s.oy, s.r * .4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,209,102,${s.alpha * .6})`;
        ctx.fill();
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// ── Scroll Reveal ──
function setupReveal() {
  const obs = new IntersectionObserver(entries =>
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
    { threshold: .1, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
}

// ── Constellation Draw (index page) ──
function setupConstellation() {
  const canvas = document.getElementById('constellation-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W = canvas.width, H = canvas.height;
  let points = [], drawing = false;

  // Pre-place some dim stars
  const fixed = Array.from({ length: 18 }, () => ({
    x: Math.random() * W, y: Math.random() * H,
    r: .8 + Math.random() * 1.2, alpha: .25 + Math.random() * .4
  }));

  let hintTimer = setTimeout(() => {
    const hint = document.querySelector('.constellation-hint');
    if (hint) { hint.style.color = 'rgba(74,159,255,.8)'; hint.textContent = '✦ nice! keep going...'; }
  }, 3000);

  function render() {
    ctx.clearRect(0, 0, W, H);
    // Fixed dim stars
    fixed.forEach(s => {
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(142,200,255,${s.alpha})`; ctx.fill();
    });
    // Draw lines between user points
    if (points.length > 1) {
      ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
      points.slice(1).forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = 'rgba(74,159,255,.55)'; ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]); ctx.stroke(); ctx.setLineDash([]);
    }
    // User-drawn stars
    points.forEach((p, i) => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? 'rgba(255,209,102,.9)' : 'rgba(142,200,255,.9)'; ctx.fill();
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = i === 0 ? 'rgba(255,209,102,.2)' : 'rgba(74,159,255,.2)'; ctx.fill();
    });
  }
  render();

  function getPos(e) {
    const r = canvas.getBoundingClientRect();
    // Scale for device pixel ratio and canvas CSS size difference
    const scaleX = canvas.width  / r.width;
    const scaleY = canvas.height / r.height;
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - r.left) * scaleX,
      y: (clientY - r.top)  * scaleY
    };
  }

  function addPoint(e) {
    e.preventDefault();
    e.stopPropagation();
    const p = getPos(e);
    // Guard: only add if within canvas bounds
    if (p.x < 0 || p.x > W || p.y < 0 || p.y > H) return;
    points.push(p); render();
    clearTimeout(hintTimer);
    if (points.length >= 4) {
      const hint = document.querySelector('.constellation-hint');
      if (hint) { hint.style.color = 'rgba(255,209,102,.8)'; hint.textContent = '✦ rasi bintangmu sudah terbentuk ✨'; }
    }
  }

  // Desktop: click
  canvas.addEventListener('click', addPoint);
  // Mobile: touchstart fires immediately on finger-down, most reliable on mobile
  canvas.addEventListener('touchstart', addPoint, { passive: false });
  // Double-tap reset (desktop dblclick + mobile: two quick taps handled via timer)
  let lastTap = 0;
  canvas.addEventListener('touchstart', e => {
    const now = Date.now();
    if (now - lastTap < 300) {
      e.preventDefault();
      points = []; render();
      const hint = document.querySelector('.constellation-hint');
      if (hint) { hint.style.color = 'rgba(142,200,255,.5)'; hint.textContent = '✦ tap untuk gambar · double-tap untuk reset'; }
    }
    lastTap = now;
  }, { passive: false });
  canvas.addEventListener('dblclick', () => {
    points = []; render();
    const hint = document.querySelector('.constellation-hint');
    if (hint) { hint.style.color = 'rgba(142,200,255,.5)'; hint.textContent = 'klik untuk gambar rasi bintang kamu sendiri ✦ double-click untuk reset'; }
  });
  canvas.title = 'Click to add stars, double-click to reset';
}

// ── Planet story expand (us page) ──
function setupPlanets() {
  document.querySelectorAll('.planet-card').forEach(card => {
    const front = card.querySelector('.planet-card-front');
    const story = card.querySelector('.planet-story');
    const close = card.querySelector('.planet-story-close');
    if (!story) return;
    front?.addEventListener('click', () => story.classList.add('open'));
    close?.addEventListener('click', e => { e.stopPropagation(); story.classList.remove('open'); });
  });
}

// ── Shooting stars (us page) ──
function launchShootingStars() {
  const wrap = document.querySelector('.shoot-wrap');
  if (!wrap) return;
  function shoot() {
    const el = document.createElement('div');
    el.classList.add('shoot');
    el.style.top = (5 + Math.random() * 50) + '%';
    el.style.animationDuration = (2 + Math.random() * 2) + 's';
    el.style.animationDelay = (Math.random() * 4) + 's';
    wrap.appendChild(el);
    setTimeout(() => el.remove(), 7000);
  }
  shoot();
  setInterval(shoot, 4000);
}

// ── Confetti cannon ──
function launchConfetti() {
  const colors = ['#4A9FFF','#FFD166','#8EC8FF','#FF6B9D','#A29BFE','#55EFC4','#FFFFFF'];
  for (let i = 0; i < 120; i++) {
    setTimeout(() => {
      const el = document.createElement('div');
      el.classList.add('confetti-piece');
      el.style.left   = (10 + Math.random() * 80) + 'vw';
      el.style.top    = '-10px';
      el.style.background = colors[Math.floor(Math.random() * colors.length)];
      el.style.width  = (6 + Math.random() * 8) + 'px';
      el.style.height = (6 + Math.random() * 8) + 'px';
      el.style.borderRadius = Math.random() > .5 ? '50%' : '2px';
      el.style.animationDuration  = (2 + Math.random() * 3) + 's';
      el.style.animationDelay     = '0s';
      el.style.animationTimingFunction = 'cubic-bezier(.25,.46,.45,.94)';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 5000);
    }, i * 25);
  }
}

// ── Birthday page: cake click ──
function setupCake() {
  const cake = document.getElementById('cake-emoji');
  const btn  = document.getElementById('candle-btn');
  let blown  = false;

  function blow() {
    if (blown) return;
    blown = true;
    if (cake) { cake.textContent = '🎂'; }
    launchConfetti();
    const hint = document.getElementById('cake-hint');
    if (hint) hint.textContent = 'selamat ulang tahun, Ardian!! 🎉';
    if (btn)  btn.style.display = 'none';
    // Show heart burst
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const e = document.createElement('div');
        e.style.cssText = `position:fixed;font-size:${1.5+Math.random()}rem;pointer-events:none;z-index:9999;left:${20+Math.random()*60}vw;top:${20+Math.random()*50}vh;animation:confettiFall ${2+Math.random()*2}s ease forwards;`;
        e.textContent = ['🎉','⭐','💙','🎊','✨','💫'][Math.floor(Math.random()*6)];
        document.body.appendChild(e);
        setTimeout(() => e.remove(), 4000);
      }, i * 100);
    }
  }

  cake?.addEventListener('click', blow);
  btn?.addEventListener('click', blow);
}

// ── Candle wishes (birthday page) ──
function setupCandles() {
  document.querySelectorAll('.candle-item').forEach(c => {
    c.addEventListener('click', () => {
      if (c.classList.contains('blown')) return;
      c.classList.add('blown');
      // Check if all blown
      const all = document.querySelectorAll('.candle-item');
      const allBlown = [...all].every(x => x.classList.contains('blown'));
      if (allBlown) {
        setTimeout(launchConfetti, 300);
        const msg = document.getElementById('all-blown-msg');
        if (msg) { msg.style.opacity = '1'; msg.style.transform = 'translateY(0)'; }
      }
    });
  });
}

// ── Memory tile 3D tilt ──
function setupTilt() {
  document.querySelectorAll('.memory-tile').forEach(tile => {
    tile.addEventListener('mousemove', e => {
      const r   = tile.getBoundingClientRect();
      const x   = (e.clientX - r.left) / r.width  - .5;
      const y   = (e.clientY - r.top)  / r.height - .5;
      tile.style.transform = `perspective(600px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.04)`;
      tile.style.boxShadow = `${-x*20}px ${-y*20}px 40px rgba(74,159,255,.18)`;
    });
    tile.addEventListener('mouseleave', () => {
      tile.style.transform = '';
      tile.style.boxShadow = '';
    });
    // Touch tilt
    tile.addEventListener('touchmove', e => {
      const r  = tile.getBoundingClientRect();
      const t  = e.touches[0];
      const x  = (t.clientX - r.left) / r.width  - .5;
      const y  = (t.clientY - r.top)  / r.height - .5;
      tile.style.transform = `perspective(600px) rotateY(${x*10}deg) rotateX(${-y*10}deg) scale(1.03)`;
    }, { passive: true });
    tile.addEventListener('touchend', () => { tile.style.transform = ''; tile.style.boxShadow = ''; });
  });
}

// ── Shooting star message shooter ──
function setupShootBtn() {
  const btn = document.getElementById('shoot-btn');
  const msg = document.getElementById('shot-message');
  if (!btn || !msg) return;

  const messages = [
    "kamu adalah bintang yang paling terang di galaksi aku 🌟",
    "setiap hari bareng kamu tuh kayak nemu planet baru yang indah 💙",
    "makasih udah ada dan mau jadi bagian dari hidupku ✨",
    "kamu gak pernah tau betapa berartinya kamu buat aku 🌙",
    "aku milih kamu. di semua versi, di semua waktu ⭐",
    "happy birthday, orang paling spesial di alam semesta aku 🎂",
    "kamu bikin hidupku lebih berwarna, lebih hangat, lebih berarti 💫",
  ];
  let last = -1;

  btn.addEventListener('click', () => {
    // Shoot a visual star across screen
    const star = document.createElement('div');
    star.style.cssText = `position:fixed;top:${10+Math.random()*40}%;left:-100px;font-size:1.2rem;pointer-events:none;z-index:9996;transition:all 1.8s cubic-bezier(.2,0,.8,1);opacity:1;`;
    star.textContent = '🌟';
    document.body.appendChild(star);
    setTimeout(() => { star.style.left = '110vw'; star.style.opacity = '0'; }, 50);
    setTimeout(() => star.remove(), 2000);

    // Show a message
    let idx;
    do { idx = Math.floor(Math.random() * messages.length); } while (idx === last);
    last = idx;
    msg.classList.remove('show');
    setTimeout(() => { msg.textContent = messages[idx]; msg.classList.add('show'); }, 300);
  });
}

// ── Rocket launch ──
function setupRocket() {
  const r = document.getElementById('rocket');
  if (!r) return;
  r.addEventListener('click', () => {
    r.classList.add('launching');
    launchConfetti();
    setTimeout(() => { r.classList.remove('launching'); r.style.transform = 'rotate(-45deg)'; }, 2000);
  });
}

// ── Star wish (letter page) ──
function setupWishSky() {
  const sky     = document.getElementById('wish-sky');
  const popup   = document.getElementById('wish-popup');
  const overlay = document.getElementById('wish-overlay');
  if (!sky) return;

  const wishes = [
    { icon:'⭐', title:'Untuk Ardian', text:'Semoga semua yang kamu impimpin jadi kenyataan, satu per satu, tepat waktu.' },
    { icon:'🌙', title:'Malam yang Tenang', text:'Di malam-malam yang paling berat sekalipun, semoga kamu ingat: kamu nggak pernah sendirian.' },
    { icon:'💙', title:'Dari Aku', text:'Kamu adalah alasan aku percaya bahwa hidup bisa sangat baik kalau ada orang yang tepat di dalamnya.' },
    { icon:'✨', title:'Harapan', text:'Semoga ulang tahun ini jadi awal dari tahun yang paling indah dalam hidupmu sejauh ini.' },
    { icon:'🌟', title:'Selalu', text:'Aku bangga sama kamu. Bukan karena apa yang kamu capai, tapi karena siapa kamu sebenernya.' },
    { icon:'🎂', title:'Happy Birthday!', text:'Selamat ulang tahun, Ardian. I love you, more than a lot, more than I think I do. More.' },
  ];

  // Scatter stars in sky
  wishes.forEach((w, i) => {
    const star = document.createElement('div');
    star.classList.add('wish-star');
    star.style.left = (8 + (i % 3) * 32 + Math.random() * 10) + '%';
    star.style.top  = (10 + Math.floor(i / 3) * 42 + Math.random() * 10) + '%';
    star.style.animationDuration = (2 + Math.random() * 3) + 's';
    star.style.animationDelay    = (Math.random() * 2) + 's';
    star.textContent = '★';
    star.style.color = i === 5 ? 'var(--gold)' : 'var(--star)';
    star.dataset.idx = i;
    sky.appendChild(star);

    star.addEventListener('click', e => {
      e.stopPropagation();
      const wish = wishes[i];
      document.getElementById('wp-icon').textContent  = wish.icon;
      document.getElementById('wp-title').textContent = wish.title;
      document.getElementById('wp-text').textContent  = wish.text;
      popup?.classList.add('show');
      overlay?.classList.add('show');
      // Burst
      const rect = star.getBoundingClientRect();
      for (let j=0;j<6;j++) {
        const sp = document.createElement('div');
        sp.style.cssText=`position:fixed;left:${rect.left+8}px;top:${rect.top+8}px;font-size:.9rem;pointer-events:none;z-index:9999;transition:all .8s ease;transform:translate(-50%,-50%);`;
        sp.textContent=['✨','💙','⭐','💫'][j%4];
        document.body.appendChild(sp);
        const a=(j/6)*Math.PI*2;const d=40+Math.random()*30;
        setTimeout(()=>{sp.style.transform=`translate(calc(-50% + ${Math.cos(a)*d}px),calc(-50% + ${Math.sin(a)*d}px))`;sp.style.opacity='0';},60);
        setTimeout(()=>sp.remove(),900);
      }
    });
  });

  // Click sky itself = ripple
  sky.addEventListener('click', e => {
    if (e.target === sky) {
      const r = document.createElement('div');
      r.style.cssText=`position:absolute;border:1px solid rgba(74,159,255,.4);border-radius:50%;width:20px;height:20px;left:${e.offsetX-10}px;top:${e.offsetY-10}px;animation:rippleOut .8s ease forwards;pointer-events:none;`;
      sky.appendChild(r); setTimeout(()=>r.remove(),900);
    }
  });
  sky.style.cssText += 'position:relative;';

  function closeWish() { popup?.classList.remove('show'); overlay?.classList.remove('show'); }
  overlay?.addEventListener('click', closeWish);
  document.getElementById('wp-close')?.addEventListener('click', closeWish);
}

// ── Typing letter ──
function setupTyping() {
  const target = document.getElementById('typing-output');
  if (!target) return;

  const full = `happy birthday bubb, happy birthday to my love of my life, my sunshine, my medicine, my eeEeverythingg 🎂

selamat bertambah umur yaa diaann. i hope your day is filled with so much love, laughter, and all your favorite things. kamu deserve semua kebahagiaan di dunia ini, hari ini dan selalu.

semoga tahun ini ngebawa kamu lebih deket ke impian impian kamu and give you tons of cute and unfogettable moment.

di hari spesial kamu ini, i hope you know that i love you always, i love you more than a lot, more than i can describe, more than i think i do... intinya MORE MORE MOREE (lebih dari kamu) 

makasi uda sabar ngadepin aku, ngadepin sifatku, ngadepin semuaa yang aku lakuin, makasi buat semuanyaaaa dehh. semoga bisa deket kaya gini terus yaaa.

i cant even find the right words to explain how much you mean to me. so on your birthday, aku mau ngingetin -

aku milih kamu.

kaya dialog film sore: "kalo diulang ratusan kali pun, aku bakal tetep pilih kamu deh." i'd still choose you, setiap hari, setiap waktu, in every lifetime deh pokoknya.

—

last, inget ini ya ardian — aku gaakan pernah nyesel ketemu dan kenal kamu.

thank u for being my medicine. makasi uda jadi alasan aku happy tiap hari. aku seneng buaaanget bisa kenal kamu.

selama aku masih ada di dunia ini, kamu selalu punya seseorang yang SELALU bangga ke kamu. aku bakal dukung semua hal yang kamu lakuin, asal bukan hal negatif.

i love you. selamat ulang tahun, my number 1 `;

  const cursor = document.createElement('span');
  cursor.classList.add('typing-cursor');
  target.appendChild(cursor);

  let i = 0, started = false;
  const sign = document.querySelector('.letter-sign');

  const obs = new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !started) { started = true; obs.disconnect(); type(); }
  }, { threshold: .1 });
  obs.observe(target);

  function type() {
    if (i >= full.length) { if (sign) sign.classList.add('show'); return; }
    const ch = full[i];
    target.insertBefore(document.createTextNode(ch), cursor);
    i++;
    const d = ch==='\n'?200 : (ch==='.'||ch==='!'||ch==='?')? 110 : ch===','?75 : 20+Math.random()*25;
    setTimeout(type, d);
  }
}

// ── First-touch autoplay ──
function setupAutoplay() {
  function go() {
    if (sessionStorage.getItem(MKEY) === null || sessionStorage.getItem(MKEY) === 'true') playMusic();
    document.removeEventListener('touchstart', go);
    document.removeEventListener('click',      go);
  }
  document.addEventListener('touchstart', go, { once: true });
  document.addEventListener('click',      go, { once: true });
}

// ── Init ──
document.addEventListener('DOMContentLoaded', () => {
  pageLoad();
  initMusic();
  initStarfield();
  setupNavLinks();
  setupReveal();
  setupConstellation();
  setupPlanets();
  launchShootingStars();
  setupCake();
  setupCandles();
  setupTilt();
  setupShootBtn();
  setupRocket();
  setupWishSky();
  setupTyping();
  setupAutoplay();
  document.getElementById('music-btn')?.addEventListener('click', toggleMusic);
});
