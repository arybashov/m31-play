// М31 · срез — основа: зависимости, числа и слова, архив колоний и следов, паспорт. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const base = __core => {
    let flightPlan, ownStory, profileEnd, stageYears;
    const __link = () => { ({ flightPlan, ownStory, profileEnd, stageYears } = __core); };
    __link();

  'use strict';

  const pct = (x, lang) => (lang === 'ru' ? x.toFixed(1).replace('.', ',') : x.toFixed(1));
  // материалы: целые — без десятых, дробные (ремонты и вторсырьё событий) — с десятыми
  const pctM = (x, lang) => Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : pct(x, lang);

  // Миссия: цель, паспорт, поворот курса — расчёты в mission.js (браузер: M31Mission).
  const M = root.M31Mission || require('../mission.js');
  // Щит как прибор (симулятор): shield.js (браузер: M31Shield).
  const SH = root.M31Shield || require('../shield.js');
  // События v1 (DOC «События v1»): генератор эпизодов дрейфа — events.js (браузер: M31Events)
  const EVM = root.M31Events || require('../events.js');
  // Износ корабля (DOC «Долгий рейс — износ и смена курса», шаг 2): граф узлов, отказы, буферы групп — wear.js (браузер: M31Wear)
  const W = root.M31Wear || require('../wear.js');
  // Единая очередь работ (шаг 3a): люди делятся между ремонтами износа и работами событий — jobs.js (браузер: M31Jobs)
  const JB = root.M31Jobs || require('../jobs.js');
  const R = root.M31Requests || require('../requests.js'), RQ = R;   // RQ — там, где R занято локально (досье: признаки маршрута)
  const nm = (s, lang) => M.nameOf(s.target || M.DECLARED, lang);
  // «звезда Барнарда» склоняется: у звезды, к звезде; остальные названия каталога — нет
  const nmG = s => nm(s, 'ru').replace(/^звезда /, 'звезды '), nmD = s => nm(s, 'ru').replace(/^звезда /, 'звезде ');
  const f1 = (x, lang) => (lang === 'ru' ? String(Math.round(x * 10) / 10).replace('.', ',') : String(Math.round(x * 10) / 10));
  const fb = (b, lang) => (lang === 'ru' ? b.toFixed(3).replace('.', ',') : b.toFixed(3)) + 'c';
  function plural(n, forms) {
    const a = Math.abs(Math.round(n)) % 100, b = a % 10;
    return forms[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
  }
  const yrs = n => `${Math.round(n)} ${plural(n, ['год', 'года', 'лет'])}`;
  const yrsG = n => `${Math.round(n)} ${plural(n, ['года', 'лет', 'лет'])}`;   // после «около»
  const yrsEn = n => `${Math.round(n)} year${Math.round(n) === 1 ? '' : 's'}`;
  const ppl = n => `${n} ${plural(n, ['человек', 'человека', 'человек'])}`;
  // трата резерва манёвров в км/с → % паспортного резерва (reserveDv — доля c)
  const dvPct = (s, kms) => kms / (s.reserveDv * 299792.458) * 100;
  const DV = { probe: 120, stream: 250, streamWeak: 900 };   // км/с
  // ---- топливо по бакам (шаг «хрупкость» 4а; спецификация Codex — «Ревью Codex — хрупкость корабля и регламент», шаг 4).
  // Четыре тормозных бака T1–T4 по четверти F0 = M.stage(P, STOP + reserveDv); сухая масса D = P + K·F0 (с конструкцией баков)
  // не уменьшается. Доступное Δv — VE·ln((D + Fп + Fи)/(D + Fи)): подключённые баки — топливо, изолированные — балласт.
  // При постоянном VE Δv аддитивна: манёвр dv уменьшает доступное ровно на dv, поэтому резерв в % паспортного (s.reserve)
  // ведётся прежними вычитаниями, а масса — параллельно, по формуле ракеты (fuelSpent = m·(1 − e^(−dv/VE))). Расходятся они
  // только при потере топлива и изоляции баков (4в) — тогда резерв пересчитывается из массы (fuelSync).
  // Двигательное торможение STOP → 0 — последние M.ENGINE лет до s.arrive, топливо расходуется по времени (fuelBurn).
  const TANKS = ['T1', 'T2', 'T3', 'T4'];
  function fuelInit(s) {
    const P = M.CORE + cargoOf(s.kits, s.eq), F0 = M.stage(P, M.STOP + s.reserveDv);
    s.fuel = { D: P + M.K * F0, burned: 0, tanks: {}, log: [], plan: [] };
    for (const id of TANKS) s.fuel.tanks[id] = { fuel0: F0 / 4, fuel: F0 / 4, feed: 'connected' };
  }
  const fuelOn = (s, f) => Object.values(s.fuel.tanks).filter(x => (x.feed === 'connected') === f).reduce((a, x) => a + x.fuel, 0);
  const dvLeft = s => { const Fi = fuelOn(s, false); return M.VE * Math.log1p(fuelOn(s, true) / (s.fuel.D + Fi)); };
  const fuelMass = s => s.fuel.D + Object.values(s.fuel.tanks).reduce((a, x) => a + x.fuel, 0);   // масса корабля с топливом, тыс. т
  // оставшееся двигательное торможение принятого графика: STOP до его начала, линейно до нуля к фактическому прибытию
  // (у спасателя — точная дата стыковки arriveExact, она уточняется торможением у склада)
  const brakeLeft = (s, t) => M.STOP * Math.max(0, Math.min(1, (profileEnd(s) - t) / M.ENGINE));
  // ---- полёт (проект «Полёт внутри системы v1», шаг 3): обязательные операции и журнал исполненных манёвров.
  // Обязательные операции — участки тяги с постоянным ускорением (Δv линейно по времени): двигательное торможение межзвёздного
  // профиля ('brake': даты — от конца профиля, исполнено — s.fuel.burned; s.fuel.brakeEnd — плановый конец: дальше маршрут внутри
  // системы, шаг 4; с даты s.fuel.brakeCut участок закрыт — остаток передан плану)
  // и участки плана s.fuel.plan { id, t1, dur, dv, done, upto, state: planned → burning → done | cut } — маршрут внутри системы
  // (шаг 4). Резерв манёвров — доступное Δv сверх неисполненного по действующим участкам (mustReq); недостаток — short.
  // Журнал s.fuel.log: { n, leg, at, end, dv, dm, m0, m1, cause } — dv (доли c) и dm (тыс. т) — исполненное именно этой
  // операцией, m0/m1 — масса корабля до и после (между ними у участка тяги — течи, другие манёвры). Сюжетный манёвр ('man')
  // и пополнение ('refuel': dv и dm отрицательны — учёт, не импульс) — запись без длительности, причину ставит журнал запасов
  // (book) после решения или границы; участок тяги — одна запись на участок. Сходится с баками: Σ fuel0 − Σ fuel − Σ lost = Σ dm
  const legLive = g => g.state === 'planned' || g.state === 'burning';
  function mustReq(s) {
    if (!s.fuel) return M.STOP;
    const f = s.fuel, e = f.brakeEnd;
    let r = f.brakeCut != null ? 0 : e == null ? M.STOP - f.burned : Math.max(0, M.STOP - brakeLeft(s, e) - f.burned);   // ещё не сожжённое Δv торможения
    for (const g of s.fuel.plan || []) if (legLive(g)) r += g.dv - g.done;
    return r;
  }
  // запись журнала: участок тяги — одна на участок (накапливается), сюжетный манёвр и пополнение — каждая своя
  function fuelLog(s, leg, at, end, dv, dm, m0) {
    const L = s.fuel.log || (s.fuel.log = []), m1 = fuelMass(s), one = leg !== 'man' && leg !== 'refuel';
    const e = one ? L.find(x => x.leg === leg) : null;
    if (e) { e.end = Math.max(e.end, end); e.dv += dv; e.dm += dm; e.m1 = m1; return e; }
    const x = { n: L.length + 1, leg, at, end, dv, dm, m0, m1, cause: one ? leg : null }; L.push(x); return x;
  }
  // расход dv из подключённых баков пропорционально содержимому: [фактически израсходованное Δv (нехватка — меньше), масса]
  function fuelDraw(s, dv) {
    if (!s.fuel || !(dv > 0)) return [0, 0];
    const Fc = fuelOn(s, true); if (!(Fc > 0)) return [0, 0];
    const m = s.fuel.D + Fc + fuelOn(s, false), use = Math.min(dv, dvLeft(s)), spent = Math.min(Fc, -m * Math.expm1(-use / M.VE));
    for (const x of Object.values(s.fuel.tanks)) if (x.feed === 'connected') x.fuel -= spent * x.fuel / Fc;
    return [use, spent];
  }
  const fuelSpendDv = (s, dv) => fuelDraw(s, dv)[0];
  // списание с записью в журнал манёвров (leg, даты исполнения — явно: внутри перемотки год партии не равен времени тяги)
  function fuelSpend(s, dv, leg, at, end) {
    if (!s.fuel) return 0;
    const m0 = fuelMass(s), [use, spent] = fuelDraw(s, dv);
    if (use > 0) fuelLog(s, leg, at, end, use, spent, m0);
    return use;
  }
  // пополнение: масса топлива, дающая ещё dv (в подключённые баки поровну); вернуть добавленную массу
  function fuelAddDv(s, dv) {
    if (!s.fuel || !(dv > 0)) return 0;
    const on = Object.values(s.fuel.tanks).filter(x => x.feed === 'connected'); if (!on.length) return 0;
    const add = (s.fuel.D + fuelOn(s, true) + fuelOn(s, false)) * Math.expm1(dv / M.VE);
    for (const x of on) x.fuel += add / on.length;
    return add;
  }
  // манёвр в % паспортного резерва: прежнее вычитание и та же Δv из баков; в журнал — сюжетный манёвр или пополнение
  const spendPct = (s, pct) => { s.reserve -= pct; if (s.fuel) fuelSpend(s, pct / 100 * s.reserveDv, 'man', s.year, s.year); };
  const addPct = (s, pct) => { s.reserve += pct; if (!s.fuel) return; const m0 = fuelMass(s), dv = pct / 100 * s.reserveDv, add = fuelAddDv(s, dv);
    if (add > 0) fuelLog(s, 'refuel', s.year, s.year, -dv, -add, m0); };
  // двигательное торможение к дате t1 (календарь модели): сожжено должно быть STOP − остаток графика; учёт — по сожжённому,
  // поэтому повторный отрезок и сдвиг даты прибытия не списывают дважды и не пропускают (недожог догоняется — прежнее правило
  // межзвёздного торможения). Остаток передан плану (brakeCut) — межзвёздный участок больше не списывается. Участки плана — legBurn
  function fuelBurn(s, t0, t1) {
    if (!s.fuel || s.arrive == null) return;
    const f = s.fuel, e = f.brakeEnd, te = e != null ? Math.min(t1, e) : t1, A = profileEnd(s);
    const dv = f.brakeCut == null && !(e != null && t0 >= e) ? M.STOP - brakeLeft(s, te) - f.burned : 0;
    if (dv > 1e-15) { f.burned += fuelSpend(s, dv, 'brake', Math.max(t0, A - M.ENGINE), Math.min(te, A)); fuelSync(s); }   // нехватка — сожжено меньше графика (short)
    if (e != null && t1 >= e && f.brakeCut == null) { f.brakeCut = e; const x = (f.log || []).find(y => y.leg === 'brake'); if (x) x.closed = e; }   // плановый конец пройден
    if (f.plan) for (const g of f.plan) legBurn(s, g, t0, t1);
  }
  // участок плана: исполнено по графику к дате t — линейно от начала t1 − dur до конца t1 или по графику g.sched (пары [доля
  // времени, доля dv] от [0, 0] до [1, 1]: тяга участка маршрута меняется во времени), между точками — линейно
  function legSched(g, t) {
    const x = Math.max(0, Math.min(1, (t - (g.t1 - g.dur)) / g.dur)), P = g.sched;
    if (!P) return g.dv * x;
    let lo = 0, hi = P.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (P[m][0] <= x) lo = m; else hi = m; }
    const a = P[lo], b = P[hi], u = b[0] > a[0] ? Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0]))) : 1;
    return g.dv * (a[1] + (b[1] - a[1]) * u);
  }
  // списание участка на отрезке — только приращение его графика с прошлого учёта (upto): пропущенное из-за нехватки топлива
  // (перекрытые баки) не догоняется сверх предела ускорения — остаётся недожогом до перепланирования; отложенный учёт (течь
  // вместе с тягой — по точкам сетки) догоняется; повтор уже пройденного отрезка ничего не списывает
  function legBurn(s, g, t0, t1) {
    if (!legLive(g)) return;
    const a = g.upto != null ? g.upto : t0;
    if (!(t1 > a)) return;
    const due = legSched(g, t1) - legSched(g, a); g.upto = t1;
    if (due > 1e-15) { g.state = 'burning'; g.done += fuelSpend(s, due, g.id, Math.max(a, g.t1 - g.dur), Math.min(t1, g.t1)); fuelSync(s); }
  }
  // участок в план (шаг 4: маршрут внутри системы): { id, t1, dur, dv }; резерв сразу учитывает обязательство. id — один на
  // экспедицию (новый план — новые id: журнал и границы находят участок по нему)
  function legAdd(s, g) {
    s.fuel.plan = s.fuel.plan || [];
    if (s.fuel.plan.some(x => x.id === g.id) || g.id === 'brake' || g.id === 'man' || g.id === 'refuel') throw new Error(`участок плана ${g.id}: такой id уже есть`);
    s.fuel.plan.push(Object.assign({ done: 0, upto: null, state: 'planned' }, g)); fuelSync(s);
  }
  // снять участок (смена плана) на дате модели at: исполненное остаётся в журнале, неисполненное больше не требуется. 'brake' —
  // остаток межзвёздного торможения передан локальному плану (списано по графику до at — перемотка уже прошла)
  function legCut(s, id, at) {
    const f = s.fuel; if (!f) return;
    if (id === 'brake') { if (f.brakeCut != null) return; f.brakeCut = at; }   // уже передан — дата прежняя
    else { const g = (f.plan || []).find(x => x.id === id); if (!g || !legLive(g)) return; g.state = 'cut'; g.end = at; }
    const e = (f.log || []).find(x => x.leg === id); if (e) e.closed = at;
    fuelSync(s);
  }
  // границы календаря (источник 'legs'): начало и конец действующих участков плана до t1; ближайшая — первой. Необработанная
  // граница в прошлом (календарь выбрал другой источник на равной с допуском дате и прошёл её) — сразу, на t0
  function legNext(s, t0, t1) {
    let nx = null;
    for (const g of (s.fuel && s.fuel.plan) || []) {
      if (!legLive(g)) continue;
      const a = g.t1 - g.dur, d = g.state === 'planned' && a < g.t1 && a <= t1 ? a : g.t1 <= t1 ? g.t1 : null;
      const at = d == null ? null : Math.max(t0, d);
      if (at != null && (!nx || at < nx.at)) nx = { at, id: g.id };
    }
    return nx;
  }
  // граница участка: начало — открыть запись журнала (тяга идёт), конец — закрыть фактическим исполнением (недожог остаётся
  // недожогом: dv − done). Списание отрезка до границы уже прошло (fuelSpan раньше go). Повтор той же даты ничего не меняет
  function legMark(s, id, at) {
    const g = (s.fuel.plan || []).find(x => x.id === id); if (!g || !legLive(g)) return;
    const e0 = (s.fuel.log || []).find(x => x.leg === id);
    if (at < g.t1) { if (g.state === 'planned') { g.state = 'burning'; if (!e0) fuelLog(s, id, at, at, 0, 0, fuelMass(s)); } return; }
    g.state = 'done'; g.end = g.t1;                                     // график участка кончился в t1 (граница могла прийти позже)
    const e = e0 || fuelLog(s, id, g.t1, g.t1, 0, 0, fuelMass(s)); e.closed = g.t1; e.short = g.dv - g.done > 1e-9 * g.dv ? g.dv - g.done : 0;   // остаток округления графика — не недожог
    fuelSync(s);
  }
  // резерв из массы (4в): когда течь, изоляция или потеря бака развели проценты и массу. Недостаток обязательных операций — short
  function fuelSync(s) {
    if (!s.fuel) return;
    const dv = dvLeft(s);
    s.reserve = Math.max(0, 100 * (dv - mustReq(s)) / s.reserveDv);
    s.fuel.short = Math.max(0, mustReq(s) - dv);
  }
  // отрезок перемотки: течь и тяга (двигательное торможение, участки плана). Если идут оба — по абсолютной суточной сетке (оба
  // меняют содержимое баков: порядок и нарезка не должны влиять на итог больше, чем на долю суток); иначе — одним шагом.
  // Вернуть: была ли течь
  const brakeBurning = (s, t0, t1) => !!(s.fuel && s.arrive != null && s.fuel.brakeCut == null && !(s.fuel.brakeEnd != null && t0 >= s.fuel.brakeEnd) && brakeLeft(s, t0) > brakeLeft(s, t1) + 1e-15);
  const legsBurning = (s, t0, t1) => !!(s.fuel && s.fuel.plan && s.fuel.plan.some(g => legLive(g) && legSched(g, t1) > legSched(g, t0) + 1e-15));
  // двигатель работает в сутки после t (межзвёздное торможение или участок плана)
  const fuelBusy = (s, t) => brakeBurning(s, t, t + 1 / 365.25) || legsBurning(s, t, t + 1 / 365.25);
  function fuelSpan(s, t0, t1) {
    const leak = tankLeaking(s), burn = brakeBurning(s, t0, t1) || legsBurning(s, t0, t1);
    if (!(leak && burn)) { if (leak) tankSync(s, t1); fuelBurn(s, t0, t1); if (s.fuel) delete s.fuel.pend; return leak; }
    // течь и тяга вместе: учёт — только в точках абсолютной суточной сетки и на границах участков тяги (они же границы
    // календаря); между точками баки не меняются, хвост отрезка уходит к следующей точке (обе операции накопительные: течь — по
    // израсходованному допуску, тяга — по графику). Итог не зависит от нарезки перемотки (ревью Codex, шаг 4)
    const h = 1 / 365.25, P = fuelPoints(s); let a = t0;
    for (;;) {
      let b = (Math.floor(a / h + 1e-9) + 1) * h; for (const m of P) if (m > a + 1e-12 && m < b) b = m;
      if (b > t1 + 1e-12) break;
      tankSync(s, b); fuelBurn(s, a, b); a = b;
    }
    if (a < t1 - 1e-12) s.fuel.pend = a; else delete s.fuel.pend;     // хвост отложен: учёт закончен в точке a
    return leak;
  }
  // дописать отложенный хвост на дату события календаря t (до того, как событие изменит подачу, содержимое или участки):
  // даты событий — модельные, поэтому и с дописыванием итог не зависит от нарезки перемотки
  function fuelFlush(s, t) {
    const f = s.fuel; if (!f || f.pend == null || !(t > f.pend + 1e-12)) return;
    const a = f.pend; delete f.pend; tankSync(s, t); fuelBurn(s, a, t);
  }
  // границы участков тяги: конец межзвёздного торможения, начала и концы действующих участков плана
  function fuelPoints(s) { const f = s.fuel, out = []; if (f.brakeEnd != null) out.push(f.brakeEnd); for (const g of f.plan || []) if (legLive(g)) out.push(g.t1 - g.dur, g.t1); return out; }
  // идёт ли течь (бак работает «до отказа»): только тогда отрезок перемотки меняет топливо
  const tankLeaking = s => !!(s.fuel && s.wear && TANKS.some(id => { const n = s.wear.nodes[id]; return n && n.ok && n.defect && n.defect.stage === 'open'; }));
  // баки в модели износа (4в): подача — по состоянию узла (изолирован — балласт, разрушен — пуст); течь при работе «до
  // отказа» — по израсходованному допуску: доля (u − u₀)/(tol − u₀) нынешнего содержимого, телескопически (нарезка не важна)
  function tankSync(s, t) {
    const w = s.wear; if (!s.fuel || !w) return;
    let changed = false; const why = [];
    for (const id of TANKS) {
      const n = w.nodes[id], x = s.fuel.tanks[id]; if (!n) continue;
      if (n.defect && n.defect.stage === 'heavy') {                         // разрушен: содержимое ушло, бак непригоден
        if (x.feed !== 'lost') { x.lost = (x.lost || 0) + x.fuel; x.fuel = 0; x.feed = 'lost'; delete x.leakU; changed = true; why.push([`бак ${id} разрушен`, `tank ${id} destroyed`]); }
        continue;
      }
      const feed = n.ok ? 'connected' : 'isolated';
      if (x.feed !== feed) { x.feed = feed; changed = true; why.push(feed === 'isolated' ? [`бак ${id} перекрыт`, `tank ${id} shut`] : [`бак ${id} снова подключён`, `tank ${id} reconnected`]); }
      // учтённая часть допуска — в баке (leakU, своя на каждый дефект: leakOf — его дата); опора износа (defect.u0) переносится
      // регламентом и предупреждением и для учёта течи не годится. Дефект открывается с нулевым износом допуска
      if (n.ok && n.defect && n.defect.stage === 'open') {
        const tol = W.DANGER.brakeTank.tol, u = Math.min(tol, W.defectAt(n, t)), u0 = x.leakU != null && x.leakOf === n.defect.at ? x.leakU : 0;
        if (u > u0 + 1e-12) { const d = x.fuel * Math.min(1, (u - u0) / (tol - u0)); x.fuel -= d; x.lost = (x.lost || 0) + d; x.leakU = u; x.leakOf = n.defect.at; changed = true; why.push([`течь бака ${id}`, `tank ${id} leak`]); }
      } else if (!n.defect && x.leakU != null) { delete x.leakU; delete x.leakOf; changed = true; }   // дефекта нет (устранён) — учёт течи снят
    }
    if (changed) { const r0 = s.reserve; fuelSync(s); tankMove(s, t, r0, why.map(x => x[0]).join(', '), why.map(x => x[1]).join(', ')); }
  }
  // изменение резерва топливом баков — с причиной (отчёт вахты: «Резерв манёвров: −3,1 п.п. — течь бака T2»)
  function tankMove(s, t, r0, ru, en) {
    const d = s.reserve - r0; if (!(Math.abs(d) > 1e-9) || !s.wear || !ru) return;
    (s.wear.moves = s.wear.moves || []).push({ at: t, key: 'reserve', d, name: { ru, en } });
  }
  const pctDv = (r, lang) => (lang === 'ru' ? String(r * 100).replace('.', ',') : String(r * 100)) + '% c';
  const eachAwake = (T, w) => M.awake(T, w);

  // ---------------------------------------------------------------- архив колоний и следов (mission.js: knownAtStart)
  // Карта показывает то, что Земля знает на день старта: последний отчёт, его возраст и даты наблюдения и получения.
  // Память прошлых партий — отдельным слоем «наследия»: общий календарь мира пока не ведётся.
  const STATUS = { viable: { ru: 'действует', en: 'active' }, establishing: { ru: 'развивается', en: 'growing' },
    declining: { ru: 'угасает', en: 'declining' }, dead: { ru: 'погибла', en: 'lost' }, trace: { ru: 'след', en: 'trace' } };
  const yrsAgo = (n, lang) => { const r = Math.round(Math.abs(n) * 12);
    if (r < 12) return lang === 'ru' ? `${r} ${plural(r, ['месяц', 'месяца', 'месяцев'])}` : `${r} month${r === 1 ? '' : 's'}`;
    return lang === 'ru' ? yrs(Math.abs(n)) : yrsEn(Math.abs(n)); };
  const yr1 = (y, lang) => f1(y, lang).replace('-', '−');
  // короткая подпись для карты в 3D
  // compact — для 3D: имя и знак состояния, без возраста (у Солнца подписи теснятся; возраст — в панели и карточке)
  function archiveShort(o, lang, year, compact) {
    const ru = lang === 'ru', age = Math.round(year - o.observedAt);
    if (compact) return o.kind === 'trace' ? `${ru ? '№' : 'No. '}${o.id.slice(1)}` : `${o[lang]}${o.status === 'declining' ? ' ?' : o.status === 'dead' ? ' ×' : ''}`;
    if (o.kind === 'trace') return `${ru ? '№' : 'No. '}${o.id.slice(1)} · ${o.id === 'e24' ? (ru ? 'пустой корабль' : 'empty ship') : (ru ? 'судьба неизвестна' : 'fate unknown')}`;
    if (o.status === 'dead') return `${o[lang]} × · ${ru ? 'погибла' : 'lost'}`;
    return `${o[lang]}${o.status === 'declining' ? ' ?' : ''} · ${ru ? `сведениям ${age} ${plural(age, ['год', 'года', 'лет'])}` : `data ${age} yr old`}`;
  }
  // строки карточки звезды на карте выбора цели
  function archiveLines(o, lang, year, world) {
    const ru = lang === 'ru', out = [];
    if (o.kind === 'trace') {
      out.push(`${o[lang]} — ${o.note[lang]}.`);
      out.push(ru ? `Последняя передача — год ${yr1(o.observedAt, 'ru')}; Земля получила её в год ${yr1(o.receivedAt, 'ru')}.` : `Last transmission: year ${yr1(o.observedAt, 'en')}; Earth received it in year ${yr1(o.receivedAt, 'en')}.`);
      return out;
    }
    const st = STATUS[o.status][lang];
    if (o.status === 'dead') {
      out.push(ru ? `«${o.ru}» — ${st}: около ${yrs(year - o.observedAt)} назад; сообщение получено за ${yrsAgo(o.receivedAt, 'ru')} до старта.` : `${o.en} — ${st}: about ${yrsEn(year - o.observedAt)} ago; the message arrived ${yrsAgo(o.receivedAt, 'en')} before departure.`);
      out.push(ru ? `Тогда в капсулы склада ушли ${o.asleep} человек; расчётный ресурс — до года 125. Живы ли все сейчас, неизвестно.` : `Then ${o.asleep} people went into the store's capsules; rated life to year 125. Whether all are alive now is unknown.`);
    } else {
      out.push(ru ? `«${o.ru}» — ${st}. Сведения около ${yrsAgo(year - o.observedAt, 'ru')} назад: ${o.awake} бодрствовали, ${o.asleep} спали.` : `${o.en} — ${st}. Data about ${yrsAgo(year - o.observedAt, 'en')} old: ${o.awake} awake, ${o.asleep} asleep.`);
      out.push(ru ? `Умеет: ${o.cap.ru}. Беда: ${o.trouble.ru}.` : `Capable of: ${o.cap.en}. Trouble: ${o.trouble.en}.`);
    }
    const EVERY = { 0.25: ['раз в квартал', 'quarterly'], 0.5: ['раз в полгода', 'every six months'], 1: ['раз в год', 'yearly'], 2: ['раз в два года', 'every two years'] }[o.every] || ['', ''];
    if (o.status === 'dead') out.push(ru ? `Последний сигнал — год ${yr1(o.observedAt, 'ru')}; Земля получила его в год ${yr1(o.receivedAt, 'ru')}.` : `Last signal: year ${yr1(o.observedAt, 'en')}; Earth received it in year ${yr1(o.receivedAt, 'en')}.`);
    else out.push(ru ? `Наблюдение — год ${yr1(o.observedAt, 'ru')}; отчёт получен за ${yrsAgo(o.receivedAt, 'ru')} до старта; отчёты — ${EVERY[0]}. Нынешнее состояние не подтверждено.` : `Observed in year ${yr1(o.observedAt, 'en')}; the report arrived ${yrsAgo(o.receivedAt, 'en')} before departure; reports come ${EVERY[1]}. The current state is unconfirmed.`);
    if (o.id === 'pass' && world && world.passTug === false) out.push(ru ? 'Наследие прошлых экспедиций: межзвёздный аппарат ушёл спасать сорок первую — для этой партии его нет.' : 'Legacy of past expeditions: the interstellar vessel went to rescue the Forty-First — it is not available this time.');
    return out;
  }
  // поселения из памяти мира у звезды
  const legacyLines = (name, lang, world) => ((world && world.settled) || []).filter(x => x.star === name).map(x => x.joined
    ? (lang === 'ru' ? `Наследие прошлых экспедиций: колония «${M.colony(x.joined).ru}» приняла спасённых — ${ppl(x.people)}.` : `Legacy of past expeditions: ${M.colony(x.joined).en} took in the rescued — ${x.people} people.`)
    : (lang === 'ru' ? `Наследие прошлых экспедиций: поселение спасённых — ${ppl(x.people)}.` : `Legacy of past expeditions: a settlement of the rescued — ${x.people} people.`));
  // строка цели контакта у звезды колонии: колонию признаём, миссия остаётся контактом
  function colonyTie(n, lang) {
    const c = M.colonyAt(n), tr = M.TRACES.find(t => t.star === n && t.id !== 'e32'), ru = lang === 'ru';
    if (c) return c.status === 'dead'
      ? (ru ? `В системе — погибшая колония «${c.ru}»: склад капсул на орбите.` : `The system holds the lost colony ${c.en}: a capsule store in orbit.`)
      : (ru ? `В системе известна колония «${c.ru}» (${STATUS[c.status].ru}). Задача — контакт; приём пятисот человек и помощь колонии не согласованы.` : `A colony is known in the system: ${c.en} (${STATUS[c.status].en}). The task is contact; taking in five hundred and helping the colony are not agreed.`);
    if (tr) return ru ? `Здесь — ${tr.ru.toLowerCase()}: ${tr.note.ru}.` : `Here: ${tr.en} — ${tr.note.en}.`;
    return null;
  }

  // ---------------------------------------------------------------- паспорт: скорость × резерв × комплекты × оснащение
  // Id ответа: b|r|комплекты|оснащение (восемь вариантов по позициям, mission.js: eqCode). Вариант собирается разбором id
  // (beat.option), а не перечислением: сочетаний с оснащением — десятки тысяч. Старые id b|r|комплекты — прежние правила:
  // зонды и ИК из комплектов становятся оснащением, профиль торможения — прежний (tMag = null), без предела замен.
  function subsets(ids) { return ids.reduce((acc, k) => acc.concat(acc.map(x => x.concat(k))), [[]]); }
  const cargoOf = (kits, eq) => M.kitMass(kits) + M.eqMass(eq);
  // Совет утверждает: груз помещается, бодрствование ≤ 25 лет, не больше двух замен оснащения (кроме старых паспортов)
  function passportParse(s, id) {
    const p = String(id).split('|');
    if (p.length !== 3 && p.length !== 4) return null;
    const b = Number(p[0]), r = Number(p[1]), legacy = p.length === 3, names = p[2] ? p[2].split('+') : [];
    if (!M.SPEEDS.includes(b) || !M.RESERVES.includes(r) || new Set(names).size !== names.length) return null;
    const order = legacy ? Object.keys(M.LEGACY_KITS) : M.kitsFor(s.mission);
    if (!names.every(k => order.includes(k)) || names.join('+') !== order.filter(k => names.includes(k)).join('+')) return null;
    const eq = legacy ? M.eqLegacy(names) : M.eqParse(p[3]);
    if (!eq || (!legacy && M.eqSwaps(eq, s.mission) > M.SWAPS)) return null;
    const kits = names.filter(k => M.KITS[k]), cargo = cargoOf(kits, eq), cap = M.capacity(b, r);
    if (cap < 0 || cargo > cap + 1e-9) return null;
    const bm = legacy ? null : M.brakeMass(b, r, cargo), tMag = legacy ? null : M.magYears(bm, b);
    const Tx = M.trip(M.star(s.target).d, b, tMag), T = Math.round(Tx);
    if (M.awake(T, 48, M.crewOf(kits)) > 25) return null;
    return passportOption(s, id, b, r, kits, eq, T, bm, tMag, Tx);
  }
  // список для экрана решения и выборочного обхода: рекомендованное оснащение миссии, все комплекты
  function passportOptions(s) {
    const eq = M.eqDefault(s.mission), code = M.eqCode(eq), out = [];
    for (const b of M.SPEEDS) for (const r of M.RESERVES) for (const kits of subsets(M.kitsFor(s.mission))) {
      const o = passportParse(s, `${b}|${r}|${kits.join('+')}|${code}`);
      if (o) out.push(o);
    }
    return out;
  }
  const kitList = (kits, lang) => kits.length ? kits.map(k => M.KITS[k][lang].toLowerCase()).join(', ') : (lang === 'ru' ? 'без груза сверх ядра' : 'nothing beyond the core');
  // оснащение словами: отличия от рекомендации Совета
  const eqList = (s, eq, lang) => { const d = M.eqDefault(s.mission), diff = M.EQUIP.filter(p => eq[p.id] !== d[p.id]);
    return diff.length ? diff.map(p => `${p[lang].toLowerCase()} — ${M.eqOpt(p.id, eq[p.id])[lang].toLowerCase()}`).join('; ')
      : (lang === 'ru' ? 'как рекомендует Совет' : 'as the Council recommends'); };
  function passportOption(s0, id, b, r, kits, eq, T, bm, tMag, Tx) {
    const a = M.awake(T, 48, M.crewOf(kits)), mag = tMag == null ? '' : { ru: ` Магнит тормозит ${yrsEn(tMag).replace(/ years?/, '')} ${plural(Math.round(tMag), ['год', 'года', 'лет'])}: масса к торможению ${Math.round(bm)} тыс. т.`, en: ` The magnet brakes for ${yrsEn(tMag)}: ${Math.round(bm)} thousand tonnes at braking.` };
    return {
      id,
      label: { ru: `${fb(b, 'ru')} · резерв ${pctDv(r, 'ru')} · ${kitList(kits, 'ru')}`, en: `${fb(b, 'en')} · reserve ${pctDv(r, 'en')} · ${kitList(kits, 'en')}` },
      known: {
        ru: [`Путь около ${yrsG(T)}; каждый проживёт в пути около ${yrsG(a)} при вахте 48.` + (mag ? mag.ru : ''), `Резерв манёвров — ${pctDv(r, 'ru')}.`, `Груз: ${kitList(kits, 'ru')}. Оснащение: ${eqList(s0, eq, 'ru')}.`],
        en: [`About ${yrsEn(T)} on the road; each person lives about ${yrsEn(a)} of it awake with a watch of 48.` + (mag ? mag.en : ''), `Manoeuvre reserve: ${pctDv(r, 'en')}.`, `Cargo: ${kitList(kits, 'en')}. Equipment: ${eqList(s0, eq, 'en')}.`]
      },
      effect: s => {
        s.beta = b; s.reserveDv = r; s.kits = kits.slice(); s.eq = Object.assign({}, eq); s.arrive = T;
        s.brakeMass = bm; s.tMag = tMag; s.arriveExact = Tx == null ? T : Tx; s.crew = M.crewOf(kits);
        s.materials = kits.includes('materials') ? 140 : 100;
        fuelInit(s);                                                    // тормозные баки T1–T4 (шаг 4а)
        flightPlan(s);                                                  // полёт внутри системы цели (если есть её данные)
      },
      record: {
        ru: s => `Ирсон зачитывает паспорт: ${fb(b, 'ru')}, резерв манёвров ${pctDv(r, 'ru')}, груз — ${kitList(kits, 'ru')}; оснащение — ${eqList(s0, eq, 'ru')}. Прибытие к ${nmD(s)} — около года ${T}.

Кассель ставит подпись Совета последней.`,
        en: s => `Irson reads out the passport: ${fb(b, 'en')}, manoeuvre reserve ${pctDv(r, 'en')}, cargo — ${kitList(kits, 'en')}; equipment — ${eqList(s0, eq, 'en')}. Arrival at ${nm(s, 'en')} around year ${T}.

Kassel signs for the Council last.`
      }
    };
  }

  // зонд вперёд: скорость, пролёт и данные на борту — из паспорта и года запуска
  function probeTimes(s, t) {
    const d = M.star(s.target).d, vp = s.beta * Math.min(t, 8) / 8 + (t < 8 ? 0.085 : 0.07);
    const flyby = t + (d - M.distLy(t, s.beta)) / vp;
    const gap = d - M.distLy(flyby, s.beta);
    return { vp, flyby: Math.round(flyby), data: Math.round(flyby + gap / (1 + s.beta)) };
  }
  // Дрейф: узлы Акта II стоят на долях пути, а не на фиксированных годах —
  // дрейф длится от ~30 до ~230 лет в зависимости от цели и паспорта.
  const brake = s => M.brakeStart(s.arrive, s.tMag);                   // год раскрытия магнита
  // увод ступени разгона: от отделения (год 8) до прохода цели — за десять лет до нас
  const stageOff = s => M.divert(stageYears(s), s.reserveDv);
  const kms = x => String(Math.round(x));
  const Y = (s, f) => Math.round(8 + f * (brake(s) - 8));
  const lag = (s, y) => Math.max(1, Math.round(M.distLy(y, s.beta, s.arrive, s.tMag, M.star(s.target).d)));   // лет идёт сообщение с Земли
  // корабль поддержки (DOC «Корабль поддержки — проект v1»): стартовал, когда сводка о нём ушла с Земли (год сводки минус
  // наше расстояние в св. годах), встреча — через год после нашего прибытия; крейсерская скорость — из этих сроков
  // (разгон 8 лет, магнит 3,86 года до 0,01c, двигатель 4 года): D = b·a/2 + b·q + (b + u)·m/2 + u·e/2
  function supportPlan(s) {
    if (!s.target || !s.arrive || ownStory(s)) return null;
    const D = M.star(s.target).d, tN = Y(s, 0.12), A = profileEnd(s), tL = tN - M.distLy(tN, s.beta, s.arrive, s.tMag, D);
    const a = 8, m = 3.86, e = 4, u = 0.01, q = A + 1 - tL - a - m - e;
    return { launch: tL, arrive: A + 1, beta: (D - u * (m + e) / 2) / (a / 2 + q + m / 2), acc: a, mag: m, brake: e, u, D };
  }
  // в 3D — после сводки о нём; найденный — у цели рядом с нами (встреча)
  const supportWorld = (s, ids) => { if (!ids.has('a2.support')) return null; const P = supportPlan(s); return P && Object.assign(P, { meet: s.support === 'found' }); };
  // Акт III: годы от прибытия; источник сигнала — ε Индейца
  const src = s => s.target === M.SOURCE;
  const vAt = (s, y) => M.speedAt(y, s.beta, s.arrive, s.tMag);
  const heatAgo = s => s.arrive - 5 - Y(s, 0.68);

    return {
      names: {
        pct, pctM, M, SH, EVM, W, JB, R, RQ, nm, nmG, nmD, f1, fb, plural, yrs, yrsG, yrsEn, ppl, dvPct, DV, TANKS, fuelInit, fuelOn, dvLeft, fuelMass,
        brakeLeft, legLive, mustReq, fuelLog, fuelDraw, fuelSpendDv, fuelSpend, fuelAddDv, spendPct, addPct, fuelBurn, legSched, legBurn, legAdd,
        legCut, legNext, legMark, fuelSync, brakeBurning, legsBurning, fuelBusy, fuelSpan, fuelFlush, fuelPoints, tankLeaking, tankSync, tankMove,
        pctDv, eachAwake, STATUS, yrsAgo, yr1, archiveShort, archiveLines, legacyLines, colonyTie, subsets, cargoOf, passportParse, passportOptions,
        kitList, eqList, passportOption, probeTimes, brake, stageOff, kms, Y, lag, supportPlan, supportWorld, src, vAt, heatAgo
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = base;
  else (root.M31Core = root.M31Core || {}).base = base;
})(typeof globalThis !== 'undefined' ? globalThis : this);
