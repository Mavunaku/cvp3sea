/* CVP Properties 4.0: turns the property gallery into a sideways slideshow.
   Swipe, drag, scroll, use the arrow buttons or the arrow keys. Clicking a photo still opens the lightbox. */
(function () {
  var track = document.querySelector('.gallery-grid');
  if (!track) return;
  var items = [].slice.call(track.querySelectorAll('.gallery-item'));
  if (items.length < 2) return;

  var wrap = document.createElement('div');
  wrap.className = 'gs';
  track.parentNode.insertBefore(wrap, track);
  wrap.appendChild(track);
  track.classList.add('gs-track');
  track.setAttribute('tabindex', '0');
  track.setAttribute('role', 'region');
  track.setAttribute('aria-label', 'Photo slideshow. Use the left and right arrow keys to move.');

  /* captions from the photo titles ("Greek Peak - Modern Kitchen" becomes "Modern Kitchen") */
  items.forEach(function (it) {
    var a = it.querySelector('a');
    var t = a && a.getAttribute('title');
    if (!t) return;
    var cap = document.createElement('span');
    cap.className = 'gs-cap';
    cap.textContent = t.replace(/^.*?\s-\s/, '');
    it.appendChild(cap);
  });

  function btn(cls, label, icon) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'gs-btn ' + cls;
    b.setAttribute('aria-label', label);
    b.innerHTML = '<i class="fa ' + icon + '"></i>';
    wrap.appendChild(b);
    return b;
  }
  var prev = btn('gs-prev', 'Previous photo', 'fa-angle-left');
  var next = btn('gs-next', 'Next photo', 'fa-angle-right');

  var meta = document.createElement('div');
  meta.className = 'gs-meta';
  meta.innerHTML = '<div class="gs-bar"><span class="gs-fill"></span></div><div class="gs-count" aria-live="polite"></div>';
  wrap.appendChild(meta);
  var hint = document.createElement('p');
  hint.className = 'gs-hint';
  hint.textContent = 'Swipe or use the arrows. Click a photo to see it larger.';
  wrap.appendChild(hint);
  var fill = meta.querySelector('.gs-fill'), count = meta.querySelector('.gs-count');

  function stepPx() {
    var a = items[0].getBoundingClientRect(), b = items[1].getBoundingClientRect();
    return Math.max(1, b.left - a.left);
  }
  function go(dir) { track.scrollBy({ left: dir * stepPx(), behavior: 'smooth' }); }
  prev.addEventListener('click', function () { go(-1); });
  next.addEventListener('click', function () { go(1); });
  track.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });

  /* progress, counter and arrow state */
  var ticking = false;
  function update() {
    ticking = false;
    var step = stepPx(), max = track.scrollWidth - track.clientWidth;
    var vis = Math.max(1, Math.round(track.clientWidth / step));          /* photos on screen at once */
    var first = Math.max(0, Math.min(items.length - vis, Math.round(track.scrollLeft / step)));
    fill.style.width = Math.max(8, ((first + vis) / items.length) * 100) + '%';
    count.textContent = vis > 1 ? (first + 1) + '–' + (first + vis) + ' / ' + items.length : (first + 1) + ' / ' + items.length;
    prev.disabled = track.scrollLeft < 8;
    next.disabled = track.scrollLeft > max - 8;
  }
  track.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  update();

  /* drag with the mouse; a drag must not count as a click on a photo */
  var down = false, startX = 0, startLeft = 0, moved = 0;
  track.addEventListener('pointerdown', function (e) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = 0; startX = e.clientX; startLeft = track.scrollLeft;
  });
  window.addEventListener('pointermove', function (e) {
    if (!down) return;
    var dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (moved > 6) { track.classList.add('is-dragging'); track.scrollLeft = startLeft - dx; }
  });
  window.addEventListener('pointerup', function () {
    if (!down) return;
    down = false;
    track.classList.remove('is-dragging');
  });
  track.addEventListener('click', function (e) {
    if (moved > 6) { e.preventDefault(); e.stopPropagation(); moved = 0; }
  }, true);
  track.addEventListener('dragstart', function (e) { e.preventDefault(); });
})();
