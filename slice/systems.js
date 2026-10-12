/* М31 · срез — системы целей: звёзды, тела, орбиты (данные без DOM; браузер — M31Systems).
   Проект «Полёт внутри системы v1» (DOC), шаг 2. Каждая величина помечена: obs — наблюдение (DOC «ε Индейца — данные
   и планета v1», источники там), author — авторская гипотеза или выбор. Орбиты — в системе цели (плоскость орбит —
   плоскость отсчёта, i = 0); эпоха t0 = 0 — старт экспедиции; фазы постоянны и от даты встречи не зависят. */
(function (root) {
  'use strict';
  const O = root.M31Orbits || require('./orbits.js');
  const M_SUN_KG = 1.98847e30, M_EARTH = 3.0035e-6, M_JUP = 9.5479e-4;   // массы в M☉
  // ε Индейца: A — K5V (obs), c — каменная планета зоны жизни (author: 0,5 а.е., 1 M⊕, год 146 суток), Ab — суперюпитер
  // (obs: 6,5–7,6 MJ, a ≈ 16–21 а.е., e ≈ 0,25; в игре a 15,8 — как было в 3D), пара Ba/Bb — вне системы (author: 1 460 а.е.
  // поперёк луча, 1 900 — вдоль, у потока). Фаза c на эпоху — 0 (author); Ab — истинная аномалия 1,1 рад (как было в 3D)
  const EPS_INDI = (() => {
    const star = { name: { ru: 'ε Инд A', en: 'ε Ind A' }, mass: 0.782, R_km: 0.713 * 696000, L: 0.21, data: 'obs' };
    const mu = O.units.MU_SUN * star.mass;
    const bodies = {
      c: { name: { ru: 'ε Инд c', en: 'ε Ind c' }, a: 0.5, e: 0, i: 0, O: 0, w: 0, M0: 0, t0: 0, mu, mass: M_EARTH, R_km: 6371, data: 'author' },
      Ab: { name: { ru: 'ε Инд Ab', en: 'ε Ind Ab' }, a: 15.8, e: 0.25, i: 0, O: 0, w: 0, M0: O.meanFromTrue(1.1, 0.25), t0: 0, mu, mass: 7 * M_JUP, R_km: 74350, data: 'obs' }
    };
    // подлёт: направление Солнце → звезда в базисе системы (как tsysAx в 3D): ℓ = (0, sin i, cos i), i — наклон плоскости орбит
    // к картинной плоскости; к плоскости орбит c луч наклонён на 12,2°
    const planeInc = 102.2, inc = planeInc * Math.PI / 180;
    return { id: 'Epsilon Indi', mission: 'contact', star, mu, bodies, target: 'c', hz: [0.47, 0.85], far: { B: { au: 1460, los: 1900, data: 'author' } }, planeInc,
      approach: [0, Math.sin(inc), Math.cos(inc)] };
  })();
  // Красные карлики (DOC «Полёт внутри системы v2 — Ксилона и Оттепель»): цели в 0,05 а.е. — маршрут «спираль» (route):
  // торможение до промежуточной круговой орбиты rs, окно, спуск по спирали, сближение у цели (дни и Δv — проектное допущение).
  // Подлёт — под 10° к плоскости орбит (author); наклоны и фазы планет — author
  const ME = O.units.MU_SUN * M_EARTH;
  const dwarf = (id, mission, star, bodies, target, route) => {
    const mu = O.units.MU_SUN * star.mass, inc = 100 * Math.PI / 180;
    for (const b of Object.values(bodies)) b.mu = b.parent ? ME * bodies[b.parent].mass / M_EARTH : mu;
    return { id, mission, star, mu, bodies, target, route, planeInc: 100, approach: [0, Math.sin(inc), Math.cos(inc)] };
  };
  const pl = (ru, en, a, mE, M0, data = 'obs') => ({ name: { ru, en }, a, e: 0, i: 0, O: 0, w: 0, M0, t0: 0, mass: mE * M_EARTH, R_km: 6371 * Math.pow(mE, 0.27), data });
  // звезда Барнарда (obs: M4V, 0,162 M☉, 0,187 R☉; планеты d, b, c, e — m sin i, принята за массу). Ксилона Ир — орбитальный
  // форпост на круговой орбите 0,05 а.е. (author; эталон Codex), без массы: у цели — точка стоянки рядом с ним
  const BARNARD = dwarf("Barnard's Star", 'supply', { name: { ru: 'звезда Барнарда', en: "Barnard's Star" }, mass: 0.162, R_km: 0.187 * 696000, L: 0.0034, data: 'obs' }, {
    d: pl('Барнард d', 'Barnard d', 0.0188, 0.263, 0.4), b: pl('Барнард b', 'Barnard b', 0.0229, 0.299, 2.1), c: pl('Барнард c', 'Barnard c', 0.0274, 0.335, 3.9),
    e: pl('Барнард e', 'Barnard e', 0.0381, 0.193, 5.2),
    x: { name: { ru: 'Ксилона Ир', en: 'Xylona Ir' }, a: 0.05, e: 0, i: 0, O: 0, w: 0, M0: 1.0, t0: 0, mass: 0, R_km: 0.2, station: true, data: 'author' }
  }, 'x', { kind: 'spiral', rs: 0.1, backKm: 20000, near: { days: 1.5, dvKms: 0.7 } });
  // Росс 128 (obs: M4V, 0,168 M☉, 0,197 R☉; b — 0,0496 а.е., 9,87 суток, m sin i 1,4 M⊕ — принята за массу, author). Склад
  // Оттепели — круговая орбита 30 000 км вокруг b (author; эталон Codex), период ~12 ч
  const ROSS128 = dwarf('Ross 128', 'rescue', { name: { ru: 'Росс 128', en: 'Ross 128' }, mass: 0.168, R_km: 0.197 * 696000, L: 0.0036, data: 'obs' }, {
    b: pl('Росс 128 b', 'Ross 128 b', 0.0496, 1.4, 2.5),
    s: { name: { ru: 'склад Оттепели', en: 'the Thaw store' }, parent: 'b', a: 30000 / O.units.AU_KM, e: 0, i: 0, O: 0, w: 0, M0: 0, t0: 0, mass: 0, R_km: 0.05, station: true, data: 'author' }
  }, 'b', { kind: 'spiral', rs: 0.1, backKm: 200000, orbitKm: 30000, near: { days: 3.5, dvKms: 3.5 } });
  const SYSTEMS = { 'Epsilon Indi': EPS_INDI, "Barnard's Star": BARNARD, 'Ross 128': ROSS128 };
  const system = name => SYSTEMS[name] || null;
  // положение и скорость тела системы на год экспедиции t (а.е., а.е./год); спутник (parent) — вокруг своего тела
  const bodyAt = (sys, id, t) => { const b = sys.bodies[id], st = O.stateAt(b, t); if (!b.parent) return st;
    const p = bodyAt(sys, b.parent, t); return { r: st.r.map((x, i) => x + p.r[i]), v: st.v.map((x, i) => x + p.v[i]), E: st.E, nu: st.nu }; };
  const api = { SYSTEMS, system, bodyAt, M_SUN_KG, M_EARTH, M_JUP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Systems = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
