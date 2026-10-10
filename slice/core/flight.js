// М31 · срез — полёт внутри системы цели: план партии, стык на 50 а.е., выход на орбиту планеты, даты прибытия. Часть
// content.js: объявленное здесь — в общем реестре частей; имена других частей приходят через __link (позднее связывание: после
// создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const flight = __core => {
    let M, fuelSync, legAdd, legCut, rescueS, wearTerminal;
    const __link = () => { ({ M, fuelSync, legAdd, legCut, rescueS, wearTerminal } = __core); };
    __link();

  // ---- полёт внутри системы (DOC «Полёт внутри системы v1 — проект», шаг 4). Контакт к цели с данными системы (systems.js)
  // от 50 а.е. летит по маршруту flight.js (таблица routes.js): участок тяги плана 'local.N' вместо остатка межзвёздного
  // торможения; выход на орбиту планеты — прибытие (сцены прибытия, «Где будет дом», акт IV, эпилог — от него).
  // Конец межзвёздного профиля (profileEnd) — прежняя дата: от неё скорость, путь, фазы полёта и двигательный участок.
  const FL = root.M31Flight || require('../flight.js'), MSYS = root.M31Systems || require('../systems.js'), ROUTES = root.M31Routes || require('../routes.js');
  const flightSys = s => s.mission === 'contact' && s.target ? MSYS.system(s.target) : null;
  // конец межзвёздного профиля: у спасателя — точная дата стыковки со складом (уточняется торможением у склада)
  const profileEnd = s => rescueS(s) && s.arriveExact != null ? s.arriveExact : s.arrive;
  // прибытие: у полёта внутри системы — выход на орбиту планеты (подтверждённый, до него — по плану), иначе — конец профиля
  const arriveView = s => s.flight ? (s.flight.orbitAt != null ? s.flight.orbitAt : s.flight.planetOrbitAt) : profileEnd(s);
  // прибытие для сцен: точная дата и год (сцены «через год», первое утро — от целого года)
  const arrivalAt = s => s.flight ? arriveView(s) : s.arrive;
  const arrivalYear = s => s.flight ? Math.round(arriveView(s)) : s.arrive;
  // таблица решена при тех же параметрах двигателя
  const tableOk = T => !!T && !!T.engine && T.engine[0] === M.ENGINE && T.engine[1] === M.STOP && T.engine[2] === M.ENGINE_ACC && T.engine[3] === M.VE;
  const MEMO = new Map();
  // маршрут для конца профиля end: из таблицы (целый год), иначе — построение (секунды; запоминается); null — маршрута нет
  function routeFor(sys, end) {
    const key = `${sys.id}|${end}`; if (MEMO.has(key)) return MEMO.get(key);
    const e = FL.entryAt(M, sys, end, 50), T = tableOk(ROUTES) && ROUTES[sys.id], row = T && T.rows[end];
    const r = row ? FL.routeOf(M, sys, T.body, e, { T: row[0], p: row[1], lam: row.slice(2, 8), dv: row[15], ratio: row[17] },
      { T: row[8], p: 2, lam: row.slice(9, 15), dv: row[16], ratio: row[18] }, { ok: true, rminKm: row[19], rmaxKm: row[20] }) : FL.planRoute(M, sys, sys.target, e);
    if (MEMO.size > 256) MEMO.clear();
    MEMO.set(key, r); return r;
  }
  // график расхода участка: пары [доля времени, доля Δv] по выборке траектории — ломаная, отличающаяся от интеграла тяги не
  // больше SCHED_KMS (упрощение Дугласа — Пекера); стык участков H и P — всегда точка графика (тяга там меняется скачком)
  const SCHED_KMS = 0.01;
  function schedOf(sys, r) {
    const pts = FL.routeSamples(sys, r), t0 = r.entryAt, T = r.planetOrbitAt - t0, tot = pts[pts.length - 1].dv, eps = SCHED_KMS / FL.units.AUYR_KMS;
    const keep = new Set([0, pts.length - 1, pts.findIndex(x => x.t >= r.rendezvousAt - 1e-12)]);
    const simplify = (a, b) => { let m = -1, w = eps;
      for (let k = a + 1; k < b; k++) { const x = pts[a].dv + (pts[b].dv - pts[a].dv) * (pts[k].t - pts[a].t) / (pts[b].t - pts[a].t), d = Math.abs(pts[k].dv - x); if (d > w) { w = d; m = k; } }
      if (m >= 0) { keep.add(m); simplify(a, m); simplify(m, b); } };
    const ks = [...keep].sort((a, b) => a - b); for (let i = 0; i + 1 < ks.length; i++) simplify(ks[i], ks[i + 1]);
    return { dv: tot * FL.units.AUYR_KMS / FL.units.C_KMS, sched: [...keep].sort((a, b) => a - b).map(k => [Math.min(1, Math.max(0, (pts[k].t - t0) / T)), pts[k].dv / tot]) };
  }
  // состояние маршрута на год t (а.е., а.е./год; система цели) — по выборке; null — вне маршрута
  function flightState(s, t) {
    const S = flightSamples(s); if (!S || !(t >= S[0].t) || t > S[S.length - 1].t) return null;
    let lo = 0, hi = S.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m].t <= t) lo = m; else hi = m; }
    const a = S[lo], b = S[hi], u = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
    return a.y.map((x, i) => x + (b.y[i] - x) * u);
  }
  // корабль связан со звездой цели (энергия относительно неё отрицательна) — захват уже произошёл
  function flightBound(s, t) { const y = flightState(s, t), sys = flightSys(s); if (!y || !sys) return false;
    const r = Math.hypot(y[0], y[1], y[2]), v = Math.hypot(y[3], y[4], y[5]); return v * v / 2 - sys.mu / r < 0; }
  // план полёта партии: при утверждении паспорта и после поворота курса. Не начатый участок прежнего плана снимается; Δv
  // маршрута сразу входит в обязательный резерв (mustReq), межзвёздное торможение — только до входа на 50 а.е.
  function flightPlan(s) {
    const f = s.fuel, old = s.flight;
    const og = old && f && (f.plan || []).find(g => g.id === old.leg);
    if (og && og.state !== 'planned') return;                          // маршрут уже исполняется — план не меняется
    if (og) legCut(s, og.id, s.year);
    const sys = flightSys(s), r = sys && f && s.arrive != null ? routeFor(sys, profileEnd(s)) : null;
    if (!r) { if (old) { delete s.flight; if (f) { delete f.brakeEnd; fuelSync(s); } } return; }
    const n = old ? old.n + 1 : 1, id = `local.${n}`, sc = schedOf(sys, r);   // Δv — интеграл тяги той же выборки, что график и 3D
    s.flight = { n, leg: id, body: r.body, end: profileEnd(s), entryAt: r.entryAt, rendezvousAt: r.rendezvousAt, planetOrbitAt: r.planetOrbitAt, dv: sc.dv };
    f.brakeEnd = r.entryAt;
    legAdd(s, { id, t1: r.planetOrbitAt, dur: r.planetOrbitAt - r.entryAt, dv: sc.dv, sched: sc.sched });
  }
  // конец маршрута (календарь, источник 'flight'): участок исполнен без недожога — корабль на орбите планеты; иначе встречи нет
  function flightArrive(s, at) {
    const fl = s.flight, g = fl && s.fuel && (s.fuel.plan || []).find(x => x.id === fl.leg), e = g && (s.fuel.log || []).find(x => x.leg === fl.leg);
    if (g && g.state === 'done' && !(e && e.short > 0)) { fl.orbitAt = at; return; }
    fl.failedAt = at; wearTerminal(s, at, 'braking');
  }
  // маршрут для показа (3D): данные и выборка состояний; null — у партии нет полёта внутри системы
  function flightRoute(s) { const sys = s.flight && flightSys(s); return sys ? routeFor(sys, s.flight.end) : null; }
  function flightSamples(s) { const sys = s.flight && flightSys(s), r = sys && routeFor(sys, s.flight.end); return r ? FL.routeSamples(sys, r) : null; }

    return {
      names: {
        FL, MSYS, ROUTES, flightSys, profileEnd, arriveView, arrivalAt, arrivalYear, tableOk, MEMO, routeFor, SCHED_KMS, schedOf, flightState,
        flightBound, flightPlan, flightArrive, flightRoute, flightSamples
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = flight;
  else (root.M31Core = root.M31Core || {}).flight = flight;
})(typeof globalThis !== 'undefined' ? globalThis : this);
