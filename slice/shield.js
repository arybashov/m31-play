/* М31 · срез: фронтальный щит как прибор — модель для правил v5 (DOC «Симулятор v1 — время и щит», шаг 3).
   Чистые расчёты без DOM, для браузера и Node.

   Геометрия — как у 3D-модели (ART/starship/parts/blender/shield_blender.py): Ø 350 м, 16 радиальных швов и кольцевые
   на 60, 105, 142 м → 64 сменные панели в четырёх поясах (A — у носа … D — у кромки) и центральная защита носа H0
   (до 18 м). Азимут панели k — центр 2πk/16, швы — 2π(k + ½)/16.

   Масса защиты задаётся на площадь фронтальной проекции (паспорт: 20 или 40 кг/м²). Пыль летит вдоль оси, поток на
   единицу проекции одинаков по всему щиту, поэтому наклон конуса сокращается: снятие на единицу проекции
   dσ = η/Q · ρ·v·(γ − 1)c² · dt — одинаково для всех панелей (различия дают только удары — шаги 4–5).
   Константы (обоснование — DOC «Ревью Codex — симулятор v1, время и щит», §1):
     ρ пыли — 2,1·10⁻²⁴ кг/м³ (порядок для локальной среды, Ulysses);
     Q — 60 МДж/кг (атомизация углерода 716,68 кДж/моль → 59,67 МДж/кг, округлено);
     η — 0,5 (доля энергии удара, уходящая на удаление материала; параметр приближённой модели).
   Сервисный допуск — 4 кг/м²: проектная граница обслуживания, не физическая граница пробоя. */
