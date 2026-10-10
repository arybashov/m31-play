/* М31 · срез — орбиты: единицы и кеплеровы орбиты тел (без DOM; браузер — M31Orbits).
   Проект «Полёт внутри системы v1» (DOC), шаг 2. Модель хранит годы от старта экспедиции; орбиты — в а.е. и годах
   (μ — а.е.³/год²), наружу — явные преобразования в км, км/с, секунды. Элементы задаются в системе координат цели:
   плоскость отсчёта — плоскость орбит (как в 3D: оси p1, p2), i — наклон к ней, Ω — долгота узла, ω — аргумент перицентра,
   M0 — средняя аномалия на эпоху t0 (год экспедиции). Положение тела — только от эпохи и времени, никогда от даты встречи. */
(function (root) {
  'use strict';
  const AU_KM = 149597870.7, C_KMS = 299792.458, YEAR_S = 3.15576e7, DAY_YR = 1 / 365.25;
  const GM_SUN = 1.32712440018e11;                                      // км³/с²
  const MU_SUN = GM_SUN * YEAR_S * YEAR_S / (AU_KM * AU_KM * AU_KM);       // а.е.³/год² (≈ 4π² для юлианского года)
  const AUYR_KMS = AU_KM / YEAR_S;                                        // 1 а.е./год в км/с (≈ 4,74)
  const units = { AU_KM, C_KMS, YEAR_S, DAY_YR, MU_SUN, AUYR_KMS,
    kms: auyr => auyr * AUYR_KMS, auyr: kms => kms / AUYR_KMS, cToKms: b => b * C_KMS, kmsToC: v => v / C_KMS,
    days: yr => yr * 365.25, years: d => d * DAY_YR };
  // уравнение Кеплера E − e·sin E = M (эллипс), Ньютон; M — любая (приводится к (−π, π])
  function kepler(M, e) {
    const TAU = 2 * Math.PI; M = M - TAU * Math.round(M / TAU);
    let E = e < 0.8 ? M : Math.PI * Math.sign(M || 1);
    for (let k = 0; k < 50; k++) { const f = E - e * Math.sin(E) - M, d = f / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-14) break; }
    return E;
  }
  const meanMotion = (mu, a) => Math.sqrt(mu / (a * a * a));            // рад/год
  const period = (mu, a) => 2 * Math.PI / meanMotion(mu, a);             // лет
  // истинная аномалия ↔ средняя (эллипс) — для задания фазы тела по известному углу
  function meanFromTrue(nu, e) { const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2)); return E - e * Math.sin(E); }
  // из плоскости орбиты в систему цели: поворот ω, наклон i, узел Ω
  function rotate(x, y, el) {
    const cw = Math.cos(el.w || 0), sw = Math.sin(el.w || 0), ci = Math.cos(el.i || 0), si = Math.sin(el.i || 0), cO = Math.cos(el.O || 0), sO = Math.sin(el.O || 0);
    const xp = cw * x - sw * y, yp = sw * x + cw * y;                      // в плоскости орбиты, от линии узлов
    return [cO * xp - sO * ci * yp, sO * xp + cO * ci * yp, si * yp];
  }
  // состояние тела на год t: r — а.е., v — а.е./год (в системе цели); el: { a, e, i, O, w, M0, t0, mu }
  function stateAt(el, t) {
    const n = meanMotion(el.mu, el.a), M = el.M0 + n * (t - (el.t0 || 0)), e = el.e || 0, E = kepler(M, e);
    const cE = Math.cos(E), sE = Math.sin(E), q = Math.sqrt(1 - e * e), den = 1 - e * cE;
    const x = el.a * (cE - e), y = el.a * q * sE, vx = -el.a * n * sE / den, vy = el.a * n * q * cE / den;
    return { r: rotate(x, y, el), v: rotate(vx, vy, el), E, nu: Math.atan2(q * sE, cE - e) };
  }
  // точки орбиты для рисования (замкнутый эллипс в системе цели)
  function orbitPoints(el, k = 256) {
    const out = [], e = el.e || 0, q = Math.sqrt(1 - e * e);
    for (let j = 0; j <= k; j++) { const E = j / k * 2 * Math.PI; out.push(rotate(el.a * (Math.cos(E) - e), el.a * q * Math.sin(E), el)); }
    return out;
  }
  // интегралы движения (проверки): удельная энергия и момент импульса
  const energy = (r, v, mu) => (v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) / 2 - mu / Math.hypot(r[0], r[1], r[2]);
  const angMom = (r, v) => [r[1] * v[2] - r[2] * v[1], r[2] * v[0] - r[0] * v[2], r[0] * v[1] - r[1] * v[0]];

  const api = { units, kepler, meanMotion, period, meanFromTrue, stateAt, orbitPoints, energy, angMom };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Orbits = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
