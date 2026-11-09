/* CVP Properties 4.0: "Notify me when available" for listings that are currently unavailable.
   - Adds a button to every unavailable card in "Our Properties" (and keeps it in sync with the live status
     that property-status.js loads), plus one in the hero of that property's own page.
   - The request is sent by email through the same EmailJS service as the other forms. */
(function () {
  var SERVICE_ID = 'service_sdhb5mi';
  var TEMPLATE_ID = 'template_kti6qzr';
  var EMAIL_RX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  var modal, form, current, lastFocus;

  /* ---------- dialog ---------- */
  function build() {
    modal = document.createElement('div');
    modal.className = 'nm-overlay';
    modal.setAttribute('hidden', '');
    modal.innerHTML =
      '<div class="nm-dialog" role="dialog" aria-modal="true" aria-labelledby="nm-title">' +
        '<button type="button" class="nm-close" aria-label="Close"><i class="fa fa-times"></i></button>' +
        '<div class="nm-view nm-form-view">' +
          '<span class="nm-icon"><i class="fa fa-bell-o"></i></span>' +
          '<h3 id="nm-title">Get notified when it opens up</h3>' +
          '<p class="nm-sub">Leave your email and we will tell you as soon as <b class="nm-prop"></b> is available.</p>' +
          '<form novalidate>' +
            '<label>Your name<input type="text" name="name" autocomplete="name" required></label>' +
            '<label>Email<input type="email" name="email" autocomplete="email" required placeholder="you@example.com"></label>' +
            '<label>Phone <span>(optional)</span><input type="tel" name="phone" autocomplete="tel"></label>' +
            '<input type="text" name="website" class="nm-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
            '<p class="nm-error" role="alert" hidden></p>' +
            '<button type="submit" class="nm-submit">Notify me</button>' +
            '<p class="nm-fine">We only use your details to tell you about this home.</p>' +
          '</form>' +
        '</div>' +
        '<div class="nm-view nm-done-view" hidden>' +
          '<span class="nm-icon nm-ok"><i class="fa fa-check"></i></span>' +
          '<h3>You are on the list</h3>' +
          '<p class="nm-sub">We will email you as soon as <b class="nm-prop"></b> is available.</p>' +
          '<button type="button" class="nm-submit nm-done-btn">Done</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);
    form = modal.querySelector('form');

    modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    modal.querySelector('.nm-close').addEventListener('click', close);
    modal.querySelector('.nm-done-btn').addEventListener('click', close);
    document.addEventListener('keydown', function (e) {
      if (modal.hasAttribute('hidden')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {                       /* keep focus inside the dialog */
        var f = [].slice.call(modal.querySelectorAll('button, input:not(.nm-hp)')).filter(function (el) { return el.offsetParent !== null; });
        if (!f.length) return;
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    form.addEventListener('submit', submit);
  }

  function open(info) {
    if (!modal) build();
    current = info;
    lastFocus = document.activeElement;
    [].forEach.call(modal.querySelectorAll('.nm-prop'), function (b) { b.textContent = info.title; });
    form.reset();
    showError('');
    modal.querySelector('.nm-form-view').removeAttribute('hidden');
    modal.querySelector('.nm-done-view').setAttribute('hidden', '');
    var sb = form.querySelector('.nm-submit'); sb.disabled = false; sb.textContent = 'Notify me';
    modal.removeAttribute('hidden');
    document.documentElement.classList.add('nm-open');
    setTimeout(function () { form.elements.name.focus(); }, 30);
  }

  function close() {
    if (!modal) return;
    modal.setAttribute('hidden', '');
    document.documentElement.classList.remove('nm-open');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function showError(msg) {
    var el = modal.querySelector('.nm-error');
    el.textContent = msg;
    if (msg) el.removeAttribute('hidden'); else el.setAttribute('hidden', '');
  }

  function submit(e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();
    var phone = form.elements.phone.value.trim();
    if (form.elements.website.value) return;                 /* spam trap */
    if (!name) { showError('Please enter your name.'); form.elements.name.focus(); return; }
    if (!EMAIL_RX.test(email)) { showError('Please enter a valid email address.'); form.elements.email.focus(); return; }
    showError('');

    var btn = form.querySelector('.nm-submit');
    btn.disabled = true; btn.textContent = 'Sending...';

    if (typeof emailjs === 'undefined') {
      btn.disabled = false; btn.textContent = 'Notify me';
      showError('Something went wrong. Please try again or call us directly.');
      return;
    }
    emailjs.send(SERVICE_ID, TEMPLATE_ID, {
      name: name,
      email: email,
      phone: phone || '(not provided)',
      tour_date: '(notify request)',
      tour_time: '(notify request)',
      message: 'NOTIFY ME REQUEST: please email me when "' + current.title + '" (' + current.slug + ') becomes available.'
    }).then(function () {
      modal.querySelector('.nm-form-view').setAttribute('hidden', '');
      modal.querySelector('.nm-done-view').removeAttribute('hidden');
      modal.querySelector('.nm-done-btn').focus();
    }).catch(function () {
      btn.disabled = false; btn.textContent = 'Notify me';
      showError('Something went wrong. Please try again or call us directly.');
    });
  }

  /* ---------- buttons ---------- */
  function info(card) {
    var h = card.querySelector('.portfolio-body h3');
    return { slug: card.getAttribute('data-property-slug'), title: (h && h.textContent.trim()) || 'this property' };
  }
  function unavailable(card) { return !!card.querySelector('.portfolio-badge.unavailable'); }

  function syncCard(card) {
    var body = card.querySelector('.portfolio-body');
    if (!body) return;
    var btn = body.querySelector('.notify-btn');
    if (unavailable(card)) {
      if (!btn) {
        btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'notify-btn';
        btn.innerHTML = '<i class="fa fa-bell-o"></i> Notify me when available';
        btn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); open(info(card)); });
        body.appendChild(btn);
      }
    } else if (btn) {
      btn.parentNode.removeChild(btn);
    }
  }

  /* the hero of a property's own page: use the matching card to know its status */
  var pageSlug = (location.pathname.split('/').pop() || '').replace(/\.html$/, '');
  function syncHero() {
    var groups = document.querySelectorAll('#home-slider .hero-cta-group');
    if (!groups.length || !pageSlug) return;
    var card = document.querySelector('[data-property-slug="' + pageSlug + '"]');
    if (!card) return;
    [].forEach.call(groups, function (g) {
      var b = g.querySelector('.notify-hero');
      if (unavailable(card)) {
        if (!b) {
          b = document.createElement('a');
          b.href = '#';
          b.className = 'hero-btn-outline notify-hero';
          b.innerHTML = '<i class="fa fa-bell-o"></i> Notify me';
          b.addEventListener('click', function (e) { e.preventDefault(); open(info(card)); });
          g.appendChild(b);
        }
      } else if (b) {
        b.parentNode.removeChild(b);
      }
    });
  }

  function syncAll() {
    [].forEach.call(document.querySelectorAll('[data-property-slug]'), syncCard);
    syncHero();
  }

  syncAll();
  /* property-status.js updates badges after a network call, so watch for it */
  [].forEach.call(document.querySelectorAll('[data-property-slug]'), function (card) {
    new MutationObserver(syncAll).observe(card, { attributes: true, subtree: true, attributeFilter: ['class'] });
  });
})();
