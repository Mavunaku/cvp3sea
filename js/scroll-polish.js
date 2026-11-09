/* Scroll polish for cvpproperties.com
   Uses ScrollCraft v0.1.0 (reveal), MIT (c) Bilal Studios, https://github.com/Bilal-Studios/scroll-craft
   Adds: a thin progress line at the top of the page, scroll reveals for every section, staggered card groups
   and headings that fill with colour. Replaces WOW.js. Visitors who prefer reduced motion get no reveals. */

var w={linear:e=>e,quadOut:e=>1-(1-e)**2,cubicOut:e=>1-(1-e)**3,quartOut:e=>1-(1-e)**4,quintOut:e=>1-(1-e)**5,elasticOut:e=>e===0||e===1?e:2**(-10*e)*Math.sin((e*10-.75)*(2*Math.PI/3))+1,backOut:e=>1+2.70158*(e-1)**3+1.70158*(e-1)**2};function v(e){var t;return typeof e=="function"?e:(t=w[e])!=null?t:w.cubicOut}function F(e){return typeof e=="string"?Array.from(document.querySelectorAll(e)):e instanceof Element?[e]:Array.from(e)}function A(e,t){switch(e){case "up":return `translateY(${t})`;case "down":return `translateY(-${t})`;case "left":return `translateX(${t})`;case "right":return `translateX(-${t})`}}function L(e,t={}){let{delay:a=0,distance:r="24px",direction:s="up",duration:m=600,ease:y="cubicOut",threshold:f=.12,rootMargin:u="0px 0px -10% 0px",once:d=true,inClass:i="sc-in"}=t,g=v(y),c=F(e);if(!c.length)return ()=>{};let E=A(s,r);if(c.forEach(o=>{let n=o;n.style.opacity="0",n.style.transform=E,n.style.transition="none",n.style.willChange="opacity, transform";}),!("IntersectionObserver"in window))return c.forEach(o=>{let n=o;n.style.opacity="1",n.style.transform="none",n.classList.add(i);}),()=>{};let h=new IntersectionObserver(o=>{o.forEach(n=>{if(!n.isIntersecting)return;let l=n.target,b=performance.now()+a;function x(q){if(q<b){requestAnimationFrame(x);return}let $=Math.min(1,(q-b)/m),p=g($);s==="left"||s==="right"?[`${parseFloat(r)*(1-p)}${r.replace(/[\d.-]/g,"")||"px"}`,"0"]:["0",`${parseFloat(r)*(s==="up"?1-p:-(1-p))}${r.replace(/[\d.-]/g,"")||"px"}`];l.style.opacity=String(p),l.style.transform=s==="left"||s==="right"?`translateX(${parseFloat(r)*(s==="left"?1-p:-(1-p))}${r.replace(/[\d.-]/g,"")||"px"})`:`translateY(${parseFloat(r)*(s==="up"?1-p:-(1-p))}${r.replace(/[\d.-]/g,"")||"px"})`,$<1?requestAnimationFrame(x):(l.style.opacity="1",l.style.transform="none",l.style.willChange="auto",l.classList.add(i));}requestAnimationFrame(x),d&&h.unobserve(n.target);});},{threshold:f,rootMargin:u});return c.forEach(o=>h.observe(o)),()=>h.disconnect()}function M(e,t={}){let{duration:a=1400,ease:r="cubicOut",threshold:s=.45,formatter:m=i=>i.toLocaleString("en-US"),attribute:y="data-count"}=t,f=v(r),u=F(e);if(!u.length||!("IntersectionObserver"in window))return ()=>{};let d=new IntersectionObserver(i=>{i.forEach(g=>{var n;if(!g.isIntersecting)return;let c=g.target,E=Number((n=c.getAttribute(y))!=null?n:0),h=performance.now();function o(l){let b=Math.min(1,(l-h)/a);c.textContent=m(Math.round(E*f(b))),b<1&&requestAnimationFrame(o);}requestAnimationFrame(o),d.unobserve(c);});},{threshold:s});return u.forEach(i=>d.observe(i)),()=>d.disconnect()}function N(e,t={}){let{start:a=.82,end:r=.2,fillSelector:s=".sc-fill"}=t,m=F(e);if(!m.length)return ()=>{};let y=m.map(u=>u.querySelector(s));function f(){let u=window.innerHeight;m.forEach((d,i)=>{let g=y[i];if(!g)return;let c=d.getBoundingClientRect(),E=u*a,h=u*r,o=Math.min(1,Math.max(0,(E-c.top)/(E-h)));g.style.clipPath=`inset(0 ${Math.round((1-o)*100)}% 0 0)`;});}return window.addEventListener("scroll",f,{passive:true}),f(),()=>window.removeEventListener("scroll",f)}var T=class{constructor(){this.cleanups=[];}reveal(t,a){return this.cleanups.push(L(t,a)),this}counter(t,a){return this.cleanups.push(M(t,a)),this}progress(t,a){return this.cleanups.push(N(t,a)),this}destroy(){this.cleanups.forEach(t=>t()),this.cleanups=[];}};

