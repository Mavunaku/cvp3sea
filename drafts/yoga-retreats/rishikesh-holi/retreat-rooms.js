/* Green Hotel room gallery: thumbnails swap the main photo; clicking the photo opens a lightbox (arrows, swipe, Esc). */
(function () {
  'use strict';
  var gal = document.getElementById('rgal');
  var lb = document.getElementById('lb');
  if (!gal || !lb) return;

  var mainImg = document.getElementById('rgMain');
  var cap = document.getElementById('rgCap');
  var mainBtn = document.getElementById('rgMainBtn');
  var thumbs = Array.prototype.slice.call(gal.querySelectorAll('.rg-thumbs button'));
  var lbImg = document.getElementById('lbImg');
  var lbCap = document.getElementById('lbCap');
  var html = document.documentElement;
  var cur = 0, lastFocus = null;

  function show(i) {
    cur = (i + thumbs.length) % thumbs.length;
    var b = thumbs[cur];
    thumbs.forEach(function (t) { var on = t === b; t.classList.toggle('on', on); t.setAttribute('aria-pressed', on ? 'true' : 'false'); });
    mainImg.classList.add('swap');
    var next = new Image();
    next.onload = function () { mainImg.src = b.getAttribute('data-src'); mainImg.alt = b.getAttribute('data-alt') || ''; mainImg.classList.remove('swap'); };
    next.onerror = function () { mainImg.classList.remove('swap'); };
    next.src = b.getAttribute('data-src');
    cap.innerHTML = b.getAttribute('data-cap');
  }
  thumbs.forEach(function (b, i) { b.addEventListener('click', function () { show(i); }); });

  function fill() {
    var b = thumbs[cur];
    lbImg.src = b.getAttribute('data-lg');
    lbImg.alt = b.getAttribute('data-alt') || '';
    lbCap.innerHTML = b.getAttribute('data-cap') + ' · ' + (cur + 1) + ' / ' + thumbs.length;
  }
  function open() {
    lastFocus = document.activeElement;
    fill();
    lb.hidden = false;
    html.classList.add('lb-open');
    document.getElementById('lbClose').focus();
  }
  function close() {
    if (lb.hidden) return;
    lb.hidden = true;
    html.classList.remove('lb-open');
    lbImg.removeAttribute('src');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  function step(d) { show(cur + d); fill(); }

  mainBtn.addEventListener('click', open);
  document.getElementById('lbClose').addEventListener('click', close);
  document.getElementById('lbPrev').addEventListener('click', function () { step(-1); });
  document.getElementById('lbNext').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) close(); });

  document.addEventListener('keydown', function (e) {
    if (lb.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); step(1); }
    else if (e.key === 'Tab') {
      var f = Array.prototype.filter.call(lb.querySelectorAll('button'), function (n) { return n.offsetParent !== null; });
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* swipe on touch screens */
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx === null) return;
    var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  });
})();
