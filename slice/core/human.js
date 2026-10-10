// М31 · срез — люди: нагрузка вахты, обещания, навыки (человеческий фактор, ядро А «Цена обязательств»). Часть content.js:
// объявленное здесь — в общем реестре частей; имена других частей приходят через __link (позднее связывание: после создания
// всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const human = __core => {
    let JB, M, MENTOR_DAYS, W, arriveView, crewOf, pools, ppl, wearNote, wearOn, yrsEn, yrsG;
    const __link = () => { ({ JB, M, MENTOR_DAYS, W, arriveView, crewOf, pools, ppl, wearNote, wearOn, yrsEn, yrsG } = __core); };
    __link();

  // ---- человеческий фактор, ядро А (DOC «Человеческий фактор — ядро А, спецификация»; решения автора — «Ревью Codex —
  // человеческий фактор и общество смен»). Шаг А1 — нагрузка вахты; шаг А2 — её цена: отдых техников при перегрузке.
  // Нагрузка — непрерывная 0…3 (уровни: <1 штатно, 1–2 напряжение, 2–3 перегрузка, 3 предел), скорость — в пунктах за сутки.
  // Острые источники (авральная ручная работа — доля техников на авралах; работы событий и наставник обучения на последнем резерве)
  // ведут к перегрузке и пределу. Хронические (тонкая вахта без свободного специалиста после регламента; растущее отставание
  // регламента выше порога) — только до напряжения CHRONIC: люди вахты сменяются, хронический недобор — это отставание
  // регламента и годы, а не накопленная усталость одних и тех же людей. Без источников — спад. Очередь работ меняется только
  // на границах календаря, отставание регламента между опорами линейно: момент пересечения порога внутри отрезка — точный,
  // поэтому нарезка перемотки итог не меняет
  const LOAD = { aural: 0.15, busy: 0.02, thin: 0.01, reg: 0.02, calm: -0.04, max: 0.20, chronic: 1.5, regThr: 0.1, top: 3 };
  const DAYS = 365.25;
  const humanStart = s => s.human || (s.human = { load: { v: 0, t: s.simYear != null ? s.simYear : s.year }, rest: 0, stats: { max: 0, d2: 0, d3: 0, src: {}, rest: 0 } });
  // составляющие скорости, постоянные на отрезке: острые (авралы, события и обучение на последнем резерве), хронические (тонкая вахта)
  function loadBase(s) {
    if (!s.jobs || !s.wear || !wearOn(s)) return null;                   // модель износа стоит — вахты-ресурса нет
    const P = pools(s).tech, act = JB.active(s.jobs).filter(j => j.status === 'work' && j.pool === 'tech');
    const used = act.reduce((a, j) => a + j.w, 0), free = P - used, aural = act.filter(j => j.maxW === 'all' && j.prio <= JB.PRIO.path).reduce((a, j) => a + j.w, 0);   // аврал — срочная работа всеми свободными
    let acute = 0, chronic = 0; const src = [];
    if (aural > 0 && P > 0) { acute += LOAD.aural * aural / P; src.push('aural'); }
    if (free <= 0 && act.some(j => j.owner === 'ev' || j.type === 'wear.mentor')) { acute += LOAD.busy; src.push('busy'); }
    if (free <= 0 && s.watch < 48) { chronic += LOAD.thin; src.push('thin'); }
    return { acute, chronic, src };
  }
  // момент на [t0, t1], с которого растущее отставание регламента выше порога (null — не на этом отрезке)
  function regFrom(s, t0, t1) {
    const w = s.wear, r = w && w.reg; if (!r) return null;
    const grow = W.regDemand(w, r.t0) - r.S, thr = LOAD.regThr * W.REG.D0; if (!(grow > 1e-9)) return null;
    const lag = W.regAt(w, t0); if (lag >= thr) return t0;
    const tc = r.t0 + (thr - r.B) / grow; return tc < t1 ? Math.max(t0, tc) : null;
  }
  // ход нагрузки на куске с постоянными источниками: линейно со скоростью rate к пределу lim и дальше постоянно; время выше x
  function loadMove(v0, rate, lim, days) {
    const v1 = rate > 0 ? Math.min(lim, v0 + rate * days) : rate < 0 ? Math.max(lim, v0 + rate * days) : v0;
    const above = x => rate > 0 ? (v0 >= x ? days : v1 > x || (v1 >= x && lim >= x) ? days - (x - v0) / rate : 0)
      : rate < 0 ? (lim >= x ? days : v0 > x ? Math.min(days, (v0 - x) / -rate) : 0) : (v0 >= x ? days : 0);
    return { v1, above };
  }
  function loadPiece(h, k, days) {
    if (!(days > 0)) return;
    const v0 = h.load.v, ac = k.acute, ch = k.chronic;
    // скорость и предел: острые — вверх до 3; только хронические — к напряжению (выше него — спад до него); без источников — к нулю
    const m = ac > 0 ? loadMove(v0, Math.min(LOAD.max, ac + ch), LOAD.top, days)
      : ch > 0 ? (v0 < LOAD.chronic ? loadMove(v0, Math.min(LOAD.max, ch), LOAD.chronic, days) : loadMove(v0, LOAD.calm, LOAD.chronic, days))
      : loadMove(v0, LOAD.calm, 0, days);
    const st = h.stats; st.d2 += m.above(2); st.d3 += m.above(LOAD.top); h.load.v = m.v1; st.max = Math.max(st.max, m.v1);
    if (h.rest) st.rest = (st.rest || 0) + h.rest * days;                // человеко-сутки техников на восстановлении
  }
  // отрезок перемотки [t0, t1]: нагрузка — по кускам постоянных источников
  function humanSpan(s, t0, t1) {
    if (!(t1 > t0)) return;
    const h = humanStart(s), b = loadBase(s);
    if (b == null) { h.load.t = t1; return; }
    const tr = regFrom(s, t0, t1), src = h.stats.src || (h.stats.src = {});
    for (const k of b.src) src[k] = (src[k] || 0) + (t1 - t0) * DAYS;
    if (tr != null) src.reg = (src.reg || 0) + (t1 - tr) * DAYS;
    if (tr == null) loadPiece(h, b, (t1 - t0) * DAYS);
    else { loadPiece(h, b, (tr - t0) * DAYS); loadPiece(h, { acute: b.acute, chronic: b.chronic + LOAD.reg }, (t1 - tr) * DAYS); }
    h.load.t = t1;
  }
  const loadLevel = s => s.human ? Math.min(3, Math.floor(s.human.load.v + 1e-9)) : 0;
  // ошибка ремонта под перегрузкой (шаг А3): сборка не держит проверку — одна переделка той же работой. Риск — по доле времени
  // ремонта (от постановки в очередь до конца) на уровнях перегрузки: REWORK[0] на ≥2, ещё REWORK[1] на пределе
  const REWORK = [0.10, 0.15], REWORK_KINDS = ['pump', 'control', 'coll', 'rad', 'ring', 'tank'];
  const humanSnap = s => s.human ? { t: s.human.load.t, d2: s.human.stats.d2, d3: s.human.stats.d3 } : null;
  function reworkRisk(s, h0, t) {
    if (!h0 || !s.human) return 0;
    const days = (t - h0.t) * DAYS; if (!(days > 0)) return 0;
    const f2 = Math.min(1, (s.human.stats.d2 - h0.d2) / days), f3 = Math.min(1, (s.human.stats.d3 - h0.d3) / days);
    return Math.max(0, REWORK[0] * f2 + REWORK[1] * f3);
  }
  // ---- обещанный срок вахты (шаг А4). Разбуженным под регламент обещан срок — TERM.years лет после обучения. По сроку —
  // карточка «Срок вахты»: передать смену (будят других — полгода обучения с наставником, регламент это время отстаёт; обещание
  // исполнено), продлить на TERM.ext года (годы тех же людей сверх обещанного — цена пути), отпустить без смены (вахта — как до
  // пробуждения, регламент снова отстаёт). Продлевать — не больше TERM.max раз: дальше смена отказывается (право отказа)
  const TERM = { years: 5, ext: 3, max: 2 };
  function termStart(s, from, n, until) {
    const h = humanStart(s); h.term = { from, n, until: until + TERM.years, ext: 0 };
  }
  // срок наступил: смена ещё на вахте, модель идёт, до прибытия больше года (иначе доработает до цели)
  function termNext(s, t0, t1) {
    const tm = s.human && s.human.term; if (!tm || tm.asked === tm.until || !(tm.until <= t1)) return null;
    if (!s.wear || !wearOn(s) || s.watch <= tm.from || tm.until + 1 > arriveView(s)) return null;
    return { at: Math.max(t0, tm.until), auto: tm.rotate };
  }
  // порядок ротации (выбран «передать смену»): срок наступил — смена меняется сама, строкой в журнале вахты
  function termRotate(s, t) {
    const n = s.human.term.n, first = !s.human.stats.rotated; termWake(s, t); s.human.stats.handover = (s.human.stats.handover || 0) + 1; s.human.term.rotate = true;
    s.human.stats.rotated = (s.human.stats.rotated || 0) + 1; if (!first) return;   // дальше — без записи: порядок известен
    wearNote(s, `Смена под регламент отслужила срок и уходит в сон по порядку ротации: будят ${ppl(n)}, полгода — обучение с наставником.`,
      `The maintenance watch has served its term and goes to sleep by the rotation order: ${n} people are woken, half a year of training with a mentor.`);
  }
  // новая смена тех же специальностей: ученики, наставник, новый срок
  function termWake(s, t) {
    const tm = s.human.term, k = Math.floor(s.watch / 6) - Math.floor(tm.from / 6);
    if (k > 0) { s.trainees = { n: k, until: W.regNext(s.wear, t + W.REG.train / 365.25 - 1e-9, Infinity) };
      if (s.jobs) JB.enqueue(s.jobs, { owner: 'wear', ref: 'mentor', type: 'wear.mentor', prio: JB.PRIO.path, pool: 'tech', minW: 1, maxW: 1, work: MENTOR_DAYS, hold: 0 }, t, pools(s)); }
    s.human.term = { from: tm.from, n: tm.n, until: (s.trainees ? s.trainees.until : t) + TERM.years, ext: 0 };
  }
  function humanTermDecision(s, ev) {
    const tm = s.human.term, can = tm.ext < TERM.max, left = x => Math.max(0, arriveView(x) - x.year);
    const opts = [{
      id: 'handover', label: { ru: 'Передать смену', en: 'Hand over the watch' },
      known: { ru: y => [`Будят ${ppl(tm.n)}: полгода обучения с наставником — регламент это время отстаёт.`, 'Отслужившие уходят в сон: обещание исполнено.'],
        en: y => [`${tm.n} people are woken: half a year of training with a mentor — maintenance falls behind meanwhile.`, 'Those who served go to sleep: the promise is kept.'] },
      effect: y => { termWake(y, y.year); y.human.stats.handover = (y.human.stats.handover || 0) + 1; y.human.term.rotate = true; },   // дальше — порядок ротации
      record: { ru: 'Отслужившая смена передаёт дела и уходит в сон; новые учатся у наставника.', en: 'The watch that served hands over and goes to sleep; the new ones train under a mentor.' }
    }];
    if (can) opts.push({
      id: 'extend', label: { ru: `Продлить на ${TERM.ext} года`, en: `Extend by ${TERM.ext} years` },
      known: { ru: y => [`Те же ${ppl(tm.n)} — ещё ${TERM.ext} года их жизни сверх обещанного.`, tm.ext + 1 >= TERM.max ? 'Это последнее продление: дальше смена откажется.' : 'Регламент идёт без перерыва.'],
        en: y => [`The same ${tm.n} people — ${TERM.ext} more years of their lives beyond the promise.`, tm.ext + 1 >= TERM.max ? 'This is the last extension: after it the watch will refuse.' : 'Maintenance goes on without a break.'] },
      effect: y => { const x = y.human.term; x.until += TERM.ext; x.ext++; y.human.stats.extraYears = (y.human.stats.extraYears || 0) + x.n * TERM.ext; y.human.stats.ext = (y.human.stats.ext || 0) + 1; },
      record: { ru: `Смена соглашается остаться ещё на ${TERM.ext} года. В журнале — новая дата.`, en: `The watch agrees to stay ${TERM.ext} more years. The log gets a new date.` }
    });
    opts.push({
      id: 'release', label: { ru: 'Отпустить без смены', en: 'Release without a relief' },
      known: { ru: y => [`Вахта — снова ${ppl(tm.from)}: регламент начнёт отставать, узлы будут стареть быстрее.`, 'Отслужившие уходят в сон: обещание исполнено.'],
        en: y => [`The watch is ${tm.from} again: maintenance will fall behind and the nodes will age faster.`, 'Those who served go to sleep: the promise is kept.'] },
      effect: y => { const x = y.human.term; y.ageShift = (y.ageShift || 0) - Math.round(M.awake(left(y), y.watch - x.from, crewOf(y))); y.watch = x.from;
        y.regAsk = { at: y.year, policy: 'release', B: W.regAt(y.wear, y.year) }; delete y.human.term; },
      record: { ru: 'Отслужившая смена уходит в сон; вахта — прежняя, регламент снова отстаёт.', en: 'The watch that served goes to sleep; the watch is back to its former size, and maintenance falls behind again.' }
    });
    return {
      id: 'd.human.term', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: 'Срок вахты', en: 'The watch term' },
      rec: x => ({ id: 'handover', why: { ru: 'обещанное исполняют — иначе следующую смену будить будет некому', en: 'promises are kept — otherwise no one will answer the next call' } }),
      context: {
        ru: x => `${ppl(tm.n)}, разбуженных под регламент, отслужили обещанные ${TERM.years} лет${tm.ext ? ` и ${tm.ext === 1 ? 'одно продление' : 'два продления'}` : ''}. До прибытия — около ${yrsG(left(x))}.${can ? '' : ' Продлевать ещё раз смена отказывается.'}`,
        en: x => `${tm.n} people woken for maintenance have served the promised ${TERM.years} years${tm.ext ? ` and ${tm.ext === 1 ? 'one extension' : 'two extensions'}` : ''}. About ${yrsEn(left(x))} to arrival.${can ? '' : ' The watch refuses another extension.'}`
      },
      options: opts
    };
  }
  // цена пути в итоге (эпилог): годы вахты сверх обещанного или смены, которыми держали регламент; null — будить не пришлось
  function costLine(s, lang) {
    const st = s.human && s.human.stats, e = st && st.ext, h = st && st.handover, ru = lang === 'ru'; if (!e && !h) return null;
    if (e) return ru ? `Сверх обещанного вахта прожила в пути ${st.extraYears} человеко-лет: срок продлевали ${e === 1 ? 'один раз' : `${e} раз${e < 5 ? 'а' : ''}`}.`
      : `Beyond what was promised, the watch lived ${st.extraYears} person-years on the road: the term was extended ${e === 1 ? 'once' : `${e} times`}.`;
    return ru ? `Регламент держали сменами: отслужившие передавали дела ${h === 1 ? 'один раз' : `${h} раз${h % 10 >= 2 && h % 10 <= 4 && (h % 100 < 12 || h % 100 > 14) ? 'а' : ''}`}, обещанные сроки соблюдены.`
      : `Maintenance was held by shifts: those who served handed over ${h === 1 ? 'once' : `${h} times`}; the promised terms were kept.`;
  }
  // отдых при перегрузке (шаг А2): уровень 2 — один техник на восстановлении, предел — двое (не больше четверти специалистов
  // вахты). Защёлка с запасом: отдых начинается на 2 и 3, кончается ниже 1,5 и 2,5 — без дребезга на пороге
  const REST = { on: [2, 3], off: [1.5, 2.5] };
  const restN = s => s.human ? s.human.rest || 0 : 0;
  function restFor(v, n) {
    let r = n;
    if (v >= REST.on[1] - 1e-9) r = 2; else if (v >= REST.on[0] - 1e-9) r = Math.max(r, 1);
    if (v <= REST.off[0] + 1e-9) r = 0; else if (v <= REST.off[1] + 1e-9) r = Math.min(r, 1);
    return r;
  }
  // ближайший на [t0, t1] порог защёлки по ходу нагрузки (тот же, что в humanSpan: куски постоянных источников)
  function humanNext(s, t0, t1) {
    const h = s.human; if (!h) return null;
    if (restFor(h.load.v, h.rest || 0) !== (h.rest || 0)) return { at: t0 };   // защёлка отстала (порог на t0)
    const b = loadBase(s); if (b == null) return null;
    const tr = regFrom(s, t0, t1), pieces = tr == null ? [[t0, t1, b]] : [[t0, tr, b], [tr, t1, { acute: b.acute, chronic: b.chronic + LOAD.reg }]];
    let v = h.load.v, n = h.rest || 0;
    for (const [a, z, k] of pieces) {
      const ac = k.acute, ch = k.chronic;
      const [rate, lim] = ac > 0 ? [Math.min(LOAD.max, ac + ch), LOAD.top] : ch > 0 ? (v < LOAD.chronic ? [Math.min(LOAD.max, ch), LOAD.chronic] : [LOAD.calm, LOAD.chronic]) : [LOAD.calm, 0];
      const xs = rate > 0 ? REST.on.filter((x, i) => n < i + 1 && x > v + 1e-12 && x <= lim + 1e-12) : rate < 0 ? REST.off.filter((x, i) => n > i && x < v - 1e-12 && x >= lim - 1e-12) : [];
      const tau = xs.length ? Math.min(...xs.map(x => Math.abs(x - v) / Math.abs(rate))) / DAYS : Infinity;
      if (a + tau <= z + 1e-12) return { at: a + tau };
      v = loadMove(v, rate, lim, (z - a) * DAYS).v1;
    }
    return null;
  }
  // граница порога: защёлка — по нагрузке на эту дату; меньше или больше специалистов — заново раздать работы
  function humanMark(s, t) {
    const h = s.human; if (!h) return;
    const n = restFor(h.load.v, h.rest || 0); if (n === (h.rest || 0)) return;
    h.rest = n; if (s.jobs) JB.dispatch(s.jobs, t, pools(s));
  }

    return {
      names: {
        LOAD, DAYS, humanStart, loadBase, regFrom, loadMove, loadPiece, humanSpan, loadLevel, REWORK, REWORK_KINDS, humanSnap, reworkRisk, TERM,
        termStart, termNext, termRotate, termWake, humanTermDecision, costLine, REST, restN, restFor, humanNext, humanMark
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = human;
  else (root.M31Core = root.M31Core || {}).human = human;
})(typeof globalThis !== 'undefined' ? globalThis : this);
