// М31 · срез — спасатель: реестр Оттепели, торможение, крепление, площадка. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const rescue = __core => {
    let M, MOVE, RESTORE, THAW0, THAW_LOSS, W, arriveX, crewOf, dvPct, f2, hidden, housedOf, incident, lifeAt, months, nextLoss, opStart, opTime, plural,
    popName, ppl, rescueS, thawN, xyl, yr;
    const __link = () => { ({ M, MOVE, RESTORE, THAW0, THAW_LOSS, W, arriveX, crewOf, dvPct, f2, hidden, housedOf, incident, lifeAt, months, nextLoss, opStart, opTime, plural, popName, ppl, rescueS, thawN, xyl, yr } = __core); };
    __link();

  // ---- спасатель v3 (rescueS): реестр Оттепели, тепловой срок секции, торможение, крепление, площадка
  // Реестр «colony:thaw» — 40 мест: 0–5 умерли до рейса, 6–39 — тридцать четыре живых. Срок капсулы i — (i − 5)-я потеря
  // по thawN: без аварий живые по реестру совпадают с thawN. Протекающая секция — капсулы 6–17 (старейшие).
  const THAW_REG = 40, THAW_HIST = 6, YD = 365.25;
  const thawAt = i => lifeAt(39 - i);
  const inSection = i => i >= 6 && i <= 17;
  const thawName = (i, lang) => popName(null, 'thaw', i, lang);
  const namesShort = (ids, lang) => ids.length <= 5 ? thawNames(ids, lang) : `${ids.slice(0, 5).map(i => thawName(i, lang)).join(', ')} ${lang === 'ru' ? `и ещё ${ids.length - 5}` : `and ${ids.length - 5} more`}`;
  const thawNames = (ids, lang) => ids.length ? ids.map(i => thawName(i, lang)).join(', ') : (lang === 'ru' ? 'нет' : 'none');
  // скрытое (версия 3): протяжённое разрежение — 25% (передовые данные видят его в 8 из 10), надлом крепления — 25%
  // (осмотр видит в 9 из 10), примесь у старой площадки после выброса — 60% (короткое испытание — половина, длительное — 95%).
  // Тепловой запас секции — 36 суток от паспортного прибытия: задержка торможения съедает его; разрыв линии — 12 суток.
  const RESCUE = { long: 0.25, longSense: 0.8, delay: 24, burn: 100, section: 36, crack: 0.25, crackSense: 0.9, torn: 12,
    grab: 1, inspect: 4, inspectCost: 3, isolate: 6, isoFast: 8, isoSlow: 16, direct: 2, cut: 1, dockDead: 6, tested: 10,
    impurity: 0.6, sense: { check: 0.5, deep: 0.95 }, waterThaw: 8, waterCrew: 4 };
  const brakeLong = s => (hidden(s, 'rescue.brake.long') ?? 1) < RESCUE.long;
  const mountCracked = s => (hidden(s, 'rescue.dock.crack') ?? 1) < RESCUE.crack;
  const waterBad = s => (hidden(s, 'rescue.water.impurity') ?? 1) < RESCUE.impurity;
  const storeNow = s => arriveX(s) + (s.rescueDays || 0) / YD;            // часы у склада: точное прибытие + сутки работ
  const daysTo = (s, t) => Math.round((t - storeNow(s)) * YD);
  const dd = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  // судьба капсулы к моменту t: срок капсулы или тепловой срок секции (что раньше); стабилизированные не стареют
  function thawFate(s, i, t) {
    if ((s.thawDeadIds || []).includes(i)) return 'dead';
    if (s.thawStable || (inSection(i) && s.sectionSafe)) return 'alive';
    const cap = thawN(t) <= 39 - i, sec = inSection(i) && s.sectionEnd != null && s.sectionEnd <= t + 1e-9;
    if (!cap && !sec) return 'alive';
    return sec && (!cap || s.sectionEnd < thawAt(i)) ? 'section' : 'late';
  }
  const sectionHolds = (s, t) => s.sectionEnd > t + 1e-9;               // секция жива к моменту t (та же ε, что в реестре)
  const thawAlive = (s, t, from = THAW_HIST, to = THAW_REG - 1) => { const out = []; for (let i = from; i <= to; i++) if (thawFate(s, i, t) === 'alive') out.push(i); return out; };
  const sectionAlive = (s, t) => thawAlive(s, t, 6, 17).length;
  // время у склада дошло до t: умершие — в реестр и протокол, по причине, без двойного счёта
  function thawAdvance(st, t, extra) {
    const late = [], sect = [];
    for (let i = THAW_HIST; i < THAW_REG; i++) { const f = thawFate(st, i, t); if (f === 'late') late.push(i); else if (f === 'section') sect.push(i); }
    st.thawDeadIds = (st.thawDeadIds || []).concat(sect, late);
    if (sect.length) incident(st, 'rescueSection', sect.length, { ids: sect, year: st.sectionEnd, torn: !!st.pipeTorn, tornLeft: st.tornLeft, delay: st.brakeDelay || 0, left: st.sectionLeft,
      beat: st.choices['d.rescueConnect'] ? 'd.rescueConnect' : st.choices['d.rescue'] ? 'd.rescue' : 'd.rescueDock' }, 'thaw');
    if (late.length) incident(st, 'rescueLate', late.length, Object.assign({ ids: late, year: Math.min(...late.map(thawAt)), end: t, beat: st.choices['d.rescue'] ? 'd.rescue' : 'none' }, extra || {}), 'thaw');
  }
  // жертвы среди живых жителей (пробуждение, авария на площадке) — детерминированный выбор по сиду
  function thawVictims(st, key, n, pool) {
    const out = [], left = pool.slice();
    for (let k = 0; out.length < n && left.length && k < n * 20; k++) {
      const h = hidden(st, `thaw.${key}.${k}`); if (h == null) break;
      out.push(left.splice(Math.floor(h * left.length), 1)[0]);
    }
    return out;
  }
  const OP_NAME = { move: { ru: 'перенос в спасательный сектор', en: 'moving into the rescue sector' }, restore: { ru: 'восстановление склада', en: 'restoring the store' }, wake: { ru: 'пробуждение всех', en: 'waking everyone' } };
  const SECTION_DEC = { isolate: { ru: 'независимый контур — готов позже срока секции', en: 'an independent loop — ready after the section deadline' },
    cut: { ru: 'отсечь повреждённую секцию', en: 'cut off the damaged section' }, proceed: { ru: 'сразу к операции, без отдельной помощи секции', en: 'straight to the operation, with no separate help for the section' },
    move: { ru: 'перенос — дольше срока секции', en: 'moving — longer than the section deadline' }, restore: { ru: 'восстановление склада — дольше срока секции', en: 'restoring the store — longer than the section deadline' },
    wake: { ru: 'пробуждение — дольше срока секции', en: 'waking — longer than the section deadline' }, grab: { ru: 'захват без осмотра', en: 'grappling without inspection' }, inspect: { ru: 'осмотр крепления', en: 'a mount inspection' } };
  // торможение: поправка — только к точному прибытию (целый год пути и пройденный дрейф не сдвигаются)
  function brakeApply(st, method) {
    st.brakeMethod = method; st.arrivePlan = arriveX(st);
    st.brakeFound = method === 'measure' && brakeLong(st) && (hidden(st, 'rescue.brake.check') ?? 1) < RESCUE.longSense;
    if (method === 'burn' || st.brakeFound) st.reserve -= dvPct(st, RESCUE.burn);
  }
  // навигационная сверка: протяжённость участка установлена по факту, поправка — к точному прибытию
  function brakeSettle(st) {
    st.brakeLong = brakeLong(st);
    if (st.brakeLong && st.brakeMethod !== 'burn' && !st.brakeFound) { st.brakeDelay = RESCUE.delay; st.arriveExact = st.arrivePlan + RESCUE.delay / YD; }
  }
  // крепление: при надломе захват срывает трубопровод в конце работ — секции остаётся не больше двенадцати суток
  function dockApply(st, method) {
    st.dockMethod = method;
    if (method === 'inspect') st.materials -= RESCUE.inspectCost;
    st.rescueDays += method === 'inspect' ? RESCUE.inspect : RESCUE.grab;
    const crack = mountCracked(st);
    st.dockFound = method === 'inspect' && crack && (hidden(st, 'rescue.dock.check') ?? 1) < RESCUE.crackSense;
    if (crack && !st.dockFound) { st.pipeTorn = true; st.sectionEnd = Math.min(st.sectionEnd, storeNow(st) + RESCUE.torn / YD); st.tornLeft = daysTo(st, st.sectionEnd); }
    thawAdvance(st, storeNow(st));
  }
  const opNormal = s => opTime(s, 'move');                              // перенос или восстановление: месяц с переходниками, три — без
  const isoDays = s => s.rescueIsolation ? RESCUE.isoFast : RESCUE.isoSlow;
  const connectNeed = s => rescueS(s) && !s.sectionSafe && s.sectionEnd != null && sectionAlive(s, storeNow(s)) > 0
    && (s.pipeTorn || s.sectionEnd <= storeNow(s) + opNormal(s) + 1e-9);
  // прямое подключение сорванной линии: отказ уходит в охлаждение корабля — шестеро погибших, аварийный сон
  function directFail(st) {
    st.deadHere += RESCUE.dockDead; st.rescueCrewDead = (st.rescueCrewDead || 0) + RESCUE.dockDead;
    incident(st, 'rescueDock', RESCUE.dockDead, { check: st.dockMethod, year: storeNow(st) });
    st.sos = 'rescueDock';
  }
  function connectOptions(s) {
    const out = [], iso = isoDays(s), left = daysTo(s, s.sectionEnd), intime = sectionHolds(s, storeNow(s) + iso / YD), n = sectionAlive(s, storeNow(s));
    if (s.materials >= RESCUE.isolate) out.push({ id: 'isolate', label: { ru: 'Подключить независимый контур', en: 'Connect an independent loop' },
      known: { ru: [`Материалы −${RESCUE.isolate}%, ${dd(iso, 'ru')}${s.rescueIsolation ? ': комплект испытан в полёте' : ': комплект собирают на месте'}. Корабельный контур изолирован.`, `Срок секции — через ${dd(left, 'ru')}: ${intime ? 'успеваем' : 'не успеваем'}.`],
        en: [`Materials −${RESCUE.isolate}%, ${dd(iso, 'en')}${s.rescueIsolation ? ': the kit was tested in flight' : ': the kit is built on site'}. The ship's loop stays isolated.`, `The section deadline is in ${dd(left, 'en')}: ${intime ? 'we make it' : 'we do not make it'}.`] },
      cost: st => { st.materials -= RESCUE.isolate; st.rescueDays += iso; },
      effect: st => { st.materials -= RESCUE.isolate; st.connect = 'isolate'; st.rescueDays += iso; thawAdvance(st, storeNow(st)); if (sectionAlive(st, storeNow(st)) > 0) st.sectionSafe = true; },
      record: { ru: s2 => s2.sectionSafe ? `Независимый контур принимает секцию: ${ppl(sectionAlive(s2, storeNow(s2)))} больше не зависят от повреждённой линии.` : 'Контур готов позже срока секции: принимать в него уже некого.',
        en: s2 => s2.sectionSafe ? `The independent loop takes the section: ${sectionAlive(s2, storeNow(s2))} no longer depend on the damaged line.` : "The loop is ready after the section's deadline: there is no one left to take into it." } });
    if (s.pipeTorn) out.push({ id: 'direct', label: { ru: 'Подключить повреждённую линию напрямую', en: 'Connect the damaged line directly' },
      known: { ru: [`${dd(RESCUE.direct, 'ru')}, без материалов.`, 'Развязки нет: отказ может перейти в охлаждение корабля и потребовать аварийного сна.'],
        en: [`${dd(RESCUE.direct, 'en')}, no materials.`, "There is no isolation: a failure can spread into the ship's cooling and require emergency sleep."] },
      cost: st => { st.rescueDays += RESCUE.direct; },
      effect: st => { st.connect = 'direct'; st.rescueDays += RESCUE.direct; directFail(st); },
      record: { ru: 'Линию подключают напрямую. Через несколько часов давление уходит и из нашего контура: отказ перешёл в охлаждение корабля.', en: "The line is connected directly. Within hours the pressure drains from our loop too: the failure has spread into the ship's cooling." } });
    out.push(s.pipeTorn ? { id: 'cut', label: { ru: 'Отсечь повреждённую секцию', en: 'Cut off the damaged section' },
      known: { ru: ['Одни сутки, без материалов. Корабль защищён.', `Без охлаждения ${ppl(n)} секции погибнут к её сроку — через ${dd(left, 'ru')}. Остальные доступны операции.`],
        en: ['One day, no materials. The ship is protected.', `Without cooling, the section's ${n} will die by its deadline — in ${dd(left, 'en')}. The others remain reachable.`] },
      cost: st => { st.rescueDays += RESCUE.cut; },
      effect: st => { st.connect = 'cut'; st.rescueDays += RESCUE.cut; thawAdvance(st, storeNow(st)); },
      record: { ru: 'Секцию отсекают. Ива вписывает в ведомость двенадцать номеров отдельной строкой.', en: 'The section is cut off. Iva enters twelve numbers in the record on a separate line.' } }
      : { id: 'proceed', label: { ru: 'Сразу к операции', en: 'Straight to the operation' },
      known: { ru: ['Без расхода.', `Секция дождётся, только если операция закончится раньше её срока — через ${dd(left, 'ru')}.`],
        en: ['No expenditure.', `The section will last only if the operation finishes before its deadline — in ${dd(left, 'en')}.`] },
      effect: st => { st.connect = 'proceed'; },
      record: { ru: 'Совет начинает операцию без отдельной помощи секции.', en: 'The council starts the operation with no separate help for the section.' } });
    return out;
  }
  // площадка после выброса: испытания вложены (один ключ диагностики); положительный результат ведёт к замкнутой воде.
  // Примесь проявляется через тридцать суток после заселения: теплообменники, температурная авария.
  const SITE = { reuse: [6, 7], closed: [12, 60], orbit: [15, 60], check: [3, 7], deep: [8, 60] };
  function siteApply(st, method) {
    st.siteMethod = method;
    const bad = waterBad(st), h = hidden(st, 'rescue.water.check') ?? 1, sense = RESCUE.sense[method];
    if (sense) { st.materials -= SITE[method][0]; st.siteDays += SITE[method][1]; st.siteFound = bad && h < sense; method = st.siteFound ? 'closed' : 'reuse'; }
    if (method !== 'stay') { st.materials -= SITE[method][0]; st.siteDays += SITE[method][1]; }
    st.site = method === 'reuse' ? 'old' : method === 'stay' ? null : method;
    if (st.site === 'old' && bad) waterAccident(st);
    st.homeReady = !!st.site && st.site !== 'evacuated';
    if (st.homeReady) st.homeReadyAt = st.year + st.siteDays / YD;     // площадка готова — люди переходят
    if (st.homeReady && st.rescued > 0) { st.housed = true; st.thawPlace = st.site; st.infirmaryUntil = null; }
  }
  function waterAccident(st) {
    const y = st.year + (st.siteDays + 30) / YD, check = RESCUE.sense[st.siteMethod] ? st.siteMethod : null;
    const pool = thawAlive(st, Infinity), thaw = st.rescued > 0 ? thawVictims(st, 'water', Math.min(RESCUE.waterThaw, pool.length), pool) : [];
    if (thaw.length) { st.thawDeadIds = st.thawDeadIds.concat(thaw); st.rescued -= thaw.length; st.thawDead += thaw.length; incident(st, 'rescueWater', thaw.length, { ids: thaw, year: y, check }, 'thaw'); }
    st.deadHere += RESCUE.waterCrew; st.rescueCrewDead = (st.rescueCrewDead || 0) + RESCUE.waterCrew; st.waterDead = thaw.length + RESCUE.waterCrew;
    incident(st, 'rescueWater', RESCUE.waterCrew, { year: y, check });
    st.site = 'evacuated'; st.housed = st.rescued > 0 && housedOf(st);
    thawShelter(st, 'infirmary', y);                                    // эвакуация: сектор или модуль, иначе лазарет с новым сроком
  }
  const SITE_REC = {
    check: { ru: 'Тея берёт пробы у старого водозабора: короткое испытание — семь суток.', en: 'Teya takes samples at the old water intake: a short test, seven days.' },
    deep: { ru: 'Тея ставит длительное испытание: шестьдесят суток, все режимы очистки.', en: 'Teya sets up an extended test: sixty days, every treatment mode.' },
    closed: { ru: 'Старую площадку переводят на замкнутую воду из корабельного оборудования.', en: 'The old site is moved to a closed water loop built from ship equipment.' },
    orbit: { ru: 'Кольца корабля готовят к постоянной жизни: дом будет на орбите.', en: "The ship's rings are prepared for permanent life: the home will be in orbit." },
    reuse: { ru: 'Старую площадку готовят к заселению: семь суток, прежняя очистка.', en: 'The old site is prepared for occupation: seven days, the old treatment.' },
    stay: { ru: 'Совет сохраняет нынешнее размещение. Дом пока не выбран.', en: 'The council keeps the present accommodation. The home is not yet chosen.' }
  };
  const SITE_NAME = { old: { ru: 'старая площадка Оттепели', en: "Thaw's old site" }, closed: { ru: 'старая площадка, замкнутая вода', en: 'the old site, closed water loop' },
    orbit: { ru: 'орбитальный дом', en: 'an orbital home' }, evacuated: { ru: 'площадка закрыта, все на корабле', en: 'the site closed, everyone aboard the ship' } };
  function homeOptionsR(s) {
    const m = s.materials, sector = crewOf(s) < M.CREW, out = [];
    const opt = (id, need, label, known, cost) => { if (m >= need) out.push({ id, label, known, cost, effect: st => siteApply(st, id), record: SITE_REC[id] }); };
    opt('check', 15, { ru: 'Короткое испытание старой площадки', en: 'A short test at the old site' },
      { ru: ['Испытание: материалы −3%, семь суток. Найдём примесь — замкнутая вода ещё за −12% и шестьдесят суток; не найдём — заселение за −6% и семь суток.', 'Короткое испытание видит примесь в половине случаев: медленное загрязнение оно не охватывает.'],
        en: ['Test: materials −3%, seven days. If impurity is found, a closed water loop for another −12% and sixty days; if not, occupation for −6% and seven days.', 'The short test sees impurity half the time: it does not cover slow contamination.'] },
      st => { st.materials -= SITE.check[0]; });
    opt('deep', 20, { ru: 'Длительное испытание старой площадки', en: 'An extended test at the old site' },
      { ru: ['Испытание: материалы −8%, шестьдесят суток. Дальше те же −12% и шестьдесят суток либо −6% и семь суток.', 'Проверяется больше режимов: примесь находят в девятнадцати случаях из двадцати; полной гарантии нет.'],
        en: ['Test: materials −8%, sixty days. Then the same −12% and sixty days, or −6% and seven days.', 'More operating conditions are tested: impurity is found nineteen times in twenty; there is no complete guarantee.'] },
      st => { st.materials -= SITE.deep[0]; });
    opt('closed', 12, { ru: 'Старая площадка с замкнутой водой', en: 'The old site with a closed water loop' },
      { ru: ['Материалы −12%, шестьдесят суток.', 'Местная вода исключена из энергетики и жилого контура: замкнутая схема из корабельного оборудования.'],
        en: ['Materials −12%, sixty days.', 'Local water is excluded from the power and habitat loops: a closed system built from ship equipment.'] },
      st => { st.materials -= SITE.closed[0]; });
    opt('orbit', 15, { ru: 'Постоянный дом на орбите', en: 'A permanent orbital home' },
      { ru: ['Материалы −15%, шестьдесят суток на длительное обеспечение поселения.', sector ? 'Спасательный сектор сохраняет свои места; новые капсулы этой работой не создаются.' : 'Кольца корабля расширяют: места будут и для спасённых.'],
        en: ['Materials −15%, sixty days for long-term settlement support.', sector ? 'The rescue sector keeps its berths; this work creates no new capsules.' : "The ship's rings are extended: there will be places for the rescued too."] },
      st => { st.materials -= SITE.orbit[0]; });
    opt('reuse', 6, { ru: 'Вернуться без испытания воды', en: 'Return without testing the water' },
      { ru: ['Материалы −6%, семь суток подготовки.', 'Старая очистка после выброса не проверена: отказ энергетики угрожает первым поселенцам.'],
        en: ['Materials −6%, seven days of preparation.', 'The old treatment has not been tested since the eruption: a power failure threatens the first residents.'] },
      st => { st.materials -= SITE.reuse[0]; });
    out.push({ id: 'stay', label: { ru: 'Сохранить нынешнее размещение', en: 'Keep the present accommodation' },
      known: { ru: ['Без расхода и новой стройки.', !s.rescued ? 'Дом экипажа — корабль.' : housedOf(s) ? 'Постоянные места спасённых сохраняются; дом экипажа — корабль.' : s.thawPlace === 'store' ? 'Дом экипажа — корабль. Спасённые спят на восстановленном складе: жилья для них нет.' : `Дом экипажа — корабль. Лазарет — до года ${yr(s.infirmaryUntil)}; жилья для спасённых к этому сроку не будет.`],
        en: ['No expenditure, no new construction.', !s.rescued ? "The crew's home is the ship." : housedOf(s) ? "The rescued keep their permanent places; the crew's home is the ship." : s.thawPlace === 'store' ? "The crew's home is the ship. The rescued sleep in the restored store: there is no housing for them." : `The crew's home is the ship. The infirmary until year ${yr(s.infirmaryUntil)}; there will be no housing for the rescued by then.`] },
      effect: st => siteApply(st, 'stay'), record: SITE_REC.stay });
    return out;
  }
  // итог площадки — после испытаний и заселения (то, что стало известно по факту)
  function siteRecord(s, lang) {
    const ru = lang === 'ru', w = s.waterDead || 0;
    const res = s.site === 'evacuated'
      ? (ru ? `После заселения примесь вывела из строя теплообменники; температурная авария. Погибли ${(s.incidents || []).filter(x => x.kind === 'rescueWater').map(x => x.pop === 'thaw' ? `${ppl(x.dead)} Оттепели` : `${ppl(x.dead)} экипажа`).join(' и ')}. Площадку закрыли, живых эвакуировали на корабль.`
        : `After occupation the impurity disabled the heat exchangers; a thermal accident. Dead: ${(s.incidents || []).filter(x => x.kind === 'rescueWater').map(x => x.pop === 'thaw' ? `${x.dead} of Thaw` : `${x.dead} of the crew`).join(' and ')}. The site was closed, the living evacuated to the ship.`)
      : s.siteFound ? (ru ? 'Испытание нашло примесь до заселения: местную воду отключили, площадку переводят на замкнутый цикл.' : 'The test found the impurity before occupation: local water was disconnected, the site is moved to a closed loop.')
      : s.siteMethod === 'check' || s.siteMethod === 'deep' ? (ru ? 'Испытание примеси не нашло; жилой контур принят.' : 'The test found no impurity; the habitat loop is accepted.')
      : s.site === 'old' ? (ru ? 'Заселение прошло; очистка держит.' : 'Occupation went ahead; the treatment holds.')
      : s.site === 'closed' ? (ru ? 'Замкнутый контур принят: местная вода в энергетику не идёт.' : 'The closed loop is accepted: local water does not enter the power system.')
      : s.site === 'orbit' ? (ru ? 'Кольца приняты: орбитальный дом работает.' : 'The rings are accepted: the orbital home is running.')
      : (ru ? 'Нового жилья пока нет; прежние места и обязательства сохраняются.' : 'There is no new housing yet; existing places and commitments remain.');
    const placed = s.housed ? s.rescued : 0, where = SITE_NAME[s.site] ? SITE_NAME[s.site][lang] : (ru ? 'не выбрано' : 'undecided');
    return `${res} ${ru ? `Постоянно устроены ${placed} из Оттепели; ждут жилья ${s.rescued - placed}. Место: ${where}.` : `Permanently housed from Thaw: ${placed}; awaiting housing: ${s.rescued - placed}. Location: ${where}.`}`;
  }
  // строка о секции — то, что видит вахта после ближней диагностики
  function sectionLine(s, lang) {
    const ru = lang === 'ru', n = sectionAlive(s, storeNow(s));
    if (s.sectionEnd == null) return '';
    if (s.sectionSafe) return ru ? 'Протекающая секция — на независимом контуре.' : 'The leaking section is on an independent loop.';
    if (!n) return ru ? 'Протекающая секция потеряна.' : 'The leaking section is lost.';
    const d = daysTo(s, s.sectionEnd);
    return ru ? `Протекающая секция: живы ${n}; её срок — через ${dd(d, 'ru')}${s.pipeTorn ? ', линия сорвана' : ''}.` : `The leaking section: ${n} alive; its deadline is in ${dd(d, 'en')}${s.pipeTorn ? ', the line torn away' : ''}.`;
  }
  function storeLineR(s, lang, t) {
    const ru = lang === 'ru', alive = thawAlive(s, t), n = alive.length;
    if (!n) return ru ? 'Живых на складе нет.' : 'No one is alive in the store.';
    const head = ru ? `Живы ${n === THAW0 ? `все ${THAW0}` : `${n} из ${THAW0}`}` : `${n === THAW0 ? `All ${THAW0}` : `${n} of ${THAW0}`} alive`;
    const nx = s.thawStable ? Infinity : alive.filter(i => !(inSection(i) && s.sectionSafe))
      .map(i => Math.min(thawAt(i), inSection(i) && s.sectionEnd != null ? s.sectionEnd : Infinity)).reduce((a, b) => Math.min(a, b), Infinity);
    if (nx === Infinity) return head + '.';
    const d = Math.max(0, Math.round((nx - t) * YD));
    return ru ? `${head}; ближайшая потеря — около года ${f2(nx, 'ru')}, через ${dd(d, 'ru')}.` : `${head}; the next loss is around year ${f2(nx, 'en')}, in ${dd(d, 'en')}.`;
  }
  // склад вращается (версия 3): что показала ближняя диагностика
  function storeR(s, lang) {
    const ru = lang === 'ru', n = s.thawConfirmed, hist = [0, 1, 2, 3, 4, 5], nx = thawAlive(s, arriveX(s)).map(thawAt).reduce((a, b) => Math.min(a, b), Infinity);
    return ru ? `Маяк пропадает и возвращается: склад вращается. Камеры видят струю теплоносителя; световая кривая подтверждает поворот корпуса.

Ближняя диагностика: ${n === THAW0 ? `живы все ${THAW0}` : `живы ${n} из ${THAW0}`}. Ещё шестеро умерли до нашего рейса: ${thawNames(hist, 'ru')}. У протекающей секции — двенадцать капсул — осталось ${dd(s.sectionLeft, 'ru')}.${nx < Infinity ? ` Ближайший отказ по сроку капсулы — около года ${f2(nx, 'ru')}.` : ''}

Сводка «штатно» всё это время описывала режим оборудования.`
      : `The beacon disappears and returns: the store is rotating. Cameras show a coolant jet; the light curve confirms the hull's turn.

Close diagnostics: ${n === THAW0 ? `all ${THAW0} alive` : `${n} of ${THAW0} alive`}. Another six died before our voyage: ${thawNames(hist, 'en')}. The leaking section — twelve capsules — has ${dd(s.sectionLeft, 'en')} left.${nx < Infinity ? ` The next capsule failure by its life is around year ${f2(nx, 'en')}.` : ''}

All this time, "nominal" described the equipment's operating mode.`;
  }
  // живые сейчас и ближайшая потеря — то, что видит вахта
  function storeLine(s, lang, t = arriveX(s)) {
    if (rescueS(s)) return storeLineR(s, lang, t);
    const ru = lang === 'ru', n = thawN(t), nx = nextLoss(t);
    if (!n) return ru ? 'Живых на складе нет.' : 'No one is alive in the store.';
    return ru ? `Живы ${n === THAW0 ? `все ${THAW0}` : `${n} из ${THAW0}`}; ближайшая потеря — около года ${f2(nx, 'ru')}, через ${months(nx - t, 'ru')}.` : `${n === THAW0 ? `All ${THAW0}` : `${n} of ${THAW0}`} alive; the next loss is around year ${f2(nx, 'en')}, in ${months(nx - t, 'en')}.`;
  }
  // операция у склада: известны цена, срок и прогноз склада; число спасённых — в записи результата
  function rescueOp(st, op, cost) {
    st.materials -= cost; st.rescueOp = op;
    if (st.preview) return;                                             // «После»: только известные затраты
    const tEnd = opStart(st) + opTime(st, op), n = thawN(tEnd), k = op === 'wake' ? Math.round(n / 10) : 0;
    st.rescued = n - k; st.thawDead = THAW0 - st.rescued; st.rescueEnd = tEnd; st.housed = st.rescued > 0 && housedOf(st);
  }
  // версия 3: одни часы у склада, реестр по именам, сроки секции; пробуждение — именные потери
  function rescueOpR(st, op, cost) {
    st.materials -= cost; st.rescueOp = op;
    if (st.preview) return;
    const tEnd = storeNow(st) + opTime(st, op);
    thawAdvance(st, tEnd, { op, end: tEnd });
    const alive = thawAlive(st, tEnd), woke = op === 'wake' ? thawVictims(st, 'wake', Math.round(alive.length / 10), alive) : [];
    if (woke.length) { st.thawDeadIds = st.thawDeadIds.concat(woke); incident(st, 'rescueWake', woke.length, { ids: woke, year: tEnd }, 'thaw'); }
    st.thawStable = true; st.rescued = alive.length - woke.length; st.thawDead = THAW0 - st.rescued;
    st.rescueEnd = tEnd; st.rescueDays = (tEnd - arriveX(st)) * YD; st.housed = st.rescued > 0 && housedOf(st);
    thawShelter(st, op === 'restore' ? 'store' : 'infirmary', tEnd);
  }
  // временное размещение: без постоянных мест — склад (спят) или лазарет на три года от приёма
  function thawShelter(st, temp, t) {
    st.thawPlace = !st.rescued ? null : housedOf(st) ? (crewOf(st) < M.CREW ? 'sector' : 'module') : temp;
    st.infirmaryUntil = st.thawPlace === 'infirmary' ? t + 3 : null;
  }
  // срок секции против срока операции — в «Что известно» каждого варианта
  function opSection(s, op, lang) {
    if (!rescueS(s) || s.sectionSafe || s.sectionEnd == null || !sectionAlive(s, storeNow(s))) return [];
    const ru = lang === 'ru', d = daysTo(s, s.sectionEnd), need = Math.round(opTime(s, op) * YD), ok = sectionHolds(s, storeNow(s) + opTime(s, op));
    return [ru ? `Срок протекающей секции — через ${dd(d, 'ru')}; операция — ${dd(need, 'ru')}: ${ok ? 'секция дождётся' : `секция не дождётся — ${ppl(sectionAlive(s, storeNow(s)))} погибнут`}.`
      : `The leaking section's deadline is in ${dd(d, 'en')}; the operation takes ${dd(need, 'en')}: ${ok ? 'the section will last' : `the section will not last — ${sectionAlive(s, storeNow(s))} will die`}.`];
  }
  function rescueOptions(s) {
    const R = rescueS(s), t0 = opStart(s), out = [], tm = op => opTime(s, op), fc = op => R ? thawAlive(s, t0 + tm(op)).length : thawN(t0 + tm(op));
    const run = (op, cost) => st => R ? rescueOpR(st, op, cost) : rescueOp(st, op, cost);
    const where = lang => housedOf(s) ? (lang === 'ru' ? 'Места для них есть.' : 'There are places for them.') : null;
    if (crewOf(s) < M.CREW && thawN(t0) <= 40 && (!R || s.materials >= MOVE)) out.push({
      id: 'move',
      label: { ru: 'Перенести в наш сектор', en: 'Move them into our sector' },
      known: {
        ru: [`Сорок мест спасательного сектора ждут. Материалы −${MOVE}%.`, `Срок — ${months(tm('move'), 'ru')}: к концу по прогнозу живы ${fc('move')}.`, 'Спящие переходят в наши капсулы; будить — у цели, по одному.'].concat(opSection(s, 'move', 'ru')),
        en: [`The rescue sector's forty berths are waiting. Materials −${MOVE}%.`, `Time: ${months(tm('move'), 'en')}; by the end, ${fc('move')} alive by the forecast.`, 'The sleepers move into our capsules; waking later, one by one.'].concat(opSection(s, 'move', 'en'))
      },
      effect: run('move', MOVE),
      record: {
        ru: s => `Спящих переносят в спасательный сектор. На каждой капсуле — номер Оттепели и наш. Перенесены ${ppl(s.rescued)}.`,
        en: s => `The sleepers are moved into the rescue sector. Each capsule carries Thaw's number and ours. ${s.rescued} are moved.`
      }
    });
    if (s.materials >= RESTORE) out.push({
      id: 'restore',
      label: { ru: 'Восстановить склад', en: 'Restore the store' },
      known: {
        ru: [`Питание и охлаждение склада — от нашей сети. Материалы −${RESTORE}%.`, `Срок — ${months(tm('restore'), 'ru')}: к концу по прогнозу живы ${fc('restore')}.`, where('ru') || 'Спящие остаются в своих капсулах: склад — не дом, постоянных мест нет.'].concat(opSection(s, 'restore', 'ru')),
        en: [`The store's power and cooling come from our grid. Materials −${RESTORE}%.`, `Time: ${months(tm('restore'), 'en')}; by the end, ${fc('restore')} alive by the forecast.`, where('en') || 'The sleepers stay in their capsules: a store is not a home, there are no permanent places.'].concat(opSection(s, 'restore', 'en'))
      },
      effect: run('restore', RESTORE),
      record: {
        ru: s => `Склад подключают к нашей сети. Капсулы Оттепели больше не стареют: спят ${ppl(s.rescued)}.`,
        en: s => `The store is connected to our grid. Thaw's capsules no longer age: ${s.rescued} sleep.`
      }
    });
    out.push({
      id: 'wake',
      label: { ru: 'Будить всех сразу', en: 'Wake everyone at once' },
      known: {
        ru: ['Все пробуждения за месяц: врачей не хватает. Каждый десятый может не пережить пробуждения.', where('ru') || 'Мест нет: лазарет — временное убежище на три года.'].concat(opSection(s, 'wake', 'ru')),
        en: ['All the wakings within a month: not enough physicians. One in ten may not survive waking.', where('en') || 'No places: the infirmary is a temporary shelter for three years.'].concat(opSection(s, 'wake', 'en'))
      },
      effect: run('wake', 0),
      record: {
        ru: s => `Будят всех за месяц. Медики не спят сами. Живы ${ppl(s.rescued)}.${s.thawDead ? ` Оттепель потеряла ${s.thawDead}.` : ''}`,
        en: s => `Everyone is woken within a month. The medics do not sleep themselves. ${s.rescued} are alive.${s.thawDead ? ` Thaw lost ${s.thawDead}.` : ''}`
      }
    });
    return out;
  }
  // старые сохранения: прежние «перенести» (места погибших) и «будить по одному»
  function rescueLegacy(s, id) {
    if (id === 'gradual') return { id, label: { ru: 'Будить по одному на складе', en: 'Wake them one by one at the store' }, known: { ru: [], en: [] },
      effect: st => { if (st.preview) return; const n = thawN(arriveX(st)), k = Math.min(3, n); st.rescueOp = 'gradual'; st.rescued = n - k; st.thawDead = THAW0 - st.rescued; st.housed = false; },
      record: { ru: 'Будят по одному. Трое не дожидаются своей очереди.', en: 'They are woken one by one. Three do not live to their turn.' } };
    if (id === 'move' && s.lost >= s.rescued) return { id, label: { ru: 'Перенести в наш зал', en: 'Move them into our hall' }, known: { ru: [], en: [] },
      effect: st => { if (st.preview) return; st.rescueOp = 'move'; st.rescued = thawN(arriveX(st)); st.thawDead = THAW0 - st.rescued; st.housed = true; },
      record: { ru: 'Спящих переносят в капсулы тех, кто не долетел. На каждой капсуле — два имени.', en: 'The sleepers are moved into the capsules of those who did not make it. Each capsule carries two names.' } };
    return null;
  }
  // таймлайн: сроки миссии на шкале пути (годы от старта)
  function missionMarks(s, lang) {
    const ru = lang === 'ru';
    if (s.mission === 'rescue') return [{ at: THAW_LOSS, c: 'bad', short: ru ? `Оттепель: потери с ${THAW_LOSS}` : `Thaw: losses from ${THAW_LOSS}`,
      title: ru ? `Год ${THAW_LOSS} — первая необратимая потеря на складе Оттепели` : `Year ${THAW_LOSS} — the first irreversible loss in Thaw's store` }];
    return [];
  }
  function missionCheck(s, T, lang) {
    const ru = lang === 'ru';
    if (s.mission === 'rescue') { const n = thawN(T), m = Math.round((THAW_LOSS - T) * 12);
      return { good: n === THAW0, text: n === THAW0 ? (ru ? `Прибытие — год ${f2(T, 'ru')}: до первой потери на складе ${m} мес.` : `Arrival — year ${f2(T, 'en')}: ${m} months before the first loss at the store.`)
        : (ru ? `Прибытие — год ${f2(T, 'ru')}, позже первой потери (год ${THAW_LOSS}): живы будут ${n} из ${THAW0}.` : `Arrival — year ${f2(T, 'en')}, after the first loss (year ${THAW_LOSS}): ${n} of ${THAW0} will be alive.`) }; }
    T = Math.round(T);
    if (s.mission === 'supply') return { warn: true, text: ru ? `Прибытие — год ${T}: форпост ${T - xyl().relayYears} лет без связи и ${Math.max(0, T - xyl().capsuleYears)} лет без запаса для капсул.` : `Arrival — year ${T}: the outpost ${T - xyl().relayYears} years without the link and ${Math.max(0, T - xyl().capsuleYears)} years without capsule spares.` };
    return null;
  }
  // тонкая вахта: столько людей, чтобы каждый прожил в пути около 13 лет, как на ближней дороге
  const thinWatch = T => Math.max(24, Math.min(40, Math.round(13 * 500 / T)));
  const regHands = s => Math.ceil(W.REG.D0 * (1 + Math.min(W.REG.ageMax, W.REG.age * s.arrive)) / W.REG.perYear - 1e-9);   // специалистов на регламент к прибытию
  // поворот к источнику в год t

    return {
      names: {
        THAW_REG, THAW_HIST, YD, thawAt, inSection, thawName, namesShort, thawNames, RESCUE, brakeLong, mountCracked, waterBad, storeNow, daysTo, dd,
        thawFate, sectionHolds, thawAlive, sectionAlive, thawAdvance, thawVictims, OP_NAME, SECTION_DEC, brakeApply, brakeSettle, dockApply, opNormal,
        isoDays, connectNeed, directFail, connectOptions, SITE, siteApply, waterAccident, SITE_REC, SITE_NAME, homeOptionsR, siteRecord, sectionLine,
        storeLineR, storeR, storeLine, rescueOp, rescueOpR, thawShelter, opSection, rescueOptions, rescueLegacy, missionMarks, missionCheck, thinWatch,
        regHands
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = rescue;
  else (root.M31Core = root.M31Core || {}).rescue = rescue;
})(typeof globalThis !== 'undefined' ? globalThis : this);
