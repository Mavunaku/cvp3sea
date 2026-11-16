/* "Inside the Ashram" video section
   - a muted 480p loop plays inside the organic shape only while it is on screen
   - nothing autoplays for visitors who prefer reduced motion, use Data Saver, or are on a slow (2g) connection
   - the full 720p video with sound downloads only when someone presses play
   - pointer parallax on desktop; Esc / backdrop click closes the player and focus returns to the button */
(function () {
  'use strict';
  var stage = document.getElementById('ashramStage');
  var modal = document.getElementById('vm');
  if (!stage || !modal) return;

  var shape = document.getElementById('ashramShape');
  var loop = document.getElementById('ashramLoop');
  var mv = document.getElementById('vmVideo');
  var closeBtn = document.getElementById('vmClose');
  var html = document.documentElement;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var conn = navigator.connection || {};
  var saver = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  var canAuto = !reduce && !saver;
  var inView = false, loaded = false, lastFocus = null;

  /* ---------- ambient loop ---------- */
  function playLoop() {
    if (!canAuto || modal.hidden === false) return;
    if (!loaded) { loaded = true; loop.src = loop.getAttribute('data-src'); loop.load(); }
    var p = loop.play();
    if (p && p.catch) p.catch(function () { /* autoplay blocked: poster stays */ });
  }
  /* show the video only once it has actually painted a frame; until then (or if it fails) the picture stays */
  function showVideo() { shape.classList.add('is-playing'); }
  if (loop.requestVideoFrameCallback) {
    loop.addEventListener('playing', function () { loop.requestVideoFrameCallback(showVideo); }, { once: true });
  } else {
    loop.addEventListener('timeupdate', function onT() { if (loop.currentTime > 0.1) { showVideo(); loop.removeEventListener('timeupdate', onT); } });
  }
  loop.addEventListener('error', function () { shape.classList.remove('is-playing'); });
  if (canAuto && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        inView = e.isIntersecting;
        if (inView) playLoop(); else loop.pause();
      });
    }, { threshold: 0.25, rootMargin: '120px 0px' }).observe(stage);
  }

  /* ---------- pointer parallax (desktop) ---------- */
  if (!reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    var raf = 0;
    stage.addEventListener('pointermove', function (e) {
      var r = stage.getBoundingClientRect();
      var x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      var y = ((e.clientY - r.top) / r.height - 0.5) * 2;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(function () {
        stage.style.setProperty('--tx', x.toFixed(3));
        stage.style.setProperty('--ty', y.toFixed(3));
      });
    });
    stage.addEventListener('pointerleave', function () {
      cancelAnimationFrame(raf);
      stage.style.setProperty('--tx', 0);
      stage.style.setProperty('--ty', 0);
    });
  }

  /* ---------- full player ---------- */
  /* Two sizes of the tour: sharp 1080p (about 38 MB) for laptops and desktops, and a lighter 720p
     (about 15 MB) for phones, small windows and Data Saver, so nobody burns mobile data by accident. */
  var smallScreen = matchMedia('(max-width: 900px)').matches;
  var tourSrc = (smallScreen || saver) ? mv.getAttribute('data-720') : mv.getAttribute('data-1080');
  var chapBtns = modal.querySelectorAll('.vm-chaps button');
  function markChapter() {
    var t = mv.currentTime, cur = null;
    chapBtns.forEach(function (b) { if (+b.getAttribute('data-t') <= t + 0.3) cur = b; });
    chapBtns.forEach(function (b) { b.classList.toggle('on', b === cur); });
  }
  mv.addEventListener('timeupdate', markChapter);

  function openPlayer(t) {
    lastFocus = document.activeElement;
    modal.hidden = false;
    html.classList.add('vm-open');
    loop.pause();
    if (!mv.getAttribute('src')) { mv.src = tourSrc; mv.load(); }
    function start() {
      if (typeof t === 'number' && isFinite(t)) { try { mv.currentTime = t; } catch (e) { /* ignore */ } }
      mv.muted = false;
      mv.volume = 1;
      var p = mv.play();
      if (p && p.catch) p.catch(function () { /* user can press the native play button */ });
    }
    if (mv.readyState >= 1) start(); else mv.addEventListener('loadedmetadata', start, { once: true });
    closeBtn.focus();
  }
  function closePlayer() {
    if (modal.hidden) return;
    mv.pause();
    modal.hidden = true;
    html.classList.remove('vm-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
    if (inView) playLoop();
  }

  /* triggers: badge, big button, the video shape itself, and the chapter chips */
  document.getElementById('ashramPlay').addEventListener('click', function () { openPlayer(0); });
  document.getElementById('ashramOpen').addEventListener('click', function () { openPlayer(0); });
  shape.addEventListener('click', function () { openPlayer(0); });
  document.querySelectorAll('.ashram-chaps button').forEach(function (b) {
    b.addEventListener('click', function () { openPlayer(+b.getAttribute('data-t')); });
  });
  chapBtns.forEach(function (b) {
    b.addEventListener('click', function () {
      mv.currentTime = +b.getAttribute('data-t');
      var p = mv.play(); if (p && p.catch) p.catch(function () {});
    });
  });

  closeBtn.addEventListener('click', closePlayer);
  modal.addEventListener('click', function (e) { if (e.target === modal) closePlayer(); });
  document.addEventListener('keydown', function (e) {
    if (modal.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); closePlayer(); return; }
    if (e.key === 'Tab') {                      /* keep keyboard focus inside the player */
      var f = Array.prototype.filter.call(modal.querySelectorAll('button, video[controls]'), function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
})();
