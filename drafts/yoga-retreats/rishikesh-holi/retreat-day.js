/* "A day in Rishikesh": the side vines behave like a light thread on the wind.
   The vine line is a chain of tiny springs. Brushing the pointer past pushes the nearby stretch of thread;
   the bend then travels along the line, swings past rest a few times and settles. The leaves ride the line and
   are fixed to it, so the whole vine moves as one piece. Desktop pointers only; everything else just sees the still vine. */
(function () {
  'use strict';
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var sec = document.getElementById('day');
  if (!sec) return;

  /* the vine centre line, the same curve the artwork was drawn with (viewBox units, before the 100px top offset) */
  var SEGS = [
    [[330, 0], [430, 90], [240, 170], [330, 260]],
    [[330, 260], [420, 350], [250, 430], [320, 520]],
    [[320, 520], [390, 610], [240, 690], [320, 780]],
    [[320, 780], [400, 860], [270, 930], [330, 1010]]
  ];
  var PER = 24, N = SEGS.length * PER + 1;           /* 97 points along the thread */
  var rest = [];
  SEGS.forEach(function (s) {
    for (var k = 0; k < PER; k++) {
      var t = k / PER, u = 1 - t;
      rest.push([
        u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0],
        u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1]
      ]);
    }
  });
  rest.push(SEGS[SEGS.length - 1][3].slice());

  /* physics: a displacement (dx, dy) per point; both ends are pinned, so the lotus stay put */
  var K = 0.006,        /* pull back toward rest: low, so it sways slowly like a thread */
      C = 0.05,         /* damping: a few soft swings, then still */
      S = 0.30,         /* coupling to neighbours: makes the bend smooth and lets it travel along the line */
      R = 135,          /* how far the breeze reaches around the pointer (viewBox units) */
      GAIN = 0.014,     /* how strongly pointer motion pushes the thread */
      MAXU = 22;        /* never bends further than this */

  function tangentDeg(p, i) {
    var a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    return Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  }

  var vines = Array.prototype.map.call(sec.querySelectorAll('.day-deco'), function (el) {
    var svg = el.querySelector('svg');
    var path = svg.querySelector('.vine');
    var leaves = Array.prototype.map.call(svg.querySelectorAll('.lf'), function (lf, n) {
      var g = lf.parentNode, m = /rotate\((-?[\d.]+)\)/.exec(g.getAttribute('transform'));
      var idx = 5 + 5 * n;                              /* the point each leaf grows from */
      return { g: g, idx: idx, base: parseFloat(m[1]) - tangentDeg(rest, idx) };
    });
    return {
      el: el, svg: svg, path: path, leaves: leaves, run: false,
      ux: new Float32Array(N), uy: new Float32Array(N), vx: new Float32Array(N), vy: new Float32Array(N),
      ax: new Float32Array(N), ay: new Float32Array(N)
    };
  });
  if (!vines.length || vines.some(function (v) { return !v.path; })) return;

  /* a smooth line through every other point (Catmull-Rom turned into cubic curves) */
  function draw(v) {
    var pts = [], i;
    for (i = 0; i < N; i += 2) pts.push([rest[i][0] + v.ux[i], rest[i][1] + v.uy[i]]);
    var d = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
    for (var j = 0; j < pts.length - 1; j++) {
      var p0 = pts[Math.max(0, j - 1)], p1 = pts[j], p2 = pts[j + 1], p3 = pts[Math.min(pts.length - 1, j + 2)];
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ',' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
                 (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ',' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
                 p2[0].toFixed(1) + ',' + p2[1].toFixed(1);
    }
    v.path.setAttribute('d', d);
    /* leaves are part of the vine: each one stays fixed to its point on the line and turns exactly with the line there */
    v.leaves.forEach(function (L) {
      var k = L.idx, x = rest[k][0] + v.ux[k], y = rest[k][1] + v.uy[k];
      var ax = rest[k - 1][0] + v.ux[k - 1], ay = rest[k - 1][1] + v.uy[k - 1];
      var bx = rest[k + 1][0] + v.ux[k + 1], by = rest[k + 1][1] + v.uy[k + 1];
      var ang = Math.atan2(by - ay, bx - ax) * 180 / Math.PI + L.base;
      L.g.setAttribute('transform', 'translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + ang.toFixed(1) + ')');
    });
  }

  function step(v) {
    var ux = v.ux, uy = v.uy, vx = v.vx, vy = v.vy, e = 0, i;
    for (i = 1; i < N - 1; i++) {
      v.ax[i] = -K * ux[i] - C * vx[i] + S * (ux[i - 1] + ux[i + 1] - 2 * ux[i]);
      v.ay[i] = -K * uy[i] - C * vy[i] + S * (uy[i - 1] + uy[i + 1] - 2 * uy[i]);
    }
    for (i = 1; i < N - 1; i++) {
      vx[i] += v.ax[i]; vy[i] += v.ay[i];
      ux[i] += vx[i];   uy[i] += vy[i];
      if (ux[i] > MAXU) ux[i] = MAXU; else if (ux[i] < -MAXU) ux[i] = -MAXU;
      if (uy[i] > MAXU) uy[i] = MAXU; else if (uy[i] < -MAXU) uy[i] = -MAXU;
      e += Math.abs(ux[i]) + Math.abs(uy[i]) + 40 * (Math.abs(vx[i]) + Math.abs(vy[i]));
    }
    return e;
  }

  function loop(v) {
    var e = step(v);
    draw(v);
    if (e > 0.4) requestAnimationFrame(function () { loop(v); });
    else {                                           /* settled: snap back to the exact artwork */
      v.ux.fill(0); v.uy.fill(0); v.vx.fill(0); v.vy.fill(0);
      draw(v); v.run = false;
    }
  }

  /* pointer position -> the vine's own coordinates (works for the mirrored right-hand vine too) */
  function toLocal(v, cx, cy) {
    var m = v.svg.getScreenCTM();
    if (!m) return null;
    var pt = v.svg.createSVGPoint(); pt.x = cx; pt.y = cy;
    var p = pt.matrixTransform(m.inverse());
    return [p.x, p.y - 100];
  }

  var last = null;
  sec.addEventListener('pointermove', function (e) {
    if (last) {
      vines.forEach(function (v) {
        var r = v.el.getBoundingClientRect();
        if (e.clientX < r.left - 40 || e.clientX > r.right + 40 || e.clientY < r.top || e.clientY > r.bottom) return;
        var p = toLocal(v, e.clientX, e.clientY), q = toLocal(v, last.x, last.y);
        if (!p || !q) return;
        var dx = p[0] - q[0], dy = p[1] - q[1];            /* how far the pointer travelled, in vine units */
        var sp = Math.sqrt(dx * dx + dy * dy);
        if (sp < 0.3) return;
        var tame = Math.min(sp, 40) / sp;                  /* soften very fast flicks */
        dx *= tame; dy *= tame;
        for (var i = 1; i < N - 1; i++) {
          var ddx = rest[i][0] + v.ux[i] - p[0], ddy = rest[i][1] + v.uy[i] - p[1];
          var d2 = (ddx * ddx + ddy * ddy) / (R * R);
          if (d2 > 4) continue;
          var w = Math.exp(-2 * d2) * GAIN;                /* smooth falloff around the pointer */
          v.vx[i] += dx * w; v.vy[i] += dy * w * 0.5;
        }
        if (!v.run) { v.run = true; requestAnimationFrame(function () { loop(v); }); }
      });
    }
    last = { x: e.clientX, y: e.clientY };
  }, { passive: true });
  sec.addEventListener('pointerleave', function () { last = null; });
})();
