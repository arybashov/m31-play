// М31 · срез — звезда цели: вспышки (DOC «Вспышки звезды цели — проект v1»; основа — «Ревью Codex — вспышки звезды цели»).
// Шаг В1: профиль активности, календарь событий, расстояние до звезды и дозы по местам — без последствий и интерфейса.
// Часть content.js: объявленное здесь — в общем реестре частей; имена других частей приходят через __link.
(function (root) {
  'use strict';
  const stellar = __core => {
    let JB, M, W, arriveView, calPick, flightState, hasIR, hashU32, incident, nf, nm, nmG, plural, pools, ppl, pplG, profileEnd, vN, victims, wearNote,
    wearOn, wearRespond, wearShop;
    const __link = () => { ({ JB, M, W, arriveView, calPick, flightState, hasIR, hashU32, incident, nf, nm, nmG, plural, pools, ppl, pplG, profileEnd, vN, victims, wearNote, wearOn, wearRespond, wearShop } = __core); };
    __link();

  // профиль звезды: обычные события (10³¹–10³³ эрг) в сутки, супервспышки (от 10³³ эрг) в год — стартовая калибровка Codex, не
  // измеренные характеристики звёзд; home — орбита дома у цели, а.е. (на подходе у целей с полётом внутри системы расстояние —
  // из модели полёта). Цель вне таблицы (G, K) — без событий. Проксима и Вольф 359 — стенды тестов, в повестке их нет
  const STELLAR = {
    "Barnard's Star": { rate: 0.1, sup: 0.3, home: 0.05 },
    'Ross 128': { rate: 0.05, sup: 0.15, home: 0.0496 },
    'Lacaille 9352 (GJ 887)': { rate: 0.1, sup: 0.3, home: 0.121 },
    'Gl 338': { rate: 0.05, sup: 0.2, home: 0.142 },
    'Epsilon Indi': { rate: 0.01, sup: 0.03, home: 0.5 },
    'Proxima Centauri': { rate: 0.8, sup: 3, home: 0.04848 },
    'Wolf 359': { rate: 2, sup: 8, home: 0.05 }
  };
  // энергии — ограниченный степенной закон dN/dE ∝ E⁻² (обычные E0…E1, супервспышки E1…Emax); попадание протонного потока (sep)
  // и выброса плазмы (cme) — у обычного и у супервспышки; q — разброс протонного выхода; act — скрытая средняя активность звезды
  // в партии (логравномерно, со средним 1); периоды повышенной активности: в блоке из 30 суток с вероятностью p — окно 3–10
  // суток с частотой ×3, общая частота нормирована к среднему профиля. Дальше far а.е. последствий нет.
  // Доза снаружи при попавшем sep: dose Гр × (E / 10³³ эрг) × (1 а.е. / r)² × q; места — коэффициенты прохождения
  const FLARE = { E0: 1e31, E1: 1e33, Emax: 1e35, sep: [0.1, 0.3], cme: [0.05, 0.15], q: [0.3, 3], act: [0.5, 2],
    block: 30, burst: { p: 0.3, mult: 3, len: [3, 10] }, far: 10,
    dose: 0.01, place: { out: 1, post: 0.05, shelter: 0.0025, hall: 0.001 } };
  const FLARE_ACT_MEAN = (FLARE.act[1] - FLARE.act[0]) / Math.log(FLARE.act[1] / FLARE.act[0]);
  const FLARE_BURST_F = FLARE.burst.p * (FLARE.burst.len[0] + FLARE.burst.len[1]) / 2 / FLARE.block, FLARE_BURST_NORM = 1 / (1 + (FLARE.burst.mult - 1) * FLARE_BURST_F);
  const STELLAR_LY_AU = 63241.077088071, SY = 365.25;
  const stellarProfile = name => STELLAR[name] || null;
  // равномерное число по сиду партии, звезде и абсолютным суткам: календарь не зависит от курса, перемотки, нарезки и загрузки
  const stellarU = (s, star, ...k) => hashU32(JSON.stringify(['stellar', s.riskSeed || '', star, ...k])) / 4294967296;
  const stellarLogU = (u, [a, b]) => a * Math.pow(b / a, u);
  const stellarAct = (s, star) => stellarLogU(stellarU(s, star, 'act'), FLARE.act) / FLARE_ACT_MEAN;
  // окно повышенной активности блока: [начало, конец) в сутках от года 0; null — блок спокойный
  function flareBurst(s, star, b) {
    if (stellarU(s, star, 'burst', b) >= FLARE.burst.p) return null;
    const [l0, l1] = FLARE.burst.len, len = l0 + stellarU(s, star, 'burstLen', b) * (l1 - l0), a = b * FLARE.block + stellarU(s, star, 'burstAt', b) * (FLARE.block - len);
    return [a, a + len];
  }
  // пуассоновское число по одной равномерной величине (обратная функция распределения)
  function flarePoisson(lam, u) { let n = 0, p = Math.exp(-lam), F = p; while (u > F && n < 50) { n++; p *= lam / n; F += p; } return n; }
  // события блока (30 суток) — один раз на партию и звезду; кэш общий, без хранения в состоянии (Совет видит только наблюдения)
  const STELLAR_CACHE = new Map();
  function flareBlock(s, star, b) {
    const key = `${s.riskSeed || ''}|${star}|${b}`; if (STELLAR_CACHE.has(key)) return STELLAR_CACHE.get(key);
    const P = STELLAR[star], out = [];
    if (P) {
      const act = stellarAct(s, star) * FLARE_BURST_NORM, w = flareBurst(s, star, b);
      for (let d = 0; d < FLARE.block; d++) {
        const k = b * FLARE.block + d, m = act * (w && k + 0.5 >= w[0] && k + 0.5 < w[1] ? FLARE.burst.mult : 1);
        for (const big of [false, true]) {
          const n = flarePoisson((big ? P.sup / SY : P.rate) * m, stellarU(s, star, big ? 'nS' : 'n', k));
          for (let i = 0; i < n; i++) {
            const t = (k + stellarU(s, star, 't', big, k, i)) / SY, u = stellarU(s, star, 'E', big, k, i);
            const [a, z] = big ? [FLARE.E1, FLARE.Emax] : [FLARE.E0, FLARE.E1], E = a / (1 - u * (1 - a / z));
            out.push({ id: `fl.${k}.${big ? 's' : 'o'}${i}`, at: t, E, big, sep: stellarU(s, star, 'sep', big, k, i) < FLARE.sep[+big],
              cme: stellarU(s, star, 'cme', big, k, i) < FLARE.cme[+big], q: stellarLogU(stellarU(s, star, 'q', big, k, i), FLARE.q) });
          }
        }
      }
      out.sort((x, y) => x.at - y.at);
    }
    if (STELLAR_CACHE.size > 20000) STELLAR_CACHE.clear();
    STELLAR_CACHE.set(key, out); return out;
  }
  // расстояние до звезды цели, а.е.: маршрут внутри системы — из модели полёта; до прибытия — по двигательному торможению
  // межзвёздного профиля (r = STOP·τ²/(2·ENGINE) св. лет, τ — лет до остановки; дальше двигательного участка — больше 1265 а.е.);
  // после прибытия — орбита дома
  function starDistAU(s, t) {
    const P = stellarProfile(s.target), fs = s.flight ? flightState(s, t) : null;
    if (fs) return Math.hypot(fs[0], fs[1], fs[2]);
    if (t >= arriveView(s) - 1e-9) return P ? P.home : null;
    const tau = Math.max(0, profileEnd(s) - t), e = M.ENGINE;
    const ly = tau <= e ? M.STOP * tau * tau / (2 * e) : M.STOP * e / 2 + M.STOP * (tau - e);
    return Math.max(P ? P.home : 0, ly * STELLAR_LY_AU);   // профиль кончается в звезде, корабль — на орбите дома
  }
  // доза события по местам, Гр; null — протонный поток не попал или звезда далеко
  function flareDose(ev, r) {
    if (!ev.sep || !(r > 0) || r > FLARE.far) return null;
    const D = FLARE.dose * (ev.E / 1e33) * ev.q / (r * r);
    return Object.fromEntries(Object.entries(FLARE.place).map(([k, f]) => [k, D * f]));
  }
  // события на [t0, t1) с расстоянием и дозой — для календаря модели (шаг В2) и прибора (В3)
  function stellarEvents(s, t0, t1) {
    const star = s.target; if (!stellarProfile(star) || !(t1 > t0)) return [];
    const out = [], b0 = Math.floor(t0 * SY / FLARE.block), b1 = Math.floor(t1 * SY / FLARE.block);
    for (let b = b0; b <= b1; b++) for (const ev of flareBlock(s, star, b)) if (ev.at >= t0 && ev.at < t1) {
      const r = starDistAU(s, ev.at); out.push(Object.assign({}, ev, { r, dose: flareDose(ev, r) }));
    }
    return out;
  }

  // ---- шаги В2–В3: последствия, режим подхода, прибор. Режим — карточка «Режим подхода к активной звезде» при 10 а.е.:
  // «укрытие по прогнозу» (вахта при событии — в убежище, наружных работ нет, электроника в защищённом режиме; пока активность
  // повышена, работы у цели идут вчетверо медленнее) или «работы по графику» (вахта — на рабочих постах, наружная бригада у цели
  // снаружи долю времени; ИК-обсерватория уводит её раньше). Доза человека: от 0,5 Гр — лучевая болезнь, от 2 Гр — угроза жизни
  // (доля гибели растёт до 6 Гр); электроника — управление капсульных групп (внутри, kместа 0,05; защищённый режим ×0,25):
  // P = 1 − exp(−0,08·X·k), X = (E/10³³)·(0,1 а.е./r)²·q; отказы одного события — пакетом, ремонт — модель износа.
  // Последствия — пока идёт модель износа (корабль — дом); после ухода всех вниз — дом у цели (после версии 1)
  const FLARE_RUN = { near: 1, eva: { n: 2, f: 0.2, ir: 0.5 }, slow: 0.25, ctrl: { a: 0.08, place: 0.05, safe: 0.25 }, sick: 0.5, harm: 2, fatal: 6,
    note: 0.1, card: 0.2 };
  const flareState = s => s.flare || (s.flare = { mode: null, asked: false, slow: false, done: [], lastAt: -Infinity, n: 0, dead: 0, sick: 0, fails: 0, log: [] });
  // доза сильного события (10³³ эрг, q = 1) снаружи у дома цели — для карточки и прибора
  const homeDose = s => { const P = stellarProfile(s.target); return P ? FLARE.dose / (P.home * P.home) : 0; };
  const flareCard = s => homeDose(s) >= FLARE_RUN.card;                 // спокойная звезда (ε Индейца) — без карточки, режим «по графику»
  // окно повышенной активности на момент t (наблюдаемо: вахта видит рост вспышек)
  const flareBurstAt = (s, t) => { const d = t * SY, w = flareBurst(s, s.target, Math.floor(d / FLARE.block)); return !!w && d >= w[0] && d < w[1]; };
  // замедление работ: укрытие по прогнозу, ближе 1 а.е., активность повышена
  const flareSlowAt = (s, t) => !!(s.flare && s.flare.mode === 'shelter' && starDistAU(s, t) < FLARE_RUN.near && flareBurstAt(s, t));
  const flareSlowFactor = s => (s.flare && s.flare.slow ? FLARE_RUN.slow : 1);
  // ближайшая на (t0, t1] граница замедления: края окон активности и переход 1 а.е.
  function flareEdge(s, t0, t1) {
    let e = Infinity; const b0 = Math.floor(t0 * SY / FLARE.block), b1 = Math.floor(t1 * SY / FLARE.block);
    for (let b = b0; b <= b1 && e === Infinity; b++) { const w = flareBurst(s, s.target, b); if (w) for (const x of w.map(d => d / SY)) if (x > t0 + 1e-12 && x <= t1 && x < e) e = x; }
    const ra = starDistAU(s, t0), rb = starDistAU(s, Math.min(t1, e));
    if ((ra < FLARE_RUN.near) !== (rb < FLARE_RUN.near)) { let lo = t0, hi = Math.min(t1, e); for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if ((starDistAU(s, m) < FLARE_RUN.near) === (ra < FLARE_RUN.near)) lo = m; else hi = m; } e = hi; }
    return e <= t1 ? e : null;
  }
  // источник календаря модели: карточка режима (10 а.е.), граница замедления, событие с протонным потоком
  function stellarNext(s, t0, t1) {
    if (!stellarProfile(s.target) || !s.wear || !wearOn(s) || s.terminalAt != null || s.relief) return null;
    const ra = starDistAU(s, t0), rb = starDistAU(s, t1);
    if (!(Math.min(ra, rb) <= FLARE.far)) return null;
    const F = flareState(s), cands = [];
    if (!F.asked && flareCard(s)) { let at = t0; if (ra > FLARE.far) { let lo = t0, hi = t1; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (starDistAU(s, m) > FLARE.far) lo = m; else hi = m; } at = hi; }
      cands.push({ at, cause: null, go: () => { F.asked = true; s.year = Math.max(s.year, at); return { kind: 'wear', type: 'flare', at }; } }); }
    if (flareSlowAt(s, t0) !== !!F.slow) cands.push({ at: t0, cause: null, go: () => { F.slow = flareSlowAt(s, t0); if (s.jobs) JB.dispatch(s.jobs, t0, pools(s)); return null; } });
    else if (F.mode === 'shelter') { const e = flareEdge(s, t0, t1); if (e != null) cands.push({ at: e, cause: null, go: () => { F.slow = flareSlowAt(s, e); if (s.jobs) JB.dispatch(s.jobs, e, pools(s)); return null; } }); }
    const ev = stellarEvents(s, t0, t1 + 1e-12).find(e => e.dose && e.at >= F.lastAt - 1e-12 && !F.done.includes(e.id));
    if (ev) cands.push({ at: ev.at, cause: null, go: () => flareFire(s, ev) });
    return calPick(cands);
  }
  const gy = (D, lang) => D < 0.1 ? `${nf(D * 1000, D * 1000 < 9.95 ? 1 : 0, lang)} ${lang === 'ru' ? 'мГр' : 'mGy'}` : `${nf(D, 1, lang)} ${lang === 'ru' ? 'Гр' : 'Gy'}`;
  // событие с протонным потоком: люди (вахта и наружная бригада), управление групп; запись в журнал
  function flareFire(s, ev) {
    const F = flareState(s), t = ev.at, d = ev.dose, w = s.wear, mode = F.mode || 'work';
    s.year = Math.max(s.year, t); F.lastAt = t; F.done = F.done.concat(ev.id).slice(-8); F.n++;
    const near = ev.r < FLARE_RUN.near, posts = mode === 'shelter' ? d.shelter : d.post;
    const evaP = mode === 'work' && near ? FLARE_RUN.eva.f * (hasIR(s) ? FLARE_RUN.eva.ir : 1) : 0, out = evaP > 0 && stellarU(s, s.target, 'eva', ev.id) < evaP;
    let dead = 0, sick = 0;
    const harm = (D, n, tag) => { if (D < FLARE_RUN.sick || n <= 0) return; if (D < FLARE_RUN.harm) { sick += n; return; }
      const p = Math.min(1, (D - FLARE_RUN.harm) / (FLARE_RUN.fatal - FLARE_RUN.harm)), k = Math.min(n, Math.floor(n * p + stellarU(s, s.target, 'dead', tag, ev.id)));
      dead += k; sick += n - k; };
    if (out) harm(d.out, FLARE_RUN.eva.n, 'eva');
    harm(posts, Math.max(0, s.watch - (out ? FLARE_RUN.eva.n : 0)), 'post');
    // управление капсульных групп: отказы одного события — пакетом, затем ответ модели износа (замена из запаса, перекладка)
    const X = (ev.E / 1e33) * Math.pow(0.1 / ev.r, 2) * ev.q, P = 1 - Math.exp(-FLARE_RUN.ctrl.a * X * FLARE_RUN.ctrl.place * (mode === 'shelter' ? FLARE_RUN.ctrl.safe : 1));
    const recs = w && wearOn(s) ? W.GIDS.filter(g => w.nodes[g + '.ctrl'].ok && stellarU(s, s.target, 'ctrl', g, ev.id) < P).map(g => W.fail(w, g + '.ctrl', t, 'flare')).filter(Boolean) : [];
    if (dead) { if (t < arriveView(s)) s.dead += dead; else { s.deadHere += dead; s.crewHereDead = (s.crewHereDead || 0) + dead; }
      incident(s, 'flare', dead, { ids: victims(s, `flare.${ev.id}`, dead), road: t < arriveView(s), beat: 'd.flare.mode', r: ev.r, out: d.out, posts, mode, eva: out }); }   // вспышек с погибшими бывает несколько — ключ жертв у каждой свой
    F.dead += dead; F.sick += sick; F.fails += recs.length;
    if (d.out >= FLARE_RUN.note || dead || sick || recs.length) {
      const gs = recs.map(x => x.id.split('.')[0]);
      F.log.push({ at: t, r: ev.r, out: d.out, posts, mode, eva: out, dead, sick, fails: gs.length });
      wearNote(s, `Вспышка ${nmG(s)}, ${nf(ev.r, 3, 'ru')} а.е.: протонный поток. ${mode === 'shelter' ? `Вахта в убежище: ${gy(posts, 'ru')}` : `На рабочих постах — ${gy(posts, 'ru')}${out ? `, наружная бригада получила ${gy(d.out, 'ru')}` : `; снаружи было бы ${gy(d.out, 'ru')}`}`}.`
          + (sick ? ` Лучевая болезнь — у ${pplG(sick)}.` : '') + (dead ? ` ${vN(dead, ['Погиб', 'Погибли'])} ${ppl(dead)}.` : '')
          + (gs.length ? ` Отказало управление ${gs.length === 1 ? `группы ${gs[0]}` : `групп ${gs.join(', ')}`}.` : ''),
        `A flare on ${nm(s, 'en')}, ${nf(ev.r, 3, 'en')} AU: a proton stream. ${mode === 'shelter' ? `The watch is in the shelter: ${gy(posts, 'en')}` : `At the work posts — ${gy(posts, 'en')}${out ? `; the outside crew took ${gy(d.out, 'en')}` : `; outside it would have been ${gy(d.out, 'en')}`}`}.`
          + (sick ? ` Radiation sickness — ${sick} ${sick === 1 ? 'person' : 'people'}.` : '') + (dead ? ` ${dead} dead.` : '')
          + (gs.length ? ` The control of group${gs.length === 1 ? '' : 's'} ${gs.join(', ')} failed.` : ''));
    }
    for (const rec of recs) wearRespond(s, rec);
    if (recs.length) wearShop(s, t);
    return null;
  }
  // сильных событий в год (обычные с энергией от 10³² эрг и супервспышки) с протонным потоком — для прибора; по профилю звезды
  // (Совет не знает скрытой активности), в окно повышенной активности — втрое
  const sigRate = (P, burst) => ((P.rate * 365.25 * FLARE.sep[0] * (FLARE.E0 / 1e32 - FLARE.E0 / FLARE.E1) / (1 - FLARE.E0 / FLARE.E1)) + P.sup * FLARE.sep[1]) * FLARE_BURST_NORM * (burst ? FLARE.burst.mult : 1);
  // прибор (строка отчёта вахты): звезда ближе 10 а.е. — активность, расстояние, вероятность сильного протонного события за 7 суток,
  // дозы такого события, режим; за период — события и их последствия
  function flareLine(s, y0, y1, lang) {
    const P = stellarProfile(s.target); if (!P || !s.wear) return null;
    const r = starDistAU(s, y1); if (!(r <= FLARE.far)) return null;
    // дозы сильного события — на нынешнем расстоянии, если звезда ближе 1 а.е., иначе — у дома цели
    const ru = lang === 'ru', F = s.flare || {}, burst = flareBurstAt(s, y1), p7 = 1 - Math.exp(-sigRate(P, burst) * 7 / 365.25), here = r < FLARE_RUN.near, D = here ? FLARE.dose / (r * r) : homeDose(s);
    const evs = (F.log || []).filter(e => e.at > y0 + 1e-9 && e.at <= y1 + 1e-9), worst = evs.reduce((a, e) => Math.max(a, e.out), 0);
    const mode = F.mode === 'shelter' ? (ru ? 'укрытие по прогнозу' : 'shelter by forecast') : F.mode === 'work' ? (ru ? 'работы по графику' : 'work to schedule') : null;
    return ru ? `Звезда: активность ${burst ? 'повышена' : 'обычная'}; ${nf(r, r < 1 ? 3 : 1, 'ru')} а.е.; сильное протонное событие за 7 суток — около ${nf(p7 * 100, p7 < 0.1 ? 1 : 0, 'ru')}%; ${here ? 'при нём' : 'у цели при нём'} снаружи ${gy(D, 'ru')}, на постах ${gy(D * FLARE.place.post, 'ru')}, в убежище ${gy(D * FLARE.place.shelter, 'ru')}.`
        + (evs.length ? ` За период протонных событий — ${evs.length}, самое сильное — ${gy(worst, 'ru')} снаружи.` : '') + (mode ? ` Режим: ${mode}.` : '')
      : `Star: activity ${burst ? 'elevated' : 'normal'}; ${nf(r, r < 1 ? 3 : 1, 'en')} AU; a strong proton event within 7 days — about ${nf(p7 * 100, p7 < 0.1 ? 1 : 0, 'en')}%; ${here ? 'it would give' : 'at the target it would give'} ${gy(D, 'en')} outside, ${gy(D * FLARE.place.post, 'en')} at posts, ${gy(D * FLARE.place.shelter, 'en')} in the shelter.`
        + (evs.length ? ` Proton events over the period — ${evs.length}, the strongest ${gy(worst, 'en')} outside.` : '') + (mode ? ` Mode: ${mode}.` : '');
  }
  // как часто у дома цели вспышка опасна и на рабочих постах (от 2 Гр при q = 1): лет на одно такое событие; null — реже раза в 1000 лет
  function postYears(s) {
    const P = stellarProfile(s.target); if (!P) return null;
    const Ec = FLARE_RUN.harm / (FLARE.dose * FLARE.place.post) * P.home * P.home * 1e33, tail = (a, z) => Ec <= a ? 1 : Ec >= z ? 0 : (a / Ec - a / z) / (1 - a / z);
    const rate = (P.rate * 365.25 * FLARE.sep[0] * tail(FLARE.E0, FLARE.E1) + P.sup * FLARE.sep[1] * tail(FLARE.E1, FLARE.Emax)) * FLARE_BURST_NORM;
    const y = rate > 0 ? 1 / rate : Infinity; return y <= 1000 ? Math.round(y / 10) * 10 || 10 : null;
  }
  // карточка «Режим подхода к активной звезде» (10 а.е.)
  function flareModeDecision(s, ev) {
    const P = stellarProfile(s.target), D = homeDose(s), sp = ((M.star(s.target) || {}).sp || '').trim(), yr = Math.round(P.rate * 365.25);
    const sup = { ru: P.sup >= 1 ? `около ${nf(P.sup, 0, 'ru')} в год` : `раз в ${Math.round(1 / P.sup)} ${plural(Math.round(1 / P.sup), ['год', 'года', 'лет'])}`,
      en: P.sup >= 1 ? `about ${nf(P.sup, 0, 'en')} a year` : `once in ${Math.round(1 / P.sup)} years` };
    const set = mode => y => { const F = flareState(y); F.mode = mode; };
    return {
      id: 'd.flare.mode', scene: 'flare', kind: 'decision',
      title: { ru: 'Режим подхода к активной звезде', en: 'Approach mode for an active star' },
      rec: y => ({ id: 'shelter', why: { ru: 'у цели сильное событие снаружи опасно для жизни; в убежище доза в четыреста раз меньше', en: 'at the target a strong event is life-threatening outside; in the shelter the dose is four hundred times lower' } }),
      context: {
        ru: y => `До ${nmG(y)} — 10 а.е. Красный карлик ${sp}: заметных вспышек — около ${yr} в год, сильных — ${sup.ru}; протонный поток доходит примерно от каждой десятой заметной и каждой третьей сильной. У цели ${nf(P.home, 3, 'ru')} а.е.: при сильном событии снаружи — около ${gy(D, 'ru')}, на рабочих постах — ${gy(D * FLARE.place.post, 'ru')}, в убежище — ${gy(D * FLARE.place.shelter, 'ru')}.`,
        en: y => `${nm(y, 'en')} is 10 AU away. A red dwarf, ${sp}: noticeable flares — about ${yr} a year, strong ones — ${sup.en}; a proton stream arrives from roughly one noticeable flare in ten and one strong flare in three. At the target, ${nf(P.home, 3, 'en')} AU: a strong event gives about ${gy(D, 'en')} outside, ${gy(D * FLARE.place.post, 'en')} at the work posts, ${gy(D * FLARE.place.shelter, 'en')} in the shelter.`
      },
      options: [{
        id: 'shelter', label: { ru: 'Укрытие по прогнозу', en: 'Shelter by forecast' },
        known: { ru: ['При повышенной активности вахта уходит в убежище, наружные работы останавливают, электронику переводят в защищённый режим.', 'Пока активность повышена, работы у цели идут вчетверо медленнее.'],
          en: ['When activity rises, the watch goes to the shelter, outside work stops and the electronics go into protected mode.', 'While activity is elevated, work at the target goes four times slower.'] },
        effect: set('shelter'),
        record: { ru: 'Совет принимает укрытие по прогнозу. Вахта расписывает переходы в убежище; наружные выходы — только в спокойные окна.', en: 'The council adopts shelter by forecast. The watch draws up shelter drills; outside work only in quiet windows.' }
      }, {
        id: 'work', label: { ru: 'Работы по графику', en: 'Work to schedule' },
        known: { ru: y => ['Работы у цели не останавливают: время не теряется.', `При сильном событии наружная бригада получит около ${gy(D, 'ru')}, рабочие посты — ${gy(D * FLARE.place.post, 'ru')}; электроника без защищённого режима отказывает вчетверо чаще.`]
            .concat(postYears(y) ? [`Сильнейшие вспышки — у цели примерно раз в ${postYears(y)} лет — опасны для жизни и на рабочих постах.`] : []),
          en: y => ['Work at the target does not stop: no time is lost.', `In a strong event the outside crew takes about ${gy(D, 'en')}, the work posts ${gy(D * FLARE.place.post, 'en')}; without protected mode the electronics fail four times as often.`]
            .concat(postYears(y) ? [`The strongest flares — at the target about once in ${postYears(y)} years — are life-threatening at the work posts too.`] : []) },
        effect: set('work'),
        record: { ru: 'Совет оставляет работы по графику. Дозиметры — на каждом наружном выходе.', en: 'The council keeps work to schedule. Dosimeters on every outside job.' }
      }]
    };
  }

    return {
      names: {
        STELLAR, FLARE, FLARE_ACT_MEAN, FLARE_BURST_F, FLARE_BURST_NORM, STELLAR_LY_AU, SY, stellarProfile, stellarU, stellarLogU, stellarAct,
        flareBurst, flarePoisson, STELLAR_CACHE, flareBlock, starDistAU, flareDose, stellarEvents, FLARE_RUN, flareState, homeDose, flareCard,
        flareBurstAt, flareSlowAt, flareSlowFactor, flareEdge, stellarNext, gy, flareFire, sigRate, flareLine, postYears, flareModeDecision
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = stellar;
  else (root.M31Core = root.M31Core || {}).stellar = stellar;
})(typeof globalThis !== 'undefined' ? globalThis : this);
