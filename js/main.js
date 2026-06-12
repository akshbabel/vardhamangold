/* ============ Vardhaman Gold — interactions (shared across pages) ============ */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile = window.matchMedia('(max-width: 700px)').matches;
  var loader = document.getElementById('loader');

  /* ---------- Mobile nav ---------- */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        nav.classList.remove('is-open');
        burger.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* ---------- Header on scroll ---------- */
  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Split section titles into words ---------- */
  document.querySelectorAll('.split').forEach(function (el) {
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (/^\s+$/.test(part) || part === '') {
              frag.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement('span');
              span.className = 'word';
              span.style.display = 'inline-block';
              span.textContent = part;
              frag.appendChild(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  });

  /* ---------- Three.js golden particle field (home hero only) ---------- */
  var canvas = document.getElementById('hero-canvas');
  if (window.THREE && canvas && !prefersReduced) {
    try {
      var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: false });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.z = 8;

      var COUNT = isMobile ? 450 : 1200;
      var positions = new Float32Array(COUNT * 3);
      var speeds = new Float32Array(COUNT);
      for (var i = 0; i < COUNT; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 22;     // x
        positions[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
        positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        speeds[i] = 0.2 + Math.random() * 0.8;
      }
      var geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

      // soft round sprite drawn on an offscreen canvas (no external assets)
      var spriteCanvas = document.createElement('canvas');
      spriteCanvas.width = spriteCanvas.height = 64;
      var ctx = spriteCanvas.getContext('2d');
      var grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(244, 209, 122, 1)');
      grad.addColorStop(0.4, 'rgba(212, 162, 60, 0.55)');
      grad.addColorStop(1, 'rgba(212, 162, 60, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      var texture = new THREE.CanvasTexture(spriteCanvas);

      var mat = new THREE.PointsMaterial({
        size: isMobile ? 0.16 : 0.12,
        map: texture,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: 0xd4a23c
      });
      var points = new THREE.Points(geo, mat);
      scene.add(points);

      var mouseX = 0, mouseY = 0;
      window.addEventListener('pointermove', function (e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      var resize = function () {
        var w = canvas.parentElement.clientWidth;
        var h = canvas.parentElement.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener('resize', resize);
      resize();

      var clock = new THREE.Clock();
      var heroVisible = true;
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          heroVisible = entries[0].isIntersecting;
        }).observe(canvas);
      }

      (function animate() {
        requestAnimationFrame(animate);
        if (!heroVisible) return; // pause off-screen for performance
        var t = clock.getElapsedTime();
        var pos = geo.attributes.position.array;
        for (var j = 0; j < COUNT; j++) {
          pos[j * 3 + 1] += Math.sin(t * speeds[j] + j) * 0.0015; // gentle drift
        }
        geo.attributes.position.needsUpdate = true;
        points.rotation.y = t * 0.03 + mouseX * 0.08;
        points.rotation.x = mouseY * 0.05;
        renderer.render(scene, camera);
      })();
    } catch (err) {
      console.warn('Hero canvas disabled:', err);
    }
  }

  /* ---------- GSAP animations ---------- */
  if (!window.gsap) {
    // No animation library: show everything statically
    document.documentElement.classList.remove('js');
    if (loader) loader.style.display = 'none';
    return;
  }
  gsap.registerPlugin(ScrollTrigger);

  if (prefersReduced) {
    if (loader) gsap.set(loader, { autoAlpha: 0 });
    return; // CSS reduced-motion rules show everything statically
  }

  if (loader) {
    // Home: loader out, hero in
    var intro = gsap.timeline();
    intro
      .to('.loader__word', { opacity: 1, duration: 0.4 })
      .to(loader, { yPercent: -100, duration: 0.8, ease: 'power3.inOut', delay: 0.3 })
      .set(loader, { display: 'none' })
      .from('.hero__eyebrow span', { yPercent: 120, duration: 0.7, ease: 'power3.out' }, '-=0.4')
      .from('#hero-title .line', {
        yPercent: 110, duration: 1, ease: 'power4.out', stagger: 0.12
      }, '-=0.5')
      .from('.hero__sub, .hero__actions', {
        y: 24, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12
      }, '-=0.6')
      .from('.header', { y: -20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.8');
  } else if (document.querySelector('.page-hero')) {
    // Inner pages: simple hero intro
    gsap.timeline()
      .from('.page-hero__eyebrow', { y: 20, opacity: 0, duration: 0.6, ease: 'power3.out', delay: 0.1 })
      .from('.header', { y: -20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '<');
  }

  // Generic reveals
  gsap.utils.toArray('.reveal').forEach(function (el) {
    gsap.fromTo(el, { y: 36, opacity: 0 }, {
      y: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Split-word headline reveals
  gsap.utils.toArray('.split').forEach(function (el) {
    gsap.fromTo(el.querySelectorAll('.word'), { yPercent: 60, opacity: 0 }, {
      yPercent: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.04,
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  // Product media: parallax + tilt-in
  gsap.utils.toArray('[data-parallax]').forEach(function (el) {
    gsap.fromTo(el, { y: 60, rotateX: 6, opacity: 0 }, {
      y: 0, rotateX: 0, opacity: 1, duration: 1.1, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%' }
    });
    gsap.to(el, {
      yPercent: -8, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Process steps cascade
  if (document.querySelector('.process__steps')) {
    gsap.from('.step', {
      y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: '.process__steps', start: 'top 80%' }
    });
  }

  // Stat counters
  gsap.utils.toArray('.stat__num').forEach(function (el) {
    var target = parseInt(el.dataset.count, 10) || 0;
    var suffix = el.dataset.suffix || '';
    var obj = { val: 0 };
    gsap.to(obj, {
      val: target, duration: 1.6, ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 88%' },
      onUpdate: function () {
        el.textContent = Math.round(obj.val).toLocaleString() + suffix;
      }
    });
  });

  // Hero content drifts up slightly as you leave (home only)
  if (document.querySelector('.hero')) {
    gsap.to('.hero__inner', {
      yPercent: -12, opacity: 0.4, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true }
    });
  }
})();
