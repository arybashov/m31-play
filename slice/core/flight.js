// М31 · срез — полёт внутри системы цели: план партии, стык на 50 а.е., выход на орбиту планеты, даты прибытия. Часть
// content.js: объявленное здесь — в общем реестре частей; имена других частей приходят через __link (позднее связывание: после
// создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const flight = __core => {
    let M, f1, fuelSync, groupTrust, hidden, legAdd, legCut, nf, plural, repName, rescueS, wearNote, wearTerminal;
    const __link = () => { ({ M, f1, fuelSync, groupTrust, hidden, legAdd, legCut, nf, plural, repName, rescueS, wearNote, wearTerminal } = __core); };
    __link();

  // ---- полёт внутри системы (DOC «Полёт внутри системы v1 — проект», шаг 4). Контакт к цели с данными системы (systems.js)
  // от 50 а.е. летит по маршруту flight.js (таблица routes.js): участок тяги плана 'local.N' вместо остатка межзвёздного
  // торможения; выход на орбиту планеты — прибытие (сцены прибытия, «Где будет дом», акт IV, эпилог — от него).
  // Конец межзвёздного профиля (profileEnd) — прежняя дата: от неё скорость, путь, фазы полёта и двигательный участок.
  const FL = root.M31Flight || require('../flight.js'), MSYS = root.M31Systems || require('../systems.js'), ROUTES = root.M31Routes || require('../routes.js');
  // система цели с полётом внутри неё — для своей миссии (ε Индейца — контакт, звезда Барнарда — снабженец, Росс 128 — спасатель)
  const flightSys = s => { const sys = s.target ? MSYS.system(s.target) : null; return sys && sys.mission === s.mission ? sys : null; };
  const spiralSys = sys => !!(sys && sys.route && sys.route.kind === 'spiral');
  // цель в текстах вех и карточек: родительный падеж, «у …», «к …» (план встречи), прибытие (план встречи), сближение
  const FLIGHT_WHO = {
    'Epsilon Indi': { gen: ['планеты c', 'planet c'], she: true, at: ['у планеты', 'near the planet'], to: ['к планете c', 'toward planet c'], arr: ['Орбита планеты c', 'Orbit of planet c'] },
    'Ross 128': { gen: ['планеты b', 'planet b'], she: true, at: ['у планеты', 'near the planet'], to: ['к складу Оттепели у планеты b', 'toward the Thaw store at planet b'],
      arr: ['Орбита склада', 'The store orbit'], near: ['сближение и выход на орбиту склада', 'the approach and insertion into the store orbit'] },
    "Barnard's Star": { gen: ['форпоста', 'the outpost'], she: false, at: ['у форпоста', 'near the outpost'], to: ['к форпосту Ксилона Ир', 'toward the Xylona Ir outpost'],
      arr: ['Стоянка у форпоста', 'A berth by the outpost'], near: ['сближение и стоянка у форпоста', 'the approach and a berth by the outpost'] } };
  const flightWho = s => FLIGHT_WHO[s.target] || FLIGHT_WHO['Epsilon Indi'];
  // конец межзвёздного профиля: у спасателя — точная дата стыковки со складом (уточняется торможением у склада)
  const profileEnd = s => rescueS(s) && s.arriveExact != null ? s.arriveExact : s.arrive;
  // прибытие: у полёта внутри системы — выход на орбиту планеты (подтверждённый, до него — по плану), иначе — конец профиля
  const arriveView = s => s.flight ? (s.flight.orbitAt != null ? s.flight.orbitAt : s.flight.planetOrbitAt) : profileEnd(s);
  // прибытие для сцен: точная дата и год (сцены «через год», первое утро — от целого года)
  const arrivalAt = s => s.flight ? arriveView(s) : s.arrive;
  const arrivalYear = s => s.flight ? Math.round(arriveView(s)) : s.arrive;
  // таблица решена при тех же параметрах двигателя; v3 — два варианта плана встречи на год, захват и график расхода в строке
  const tableOk = T => !!T && T.v === 3 && !!T.engine && T.engine[0] === M.ENGINE && T.engine[1] === M.STOP && T.engine[2] === M.ENGINE_ACC && T.engine[3] === M.VE;
  const MEMO = new Map();
  // маршрут для конца профиля end и варианта плана встречи ('late' — позже, экономнее; 'early' — раньше): из таблицы (целый
  // год), иначе — построение (секунды; запоминается); null — маршрута (или раннего варианта) нет
  function routeFor(sys, end, variant = 'late') {
    const key = `${sys.id}|${end}|${variant}`; if (MEMO.has(key)) return MEMO.get(key);
    const e = FL.entryAt(M, sys, end, 50), T = tableOk(ROUTES) && ROUTES[sys.id], rows = T && !spiralSys(sys) && T.rows[end];
    let r;
    if (spiralSys(sys)) {   // красный карлик: строки участка S из таблицы (захват и график — оттуда же), окно и спираль — здесь
      const list = T && T.kind === 'spiral' ? T.rows.map(x => { const pairs = []; for (let i = 12; i + 1 < x.length; i += 2) pairs.push([x[i], x[i + 1]]);
        return { th: x[0], T: x[1], p: x[2], lam: x.slice(3, 9), dv: x[9], ratio: x[10], cap: x[11], pairs }; }) : FL.stageRows(M, sys);
      const both = FL.spiralRoutes(M, sys, e, list);
      for (const v of ['late', 'early']) { const x = both[v]; if (x && x.row.pairs) { x.captureAt = x.row.cap >= 0 ? e.t + x.row.cap : null; x.sched = FL.spiralSched(M, sys, x, x.row.pairs, 0.05); }
        MEMO.set(`${sys.id}|${end}|${v}`, x); }
      r = both[variant];
    } else if (rows) { const row = variant === 'early' ? rows[1] : rows[0];
      r = row ? FL.routeOf(M, sys, T.body, e, { T: row[0], p: row[1], lam: row.slice(2, 8), dv: row[15], ratio: row[17] },
        { T: row[8], p: 2, lam: row.slice(9, 15), dv: row[16], ratio: row[18] }, { ok: true, rminKm: row[19], rmaxKm: row[20] }) : null;
      if (r) { const sc = []; for (let i = 23; i + 1 < row.length; i += 2) sc.push([row[i], row[i + 1]]);   // захват и график — из таблицы
        r.captureAt = row[21] >= 0 ? e.t + row[21] : null; r.sched = { dv: row[22], pairs: sc }; } }
    else { const both = FL.planRoutes(M, sys, sys.target, e); MEMO.set(`${sys.id}|${end}|late`, both.late); MEMO.set(`${sys.id}|${end}|early`, both.early); r = both[variant]; }
    if (MEMO.size > 256) MEMO.clear();
    MEMO.set(key, r); return r;
  }
  // график расхода участка: пары [доля времени, доля Δv] — из таблицы (посчитан по выборке траектории заранее); вне таблицы —
  // по выборке здесь же (медленно). dv — интеграл тяги той же выборки: стык участков H и P на графике точный
  const SCHED_KMS = 0.01;
  function schedOf(sys, r) {
    const sc = r.sched || FL.schedPairs(FL.routeSamples(sys, r), r.entryAt, r.planetOrbitAt, r.rendezvousAt, SCHED_KMS);
    return { dv: sc.dv * FL.units.AUYR_KMS / FL.units.C_KMS, sched: sc.pairs };
  }
  // состояние маршрута на год t (а.е., а.е./год; система цели) — по выборке; null — вне маршрута
  function flightState(s, t) {
    const S = flightSamples(s); if (!S || !(t >= S[0].t) || t > S[S.length - 1].t) return null;
    let lo = 0, hi = S.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m].t <= t) lo = m; else hi = m; }
    const a = S[lo], b = S[hi], u = b.t > a.t ? (t - a.t) / (b.t - a.t) : 0;
    return a.y.map((x, i) => x + (b.y[i] - x) * u);
  }
  // корабль связан со звездой цели — захват уже произошёл (энергия на маршруте убывает: после захвата орбита остаётся замкнутой)
  const flightBound = (s, t) => !!(s.flight && s.flight.captureAt != null && t >= s.flight.captureAt - 1e-12);
  // план полёта партии: при утверждении паспорта и после поворота курса. Не начатый участок прежнего плана снимается; Δv
  // маршрута сразу входит в обязательный резерв (mustReq), межзвёздное торможение — только до входа на 50 а.е.
  function flightPlan(s) {
    const f = s.fuel, old = s.flight;
    const og = old && f && (f.plan || []).find(g => g.id === old.leg);
    if (og && og.state !== 'planned') return;                          // маршрут уже исполняется — план не меняется
    if (og) legCut(s, og.id, s.year);
    const sys = flightSys(s), want = old && old.variant || 'late', r0 = sys && f && s.arrive != null ? routeFor(sys, profileEnd(s), want) : null;
    const r = r0 || (sys && f && s.arrive != null && want !== 'late' ? routeFor(sys, profileEnd(s), 'late') : null);   // раннего варианта нет — поздний
    if (!r) { if (old) { delete s.flight; if (f) { delete f.brakeEnd; fuelSync(s); } } return; }
    const n = old ? old.n + 1 : 1, id = `local.${n}`, sc = schedOf(sys, r);   // Δv — интеграл тяги той же выборки, что график и 3D
    s.flight = { n, leg: id, body: r.body, end: profileEnd(s), variant: r0 ? want : 'late', entryAt: r.entryAt, captureAt: captureOf(sys, r), rendezvousAt: r.rendezvousAt,
      planetOrbitAt: r.planetOrbitAt, dv: sc.dv, marks: [] };
    if (r.kind === 'spiral') Object.assign(s.flight, { stageAt: r.stageAt, spiralAt: r.spiralAt });   // промежуточная орбита, окно
    f.brakeEnd = r.entryAt;
    legAdd(s, { id, t1: r.planetOrbitAt, dur: r.planetOrbitAt - r.entryAt, dv: sc.dv, sched: sc.sched });
  }
  // захват звездой: из таблицы; вне таблицы — первая точка выборки с отрицательной энергией относительно звезды
  const captureOf = (sys, r) => r.captureAt !== undefined ? r.captureAt : FL.captureT(sys, FL.routeSamples(sys, r));
  // варианты плана встречи: поздний и ранний (если есть) — даты, Δv (доли c), доля предела тяги
  function flightOptions(s) {
    const sys = s.flight && flightSys(s); if (!sys) return { late: null, early: null };
    const one = v => { const r = routeFor(sys, s.flight.end, v); return r && { variant: v, planetOrbitAt: r.planetOrbitAt, dv: r.dv, ratio: r.ratio }; };
    return { late: one('late'), early: one('early') };
  }
  // выбор плана встречи (решение «План встречи»): до входа на 50 а.е. маршрут ещё не исполняется — меняется целиком
  function flightChoose(s, variant) { if (!s.flight || s.flight.variant === variant) return; s.flight.variant = variant; flightPlan(s); }
  // вехи подхода (календарь, источник 'flight'): вход на 50 а.е., захват звездой, (у красных карликов — промежуточная орбита и
  // окно спуска), сближение с целью — строка журнала вахты
  const FLIGHT_MARKS = ['entry', 'capture', 'stage', 'spiral', 'nav', 'meet'];
  const markAt = (fl, m) => m === 'entry' ? fl.entryAt : m === 'capture' ? fl.captureAt : m === 'stage' ? (fl.stageAt ?? null) : m === 'spiral' ? (fl.spiralAt ?? null)
    : m === 'nav' ? (navAt(fl) > fl.entryAt ? navAt(fl) : null) : fl.rendezvousAt;
  function flightMarkNext(s, t1) {
    const fl = s.flight; if (!fl || fl.failedAt != null) return null;
    let nx = null; for (const m of FLIGHT_MARKS) { const at = markAt(fl, m); if (at != null && !(fl.marks || []).includes(m) && at <= t1 && (!nx || at < nx.at)) nx = { m, at }; }
    return nx;
  }
  function flightMark(s, m) {
    const fl = s.flight; (fl.marks = fl.marks || []).push(m);
    // отклонение — решение совета; коррекция дольше оборота цели (у красных карликов — ~10 суток) — выбора нет: ожидание сразу
    if (m === 'nav') { const d = navRoll(s), at = navAt(fl), refuse = groupTrust(s, 'engine') === 0;   // ядро Б: смены двигателя без доверия — без коррекции на пределе
      if (d && !refuse && navFix(s, at, d.km)) return { kind: 'wear', type: 'nav', at, km: d.km, ahead: d.ahead };
      if (d) { navHold(s, at); if (s.wear) { const W = flightWho(s), P = Math.round(fl.hold.dur * 365.25), tk = Math.round(d.km / 1000);
        wearNote(s, `Навигация уточнила орбиту ${W.gen[0]}: ${W.she ? 'она' : 'он'} на ${tk} тыс. км ${d.ahead ? 'впереди' : 'позади'} расчёта. ${refuse ? `${repName('engine', 'ru')}: смены двигателя на коррекцию на пределе не идут — Совету не доверяют;` : 'Сдвиг займёт дольше оборота цели —'} корабль ждёт следующего окна ${W.at[0]}: ${navDays(P, 'ru')}.`,
          `Navigation has refined the orbit of ${W.gen[1]}: it is ${tk} thousand km ${d.ahead ? 'ahead of' : 'behind'} the computed place. ${refuse ? `${repName('engine', 'en')}: the engine shifts will not run a correction at the limit — they do not trust the Council;` : 'A shift would take longer than one revolution of the target —'} the ship waits for the next window ${W.at[1]}: ${navDays(P, 'en')}.`); }
        return null; } }
    if (!s.wear) return null;                                            // журнал вахты — у модели износа
    const kms = x => Math.round(x * FL.units.C_KMS), days = Math.round((fl.planetOrbitAt - fl.entryAt) * 365.25), W = flightWho(s), dd = (t0, t1, l) => navDays(Math.round((t1 - t0) * 365.25), l);
    if (fl.stageAt != null && m === 'entry') wearNote(s, `50 а.е. от звезды: межзвёздное торможение кончено; до промежуточной орбиты 0,1 а.е. — ${dd(fl.entryAt, fl.stageAt, 'ru')} тяги, до цели — ${days} суток, Δv ${kms(fl.dv)} км/с.`,
      `50 AU from the star: interstellar braking is over; ${dd(fl.entryAt, fl.stageAt, 'en')} of thrust to the 0.1 AU staging orbit, ${days} days to the target, Δv ${kms(fl.dv)} km/s.`);
    else if (m === 'stage') wearNote(s, fl.spiralAt - fl.stageAt > 0.5 / 365.25 ? `Промежуточная орбита 0,1 а.е.: двигатель стоит. Окно спуска к цели — через ${dd(fl.stageAt, fl.spiralAt, 'ru')}.` : 'Промежуточная орбита 0,1 а.е.: окно спуска к цели — сразу.',
      fl.spiralAt - fl.stageAt > 0.5 / 365.25 ? `The 0.1 AU staging orbit: the engine is off. The window for the descent to the target is in ${dd(fl.stageAt, fl.spiralAt, 'en')}.` : 'The 0.1 AU staging orbit: the descent window is open at once.');
    else if (m === 'spiral') wearNote(s, `Окно: спуск по спирали к орбите цели — ${dd(fl.spiralAt, fl.rendezvousAt, 'ru')} тяги.`, `The window: a spiral descent to the target's orbit — ${dd(fl.spiralAt, fl.rendezvousAt, 'en')} of thrust.`);
    else if (m === 'entry') wearNote(s, `50 а.е. от звезды: межзвёздное торможение кончено, корабль идёт к планете ${fl.body} — ${days} суток тяги, Δv ${kms(fl.dv)} км/с.`,
      `50 AU from the star: interstellar braking is over; the ship heads for planet ${fl.body} — ${days} days of thrust, Δv ${kms(fl.dv)} km/s.`);
    else if (m === 'capture') wearNote(s, 'Звезда захватила корабль: орбита вокруг неё уже замкнута, тяга ведёт к планете.', 'The star has captured the ship: the orbit around it is already closed, and the thrust leads to the planet.');
    else if (m === 'nav') wearNote(s, `Навигация уточнила орбиту ${W.gen[0]}: отклонение в пределах допуска, встреча — по плану.`, `Navigation has refined the orbit of ${W.gen[1]}: the offset is within tolerance, the rendezvous goes as planned.`);
    else if (fl.hold && fl.hold.kind === 'corr') wearNote(s, `Коррекция окна идёт: встреча — через ${navDays(Math.round(fl.hold.dur * 365.25), 'ru')}.`,
      `The window correction is under way: the rendezvous is in ${navDays(Math.round(fl.hold.dur * 365.25), 'en')}.`);
    else if (fl.hold) wearNote(s, `Сближение отложено: корабль держится ${W.at[0]} на орбите ожидания — следующее окно через ${navDays(Math.round(fl.hold.dur * 365.25), 'ru')}.`,
      `The rendezvous is postponed: the ship holds ${W.at[1]} in a waiting orbit — the next window is in ${navDays(Math.round(fl.hold.dur * 365.25), 'en')}.`);
    else if (W.near) { const k = Math.round(MSYS.system(s.target).route.backKm / 1000);
      wearNote(s, `Спуск кончен: цель — в ${k} тыс. км впереди; ${W.near[0]} — ${dd(fl.rendezvousAt, fl.planetOrbitAt, 'ru')}.`, `The descent is over: the target is ${k} thousand km ahead; ${W.near[1]} — ${dd(fl.rendezvousAt, fl.planetOrbitAt, 'en')}.`); }
    else wearNote(s, `Планета ${fl.body} — в 600 тыс. км, догон 1 км/с: начат выход на её орбиту.`, `Planet ${fl.body} is 600 thousand km away, closing at 1 km/s: the insertion into its orbit has begun.`);
  }
  // конец маршрута (календарь, источник 'flight'): участок исполнен без недожога — корабль на орбите планеты; иначе встречи нет
  function flightArrive(s, at) {
    const fl = s.flight, ids = fl && (fl.legs || [fl.leg]), plan = (s.fuel && s.fuel.plan) || [], log = (s.fuel && s.fuel.log) || [];
    const ok = ids && ids.every(id => { const g = plan.find(x => x.id === id), e = log.find(x => x.leg === id); return g && (g.state === 'cut' || (g.state === 'done' && !(e && e.short > 0))); })
      && ids.some(id => (plan.find(x => x.id === id) || {}).state === 'done');
    if (ok) { fl.orbitAt = at; return; }
    fl.failedAt = at; wearTerminal(s, at, 'braking');
  }
  // ---- отклонение навигации (шаг 5, часть 4). За NAV.lead суток до сближения навигация уточняет орбиту планеты: с вероятностью
  // NAV.p планета на δ в стороне от расчёта (скрытый бросок). Коррекция окна — сдвиг на δ (разгон и торможение пополам) в запасе
  // тяги сверх маршрута (маршрут идёт на долю ratio предела F/m): за оставшиеся τ нужно ускорение 4δ/τ², Δv 4δ/τ — встреча в срок;
  // не укладывается — сдвиг на пределе запаса, встреча позже на дни–недели. Орбита ожидания: корабль держится у планеты один её
  // оборот (окно повторяется: орбита круговая), удержание — NAV.hold км/с; затем тот же захват
  const NAV = { p: 0.3, lead: 10, dmin: 3e5, dmax: 3e6, hold: 0.5 };   // сутки; км; км; км/с
  function navRoll(s) {
    const u = hidden(s, 'flight.nav'), v = hidden(s, 'flight.nav.d'), w = hidden(s, 'flight.nav.sign');
    return u != null && u < NAV.p ? { km: NAV.dmin + (NAV.dmax - NAV.dmin) * (v ?? 0.5), ahead: (w ?? 0.5) < 0.5 } : null;
  }
  // коррекция к дате at: Δv (км/с) и опоздание встречи slip (годы). В срок τ — ускорение 4δ/τ²; сверх запаса тяги a — сдвиг на
  // пределе запаса за τ' = 2√(δ/a), Δv = a·τ', встреча позже на τ' − τ. null — запаса нет или опоздание не меньше оборота планеты
  function navFix(s, at, km) {
    const fl = s.flight, tau = (fl.rendezvousAt - at) * FL.units.YEAR_S, r = flightRoute(s); if (!(tau > 0) || !r) return null;
    const VE = M.VE * FL.units.C_KMS, lim = M.ENGINE_ACC * Math.exp((M.STOP * FL.units.C_KMS - FL.norm(r.entry.v) * FL.units.AUYR_KMS + fl.dv * FL.units.C_KMS) / VE);   // предел F/m к концу маршрута, м/с²
    const a = 4 * km * 1000 / (tau * tau), margin = (1 - r.ratio) * lim; if (!(margin > 0)) return null;
    if (a <= margin) return { dv: 4 * km / tau, slip: 0, margin };
    const t2 = 2 * Math.sqrt(km * 1000 / margin), slip = (t2 - tau) / FL.units.YEAR_S;
    return slip < O_PERIOD(flightSys(s), fl.body) ? { dv: margin * t2 / 1000, slip, margin } : null;
  }
  const navAt = fl => fl.rendezvousAt - NAV.lead / 365.25;
  // встреча позже на dur (орбита ожидания — оборот планеты; коррекция с опозданием): участок маршрута снимается на дате at; до
  // сближения — его остаток, у планеты — свой участок extra (удержание или коррекция), захват — на dur позже (графики — из графика
  // маршрута). В 3D корабль у планеты, пока идёт dur, захват повёрнут вместе с ней
  function navShift(s, at, dur, extra, kind) {
    const fl = s.flight, f = s.fuel, g = f.plan.find(x => x.id === fl.leg);
    const x0 = (at - (g.t1 - g.dur)) / g.dur, xh = (fl.rendezvousAt - (g.t1 - g.dur)) / g.dur, part = (a, b) => {
      const pts = g.sched.filter(p => p[0] > a + 1e-12 && p[0] < b - 1e-12), fa = schedAt(g.sched, a), fb = schedAt(g.sched, b);
      return { dvf: fb - fa, sched: [[0, 0]].concat(pts.map(p => [(p[0] - a) / (b - a), (p[1] - fa) / (fb - fa)]), [[1, 1]]) }; };
    const h = part(x0, xh), c = part(xh, 1), n = fl.n;
    legCut(s, g.id, at);
    legAdd(s, { id: `local.${n}.h`, t1: fl.rendezvousAt, dur: fl.rendezvousAt - at, dv: g.dv * h.dvf, sched: h.sched });
    legAdd(s, Object.assign({ t1: fl.rendezvousAt + dur }, extra));
    legAdd(s, { id: `local.${n}.p`, t1: fl.planetOrbitAt + dur, dur: fl.planetOrbitAt - fl.rendezvousAt, dv: g.dv * c.dvf, sched: c.sched });
    fl.legs = [g.id, `local.${n}.h`, extra.id, `local.${n}.p`]; fl.hold = { at: fl.rendezvousAt, dur, kind }; fl.planetOrbitAt += dur;
  }
  function navHold(s, at) { const fl = s.flight, P = O_PERIOD(flightSys(s), fl.body); navShift(s, at, P, { id: `hold.${fl.n}`, dur: P, dv: NAV.hold / FL.units.C_KMS }, 'wait'); }
  // коррекция: в срок — участок коррекции рядом с маршрутом; с опозданием — сдвиг встречи на slip
  function navCorrect(s, at, fix) {
    const fl = s.flight, dv = fix.dv / FL.units.C_KMS; fl.navFix = +fix.dv.toFixed(2);
    if (fix.slip > 0) return navShift(s, at, fix.slip, { id: `corr.${fl.n}`, dur: fl.rendezvousAt + fix.slip - at, dv }, 'corr');
    legAdd(s, { id: `corr.${fl.n}`, t1: fl.rendezvousAt, dur: fl.rendezvousAt - at, dv }); fl.legs = [fl.leg, `corr.${fl.n}`];
  }
  const navDays = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  const O_PERIOD = (sys, id) => 2 * Math.PI / Math.sqrt(sys.bodies[id].mu / Math.pow(sys.bodies[id].a, 3));
  // доля Δv по графику на доле времени x (как legSched, без dv)
  function schedAt(P, x) { let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= x) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], u = b[0] > a[0] ? Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0]))) : 1; return a[1] + (b[1] - a[1]) * u; }
  function flightNavDecision(s, ev) {
    const fl = s.flight, fix = navFix(s, ev.at, ev.km), P = Math.round(O_PERIOD(flightSys(s), fl.body) * 365.25), kms = x => nf(x, 1, 'ru'), kmsE = x => nf(x, 1, 'en');
    const where = { ru: ev.ahead ? 'впереди' : 'позади', en: ev.ahead ? 'ahead of' : 'behind' }, tk = Math.round(ev.km / 1000), W = flightWho(s);
    const late = fix && fix.slip > 0 ? Math.ceil(fix.slip * 365.25) : 0, left = (y, lang) => f1(Math.max(0, y.reserve - 100 * fix.dv / FL.units.C_KMS / y.reserveDv), lang);
    const opts = [];
    if (fix) opts.push({ id: 'correct', label: { ru: 'Коррекция окна', en: 'Correct the window' },
      known: { ru: y => [`Δv коррекции — ${kms(fix.dv)} км/с; резерв манёвров после — ${left(y, 'ru')}%.`, late ? `Встреча — на ${navDays(late, 'ru')} позже: двигатель на пределе запаса тяги.` : 'Дата встречи прежняя; двигатель — ближе к пределу.'],
        en: y => [`Correction Δv — ${kmsE(fix.dv)} km/s; manoeuvre reserve after — ${left(y, 'en')}%.`, late ? `The rendezvous is ${navDays(late, 'en')} later: the engine at the limit of its thrust margin.` : 'The rendezvous date stays; the engine runs closer to its limit.'] },
      effect: y => navCorrect(y, y.year, fix),
      record: late ? { ru: `Навигаторы закладывают коррекцию: встреча — на ${navDays(late, 'ru')} позже.`, en: `The navigators load a correction: the rendezvous is ${navDays(late, 'en')} later.` }
        : { ru: 'Навигаторы закладывают коррекцию: встреча — в прежний день.', en: 'The navigators load a correction: the rendezvous stays on the same day.' } });
    opts.push({ id: 'wait', label: { ru: 'Орбита ожидания', en: 'A waiting orbit' },
      known: { ru: y => [`Корабль держится ${W.at[0]} ${navDays(P, 'ru')} — до следующего окна; удержание — ${kms(NAV.hold)} км/с.`, `Ещё ${navDays(P, 'ru')} вахты: износ и регламент идут.`],
        en: y => [`The ship holds ${W.at[1]} for ${navDays(P, 'en')} — until the next window; station-keeping — ${kmsE(NAV.hold)} km/s.`, `${navDays(P, 'en')} more of watch: wear and maintenance go on.`] },
      effect: y => navHold(y, y.year),
      record: { ru: `Совет выбирает орбиту ожидания: встреча — через ${P} суток.`, en: `The council chooses a waiting orbit: the rendezvous is ${P} days later.` } });
    return {
      id: 'd.flight.nav', scene: 'arrival', kind: 'decision',
      title: { ru: 'Отклонение навигации', en: 'A navigation offset' },
      rec: y => fix && y.reserve - 100 * fix.dv / FL.units.C_KMS / y.reserveDv >= 10 ? { id: 'correct', why: { ru: `коррекция стоит ${kms(fix.dv)} км/с${late ? ` и ${navDays(late, 'ru')}` : ''}, ожидание — ${navDays(P, 'ru')} вахты`, en: `a correction costs ${kmsE(fix.dv)} km/s${late ? ` and ${navDays(late, 'en')}` : ''}, waiting — ${navDays(P, 'en')} of watch` } }
        : { id: 'wait', why: { ru: fix ? 'резерва на коррекцию почти нет' : 'тяги на коррекцию не хватит', en: fix ? 'there is almost no reserve for a correction' : 'there is not enough thrust for a correction' } },
      context: {
        ru: y => `Навигация уточнила орбиту ${W.gen[0]}: ${W.she ? 'она' : 'он'} на ${tk} тыс. км ${where.ru} расчёта. До сближения — ${NAV.lead} суток.${late ? ' За это время двигатель встречу не сдвинет — только с опозданием.' : ''}`,
        en: y => `Navigation has refined the orbit of ${W.gen[1]}: it is ${tk} thousand km ${where.en} the computed place. ${NAV.lead} days to the rendezvous.${late ? ' The engine cannot shift the rendezvous in that time — only with a delay.' : ''}`
      },
      options: opts
    };
  }
  // маршрут для показа (3D): данные и выборка состояний; null — у партии нет полёта внутри системы
  function flightRoute(s) { const sys = s.flight && flightSys(s); return sys ? routeFor(sys, s.flight.end, s.flight.variant || 'late') : null; }
  function flightSamples(s) { const r = flightRoute(s); return r ? FL.routeSamples(flightSys(s), r) : null; }   // выбранный вариант плана встречи

    return {
      names: {
        FL, MSYS, ROUTES, flightSys, spiralSys, FLIGHT_WHO, flightWho, profileEnd, arriveView, arrivalAt, arrivalYear, tableOk, MEMO, routeFor,
        SCHED_KMS, schedOf, flightState, flightBound, flightPlan, captureOf, flightOptions, flightChoose, FLIGHT_MARKS, markAt, flightMarkNext,
        flightMark, flightArrive, NAV, navRoll, navFix, navAt, navShift, navHold, navCorrect, navDays, O_PERIOD, schedAt, flightNavDecision,
        flightRoute, flightSamples
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = flight;
  else (root.M31Core = root.M31Core || {}).flight = flight;
})(typeof globalThis !== 'undefined' ? globalThis : this);
