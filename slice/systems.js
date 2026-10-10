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
    return { id: 'Epsilon Indi', star, mu, bodies, target: 'c', hz: [0.47, 0.85], far: { B: { au: 1460, los: 1900, data: 'author' } }, planeInc,
      approach: [0, Math.sin(inc), Math.cos(inc)] };
  })();
  const SYSTEMS = { 'Epsilon Indi': EPS_INDI };
  const system = name => SYSTEMS[name] || null;
  // положение и скорость тела системы на год экспедиции t (а.е., а.е./год)
  const bodyAt = (sys, id, t) => O.stateAt(sys.bodies[id], t);
  const api = { SYSTEMS, system, bodyAt, M_SUN_KG, M_EARTH, M_JUP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Systems = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