const ScrollCraft = T;

/* thin scroll-progress line (always on, it is not an animation) */
(function () {
  const st = document.createElement('style');
  st.textContent = '.cvp-sbar{position:fixed;top:0;left:0;width:100%;height:3px;z-index:2000;transform-origin:0 50%;transform:scaleX(0);background:linear-gradient(90deg,#1a9e8c,#2e7d32,#d4a24c);pointer-events:none;}';
  document.head.appendChild(st);
  const bar = document.createElement('div');
  bar.className = 'cvp-sbar';
  bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  let tick = false;
  const upd = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
    tick = false;
  };
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  upd();
})();

/* one consistent scroll system for every page */
if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const sc = new ScrollCraft();

  /* reveal an element, then hand control back to the stylesheet so hover effects keep working */
  const go = (el, opts) => {
    sc.reveal(el, Object.assign({ distance: '30px', duration: 800, ease: 'quartOut' }, opts));
    new MutationObserver((_, obs) => {
      if (el.classList.contains('sc-in')) {
        ['opacity', 'transform', 'transition', 'will-change'].forEach(p => el.style.removeProperty(p));
        obs.disconnect();
      }
    }).observe(el, { attributes: true, attributeFilter: ['class'] });
  };

  /* 1. Elements that used WOW.js. On most pages WOW was never started, so they all played at once on load.
        Anything below the first screen now reveals as you scroll to it. The first screen keeps its entrance. */
  const dirs = { fadeInUp: 'up', fadeInDown: 'down', fadeInLeft: 'right', fadeInRight: 'left', zoomIn: 'up', fadeIn: 'up' };
  document.querySelectorAll('.wow').forEach(el => {
    if (el.getBoundingClientRect().top < innerHeight * 0.85) return;
    const m = (el.className.match(/\b(fadeInUp|fadeInDown|fadeInLeft|fadeInRight|zoomIn|fadeIn)\b/) || [])[1] || 'fadeInUp';
    const delay = Math.round((parseFloat(el.getAttribute('data-wow-delay')) || 0) * 1000);
    el.classList.remove('wow', 'animated', 'fadeInUp', 'fadeInDown', 'fadeInLeft', 'fadeInRight', 'zoomIn', 'fadeIn');
    el.style.removeProperty('visibility');
    el.style.removeProperty('animation-name');
    go(el, { direction: dirs[m], delay, distance: m === 'zoomIn' ? '18px' : '34px' });
  });

  /* 2. Card groups come in one after another */
  [
    { items: '.project-wrapper > .portfolio-item', step: 120 },
    { items: '.amenities-grid > .amenity-card',    step: 70 },
    { items: '.gs',                                step: 0 },
    { items: '.why-list > li',                     step: 110, base: 500 },
    { items: '.footer-grid > .footer-col',         step: 120 },
    { items: '.practice-accordion .practice-item', step: 90 }
  ].forEach(g => {
    document.querySelectorAll(g.items).forEach((el, i) => go(el, { delay: (g.base || 0) + (i % 5) * g.step }));
  });

  /* 3. Section headings fill with colour as they scroll through the viewport */
  const heads = [];
  document.querySelectorAll('main h2, section h2, .combined-section-title').forEach(h => {
    const r = h.getBoundingClientRect();
    if (h.closest('footer, .modern-hero, .sl-slider, .hero-why-card, .navbar') || h.querySelector('.cvp-fillh')) return;
    if (r.height === 0 || r.top < innerHeight * 0.75) return;   /* skip the first screen and hidden headings */
    const html = h.innerHTML;
    h.innerHTML = '<span class="cvp-fillh"><span class="cvp-ghost">' + html + '</span><span class="sc-fill" aria-hidden="true">' + html + '</span></span>';
    heads.push(h.firstChild);
  });
  const st = document.createElement('style');
  st.textContent = '.cvp-fillh{display:block;position:relative}.cvp-fillh .cvp-ghost{opacity:.28}.cvp-fillh .sc-fill{position:absolute;left:0;top:0;width:100%;pointer-events:none}';
  document.head.appendChild(st);
  sc.progress(heads, { start: 0.92, end: 0.5 });
}

/* line-by-line tint behind hero text: wrap the words so each wrapped line gets its own soft band */
(function () {
  var sel = '.hero-title, .hero-description, .page-property .caption-content h1, .page-property .caption-content h2, .page-property .caption-content .slide-title, .page-property .caption-content .slide-subtitle, .yoga-hero-panel h1, .yoga-hero-panel p';
  [].forEach.call(document.querySelectorAll(sel), function (el) {
    if (el.getAttribute('data-lt') || !el.textContent.trim()) return;
    var span = document.createElement('span');
    span.className = 'lt';
    while (el.firstChild) span.appendChild(el.firstChild);
    el.appendChild(span);
    el.setAttribute('data-lt', '1');
  });
})();