(function (root) {
  'use strict';

  const C_MS = 299792458, YEAR_S = 31557600;
  // hitArea — площадь проекции, на которую расходится энергия одиночного удара в разнесённом пакете (инженерное
  // допущение, не константа гиперскоростного удара; чувствительность проверять удвоением); patch — остаток по
  // нормали в месте аварийной заплаты; grain — плотность вещества зерна (силикат)
  const RULES = { rhoDust: 2.1e-24, Q: 60e6, eta: 0.5, service: 4, step: 0.05, hitArea: 0.06, patch: 8, grain: 3000 };
  const R = 175, NOSE = 18, RINGS = [NOSE, 60, 105, 142, R], SECTORS = 16, BELTS = 'ABCD';
  const NOMINAL = { dust20: 20, dust40: 40, sectors: 20 };          // кг/м² проекции по оснащению
  const SPARES_PER_BELT = { sectors: 8 };                            // сменные сектора: по восемь панелей каждого пояса

  // 64 панели и центр: id, пояс, азимут, радиусы, площадь проекции (м²)
  const PANELS = [{ id: 'H0', belt: null, az: null, r0: 0, r1: NOSE, area: Math.PI * NOSE * NOSE }];
  for (let b = 0; b < 4; b++) for (let k = 0; k < SECTORS; k++) {
    const r0 = RINGS[b], r1 = RINGS[b + 1];
    PANELS.push({ id: BELTS[b] + String(k).padStart(2, '0'), belt: BELTS[b], az: k, r0, r1, area: Math.PI * (r1 * r1 - r0 * r0) / SECTORS });
  }
  const AREA = Math.PI * R * R;

  function create(kind) {
    const nominal = NOMINAL[kind] || NOMINAL.dust20, n = SPARES_PER_BELT[kind] || 0;
    return { schema: 1, kind: NOMINAL[kind] ? kind : 'dust20', nominal, sigma: PANELS.map(() => nominal),
      spares: { A: n, B: n, C: n, D: n }, hits: [], erodedKg: 0, absorbedJ: 0, notes: [] };
  }

  // поток энергии пыли на единицу проекции, Вт/м², при скорости β (доля c) и плотности ρ, кг/м³
  function energyFlux(beta, rho = RULES.rhoDust) {
    const g = 1 / Math.sqrt(1 - beta * beta);
    return rho * beta * C_MS * (g - 1) * C_MS * C_MS;
  }

  // снятие за годы [y0, y1] при скорости betaAt(y): Симпсон с шагом не больше RULES.step года (скорость кусочно-линейна,
  // точность — доли процента); возвращает снятое на единицу проекции, кг/м², и энергию, Дж/м²
  function erode(sh, y0, y1, betaAt, rho = RULES.rhoDust) {
    if (!(y1 > y0)) return { dSigma: 0, energy: 0 };
    const n = 2 * Math.max(1, Math.ceil((y1 - y0) / RULES.step / 2)), h = (y1 - y0) / n;
    let acc = 0;
    for (let i = 0; i <= n; i++) acc += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * energyFlux(Math.max(0, betaAt(y0 + i * h)), rho);
    const energy = acc * h / 3 * YEAR_S, dSigma = RULES.eta / RULES.Q * energy;
    sh.sigma = sh.sigma.map(v => Math.max(0, v - dSigma));
    for (const hh of sh.hits || []) if (hh.state !== 'replaced') {                     // места ударов тоже стираются
      hh.residual = Math.max(0, hh.residual - dSigma);
      if (hh.residual <= 0 && hh.state !== 'breached') { hh.state = 'breached'; hh.breached = true; hh.burntAt = y1; }   // заплату пыль прожгла насквозь (год — конец отрезка)
    }
    sh.erodedKg += dSigma * AREA; sh.absorbedJ += energy * AREA;
    return { dSigma, energy };
  }

  // ---- удары: локальное повреждение не обнуляет панель — у панели остаётся bulk sigma, у места удара свой остаток
  const panelIndex = id => PANELS.findIndex(p => p.id === id);
  // панель, куда пришёл удар: поток одинаков на единицу проекции — вероятность пропорциональна площади (u ∈ [0, 1))
  function panelAt(u) {
    let acc = 0;
    for (const p of PANELS) { acc += p.area / AREA; if (u < acc) return p.id; }
    return PANELS[PANELS.length - 1].id;
  }
  // энергия зерна радиуса a (м) на скорости β: m·(γ − 1)c²
  function grainEnergy(a, beta) { const m = 4 / 3 * Math.PI * a * a * a * RULES.grain, g = 1 / Math.sqrt(1 - beta * beta); return m * (g - 1) * C_MS * C_MS; }
  // удар: снятое в месте удара η·E/(Q·hitArea), кг/м² проекции; пробой — если остатка в месте удара не хватило
  function hit(sh, rec) {
    const i = panelIndex(rec.panel), removed = RULES.eta * rec.energy / (RULES.Q * RULES.hitArea);
    const residual = Math.max(0, sh.sigma[i] - removed);
    const h = Object.assign({}, rec, { removed, residual, breached: residual <= 0, state: residual <= 0 ? 'breached' : 'scarred', first: residual <= 0 ? 'breached' : 'scarred' });
    sh.hits.push(h); return h;
  }
  const hitOf = (sh, id) => sh.hits.find(h => h.id === id);
  // аварийная заплата: пробоина закрыта, остаток в месте удара — RULES.patch; at — год работы (история панели)
  function patch(sh, id, at) { const h = hitOf(sh, id); h.residual = Math.max(h.residual, RULES.patch); h.state = 'patched'; if (at != null) h.patchedAt = at; return h; }
  // замена панели запасной своего пояса: новая панель, все повреждения панели уходят вместе со старой
  function replace(sh, panel, at) {
    const i = panelIndex(panel), belt = PANELS[i].belt;
    if (!belt || !(sh.spares[belt] > 0)) return false;
    sh.spares[belt]--; sh.sigma[i] = sh.nominal;
    for (const h of sh.hits) if (h.panel === panel && h.state !== 'replaced') { h.state = 'replaced'; if (at != null) h.replacedAt = at; }
    if (at != null) (sh.renewed || (sh.renewed = {}))[panel] = at;
    return true;
  }
  const open = sh => sh.hits.filter(h => h.state !== 'replaced');
  const localMin = (sh, h) => Math.min(h.residual, sh.sigma[panelIndex(h.panel)]);

  // наблюдаемое: минимум остатка — по панелям и по местам ударов (среднее скрыло бы опасную дыру), повреждения, запас
  function observe(sh) {
    let min = Infinity, at = null;
    sh.sigma.forEach((v, i) => { if (v < min) { min = v; at = PANELS[i].id; } });
    for (const h of open(sh)) { const v = localMin(sh, h); if (v < min) { min = v; at = h.panel; } }
    const damaged = open(sh).map(h => ({ id: h.id, panel: h.panel, state: h.state, residual: localMin(sh, h) }));
    return { min, at, nominal: sh.nominal, damaged, spares: Object.assign({}, sh.spares), service: RULES.service };
  }

  // наружу (интерфейс, 3D): только зарегистрированное — остатки панелей, состояние, удары и работы; будущих ударов
  // в модели нет (они выводятся из скрытых фактов по требованию), поэтому вид можно отдавать как есть (шаг 6)
  function panelState(sh, id) {
    const hs = open(sh).filter(h => h.panel === id);
    return hs.some(h => h.state === 'breached') ? 'breached' : hs.some(h => h.state === 'patched') ? 'patched'
      : hs.length ? 'scarred' : sh.renewed && sh.renewed[id] != null ? 'new' : 'ok';
  }
  function publicView(sh) {
    return { nominal: sh.nominal, kind: sh.kind, service: RULES.service, spares: Object.assign({}, sh.spares),
      panels: PANELS.map((p, i) => { const hs = open(sh).filter(h => h.panel === p.id);
        return { id: p.id, belt: p.belt, az: p.az, r0: p.r0, r1: p.r1, sigma: sh.sigma[i], state: panelState(sh, p.id),
          residual: Math.min(sh.sigma[i], ...hs.map(h => h.residual)), renewedAt: sh.renewed ? sh.renewed[p.id] : undefined }; }),
      hits: sh.hits.map(h => ({ id: h.id, panel: h.panel, state: h.state, residual: h.residual, at: h.at, radius: h.radius, energy: h.energy, beta: h.beta,
        first: h.first, patchedAt: h.patchedAt, replacedAt: h.replacedAt, burntAt: h.burntAt })) };
  }

  // записи приборного журнала копятся в модели и забираются движком в ленту (take)
  function note(sh, rec) { sh.notes.push(rec); }
  function take(sh) { const out = sh.notes; sh.notes = []; return out; }

  const api = { RULES, PANELS, AREA, NOMINAL, C_MS, YEAR_S, create, energyFlux, erode, observe, note, take,
    panelAt, panelIndex, grainEnergy, hit, hitOf, patch, replace, panelState, publicView };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Shield = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
