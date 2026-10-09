// М31 · срез — журнал запасов и людей, ревизии маршрута. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const ledger = __core => {
    let CAL, DV, EV, INCIDENT_NAME, M, SH, Y, brake, breached, crewOf, dvPct, eqOf, f1, gauges, hasIR, hidden, incYear, kms0, lag, lossesOf, nameAt, nf,
    observeShip, pct, plural, powerOK, ppl, probesLeft, rescueS, serviceDecision, simAdvance, simNotes, simReport, src, storeNow, supplyS, taskName,
    terminalBeat, vAt, wearDecision, wearSync, yrs, yrsEn;
    const __link = () => { ({ CAL, DV, EV, INCIDENT_NAME, M, SH, Y, brake, breached, crewOf, dvPct, eqOf, f1, gauges, hasIR, hidden, incYear, kms0, lag, lossesOf, nameAt, nf, observeShip, pct, plural, powerOK, ppl, probesLeft, rescueS, serviceDecision, simAdvance, simNotes, simReport, src, storeNow, supplyS, taskName, terminalBeat, vAt, wearDecision, wearSync, yrs, yrsEn } = __core); };
    __link();

  // ---- журнал запасов и людей, ревизии маршрута (DOC «Долгий рейс — износ и смена курса», шаг 1).
  // Журнал: каждое изменение запасов и числа погибших — записью с причиной: решение (id/вариант), сцена (id), граница
  // модели (событие, удар, выход из ядра). Сумма записей сходится с состоянием — одно происшествие не считается дважды
  // и не теряется (проверка test-engine). Расчётные потери в капсулах (lossesOf) — пока вне журнала: их заменят отказы
  // капсульных групп модели износа.
  // Ревизия маршрута: цель, скорость, магнит, прибытие. Номер растёт при каждой смене; по ревизиям видно исходный курс
  // (последняя ревизия до отлёта) и каждый поворот с причиной
  const BOOK_KEYS = ['materials', 'reserve', 'dead', 'deadHere', 'outpostDead', 'thawDead'];
  function startBooks(s) {
    s.book = { v: Object.fromEntries(BOOK_KEYS.map(k => [k, s[k] || 0])), log: [] };
    s.nav = { rev: 0, revs: [] };
  }
  function book(s, cause, at) {
    const b = s.book; if (!b) return;
    const d = {};
    for (const k of BOOK_KEYS) { const v = s[k] || 0; if (Math.abs(v - b.v[k]) > 1e-9) { d[k] = v - b.v[k]; b.v[k] = v; } }
    const last = b.log[b.log.length - 1];
    if (cause === 'wear.reg' && last && last.cause === cause && Object.keys(d).every(k => k in last.d)) {   // регламент списывает непрерывно — одна запись подряд
      for (const k of Object.keys(d)) last.d[k] += d[k]; last.at = at != null ? at : s.year; return; }
    if (Object.keys(d).length) b.log.push({ at: at != null ? at : s.year, cause, d });
  }
  function routeCheck(s, cause) {
    const n = s.nav; if (!n || !s.target || !s.arrive) return;
    const r = { target: s.target, beta: s.beta, tMag: s.tMag ?? null, arrive: s.arriveExact ?? s.arrive };
    const l = n.revs[n.revs.length - 1];
    if (l && l.target === r.target && l.beta === r.beta && l.tMag === r.tMag && Math.abs(l.arrive - r.arrive) < 1e-9) return;
    n.rev++; n.revs.push(Object.assign({ rev: n.rev, at: s.year, cause }, r));
  }
  const track = (s, cause) => { routeCheck(s, cause); book(s, cause); };
  // исходный курс — последняя ревизия до отлёта (выбор цели и паспорт — в год 0); дальше — повороты
  const navDeparture = s => s.nav ? s.nav.revs.filter(r => r.at <= 0).pop() || null : null;
  const sim = { active: () => true, advance: simAdvance, notes: simNotes,
    decision: (s, ev) => ev.kind === 'event' ? EV.decision(s, ev) : ev.kind === 'wear' ? wearDecision(s, ev) : serviceDecision(s, ev),
    decided: (s, beat) => { EV.decided(s); wearSync(s); track(s, beat ? `${beat.id}/${s.choices[beat.id]}` : 'model'); },   // плановый совет, вахта в зале, ревизия маршрута, журнал
    applied: (s, beat) => { wearSync(s); track(s, beat.id); }, observe: observeShip, report: simReport, calendar: CAL.map(c => c.id),
    terminal: s => s.terminalAt != null, endBeat: s => terminalBeat(s) };   // рейс окончен состоянием корабля (шаг 3d)
  // прибор щита: минимум остатка по панелям — среднее скрыло бы опасную дыру
  function shieldGaugeV5(s, lang) {
    const o = SH.observe(s.shield), ru = lang === 'ru', kg = ru ? 'кг/м²' : 'kg/m²';
    const worst = o.damaged.slice().sort((a, b) => a.residual - b.residual)[0];
    const dmg = !worst ? (ru ? 'повреждений нет' : 'no damage')
      : worst.state === 'breached' ? (ru ? `${worst.panel}: сквозной пробой` : `${worst.panel}: through-breach`)
      : worst.state === 'patched' ? (ru ? `${worst.panel}: заплата, ${nf(worst.residual, 1, lang)} ${kg}` : `${worst.panel}: patch, ${nf(worst.residual, 1, lang)} ${kg}`)
      : (ru ? `${worst.panel}: выбоина, остаток ${nf(worst.residual, 1, lang)} ${kg}` : `${worst.panel}: scar, ${nf(worst.residual, 1, lang)} ${kg} left`);
    return `${ru ? 'минимум' : 'minimum'} ${nf(o.min, 2, lang)} ${kg} · ${dmg}`;
  }
  // крупный заголовок по центру кадра (интерфейс): итог экспедиции у концовки и происшествие экрана.
  // Только то, что знает экспедиция: состояние партии и записи протокола
  const endHeadline = (s, id, lang) => {
    const ru = lang === 'ru', kicker = ru ? 'Итог экспедиции' : 'Expedition outcome', yr = y => ru ? `год ${Math.floor(y)}` : `year ${Math.floor(y)}`;
    const lost = [...(s.incidents || [])].reverse().find(x => x.lost);
    if (id === 'x.lost' && lost) return { kicker, lines: [ru ? `На борту было ${ppl(lost.aboard)}` : `${lost.aboard} were aboard`, yr(lost.year)] };
    if (/^x\.sos\./.test(id) && s.incident) return { kicker, lines: [ru ? `В капсулах — ${ppl(s.incident.sleepers)}, на вахте — ${s.incident.watch}` : `${s.incident.sleepers} in the capsules, ${s.incident.watch} on watch`,
      ru ? `сигнал бедствия — ${yr(s.incident.sent)}` : `distress signal — ${yr(s.incident.sent)}`] };
    if (id === 'e.end' && s.arrive) {
      const road = lossesOf(s, s.arrive).total + s.dead, lines = [ru ? `Позади ${yrs(Yepi(s))}` : `${yrsEn(Yepi(s))} behind`];
      if (s.mission === 'rescue' && s.rescued) lines.push(ru ? `спасены ${ppl(s.rescued)} из Оттепели` : `${s.rescued} saved from Thaw`);
      if (s.mission === 'contact' && s.task) { const n = taskName(s.task, lang);
        lines.push(s.task.done ? (ru ? `задание выполнено: ${n}` : `task done: ${n}`) : (ru ? `задание не выполнено: ${n}` : `task not done: ${n}`)); }
      lines.push(ru ? `погибли в пути — ${road}, у цели — ${s.deadHere}` : `died on the road — ${road}, at the target — ${s.deadHere}`);
      return { kicker, lines };
    }
    return { kicker, lines: [] };
  };
  const HEADLINE_NAME = { cloud: ['Пробой щита у облака', 'Shield breach at the cloud'], stream: ['Удар потока у Тёмной звезды', 'The stream strikes at the Dark Star'],
    loop: ['Авария общей магистрали', 'The common main fails'], supplyCargo: ['Отказ охлаждения в дрейфе', 'Cooling fails in the drift'],
    supplyExposure: ['Монтаж под вспышками', 'Installation under the flares'], supplyBus: ['Отказ общей платы', 'The common board fails'],
    rescueLate: ['Сроки капсул Оттепели', "Thaw's capsule lives run out"], rescueSection: ['Протекающая секция склада', "The store's section leaks"],
    rescueDock: ['Срыв крепления склада', "The store's mount gives way"], wearGroup: ['Группа без охлаждения', 'A group without cooling'], wearLost: ['Ядро без охлаждения', 'The core without cooling'], rescueWake: ['Массовое пробуждение', 'Mass waking'], rescueWater: ['Вода старой площадки', "The old site's water"] };
  const incidentHeadline = (inc, lang) => {
    const ru = lang === 'ru', name = HEADLINE_NAME[inc.kind] ? HEADLINE_NAME[inc.kind][ru ? 0 : 1] : INCIDENT_NAME[inc.kind] ? INCIDENT_NAME[inc.kind][ru ? 'ru' : 'en'] : inc.kind;
    const who = inc.pop === 'thaw' ? (ru ? ' Оттепели' : ' of Thaw') : /^rescue/.test(inc.kind) ? (ru ? ' экипажа' : ' of the crew') : '';
    return { kicker: ru ? `Происшествие · год ${incYear(inc)}` : `Incident · year ${incYear(inc)}`, title: name[0].toUpperCase() + name.slice(1),
      lines: [inc.lost ? (ru ? 'Корабль потерян' : 'The ship is lost') : inc.dead ? (ru ? `Погибших${who} — ${inc.dead}` : `Dead${who}: ${inc.dead}`) : (ru ? 'Погибших нет' : 'No one died')] };
  };
  // осмотр щита (шаг 6): карточка панели — состояние, остаток, прогноз при нынешнем потоке, история работ.
  // Прогноз — по среде, в которой корабль уже идёт (её видит вахта), без скрытых опасностей впереди
  const PANEL_STATE = { ok: ['цела', 'intact'], scarred: ['выбоина', 'scar'], patched: ['заплата', 'patch'], breached: ['сквозной пробой', 'through-breach'], new: ['заменена', 'replaced'] };
  function shieldInspect(s, id, lang) {
    if (!s.shield) return null;
    const ru = lang === 'ru', kg = ru ? 'кг/м²' : 'kg/m²', V = SH.publicView(s.shield), p = V.panels.find(x => x.id === id) || V.panels[0];
    const yr = y => ru ? `год ${nf(y, 2, 'ru')}` : `year ${nf(y, 2, 'en')}`;
    const where = p.belt ? (ru ? `пояс ${p.belt}, ${p.r0}–${p.r1} м от оси` : `belt ${p.belt}, ${p.r0}–${p.r1} m from the axis`) : (ru ? `центр носа, до ${p.r1} м` : `nose centre, out to ${p.r1} m`);
    const lines = [`${ru ? 'Остаток' : 'Residual'} — ${nf(p.residual, 2, lang)} ${kg} ${ru ? 'из' : 'of'} ${V.nominal}; ${ru ? 'сервисный допуск' : 'service limit'} — ${V.service} ${kg}.`];
    if (p.belt && V.spares[p.belt] != null && s.shield.kind === 'sectors') lines.push(ru ? `Запасных панелей пояса ${p.belt}: ${V.spares[p.belt]}.` : `Spare belt ${p.belt} panels: ${V.spares[p.belt]}.`);
    // прогноз: сколько до допуска при последнем измеренном потоке пыли (наблюдение модели, не план среды впереди)
    const F = s.shield.flux, rate = F ? SH.RULES.eta / SH.RULES.Q * F.w * SH.YEAR_S : 0;   // кг/м² в год
    const left = p.residual - V.service, fw = F ? nf(F.w, F.w >= 100 ? 0 : F.w >= 1 ? 2 : 4, lang) : '';
    lines.push(left <= 0 ? (ru ? 'Допуск исчерпан: нужна замена или заплата.' : 'The limit is exhausted: a replacement or a patch is needed.')
      : !(rate > 0) ? (ru ? 'При нынешнем потоке пыли допуск не достигается.' : 'At the present dust flux the limit is not reached.')
      : left / rate > 1000 ? (ru ? `При последнем измеренном потоке (${fw} Вт/м²) запас до допуска — больше тысячи лет.` : `At the last measured flux (${fw} W/m²) the margin to the limit is over a thousand years.`)
      : left / rate >= 1 ? (ru ? `При последнем измеренном потоке (${fw} Вт/м²) допуск — через ${yrs(left / rate)}.` : `At the last measured flux (${fw} W/m²) the limit is reached in about ${yrsEn(left / rate)}.`)
      : (ru ? `При последнем измеренном потоке (${fw} Вт/м²) допуск — через ${days(Math.max(1, Math.round(left / rate * 365.25)), 'ru')}.` : `At the last measured flux (${fw} W/m²) the limit is reached in ${days(Math.max(1, Math.round(left / rate * 365.25)), 'en')}.`));
    // история: удары, работы, прогорание — по годам
    const hist = [];
    for (const h of V.hits.filter(x => x.panel === p.id)) {
      hist.push({ at: h.at, t: ru ? `${yr(h.at)} — удар зерна ${nf(h.radius * 1000, 2, 'ru')} мм, ${nf(h.energy / 1e6, 0, 'ru')} МДж: ${h.first === 'breached' ? 'пробой' : 'выбоина'}`
        : `${yr(h.at)} — grain ${nf(h.radius * 1000, 2, 'en')} mm, ${nf(h.energy / 1e6, 0, 'en')} MJ: ${h.first === 'breached' ? 'breach' : 'scar'}` });
      if (h.patchedAt != null) hist.push({ at: h.patchedAt, t: ru ? `${yr(h.patchedAt)} — аварийная заплата, ${SH.RULES.patch} ${kg}` : `${yr(h.patchedAt)} — emergency patch, ${SH.RULES.patch} ${kg}` });
      if (h.burntAt != null) hist.push({ at: h.burntAt, t: ru ? `к ${yr(h.burntAt).replace('год', 'году')} — пыль прожгла заплату` : `by ${yr(h.burntAt)} — dust burned through the patch` });
    }
    if (p.renewedAt != null) hist.push({ at: p.renewedAt, t: ru ? `${yr(p.renewedAt)} — панель заменена запасной` : `${yr(p.renewedAt)} — the panel was replaced with a spare` });
    hist.sort((a, b) => a.at - b.at);
    return { id: p.id, state: p.state, title: `${ru ? 'Панель' : 'Panel'} ${p.id} · ${PANEL_STATE[p.state][ru ? 0 : 1]}`, where, lines,
      history: hist.length ? hist.map(h => h.t) : [ru ? 'Ударов и работ не было.' : 'No impacts or work.'], view: V };
  }

  // что изменится: только отличающиеся приборы, с разницей для чисел
  function gaugeDiff(a, b, lang) {
    const A = gauges(a, lang), B = gauges(b, lang), sign = x => (x > 0 ? '+' : '−') + (Math.abs(x) % 1 ? pct(Math.abs(x), lang) : Math.abs(x));
    return B.filter(g => { const o = A.find(x => x.id === g.id); return !o || o.value !== g.value; })
      .map(g => { const o = A.find(x => x.id === g.id); const d = o && g.n !== undefined && o.n !== undefined ? g.n - o.n : 0;
        return `${g.label} ${g.value}` + (d ? ` (${sign(d)})` : ''); });
  }
  const stageYears = s => brake(s) + M.brakeDist(s.beta, s.tMag) / s.beta - M.ACC;   // от отделения ступени до прохода цели
  const stagePass = s => M.ACC + stageYears(s);
  // кто на борту читает слабые спектры (для поиска поддержки)
  const reader = (s, lang) => s.taught ? (lang === 'ru' ? 'ученики Коры' : "Kora's students") : s.koraYear ? (lang === 'ru' ? 'Ная Сорн' : 'Naya Sorn')
    : hasIR(s) ? (lang === 'ru' ? 'инфракрасная обсерватория' : 'the infrared observatory') : null;
  // сутки проверки потока: проверка и манёвр должны уложиться в окно до ядра (streamWin)
  const CHECK = { probe: 10, kora: 21, student: 26 };
  const burnDays = s => s.highPower ? 0.25 : 12;
  const CHECK_PLUS = { student: 18 };                                   // расширенная спектрометрия: ученики читают поток быстрее; Кору будят три недели в любом случае
  const checkDays = (s, k) => eqOf(s).sensors === 'spectraPlus' && CHECK_PLUS[k] ? CHECK_PLUS[k] : CHECK[k];
  // поток: в 30% партий опасная полоса пересекает номинальный курс. Зонд (10 суток) видит её в 9 из 10,
  // Кора (21) — в 19 из 20, ученики (26, со спектрометрией 18) — в 8 из 10. Удар — при проходе или опоздавшем уходе:
  // целый щит и полная мощность — 8 погибших, нет одного — 27, нет обоих — гибель корабля
  const STREAM = { wide: 0.3, sense: { probe: 0.9, kora: 0.95, student: 0.8 }, dead: { 1: 8, 2: 27 } };
  const streamWide = s => (hidden(s, 'contact.stream.wide') ?? 1) < STREAM.wide;
  // поток у Тёмной звезды — место на пути, отсчитанное от цели (DOC «Симулятор v1 — время и щит», шаг 5):
  // предупреждение и вход в ядро — на 0,0328 и 0,0315 св. года до цели (на эталоне — «прибытие − 5» и 30 суток до
  // ядра), ядро толщиной 0,00012 св. года (около трёх суток на 0,015c). Предвестник — 10⁻¹⁸ кг/м³; ядро на курсе —
  // только при широкой полосе (скрытый факт streamWide): 10⁻¹⁶ кг/м³ и одно зерно 1,9–2,1 мм.
  const STREAM_X = { warn: 0.032809771231847, core: 0.031545807335968, thick: 0.00012, dark: 1900 / 63241.077 };   // dark — ближайший проход пары карликов, 1900 а.е. до цели вдоль пути
  const STREAM_RHO = { pre: 1e-18, core: 1e-16 }, STREAM_MAT5 = { 1: 5, 2: 10 };   // отсеки; щит — отдельным решением
  const STREAM_MEMO = new Map();
  // года предупреждения, входа в ядро и выхода из него: остаток пути до цели — интеграл той же скорости, что у модели
  function streamTimes(s) {
    const key = `${s.beta}|${s.arrive}|${s.tMag}`;
    if (STREAM_MEMO.has(key)) return STREAM_MEMO.get(key);
    const v = t => M.speedAt(t, s.beta, s.arrive, s.tMag), h = 0.002;
    const left = y => { const n = Math.max(2, 2 * Math.ceil((s.arrive - y) / h / 2)), dt = (s.arrive - y) / n; let a = 0;
      for (let i = 0; i <= n; i++) a += (i === 0 || i === n ? 1 : i % 2 ? 4 : 2) * v(y + i * dt); return a * dt / 3; };
    const at = x => { let lo = s.arrive - 30, hi = s.arrive; for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (left(m) > x) lo = m; else hi = m; } return (lo + hi) / 2; };
    const T = { warn: at(STREAM_X.warn), core: at(STREAM_X.core), exit: at(STREAM_X.core - STREAM_X.thick), dark: at(STREAM_X.dark) };
    STREAM_MEMO.set(key, T); return T;
  }
  const streamWin = s => (streamTimes(s).core - streamTimes(s).warn) * 365.25;      // окно до ядра, сутки
  // мимо Тёмной звезды: пара карликов лежит в 1460 а.е. поперёк пути к A (проекция на небо) и — по выбору автора, данные
  // это допускают — на 1900 а.е. впереди A вдоль луча, у потока. Ближе 1460 а.е. путь к ней не подходит; диск отсюда не виден.
  // Встать рядом с парой — прежде всего погасить скорость прохода (тысячи км/с); сверх того — поперечный перенос и путь к A
  const DARK = { side: 1460 };                                            // а.е.
  const darkAt = s => streamTimes(s).dark;
  function discText(s, lang) {
    const ru = lang === 'ru', vk = vAt(s, darkAt(s)) * 299792.458, v = Math.round(vk / 10) * 10, res = kms0(s);
    // остановиться у пары: одно только гашение скорости прохода больше малого резерва; при большом — съело бы его, а у цели он нужнее
    const stop = res < vk ? (ru ? `Встать рядом с ней нечем: одно гашение скорости прохода — ${v} км/с, больше всего резерва манёвров (${res} км/с).`
        : `There is nothing to stop beside it with: just killing the passing speed takes ${v} km/s, more than the whole manoeuvre reserve (${res} km/s).`)
      : (ru ? `Встать рядом с ней — одно гашение скорости прохода съело бы ${Math.round(100 * vk / res)}% резерва манёвров (${v} из ${res} км/с), а ещё поперечный перенос и годы пути обратно к A. Совет решает идти мимо.`
        : `Stopping beside it — just killing the passing speed would eat ${Math.round(100 * vk / res)}% of the manoeuvre reserve (${v} of ${res} km/s), plus the sideways transfer and years back to A. The council decides to go past.`);
    const lead = s.streamRoute === 'pass' ? (ru ? 'Край потока проводит' : 'The edge of the stream takes') : (ru ? 'Изменённая траектория проводит' : 'The changed trajectory takes');
    const log = ru ? `Они пытались вскрыть диск, прорезая один из спиральных выступов. Разрез выпустил пламя; чужой металл заварил пролом сам. Погибла часть экипажа, двигатель был повреждён. Маяк диска проснулся от вскрытия — это и был сигнал, который приняло Кольцо. Выжившие годами держались на орбите, пока питание капсул не иссякло.`
      : `They tried to open the disc by cutting through one of the spiral ridges. The cut let out flame; the alien metal welded the breach shut by itself. Part of the crew died, the engine was damaged. The disc's beacon woke at the breach — that was the signal the Ring received. The survivors held on in orbit for years, until the capsules' power ran out.`;
    return ru ? `${lead} корабль мимо пары карликов — источника сигнала. Ближе ${DARK.side} а.е. путь к ε Индейца A к ним не подходит: пара лежит в стороне. ${stop}

В инфракрасные телескопы карлики видны двумя тусклыми точками. Диск отсюда не разглядеть ни в один прибор: четыреста метров с такого расстояния — миллионные доли угловой секунды. Зато слышны оба маяка — диска и корабля тридцать второй. Радио от пары идёт больше восьми суток.

Маяк тридцать второй на изотопном питании передаёт их бортовой журнал по кругу; за несколько суток его принимают целиком. В журнале — их собственные снимки: дискообразный корпус около четырёхсот метров поперёк, миллионы лет как мёртвый, со спиральными выступами по поверхности, и заваренный разрез на одном из выступов. ${log}

Когда пара остаётся позади, экипаж проводит обряд имён: каждого из тридцать второй называют вслух по реестру и показывают его запись в архиве.

Последняя запись журнала — голос женщины: тем, кто придёт, — не вскрывать корпус.`
      : `${lead} the ship past the pair of dwarfs — the source of the signal. The road to ε Indi A comes no closer to them than ${DARK.side} AU: the pair lies off to the side. ${stop}

In the infrared telescopes the dwarfs are two faint points. The disc cannot be seen from here by any instrument: four hundred metres at this distance is millionths of an arcsecond. But both beacons are heard — the disc's and the Thirty-Second's ship's. Radio from the pair takes more than eight days.

The Thirty-Second's beacon, on isotope power, sends their log round and round; within a few days it is received in full. The log holds their own pictures: a disc-shaped hull about four hundred metres across, dead for millions of years, with spiral ridges across its surface, and a welded cut on one of the ridges. ${log}

When the pair is behind, the crew holds the rite of names: each of the Thirty-Second is named aloud from the register, and their archive entry is shown.

The log's last entry is a woman's voice: to those who come after — do not open the hull.`;
  }
  const warnAt = s => src(s) ? streamTimes(s).warn : s.arrive - 5;   // вход в систему — точка предупреждения
  const streamAt = s => s.streamImpact && s.streamImpact.out != null ? s.streamImpact.out : s.arrive - 5;   // выход из ядра после удара
  const sosAtStream = s => s.streamImpact && s.streamImpact.out != null ? Math.max(s.streamImpact.out, s.streamImpact.done ?? s.streamImpact.out) : s.arrive - 5;   // сигнал — после манёвра ухода
  const days = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  // сколько снимает пыль ядра за весь проход (кг/м²) — для подсказки о слабом месте; на свежей копии, без скрытых фактов
  const coreLoss = s => { const T = streamTimes(s); return SH.erode(SH.create('dust20'), T.core, T.exit, y => M.speedAt(y, s.beta, s.arrive, s.tMag), STREAM_RHO.core).dSigma; };
  const win = s => Math.round(streamWin(s));
  // план прохода: когда начат и закончен манёвр ухода, когда удар зерна, сколько корабль в предвестнике и в ядре
  function streamPlan(s) {
    const T = streamTimes(s), wide = streamWide(s);
    const start = s.streamRoute === 'evade' ? T.warn + (s.streamDays || 0) / 365.25 : null;
    const done = start != null ? start + burnDays(s) / 365.25 : null;
    const g = T.core + (hidden(s, 'shield.stream.hit.0.time') ?? 0.5) * (T.exit - T.core);
    let coreEnd = null, hit = false;
    if (wide && s.streamRoute && (done == null || done > T.core)) {                 // ядро на курсе и уйти до него не успели
      if (done != null) { coreEnd = Math.min(done, T.exit); hit = g < coreEnd; }
      else { hit = true; coreEnd = Math.min(T.exit, g + burnDays(s) / 365.25); } // после удара — уход из ядра
    }
    return Object.assign({}, T, { done, g, hit, coreEnd, preEnd: done != null ? Math.min(done, T.exit) : T.exit });
  }
  const streamDv = s => dvPct(s, s.highPower ? DV.stream : DV.streamWeak);
  const canEvade = s => s.reserve >= streamDv(s);
  const streamLate = s => (s.streamDays || 0) + burnDays(s) > streamWin(s);   // граница включительна: ровно по окну — вовремя
  const windowLine = (s, lang) => { const ru = lang === 'ru', d = s.streamDays || 0, bd = s.highPower ? (ru ? '6 часов' : '6 hours') : (ru ? '12 суток' : '12 days'), W = streamWin(s), over = d + burnDays(s) - W;
    return ru ? `Окно — ${days(win(s), 'ru')}: прошло ${d}, манёвр — ${bd}.` + (over > 0 ? ` Не успеваем на ${Math.ceil(over)} сут.` : ' Успеваем.')
      : `Window: ${days(win(s), 'en')} — ${d} gone, manoeuvre ${bd}.` + (over > 0 ? ` Too late by ${Math.ceil(over)} days.` : ' In time.'); };
  // проверка у потока даёт сведения; маршрут — отдельным решением (d.streamRoute)
  function streamCheckEffect(st, k) {
    st.streamCheck = k; st.streamDays = checkDays(st, k);
    st.streamFound = streamWide(st) && (hidden(st, 'contact.stream.check') ?? 1) < STREAM.sense[k];
  }
  // ответ приходит в свой срок — в совете о маршруте; в записи выбора — только начало проверки
  const streamFoundRecord = { ru: s => `Проверка начата: ответ — через ${days(s.streamDays, 'ru')}.`,
    en: s => `The check has begun: the answer in ${days(s.streamDays, 'en')}.` };
  const probeOK = s => probesLeft(s) || s.materials >= 5;              // зонд: готовый или из материалов
  const pctFrom = (p, lang) => lang === 'ru' ? { 0.9: 'в девяти случаях из десяти', 0.95: 'в девятнадцати случаях из двадцати', 0.8: 'в восьми случаях из десяти' }[p] : { 0.9: 'nine times in ten', 0.95: 'nineteen times in twenty', 0.8: 'eight times in ten' }[p];
  function streamOptions(s) {
    const out = [{
      id: 'probe', label: { ru: 'Зонд Тамира', en: "Tamir's probe" },
      known: {
        ru: s => [probesLeft(s) ? 'Готовый зонд: прямые детекторы, без трат материалов.' : 'Зонд из материалов для высадки: −5% запаса.', `${checkDays(s, 'probe')} суток: прямые детекторы видят опасную полосу ${pctFrom(STREAM.sense.probe, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => [probesLeft(s) ? 'A ready probe: direct detectors, no materials spent.' : 'A probe from landing materials: −5% of stock.', `${checkDays(s, 'probe')} days: direct detectors see the dangerous band ${pctFrom(STREAM.sense.probe, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      cost: st => { if (!probesLeft(st)) st.materials -= 5; },
      effect: st => { if (!probesLeft(st)) st.materials -= 5; streamCheckEffect(st, 'probe'); },
      record: streamFoundRecord
    }].filter(o => probeOK(s)).concat([{
      id: 'kora', label: { ru: 'Разбудить Кору', en: 'Wake Kora' },
      known: {
        ru: s => ['Её последнее пробуждение: у цели Кору будить будет нельзя.', `${checkDays(s, 'kora')} суток: Кора видит опасную полосу ${pctFrom(STREAM.sense.kora, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => ['Her last waking: at the target Kora cannot be woken again.', `${checkDays(s, 'kora')} days: Kora sees the dangerous band ${pctFrom(STREAM.sense.kora, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      effect: st => { st.koraLast = true; st.koraAwake += 1; streamCheckEffect(st, 'kora'); },
      record: streamFoundRecord
    }]);
    if (s.taught || s.koraYear) out.push({
      id: 'student', label: { ru: s => s.taught ? 'Разбудить учеников Коры' : 'Разбудить Наю Сорн', en: s => s.taught ? "Wake Kora's students" : 'Wake Naya Sorn' },
      known: {
        ru: s => ['Кора остаётся для цели.', `${checkDays(s, 'student')} суток: видят опасную полосу ${pctFrom(STREAM.sense.student, 'ru')}.`, 'Решать, уходить ли, — по результату.'],
        en: s => ['Kora is kept for the target.', `${checkDays(s, 'student')} days: they see the dangerous band ${pctFrom(STREAM.sense.student, 'en')}.`, 'Whether to leave is decided on the result.']
      },
      effect: st => { streamCheckEffect(st, 'student'); },
      record: streamFoundRecord
    });
    if (canEvade(s)) out.push({
      id: 'evade', label: { ru: 'Уходить сразу', en: 'Leave at once' },
      known: {
        ru: s => [`Резерв манёвров −${f1(streamDv(s), 'ru')}% паспортного.`, windowLine(s, 'ru'), 'Опасна ли полоса — так и не узнаем.'],
        en: s => [`Manoeuvre reserve −${f1(streamDv(s), 'en')}% of rated.`, windowLine(s, 'en'), 'Whether the band was dangerous we will never know.']
      },
      cost: st => { st.reserve -= streamDv(st); },
      effect: st => { st.reserve -= streamDv(st); st.streamRoute = 'evade'; },
      record: { ru: 'Совет решает уходить, не дожидаясь измерений.', en: 'The council decides to leave without waiting for measurements.' }
    });
    out.push({
      id: 'model', label: { ru: 'Довериться модели', en: 'Trust the model' },
      known: {
        ru: s => ['91% за безопасный проход — если модель верна и набор гипотез полон.', 'Ни циклов, ни материалов, ни времени.', riskLine(s, 'ru')],
        en: s => ['91% for a safe passage — if the model is correct and the hypothesis set complete.', 'No cycles, no materials, no time.', riskLine(s, 'en')]
      },
      effect: st => { st.streamRoute = 'pass'; },
      record: { ru: 'Корабль идёт по краю потока, не меняя курса.', en: 'The ship runs along the edge of the stream without changing course.' }
    });
    return out;
  }
  // энергия у цели: груз поддержки или работающий изомерный контур
  const energyOK = s => s.support === 'found' || powerOK(s);
  const riskLine = (s, lang) => { const ru = lang === 'ru', r = [];
    if (s.shield) {                                      // слабое место — по модели щита (ядро снимает ~10 кг/м²)
      const cl = coreLoss(s), w = SH.observe(s.shield).damaged.filter(d => d.residual < cl).sort((a, b) => a.residual - b.residual)[0];
      if (w) r.push(ru ? (w.residual <= 0 ? `в панели ${w.panel} открытая пробоина — пыль ядра пойдёт прямо в отсек` : `в панели ${w.panel} ${nf(w.residual, 1, 'ru')} кг/м², а ядро потока снимает до ${nf(cl, 1, 'ru')}`)
        : (w.residual <= 0 ? `panel ${w.panel} has an open hole — the core dust goes straight into the compartment` : `panel ${w.panel} has ${nf(w.residual, 1, 'en')} kg/m², and the stream's core removes up to ${nf(cl, 1, 'en')}`));
    } else if (breached(s)) r.push(ru ? 'сектор щита, пробитый у облака, держит меньше' : 'the shield sector breached at the cloud holds less');
    if (!s.highPower) r.push(ru ? 'без полного контура быстро уйти из потока нельзя' : 'without the full loop there is no quick way out of the stream');
    return r.length ? (ru ? 'Если поток ударит: ' : 'If the stream hits: ') + r.join('; ') + '.' : (ru ? 'Если поток ударит — щит цел, контур полный.' : 'If the stream hits — the shield is whole, the loop full.'); };                   // в комплекте два зонда: один остаётся всегда
  const bad = w => ['hostile', 'ruined', 'none'].includes(w);
  // Акт IV: мир пригоден для высадки (открытый или под куполами); иначе дом — на орбите, спутниках или в пути
  const livable = s => s.mission !== 'supply' && ['open', 'dome'].includes(M.worldOf(s.target));
  // Акт III — за 12 лет до прибытия, но не раньше раскрытия магнита: после поворота к источнику скорость ниже и торможение короче
  const Y3 = s => M.actIII(s.arrive, s.tMag);
  const Y4 = s => s.arrive + 3;                                        // первое утро дома
  const answerLag = s => 2 * Math.round(M.star(s.target).d) + 2;      // отчёт туда, ответ обратно и решение Совета
  const Yepi = s => Y4(s) + answerLag(s);
  const laserYear = s => s.arrive + 1 + laserNews(s);
  // исход партии по фактическому состоянию
  const OUTCOME = {
    mainstay: { ru: 'Новая опора Кольца', en: 'A new mainstay of the Ring' },
    lean: { ru: 'Неполная, но живая колония', en: 'An incomplete but living colony' },
    orbital: { ru: 'Орбитальный дом', en: 'An orbital home' },
    beacon: { ru: 'Маяк для следующих', en: 'A beacon for those who follow' },
    return: { ru: 'Возвращение', en: 'The return' },
    delivered: { ru: 'Форпост снова в Кольце', en: 'The outpost back in the Ring' },
    partialSupply: { ru: 'Форпост спасён наполовину', en: 'The outpost half saved' },
    sheltered: { ru: 'Форпост под крылом корабля', en: 'The outpost under the ship\'s wing' },
    supplyFailed: { ru: 'Снабжение сорвано', en: 'The supply mission failed' },
    housed: { ru: 'Спасены и устроены', en: 'Rescued and housed' },
    unhoused: { ru: 'Спасены, но без постоянных мест', en: 'Rescued, awaiting housing' },
    tooLate: { ru: 'Опоздали', en: 'Too late' },
    rescueFailed: { ru: 'Спасены, но обязательство не выполнено', en: 'Rescued, but the commitment failed' }
  };
  function outcomeOf(s) {
    if (s.mission === 'supply' && supplyS(s)) { if (s.supplyFailed) return 'supplyFailed'; if ((s.outpostDead || 0) > 0 || (s.supplyCrewDead || 0) > 0) return 'partialSupply'; }
    if (s.mission === 'supply') return !(s.relayOK && s.capsOK) ? 'partialSupply' : s.shelter ? 'sheltered' : 'delivered';
    if (rescueS(s) && s.rescued && !s.housed && s.thawPlace === 'infirmary') return 'rescueFailed';   // срок лазарета истёк без жилья
    if (s.mission === 'rescue') return !s.rescued ? 'tooLate' : s.housed ? 'housed' : 'unhoused';      // версия 3: полнота — в итоге, не в названии исхода
    if (s.home === 'return') return 'return';
    if (s.home === 'beacon') return 'beacon';
    if (!livable(s) || s.settle === 'orbit') return 'orbital';
    const deadAll = lossesOf(s, s.arrive).total + s.dead + s.deadHere;
    return s.winterDead > 0 || deadAll > 60 ? 'lean' : 'mainstay';
  }                  // когда до нас дойдёт весть с Тёмной звезды
  const laserLate = s => !src(s) && laserYear(s) > Yepi(s);
  // экспедиция эпохи III из сводки a3.epoch3: парус уходит с Земли, когда отправлена сводка (год приёма минус задержка),
  // к источнику; если источник — наша цель, то к δ Павлина. Разгон и торможение — как у спасательного паруса Земли
  const EPOCH3 = { beta: 0.2, acc: 2, dec: 8, far: 'Gl 780' };
  function epoch3(s) {
    if (!s.arrive || !s.target) return null;
    const news = Y3(s);
    return { launch: news - lag(s, news), news, star: src(s) ? EPOCH3.far : M.SOURCE, beta: EPOCH3.beta, acc: EPOCH3.acc, dec: EPOCH3.dec };
  }
  // лазерная экспедиция эпохи III: от Земли к ε Индейца на 0,2c; весть о находке идёт от ε Индейца к нам
  function laserNews(s) {
    const t0 = epoch3(s).launch, a = M.star(M.SOURCE), b = M.star(s.target);
    const d = Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
    return Math.max(2, Math.round(t0 + a.d / EPOCH3.beta + (EPOCH3.acc + EPOCH3.dec) / 2 + d - (s.arrive + 1)));
  }
  const skipTo = (f, ru, en) => ({ kind: 'skip', toYear: s => Y(s, f),
    label: { ru: s => `Промотать до года ${Y(s, f)}${ru ? ' · ' + ru : ''}`, en: s => `Skip ahead to year ${Y(s, f)}${en ? ' · ' + en : ''}` } });
  const bulletinTitle = f => ({
    ru: s => `Сводка Кольца · отправлена с Земли ${yrs(lag(s, Y(s, f)))} назад`,
    en: s => `Ring bulletin · sent from Earth ${yrsEn(lag(s, Y(s, f)))} ago`
  });
  // что из решений Акта I уходящая вахта разбирает последним
  function lastCall(s, lang) {
    const c = s.choices, ru = lang === 'ru', E = s.earlyCouncil;
    const why = E && (E.family === 'signal' ? (ru ? 'сообщения об источнике' : 'the report on the source') : (ru ? 'новых сведений о мирах' : 'new information on the worlds'));
    if (E && E.choice === 'turn') return ru ? `смену курса с ${nameAt(E.from, 'ru')} на ${nameAt(E.to, 'ru')} после ${why}` : `the course change from ${M.nameOf(E.from, 'en')} to ${M.nameOf(E.to, 'en')} after ${why}`;
    if (c['d.cloud'] === 'trust') return ru ? 'доверие модели у края облака и полтора года щита' : 'trusting the model at the cloud edge, and a year and a half of shield';
    if (c['d.cloud'] === 'manoeuvre') return ru ? 'манёвр у облака и то, чем за него заплатили' : 'the manoeuvre at the cloud and what it cost';
    if (c['d.scout'] === 'launch') return ru ? 'зонд, отправленный вперёд' : 'the probe sent ahead';
    if (c['d.scout'] === 'keep') return ru ? 'зонд, который не стали строить' : 'the probe that was not built';
    if (c['d.long']) return ru ? `вахту в ${ppl(s.watch)}` : `a watch of ${s.watch}`;
    if (E) return ru ? `решение держать курс после ${why}` : `the decision to hold the course after ${why}`;
    return ru ? 'курс, выбранный на Земле' : 'the course chosen on Earth';
  }
  // миссии: окно спасения и опоздание снабженца (M.COLONIES)
  const thaw = () => M.colony('thaw'), xyl = () => M.colony('xylona');
  const thawDeadline = () => thaw().capsuleYears - thaw().diedAgo;          // год после старта, до которого держат капсулы Оттепели
  // склад Оттепели по точному времени (годы от старта 41-й): 34 живых до 124,5; первая необратимая потеря — год 125;
  // к 140 — 12, к 150 — никого. Помощь останавливает деградацию, когда операция закончена.
  const THAW0 = 34, THAW_LOSS = 125;
  const thawLife = t => t <= 124.5 ? 34 : t <= 125 ? 34 - (t - 124.5) * 2 : t <= 140 ? 33 - 21 * (t - 125) / 15 : t <= 150 ? 12 - 1.2 * (t - 140) : 0;
  const thawN = t => Math.max(0, THAW0 - Math.floor(THAW0 - thawLife(t) + 1e-9));
  const lifeAt = v => v >= 33 ? 124.5 + (34 - v) / 2 : v >= 12 ? 125 + (33 - v) * 15 / 21 : 140 + (12 - v) / 1.2;
  const nextLoss = t => thawN(t) > 0 ? lifeAt(thawN(t) - 1) : null;                 // год ближайшей потери
  const arriveX = s => s.arriveExact == null ? s.arrive : s.arriveExact;
  const f2 = (x, lang) => (lang === 'ru' ? x.toFixed(2).replace('.', ',') : x.toFixed(2));
  const PREP = 8, SHELTER_R = 15, RESTORE = 10, MOVE = 2;
  const thawLag = s => Math.max(1, Math.round(M.star(s.target).d - M.distLy(Y(s, 0.5), s.beta, s.arrive, s.tMag, M.star(s.target).d)));
  const housedOf = s => crewOf(s) < M.CREW || !!s.rescueShelter;      // постоянные места: сектор или жилой модуль
  const opStart = s => rescueS(s) ? storeNow(s) : arriveX(s) + (s.rescueShelter ? 0.25 : 0);   // операция начинается после стройки модуля
  const opTime = (s, op) => op === 'wake' ? 1 / 12 : s.rescuePrep ? 1 / 12 : 0.25;
  const months = (t, lang) => { const m = Math.max(0, Math.round(t * 12)); return lang === 'ru' ? `${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}` : `${m} month${m === 1 ? '' : 's'}`; };

    return {
      names: {
        BOOK_KEYS, startBooks, book, routeCheck, track, navDeparture, sim, shieldGaugeV5, endHeadline, HEADLINE_NAME, incidentHeadline, PANEL_STATE,
        shieldInspect, gaugeDiff, stageYears, stagePass, reader, CHECK, burnDays, CHECK_PLUS, checkDays, STREAM, streamWide, STREAM_X, STREAM_RHO,
        STREAM_MAT5, STREAM_MEMO, streamTimes, streamWin, DARK, darkAt, discText, warnAt, streamAt, sosAtStream, days, coreLoss, win, streamPlan,
        streamDv, canEvade, streamLate, windowLine, streamCheckEffect, streamFoundRecord, probeOK, pctFrom, streamOptions, energyOK, riskLine, bad,
        livable, Y3, Y4, answerLag, Yepi, laserYear, OUTCOME, outcomeOf, laserLate, EPOCH3, epoch3, laserNews, skipTo, bulletinTitle, lastCall, thaw,
        xyl, thawDeadline, THAW0, THAW_LOSS, thawLife, thawN, lifeAt, nextLoss, arriveX, f2, PREP, SHELTER_R, RESTORE, MOVE, thawLag, housedOf,
        opStart, opTime, months
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = ledger;
  else (root.M31Core = root.M31Core || {}).ledger = ledger;
})(typeof globalThis !== 'undefined' ? globalThis : this);
