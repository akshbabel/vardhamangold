/* ============ Vardhman Gold — interactions (shared across pages) ============ */
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
    // Stay transparent while the dark hero / page-hero is behind the header;
    // switch to the light scrolled style only once it has scrolled past.
    var darkSection = document.querySelector('.hero') || document.querySelector('.page-hero');
    var onScroll = function () {
      var scrolled;
      if (darkSection) {
        scrolled = darkSection.getBoundingClientRect().bottom <= header.offsetHeight;
      } else {
        scrolled = window.scrollY > 40;
      }
      header.classList.toggle('is-scrolled', scrolled);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
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

  /* ---------- Button hover ripple-fill effect ---------- */
  document.querySelectorAll('.btn').forEach(function (btn) {
    // Lift the button content above the fill layer
    var label = document.createElement('span');
    label.className = 'btn__label';
    while (btn.firstChild) label.appendChild(btn.firstChild);
    btn.appendChild(label);

    var fill = document.createElement('span');
    fill.className = 'btn__fill';
    btn.appendChild(fill);

    var placeFill = function (e) {
      var rect = btn.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      // Circle diameter: twice the distance to the farthest corner,
      // so the fill always covers the whole button from any entry point
      var dx = Math.max(x, rect.width - x);
      var dy = Math.max(y, rect.height - y);
      var d = Math.sqrt(dx * dx + dy * dy) * 2;
      fill.style.width = d + 'px';
      fill.style.height = d + 'px';
      fill.style.left = x + 'px';
      fill.style.top = y + 'px';
    };

    btn.addEventListener('mouseenter', function (e) {
      placeFill(e);
      void fill.offsetWidth; // commit position before scaling up
      btn.classList.add('is-hovered');
    });

    btn.addEventListener('mouseleave', function (e) {
      placeFill(e);
      void fill.offsetWidth; // commit position so it shrinks toward the exit point
      btn.classList.remove('is-hovered');
    });
  });

  /* ---------- Three.js golden particle field (home hero only) ---------- */
  var canvasBack = document.getElementById('hero-canvas');
  var canvasFront = document.getElementById('hero-canvas-front');
  if (window.THREE && canvasBack && canvasFront && !prefersReduced) {
    try {
      var rendererBack = new THREE.WebGLRenderer({ canvas: canvasBack, alpha: true, antialias: false });
      rendererBack.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

      var rendererFront = new THREE.WebGLRenderer({ canvas: canvasFront, alpha: true, antialias: false });
      rendererFront.setPixelRatio(Math.min(window.devicePixelRatio, isMobile ? 1.5 : 2));

      var sceneBack = new THREE.Scene();
      var sceneFront = new THREE.Scene();

      var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
      camera.position.z = 8;

      var COUNT = isMobile ? 450 : 1200;
      var COUNT_BACK = Math.floor(COUNT * 0.75);
      var COUNT_FRONT = COUNT - COUNT_BACK;

      // Positions & speeds back
      var posBack = new Float32Array(COUNT_BACK * 3);
      var speedsBack = new Float32Array(COUNT_BACK);
      for (var i = 0; i < COUNT_BACK; i++) {
        posBack[i * 3] = (Math.random() - 0.5) * 22;     // x
        posBack[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
        posBack[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        speedsBack[i] = 0.2 + Math.random() * 0.8;
      }
      var geoBack = new THREE.BufferGeometry();
      geoBack.setAttribute('position', new THREE.BufferAttribute(posBack, 3));

      // Positions & speeds front
      var posFront = new Float32Array(COUNT_FRONT * 3);
      var speedsFront = new Float32Array(COUNT_FRONT);
      for (var i = 0; i < COUNT_FRONT; i++) {
        posFront[i * 3] = (Math.random() - 0.5) * 22;     // x
        posFront[i * 3 + 1] = (Math.random() - 0.5) * 14; // y
        posFront[i * 3 + 2] = (Math.random() - 0.5) * 10; // z
        speedsFront[i] = 0.2 + Math.random() * 0.8;
      }
      var geoFront = new THREE.BufferGeometry();
      geoFront.setAttribute('position', new THREE.BufferAttribute(posFront, 3));

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

      var pointsBack = new THREE.Points(geoBack, mat);
      sceneBack.add(pointsBack);

      var pointsFront = new THREE.Points(geoFront, mat);
      sceneFront.add(pointsFront);

      var mouseX = 0, mouseY = 0;
      window.addEventListener('pointermove', function (e) {
        mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
        mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
      }, { passive: true });

      var resize = function () {
        var w = canvasBack.parentElement.clientWidth;
        var h = canvasBack.parentElement.clientHeight;
        
        rendererBack.setSize(w, h, false);
        rendererFront.setSize(w, h, false);
        
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
        }).observe(canvasBack);
      }

      (function animate() {
        requestAnimationFrame(animate);
        if (!heroVisible) return; // pause off-screen for performance
        var t = clock.getElapsedTime();
        
        // Update back particles
        var posB = geoBack.attributes.position.array;
        for (var j = 0; j < COUNT_BACK; j++) {
          posB[j * 3 + 1] += Math.sin(t * speedsBack[j] + j) * 0.0015; // gentle drift
        }
        geoBack.attributes.position.needsUpdate = true;
        pointsBack.rotation.y = t * 0.03 + mouseX * 0.08;
        pointsBack.rotation.x = mouseY * 0.05;

        // Update front particles
        var posF = geoFront.attributes.position.array;
        for (var k = 0; k < COUNT_FRONT; k++) {
          posF[k * 3 + 1] += Math.sin(t * speedsFront[k] + k) * 0.0015; // gentle drift
        }
        geoFront.attributes.position.needsUpdate = true;
        pointsFront.rotation.y = t * 0.03 + mouseX * 0.08;
        pointsFront.rotation.x = mouseY * 0.05;

        rendererBack.render(sceneBack, camera);
        rendererFront.render(sceneFront, camera);
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
      .from('.header', { y: -20, opacity: 0, duration: 0.6, ease: 'power2.out' }, '-=0.8')
      .eventCallback("onComplete", function () {
        ScrollTrigger.refresh();
      });
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

  // About: journey timeline — scrubbed progress line + sticky-year milestone reveals
  if (document.querySelector('.journey')) {
    var journeyLine = document.querySelector('.journey__line');
    if (journeyLine) {
      gsap.to(journeyLine, {
        scaleY: 1, ease: 'none',
        scrollTrigger: {
          trigger: '.journey__track', start: 'top 75%', end: 'bottom 55%', scrub: true
        }
      });
    }
    gsap.utils.toArray('.journey__item').forEach(function (item) {
      gsap.from(item.querySelector('.journey__year'), {
        x: -28, opacity: 0, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 80%' }
      });
      gsap.from(item.querySelector('.journey__body'), {
        y: 50, opacity: 0, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: item, start: 'top 78%' }
      });
    });
  }

  // Hero content drifts up slightly as you leave (home only) —
  // starts only after 40% of the hero has scrolled past, so the headline
  // doesn't fade while the dark hero section is still on screen
  if (document.querySelector('.hero')) {
    gsap.to('.hero__inner', {
      yPercent: -12, opacity: 0.4, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: '40% top', end: 'bottom top', scrub: true }
    });
  }
})();
