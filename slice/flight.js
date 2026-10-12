/* М31 · срез — полёт внутри системы цели: стык с межзвёздным профилем, конечная тяга, интегрирование (без DOM; браузер —
   M31Flight). Проект «Полёт внутри системы v1» (DOC), шаг 4. Единицы — как в orbits.js: а.е., годы, а.е./год, а.е./год²;
   наружу — явные преобразования. Система координат — система цели (p1, p2, n; плоскость орбит — плоскость отсчёта), начало
   — звезда A. Динамика: гравитация A, гравитация c с косвенным членом (начало в A, а не в центре масс), тяга по программе.
   Ab и пара Ba/Bb в динамику v1 не входят (явное ограничение модели). */
(function (root) {
  'use strict';
  const O = root.M31Orbits || require('./orbits.js');
  const U = O.units;
  const add = (a, b, k = 1) => [a[0] + k * b[0], a[1] + k * b[1], a[2] + k * b[2]];
  const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = a => Math.hypot(a[0], a[1], a[2]);
  const unit = a => mul(a, 1 / norm(a));
  // ускорение: м/с² ↔ а.е./год²
  const ACC_UNIT = U.YEAR_S * U.YEAR_S / (U.AU_KM * 1000);
  const accAU = ms2 => ms2 * ACC_UNIT, accMS = auyr2 => auyr2 / ACC_UNIT;

  // ---------------------------------------------------------------- динамика
  // гравитация в системе цели: звезда (sys.mu) и планета (элементы body, μ muB) с косвенным членом; grad — градиент (3×3,
  // симметричный) для сопряжённых уравнений
  function gravity(ctx, t, r, grad) {
    const R = norm(r), R3 = R * R * R;
    let g = mul(r, -ctx.mu / R3);
    if (grad) { const k = ctx.mu / R3, u = mul(r, 1 / R); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) grad[i][j] = k * (3 * u[i] * u[j] - (i === j ? 1 : 0)); }
    if (ctx.body) {
      const rc = O.stateAt(ctx.body, t).r, x = add(r, rc, -1), X = norm(x), X3 = X * X * X, Rc = norm(rc);
      g = add(g, add(mul(x, -ctx.muB / X3), mul(rc, -ctx.muB / (Rc * Rc * Rc))));
      if (grad) { const k = ctx.muB / X3, u = mul(x, 1 / X); for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) grad[i][j] += k * (3 * u[i] * u[j] - (i === j ? 1 : 0)); }
    }
    return g;
  }
  // движение с тягой по программе: y = (r, v); ctx.thrust(t, r, v) → ускорение тяги
  const motion = ctx => (t, y) => { const r = [y[0], y[1], y[2]], v = [y[3], y[4], y[5]], a = add(gravity(ctx, t, r), ctx.thrust ? ctx.thrust(t, r, v) : [0, 0, 0]);
    return [v[0], v[1], v[2], a[0], a[1], a[2]]; };
  // встреча с минимумом ∫|a|^p/p (p ≥ 2; большое p выравнивает тягу, ближе к постоянной на пределе): y = (r, v, λr, λv, Δv);
  // тяга a = −aref·λ̂v·|λv|^(1/(p−1)); λr' = −G·λv, λv' = −λr (G — градиент гравитации); Δv' = |a|
  const G3 = () => [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  function control(lv, p, aref) { const L = norm(lv); if (!(L > 0)) return [0, 0, 0]; return mul(lv, -aref * Math.pow(L, 1 / (p - 1)) / L); }
  const optimal = (ctx, p, aref) => (t, y) => {
    const r = [y[0], y[1], y[2]], G = G3(), g = gravity(ctx, t, r, G), lv = [y[9], y[10], y[11]], a = control(lv, p, aref);
    const Gl = [0, 1, 2].map(i => G[i][0] * lv[0] + G[i][1] * lv[1] + G[i][2] * lv[2]);
    return [y[3], y[4], y[5], g[0] + a[0], g[1] + a[1], g[2] + a[2], -Gl[0], -Gl[1], -Gl[2], -y[6], -y[7], -y[8], norm(a)];
  };
  // Дорманд — Принс 5(4), адаптивный шаг; f(t, y) → y'; t0 → t1 (t1 > t0). tol — относительный допуск, abs — абсолютный.
  // breaks — точки, через которые шаг не перешагивает (разрывы программы тяги); maxStep — предел шага (плотная проверка тяги)
  const A = [[], [1 / 5], [3 / 40, 9 / 40], [44 / 45, -56 / 15, 32 / 9], [19372 / 6561, -25360 / 2187, 64448 / 6561, -212 / 729],
    [9017 / 3168, -355 / 33, 46732 / 5247, 49 / 176, -5103 / 18656], [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84]];
  const Cc = [0, 1 / 5, 3 / 10, 4 / 5, 8 / 9, 1, 1];
  const B5 = [35 / 384, 0, 500 / 1113, 125 / 192, -2187 / 6784, 11 / 84, 0];
  const B4 = [5179 / 57600, 0, 7571 / 16695, 393 / 640, -92097 / 339200, 187 / 2100, 1 / 40];
  function integrate(f, t0, y0, t1, opt = {}) {
    const n = y0.length, ne = opt.errN || n, tol = opt.tol || 1e-11, abs = opt.abs || 1e-12, hmax = opt.maxStep || Infinity;   // ошибка — по первым ne
    const breaks = (opt.breaks || []).filter(b => b > t0 && b < t1).sort((a, b) => a - b).concat([t1]);
    let t = t0, y = y0.slice(), h = Math.min(opt.h0 || 1e-3, t1 - t0, hmax), steps = 0;
    const out = opt.sample ? [{ t, y: y.slice() }] : null, ys = new Array(n), k = [];
    for (const tb of breaks) {
      while (t < tb - 1e-15) {
        if (++steps > (opt.maxSteps || 2e6)) throw new Error('flight.integrate: слишком много шагов');
        h = Math.min(h, tb - t, hmax);
        for (let s = 0; s < 7; s++) {
          for (let i = 0; i < n; i++) { let x = y[i]; for (let j = 0; j < s; j++) x += h * A[s][j] * k[j][i]; ys[i] = x; }
          k[s] = f(t + Cc[s] * h, ys);
        }
        let err = 0; const y5 = new Array(n);
        for (let i = 0; i < n; i++) {
          let d5 = 0, d4 = 0; for (let s = 0; s < 7; s++) { d5 += B5[s] * k[s][i]; d4 += B4[s] * k[s][i]; }
          y5[i] = y[i] + h * d5; if (i < ne) err = Math.max(err, Math.abs(h * (d5 - d4)) / (abs + tol * Math.max(Math.abs(y[i]), Math.abs(y5[i]))));
        }
        if (err <= 1) { t = tb - (t + h) < 1e-15 ? tb : t + h; y = y5; if (out) out.push({ t, y: y.slice() }); }
        h = h * Math.min(5, Math.max(0.2, 0.9 * Math.pow(err || 1e-10, -0.2)));
      }
    }
    return { t, y, steps, samples: out };
  }

  // ---------------------------------------------------------------- стык с межзвёздным профилем
  // Состояние корабля на расстоянии rAU от звезды по линии подлёта. Двигательный участок межзвёздного профиля (mission.js) —
  // STOP → 0 равнозамедленно за ENGINE лет до конца профиля end: остаток пути x = STOP·τ²/(2·ENGINE) (св. годы, τ — лет до
  // конца). Направление подлёта ℓ — Солнце → звезда в базисе системы цели (systems.js: approach)
  const LY_AU = 63241.077088071;                                         // а.е. в световом году (юлианский)
  function entryAt(M, sys, end, rAU = 50) {
    const tau = Math.sqrt(2 * M.ENGINE * (rAU / LY_AU) / M.STOP), beta = M.STOP * tau / M.ENGINE, l = sys.approach;
    return { t: end - tau, r: mul(l, -rAU), v: mul(l, beta * U.C_KMS / U.AUYR_KMS), beta };
  }
  // то же по профилю mission.js (flightProfile): проверка согласия
  function entryState(M, pf, sys, rAU = 50) {
    const t = M.timeAtDistance(pf, pf.d - rAU / LY_AU), st = M.sampleFlight(pf, t), l = sys.approach;
    return { t, r: mul(l, -rAU), v: mul(l, st.beta * U.C_KMS / U.AUYR_KMS), beta: st.beta };
  }

  // ---------------------------------------------------------------- маршрут к планете (шаг 4)
  // Два участка конечной тяги (решения проекта, ревью Codex 10.10):
  //   H — от 50 а.е. до точки сближения у планеты: BACK_KM позади неё (против её движения), OUT_KM наружу по радиусу звезда →
  //       планета, догон V_REL вдоль её движения; гравитация звезды и планеты; минимум ∫|a|^p, длительность и p — перебором;
  //   P — захват: от точки сближения до круговой орбиты R_ORB_KM в плоскости орбиты планеты, по её обращению; ∫|a|².
  // Предел тяги — постоянная сила двигателя: F = m(включение)·ENGINE_ACC (межзвёздный участок дросселирован), ускорение F/m
  // растёт с расходом: ENGINE_ACC·e^(Δv с включения/VE) (течь только облегчает корабль). Межзвёздный профиль не меняется.
  // Подтверждение орбиты — свободный полёт VERIFY_D суток: связанная орбита планеты, расстояние в допуске.
  const ROUTE = { BACK_KM: 600000, OUT_KM: 300000, V_REL: 1, R_ORB_KM: 200000, VERIFY_D: 60, MARGIN: 0.92,
    TH: [270, 280, 290, 300, 310, 320, 330, 340, 350], P: [2, 3, 4, 6], TP: [5, 6, 4, 7, 8] };   // сутки; доля предела
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const kmAU = km => km / U.AU_KM;
  // точка сближения у планеты на год t
  function meetPoint(sys, id, t) {
    const st = O.stateAt(sys.bodies[id], t), vh = unit(st.v), rh = unit(st.r);
    return { r: add(add(st.r, vh, -kmAU(ROUTE.BACK_KM)), rh, kmAU(ROUTE.OUT_KM)), v: add(st.v, vh, ROUTE.V_REL / U.AUYR_KMS) };
  }
  // точка круговой орбиты планеты: side — единичный вектор от её центра (в плоскости её орбиты), обращение — как у планеты
  function orbitPoint(sys, id, t, side) {
    const b = sys.bodies[id], st = O.stateAt(b, t), d = kmAU(ROUTE.R_ORB_KM), h = unit(cross(st.r, st.v)), along = unit(cross(h, side));
    return { r: add(st.r, side, d), v: add(st.v, along, Math.sqrt(U.MU_SUN * b.mass / d)) };
  }
  const ctxOf = (sys, id, k = 1) => ({ mu: sys.mu, body: sys.bodies[id], muB: U.MU_SUN * sys.bodies[id].mass * k });
  // прогон оптимального участка: e = { t, r, v }, длительность T, λ0 — 6 чисел
  const shoot = (ctx, p, aref, e, T, lam, o = {}) => integrate(optimal(ctx, p, aref), e.t, e.r.concat(e.v, lam, [0]), e.t + T,
    { tol: o.tol || 1e-10, abs: 1e-12, maxSteps: o.maxSteps || 300000, sample: !!o.sample, maxStep: o.maxStep, errN: 6 });
  // невязка конца: положение (а.е.) и скорость × T (а.е.)
  function miss(y, tg, T) { return [y[0] - tg.r[0], y[1] - tg.r[1], y[2] - tg.r[2], (y[3] - tg.v[0]) * T, (y[4] - tg.v[1]) * T, (y[5] - tg.v[2]) * T]; }
  const n6 = R => Math.sqrt(R.reduce((a, x) => a + x * x, 0));
  function solveLin(A, b) {
    const n = b.length, a = A.map((r, i) => r.concat([b[i]]));
    for (let c = 0; c < n; c++) { let q = c; for (let i = c + 1; i < n; i++) if (Math.abs(a[i][c]) > Math.abs(a[q][c])) q = i; const tmp = a[c]; a[c] = a[q]; a[q] = tmp;
      for (let i = c + 1; i < n; i++) { const k = a[i][c] / a[c][c]; for (let j = c; j <= n; j++) a[i][j] -= k * a[c][j]; } }
    const x = new Array(n); for (let i = n - 1; i >= 0; i--) { let v = a[i][n]; for (let j = i + 1; j < n; j++) v -= a[i][j] * x[j]; x[i] = v / a[i][i]; }
    return x;
  }
  // Ньютон по λ0 (конечные разности, дробление шага); прогон, ушедший в разнос, — неудачный шаг
  function newton(ctx, p, aref, e, T, lam, tg, it = 40) {
    const res = l => { try { return miss(shoot(ctx, p, aref, e, T, l).y, tg, T); } catch (x) { return null; } };
    let R = res(lam); if (!R) return { lam, nR: Infinity }; let nR = n6(R);
    for (let k = 0; k < it && nR > 1e-12; k++) {
      const J = [[], [], [], [], [], []];
      for (let j = 0; j < 6; j++) { const h = 1e-7 * (Math.abs(lam[j]) + 1e-3), l2 = lam.slice(); l2[j] += h; const R2 = res(l2); if (!R2) return { lam, nR }; for (let i = 0; i < 6; i++) J[i][j] = (R2[i] - R[i]) / h; }
      const dx = solveLin(J, R.map(x => -x)); let s = 1, ok = false;
      for (let ls = 0; ls < 14 && !ok; ls++, s /= 2) { const l2 = lam.map((x, i) => x + s * dx[i]), R2 = res(l2); if (R2 && n6(R2) < nR) { lam = l2; R = R2; nR = n6(R2); ok = true; } }
      if (!ok) break;
    }
    return { lam, nR };
  }
  // начальное приближение без гравитации (p = 2): a(τ) = A + Bτ ⇒ λv = −A/aref, λr = B/aref
  function guess(e, T, tg, aref) {
    const Dr = add(add(tg.r, e.r, -1), e.v, -T), Dv = add(tg.v, e.v, -1);
    const A = add(mul(Dr, 6 / (T * T)), Dv, -2 / T), B = add(mul(Dv, 6 / (T * T)), Dr, -12 / (T * T * T));
    return mul(B, 1 / aref).concat(mul(A, -1 / aref));
  }
  // смена p при той же тяге: |a| ~ aref·|λv|^(1/(p−1)) ⇒ λ·|λv|^((p2−p)/(p−1))
  const rescale = (lam, p, p2) => { const L = Math.hypot(lam[3], lam[4], lam[5]); return mul(lam.slice(0, 3), Math.pow(L, (p2 - p) / (p - 1))).concat(mul(lam.slice(3), Math.pow(L, (p2 - p) / (p - 1)))); };
  const TOL_AU = 1e-9;                                                   // сходимость: ~150 м
  // предел ускорения F/m: на входе lim0 (а.е./год²), дальше ×e^(Δv/VE)
  const limitAt = (M, e) => accAU(M.ENGINE_ACC) * Math.exp((M.STOP * U.C_KMS / U.AUYR_KMS - norm(e.v)) / (M.VE * U.C_KMS / U.AUYR_KMS));
  // доля предела по выборке оптимального участка (пик) и Δv; dv0 — Δv, исполненное до начала участка
  function peak(M, ctx, p, aref, e, T, lam, lim0, dv0 = 0) {
    const VE = M.VE * U.C_KMS / U.AUYR_KMS, sm = shoot(ctx, p, aref, e, T, lam, { sample: true, maxStep: 0.25 / 365.25 });
    let q = 0; for (const x of sm.samples) q = Math.max(q, norm(control([x.y[9], x.y[10], x.y[11]], p, aref)) / (lim0 * Math.exp((dv0 + x.y[12]) / VE)));
    return { ratio: q, dv: sm.y[12], end: sm.y.slice(0, 6) };
  }
  // участок H при длительности T: продолжение — без планеты (p 2) → масса планеты ступенями → p по списку; решения по каждому p
  function legH(M, sys, id, e, T, aref) {
    const tg = meetPoint(sys, id, e.t + T), out = [];
    let lam = guess(e, T, tg, aref), r = newton({ mu: sys.mu, body: null }, 2, aref, e, T, lam, tg); lam = r.lam;
    for (const k of [0.1, 0.3, 1]) { r = newton(ctxOf(sys, id, k), 2, aref, e, T, lam, tg); lam = r.lam; }
    let p0 = 2;
    for (const p of ROUTE.P) {
      if (p !== p0) { r = newton(ctxOf(sys, id), p, aref, e, T, rescale(lam, p0, p), tg); if (r.nR > TOL_AU) break; lam = r.lam; p0 = p; }
      else if (r.nR > TOL_AU) break;
      out.push({ T, p, lam: lam.slice() });
    }
    return out;
  }
  // участок P (захват) из состояния s0 на год t0 за Tp: ∫|a|², продолжение по массе планеты
  function legP(sys, id, t0, s0, Tp, aref) {
    const st = O.stateAt(sys.bodies[id], t0), rel = add(s0.slice(0, 3), st.r, -1), vh = unit(add(s0.slice(3), st.v, -1));
    const side = unit(add(rel, vh, -dot(rel, vh))), e = { t: t0, r: s0.slice(0, 3), v: s0.slice(3) }, tg = orbitPoint(sys, id, t0 + Tp, side);
    let r = newton({ mu: sys.mu, body: null }, 2, aref, e, Tp, guess(e, Tp, tg, aref), tg);
    for (const k of [0.1, 0.3, 1]) r = newton(ctxOf(sys, id, k), 2, aref, e, Tp, r.lam, tg);
    return r.nR <= TOL_AU ? { T: Tp, p: 2, lam: r.lam, side } : null;
  }
  // проверка орбиты: свободный полёт days суток от состояния y на год t — связанная орбита планеты, расстояние в допуске
  function verifyOrbit(sys, id, t, y, days = ROUTE.VERIFY_D) {
    const b = sys.bodies[id], muB = U.MU_SUN * b.mass, fr = integrate(motion(ctxOf(sys, id)), t, y, t + days / 365.25, { sample: true, tol: 1e-11, abs: 1e-13, maxStep: 0.05 / 365.25 });
    let rmin = Infinity, rmax = 0, Emax = -Infinity;
    for (const q of fr.samples) { const c = O.stateAt(b, q.t), d = norm(add(q.y.slice(0, 3), c.r, -1)), w = norm(add(q.y.slice(3, 6), c.v, -1)); rmin = Math.min(rmin, d); rmax = Math.max(rmax, d); Emax = Math.max(Emax, w * w / 2 - muB / d); }
    const R = kmAU(ROUTE.R_ORB_KM);
    return { ok: Emax < 0 && rmin > 0.8 * R && rmax < 1.2 * R, rminKm: rmin * U.AU_KM, rmaxKm: rmax * U.AU_KM, bound: Emax < 0 };
  }
  // построение маршрута (медленно: перебор, секунды; в игре — таблица routes.js): лучший выполнимый — минимум полного Δv
  // кандидаты участка H: перебор длительности и p, только под пределом
  function routeCands(M, sys, id, e, opt = {}) {
    const aref = accAU(M.ENGINE_ACC), lim0 = limitAt(M, e), ctx = ctxOf(sys, id), cand = [];
    for (const Td of opt.TH || ROUTE.TH) {
      let hs; try { hs = legH(M, sys, id, e, Td / 365.25, aref); } catch (x) { continue; }
      for (const h of hs) { const pk = peak(M, ctx, h.p, aref, e, h.T, h.lam, lim0); if (pk.ratio <= ROUTE.MARGIN) cand.push(Object.assign(h, pk)); }
    }
    return cand;
  }
  // выбор маршрута из кандидатов: order 'dv' — минимум Δv («позже, экономнее»), 'time' — самый ранний («раньше»); у кандидата
  // должен найтись захват под пределом и держащаяся орбита
  function routePick(M, sys, id, e, cand, order = 'dv') {
    const aref = accAU(M.ENGINE_ACC), lim0 = limitAt(M, e), ctx = ctxOf(sys, id);
    const list = cand.slice().sort(order === 'time' ? (a, b) => a.T - b.T || a.dv - b.dv : (a, b) => a.dv - b.dv);
    for (const h of list) {
      const t0 = e.t + h.T;
      for (const Td of ROUTE.TP) {
        let c; try { c = legP(sys, id, t0, h.end, Td / 365.25, aref); } catch (x) { c = null; }
        if (!c) continue;
        const pk = peak(M, ctx, 2, aref, { t: t0, r: h.end.slice(0, 3), v: h.end.slice(3) }, c.T, c.lam, lim0, h.dv);
        if (pk.ratio > ROUTE.MARGIN) continue;
        const vf = verifyOrbit(sys, id, t0 + c.T, pk.end);
        if (!vf.ok) continue;
        return routeOf(M, sys, id, e, { T: h.T, p: h.p, lam: h.lam, ratio: h.ratio, dv: h.dv }, { T: c.T, p: 2, lam: c.lam, ratio: pk.ratio, dv: pk.dv }, vf);
      }
    }
    return null;
  }
  // построение маршрута (медленно: перебор, секунды; в игре — таблица routes.js)
  const planRoute = (M, sys, id, e, opt = {}) => routePick(M, sys, id, e, routeCands(M, sys, id, e, opt), opt.order || 'dv');
  // оба варианта плана встречи из одних кандидатов: позже (минимум Δv) и раньше (самый ранний; null — совпадает с поздним)
  function planRoutes(M, sys, id, e, opt = {}) {
    const cand = routeCands(M, sys, id, e, opt), late = routePick(M, sys, id, e, cand, 'dv'), early = routePick(M, sys, id, e, cand, 'time');
    return { late, early: early && late && early.planetOrbitAt < late.planetOrbitAt - 1e-9 ? early : null };
  }
  // маршрут как данные: даты, Δv (доли c и км/с), участки; восстанавливается из λ0 (таблица) прогоном
  function routeOf(M, sys, id, e, H, P, vf) {
    const toC = x => x * U.AUYR_KMS / U.C_KMS;
    return { v: 1, sys: sys.id, body: id, aref: accAU(M.ENGINE_ACC), entry: { t: e.t, r: e.r, v: e.v }, H, P,
      entryAt: e.t, rendezvousAt: e.t + H.T, planetOrbitAt: e.t + H.T + P.T, dv: toC(H.dv + P.dv), dvKms: (H.dv + P.dv) * U.AUYR_KMS,
      ratio: Math.max(H.ratio, P.ratio), verify: vf };
  }
  // захват звездой: первая точка выборки с отрицательной энергией относительно звезды (null — не захвачен)
  function captureT(sys, pts) {
    for (const x of pts) { const R = Math.hypot(x.y[0], x.y[1], x.y[2]), v = Math.hypot(x.y[3], x.y[4], x.y[5]); if (v * v / 2 - sys.mu / R < 0) return x.t; }
    return null;
  }
  // график расхода маршрута: пары [доля времени, доля Δv] — ломаная, отличающаяся от интеграла тяги выборки не больше kms
  // (упрощение Дугласа — Пекера); стык участков H и P (tH) — всегда точка графика. dv — интеграл тяги выборки (а.е./год)
  function schedPairs(pts, t0, t1, tH, kms) {
    const T = t1 - t0, tot = pts[pts.length - 1].dv, eps = kms / U.AUYR_KMS;
    const keep = new Set([0, pts.length - 1, pts.findIndex(x => x.t >= tH - 1e-12)]);
    const simplify = (a, b) => { let m = -1, w = eps;
      for (let k = a + 1; k < b; k++) { const x = pts[a].dv + (pts[b].dv - pts[a].dv) * (pts[k].t - pts[a].t) / (pts[b].t - pts[a].t), d = Math.abs(pts[k].dv - x); if (d > w) { w = d; m = k; } }
      if (m >= 0) { keep.add(m); simplify(a, m); simplify(m, b); } };
    const ks = [...keep].sort((a, b) => a - b); for (let i = 0; i + 1 < ks.length; i++) simplify(ks[i], ks[i + 1]);
    return { dv: tot, pairs: [...keep].sort((a, b) => a - b).map(k => [Math.min(1, Math.max(0, (pts[k].t - t0) / T)), pts[k].dv / tot]) };
  }
  // ---------------------------------------------------------------- маршрут «спираль» (v2: красные карлики)
  // DOC «Полёт внутри системы v2 — Ксилона и Оттепель». Цель — в 0,05 а.е. от карлика: тяготение звезды там в ~17 раз сильнее
  // тяги, одна оптимальная дуга к цели не строится (семейство решений обрывается). Участки (route системы — systems.js):
  //   S — от 50 а.е. до промежуточной круговой орбиты rs (плоскость орбит цели, угол th, прямое обращение): оптимальная тяга,
  //       как H; цели в динамике нет — участок не зависит от года (сдвиг во времени). Решения — таблица: угол × длительность;
  //   W — ожидание окна: свободный полёт по промежуточной орбите, пока фаза цели не подойдёт (без расхода);
  //   Z — спуск по спирали к орбите цели: наведение по скорости (круговая скорость и снижение ṙ = −2·a_t·√(r³/μ)), тяга ≤ AMAX
  //       предела; спирали системы — по доле a_t (ATS: медленнее — дешевле); поворот вокруг звезды; конец — на орбите цели,
  //       backKm позади неё;
  //   N — сближение у цели: сутки и Δv — проектное допущение (route.near); показ — плавный переход к орбите у цели.
  const SPIRAL = { TH: [280, 290, 300, 310], ANG: [90, 112.5, 135, 157.5], AMAX: 0.85, ATS: [0.6, 0.8, 1], TAU_D: 0.5, DVH_KMS: 580, CHUNK_D: 0.05, HOLD_KM: 2 };
  const rotZ = (v, a) => { const c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c, v[2]]; };
  function stagePoint(sys, th) { const rs = sys.route.rs, vc = Math.sqrt(sys.mu / rs); return { r: [rs * Math.cos(th), rs * Math.sin(th), 0], v: [-vc * Math.sin(th), vc * Math.cos(th), 0] }; }
  // участок S за T к углу th: прямое решение со звездой, иначе продолжение по её массе → p по списку; решения по каждому p
  function legStage(M, sys, e, T, th, aref) {
    const tg = stagePoint(sys, th), ctx = { mu: sys.mu, body: null }, out = [];
    let lam = guess(e, T, tg, aref), r = newton(ctx, 2, aref, e, T, lam, tg);
    if (r.nR > TOL_AU) for (const k of [1e-9, 0.2, 0.4, 0.6, 0.8, 0.9, 1]) { r = newton({ mu: sys.mu * k, body: null }, 2, aref, e, T, lam, tg); if (r.nR > TOL_AU) return out; lam = r.lam; }
    lam = r.lam; let p0 = 2;
    for (const p of ROUTE.P) {
      if (p !== p0) { r = newton(ctx, p, aref, e, T, rescale(lam, p0, p), tg); if (r.nR > TOL_AU) break; lam = r.lam; p0 = p; }
      out.push({ T, p, lam: lam.slice() });
    }
    return out;
  }
  // решения участка S (медленно; в игре — таблица): по углам и длительностям — p под пределом с минимумом Δv
  function stageRows(M, sys) {
    const e = entryAt(M, sys, 100, 50), aref = accAU(M.ENGINE_ACC), lim0 = limitAt(M, e), ctx = { mu: sys.mu, body: null }, rows = [];
    for (const deg of SPIRAL.ANG) for (const Td of SPIRAL.TH) {
      let hs; try { hs = legStage(M, sys, e, Td / 365.25, deg * Math.PI / 180, aref); } catch (x) { continue; }
      let best = null;
      for (const h of hs) { const pk = peak(M, ctx, h.p, aref, e, h.T, h.lam, lim0); if (pk.ratio <= ROUTE.MARGIN && (!best || pk.dv < best.dv)) best = { th: deg * Math.PI / 180, T: h.T, p: h.p, lam: h.lam, dv: pk.dv, ratio: pk.ratio }; }
      if (best) rows.push(best);
    }
    return rows;
  }
  // спираль системы с долей тяги ka (кэш): от промежуточной орбиты (угол 0, год 0) до орбиты цели — выборка, длительность, Δv,
  // пройденный угол. Конец — на границе куска CHUNK_D, когда орбита у радиуса цели и почти круговая (детерминированно)
  const SPIRALS = new Map();
  function spiralOf(M, sys, ka) {
    const key = `${sys.id}|${ka}`; if (SPIRALS.has(key)) return SPIRALS.get(key);
    const mu = sys.mu, rs = sys.route.rs, rt = sys.bodies[sys.target].a, e = entryAt(M, sys, 100, 50), VE = M.VE * U.C_KMS / U.AUYR_KMS;
    const amax = SPIRAL.AMAX * limitAt(M, e) * Math.exp(SPIRAL.DVH_KMS / U.AUYR_KMS / VE), at = ka * amax, tau = SPIRAL.TAU_D / 365.25, z = [0, 0, 1];
    const ctl = y => { const r = [y[0], y[1], y[2]], v = [y[3], y[4], y[5]], R = norm(r), rh = mul(r, 1 / R), th = unit(cross(z, rh));
      const k = Math.min(1, Math.max(0, (R - rt) / (0.15 * rt))), vdes = add(mul(th, Math.sqrt(mu / R)), rh, -2 * at * k * Math.sqrt(R * R * R / mu));
      const a = add(mul(th, -at * k), add(vdes, v, -1), 1 / tau), m = norm(a); return m > amax ? mul(a, amax / m) : a; };
    const f = (t, y) => { const R = Math.hypot(y[0], y[1], y[2]), g = -mu / (R * R * R), a = ctl(y); return [y[3], y[4], y[5], g * y[0] + a[0], g * y[1] + a[1], g * y[2] + a[2], norm(a)]; };
    const ecc = y => { const r = y.slice(0, 3), v = y.slice(3, 6); return norm(add(mul(cross(v, cross(r, v)), 1 / mu), unit(r), -1)); };
    let t = 0, y = [rs, 0, 0, 0, Math.sqrt(mu / rs), 0, 0], th = 0, prev = 0;
    const pts = [{ t: 0, y: y.slice(0, 6), dv: 0, a: norm(ctl(y)) }];
    for (;;) {
      const r = integrate(f, t, y, t + SPIRAL.CHUNK_D / 365.25, { tol: 1e-10, abs: 1e-12, errN: 6, sample: true });
      for (const x of r.samples.slice(1)) pts.push({ t: x.t, y: x.y.slice(0, 6), dv: x.y[6], a: norm(ctl(x.y)) });
      t = r.t; y = r.y; const ang = Math.atan2(y[1], y[0]); let d = ang - prev; if (d < -Math.PI) d += 2 * Math.PI; if (d > Math.PI) d -= 2 * Math.PI; th += d; prev = ang;
      if (Math.abs(norm(y.slice(0, 3)) - rt) < 1e-4 * rt && ecc(y) < 1e-3) break;
      if (t > 0.3) throw new Error('flight.spiralOf: спираль не сошлась');
    }
    const sp = { ka, T: t, dv: y[6], theta: th, pts, amax, ratio: SPIRAL.AMAX };
    SPIRALS.set(key, sp); return sp;
  }
  // ожидание окна с года tS на промежуточной орбите у угла th: после ожидания w и спирали корабль — backKm позади цели
  const angleAt = (b, t) => { const st = O.stateAt(b, t); return Math.atan2(st.r[1], st.r[0]); };
  function windowWait(sys, th, tS, sp) {
    const rs = sys.route.rs, b = sys.bodies[sys.target], ws = Math.sqrt(sys.mu / (rs * rs * rs)), n = Math.sqrt(b.mu / (b.a * b.a * b.a)), P = 2 * Math.PI;
    const X = angleAt(b, tS + sp.T) - th - sp.theta - sys.route.backKm / U.AU_KM / b.a;
    return ((-X % P) + P) % P / (n - ws);
  }
  // маршрут «спираль» для входа e по строке решений row { th, T, p, lam, dv, ratio } и доле тяги спирали ka (поля — как у
  // маршрута к планете)
  function spiralRoute(M, sys, e, row, ka) {
    const sp = spiralOf(M, sys, ka), nr = sys.route.near, tS = e.t + row.T, w = windowWait(sys, row.th, tS, sp), tR = tS + w + sp.T;
    const tot = row.dv + sp.dv + nr.dvKms / U.AUYR_KMS;
    return { v: 1, kind: 'spiral', row, sys: sys.id, body: sys.target, aref: accAU(M.ENGINE_ACC), entry: { t: e.t, r: e.r, v: e.v },
      H: { T: row.T, p: row.p, lam: row.lam, dv: row.dv, ratio: row.ratio }, th: row.th, ka, entryAt: e.t, stageAt: tS, spiralAt: tS + w, rendezvousAt: tR,
      planetOrbitAt: tR + nr.days / 365.25, dv: tot * U.AUYR_KMS / U.C_KMS, dvKms: tot * U.AUYR_KMS, ratio: Math.max(row.ratio, sp.ratio), verify: { ok: true } };
  }
  // варианты плана встречи по строкам × спиралям: позже — минимум Δv; раньше — самое раннее прибытие (null — не раньше суток)
  function spiralRoutes(M, sys, e, rows) {
    const list = []; for (const ka of SPIRAL.ATS) for (const row of rows) list.push(spiralRoute(M, sys, e, row, ka));
    const late = list.slice().sort((a, b) => a.dv - b.dv || a.planetOrbitAt - b.planetOrbitAt)[0] || null;
    const early = list.slice().sort((a, b) => a.planetOrbitAt - b.planetOrbitAt || a.dv - b.dv)[0] || null;
    return { late, early: early && late && early.planetOrbitAt < late.planetOrbitAt - 1 / 365.25 ? early : null };
  }
  // график расхода маршрута «спираль»: участок S (пары из таблицы или выборки), ожидание (ровно), спираль, сближение (линейно)
  function spiralSched(M, sys, r, hPairs, kms) {
    const sp = spiralOf(M, sys, r.ka), spPairs = sp.sched || (sp.sched = schedPairs(sp.pts, 0, sp.T, sp.T, kms).pairs);
    const tot = r.H.dv + sp.dv + sys.route.near.dvKms / U.AUYR_KMS, t0 = r.entryAt, T = r.planetOrbitAt - t0, abs = [];
    for (const [x, f] of hPairs) abs.push([t0 + x * r.H.T, f * r.H.dv]);
    for (const [x, f] of spPairs) abs.push([r.spiralAt + x * sp.T, r.H.dv + f * sp.dv]);
    abs.push([r.planetOrbitAt, tot]);
    return { dv: tot, pairs: abs.map(([t, d]) => [Math.min(1, Math.max(0, (t - t0) / T)), d / tot]) };
  }
  // положение у цели относительно неё: на сближении — от конца спирали (поворачивается вместе с целью) к орбите у цели
  // (у планеты — круговая orbitKm, прямое обращение; у форпоста — точка стоянки HOLD_KM позади); после — та же орбита
  function nearRel(sys, r, end, t) {
    const b = sys.bodies[sys.target], tR = r.rendezvousAt, tN = r.planetOrbitAt, c0 = bodyAtSys(sys, sys.target, tR), ang = x => angleAt(b, x);
    const d0 = add(end.y.slice(0, 3), c0.r, -1), rel0 = rotZ(d0, ang(t) - ang(tR));
    const R = (sys.route.orbitKm || SPIRAL.HOLD_KM) / U.AU_KM, muB = U.MU_SUN * b.mass, dN = rotZ(d0, ang(tN) - ang(tR));
    const relF = b.mass > 0 ? (() => { const psi = Math.atan2(dN[1], dN[0]) + Math.sqrt(muB / (R * R * R)) * (t - tN); return [R * Math.cos(psi), R * Math.sin(psi), 0]; })()
      : rotZ(mul(unit(c0.v), -R), ang(t) - ang(tR));
    const u = Math.min(1, Math.max(0, (t - tR) / (tN - tR))), s = u * u * (3 - 2 * u);
    return add(mul(rel0, 1 - s), relF, s);
  }
  const bodyAtSys = (sys, id, t) => O.stateAt(sys.bodies[id], t);
  // выборка маршрута «спираль» (показ, проверки): S (прогон), ожидание, спираль (поворот и сдвиг), сближение у цели
  function spiralSamples(M, sys, r) {
    const sp = spiralOf(M, sys, r.ka), b = sys.bodies[sys.target], ws = Math.sqrt(sys.mu / Math.pow(sys.route.rs, 3)), w = r.spiralAt - r.stageAt;
    const h = shoot({ mu: sys.mu, body: null }, r.H.p, r.aref, r.entry, r.H.T, r.H.lam, { sample: true, maxStep: 0.25 / 365.25 });
    const pts = h.samples.map(x => ({ t: x.t, y: x.y.slice(0, 6), dv: x.y[12], a: norm(control(x.y.slice(9, 12), r.H.p, r.aref)) })), dvS = h.y[12];
    if (w > 1e-9) { const n = Math.max(1, Math.ceil(w * 365.25 / 0.25)); for (let k = 1; k <= n; k++) { const st = stagePoint(sys, r.th + ws * w * k / n); pts.push({ t: r.stageAt + w * k / n, y: st.r.concat(st.v), dv: dvS, a: 0 }); } }
    const a0 = r.th + ws * w;
    for (const x of sp.pts.slice(1)) pts.push({ t: r.spiralAt + x.t, y: rotZ(x.y.slice(0, 3), a0).concat(rotZ(x.y.slice(3, 6), a0)), dv: dvS + x.dv, a: x.a });
    const end = pts[pts.length - 1], tR = end.t, Tn = r.planetOrbitAt - tR, dvN = sys.route.near.dvKms / U.AUYR_KMS, n = Math.max(2, Math.ceil(Tn * 365.25 / 0.02)), hh = 1e-6;
    const pos = t => add(bodyAtSys(sys, sys.target, t).r, nearRel(sys, Object.assign({}, r, { rendezvousAt: tR }), end, t));
    for (let k = 1; k <= n; k++) { const t = tR + Tn * k / n, p = pos(t), v = mul(add(pos(t + hh), pos(t - hh), -1), 1 / (2 * hh));
      pts.push({ t, y: p.concat(v), dv: end.dv + dvN * k / n, a: dvN / Tn }); }
    return pts;
  }
  // прогон маршрута: состояние на год t (до входа — по линии подлёта не определено: null), тяга; кэш выборки по ключу
  const SAMPLES = new Map();
  function routeSamples(sys, r, M) {
    const key = r.kind === 'spiral' ? `${r.sys}|${r.entryAt}|${r.th}|${r.H.T}|${r.H.p}|${r.ka}|${r.spiralAt}` : `${r.sys}|${r.entryAt}|${r.H.T}|${r.H.p}|${r.H.lam.join(',')}|${r.P.lam.join(',')}`;
    if (SAMPLES.has(key)) return SAMPLES.get(key);
    if (r.kind === 'spiral') { const pts = spiralSamples(M || root.M31Mission || require('./mission.js'), sys, r); if (SAMPLES.size > 64) SAMPLES.clear(); SAMPLES.set(key, pts); return pts; }
    const ctx = ctxOf(sys, r.body), ar = r.aref;
    const h = shoot(ctx, r.H.p, ar, r.entry, r.H.T, r.H.lam, { sample: true, maxStep: 0.25 / 365.25 });   // как в planRoute (peak): тот же конец H
    const e2 = { t: r.rendezvousAt, r: h.y.slice(0, 3), v: h.y.slice(3, 6) };
    const p = shoot(ctx, 2, ar, e2, r.P.T, r.P.lam, { sample: true, maxStep: 0.05 / 365.25 });
    const pts = h.samples.map(x => ({ t: x.t, y: x.y.slice(0, 6), dv: x.y[12], a: norm(control(x.y.slice(9, 12), r.H.p, ar)) }))
      .concat(p.samples.slice(1).map(x => ({ t: x.t, y: x.y.slice(0, 6), dv: h.y[12] + x.y[12], a: norm(control(x.y.slice(9, 12), 2, ar)) })));
    if (SAMPLES.size > 64) SAMPLES.clear();
    SAMPLES.set(key, pts); return pts;
  }

  const api = { units: Object.assign({ ACC_UNIT, LY_AU }, U), ROUTE, accAU, accMS, add, mul, dot, norm, unit, cross, gravity, motion, control, optimal, integrate,
    entryAt, entryState, meetPoint, orbitPoint, limitAt, shoot, newton, legH, legP, peak, verifyOrbit, routeCands, routePick, planRoute, planRoutes, routeOf, routeSamples, captureT, schedPairs,
    SPIRAL, rotZ, stagePoint, legStage, stageRows, spiralOf, windowWait, spiralRoute, spiralRoutes, spiralSched, nearRel, spiralSamples };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Flight = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
