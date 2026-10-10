// М31 · срез — оснащение, протокол происшествий, приборы паспорта и корабля. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const outfit = __core => {
    let BUILD, CAST_SEATS, DV, M, OP_NAME, R, SECTION_DEC, SH, SHELTER, THAW0, THAW_LOSS, W, Y, arrivalAt, arrivalYear, awakeOf, busSplit, cap, capsKit,
    dd, f1, f2, hashU32, hidden, nf, nm, nmG, pct, pctM, pendingFor, people, plural, ppl, pumpProspect, relayKit, shieldGaugeV5, supplyBothCost,
    supplyBuild, supplyForecast, thawAlive, thawN, thawName, wearOn, xyl, yrs, yrsEn, yrsG;
    const __link = () => { ({ BUILD, CAST_SEATS, DV, M, OP_NAME, R, SECTION_DEC, SH, SHELTER, THAW0, THAW_LOSS, W, Y, arrivalAt, arrivalYear, awakeOf, busSplit, cap, capsKit, dd, f1, f2, hashU32, hidden, nf, nm, nmG, pct, pctM, pendingFor, people, plural, ppl, pumpProspect, relayKit, shieldGaugeV5, supplyBothCost, supplyBuild, supplyForecast, thawAlive, thawN, thawName, wearOn, xyl, yrs, yrsEn, yrsG } = __core); };
    __link();

  // ---- оснащение: что даёт каждая позиция (mission.js: EQUIP). До паспорта — базовое.
  // оснащение партии; станки потеряны (износ, шаг 3c) — производство для всех решений и событий — ремкомплект
  const eqOf = s => { const e = s.eq || M.EQ_BASE; return s.wear && s.wear.shop && s.wear.shop.lost && e.prod !== 'repair' ? Object.assign({}, e, { prod: 'repair' }) : e; };
  const hasIR = s => eqOf(s).sensors === 'ir';                          // ИК: слабые спектры, карлики, вспышки
  const hasScouts = s => eqOf(s).probes === 'scout2';                   // два разведчика: ранний зонд и зонд в поток
  const probesLeft = s => ['scout2', 'inspect'].includes(eqOf(s).probes);   // есть готовый зонд для проверки потока
  const capsSafe = s => eqOf(s).caps === 'capsSafe';                    // надёжные капсулы: отказы вдвое реже
  const crewOf = s => s.crew || M.CREW;                               // своих: 460 со спасательным сектором
  const contactRun = s => !s.mission || s.mission === 'contact';
  const nmA = s => nm(s, 'ru').replace(/^звезда /, 'звезду ');            // курс на звезду Барнарда
  // что торопит паспорт: у каждой миссии своё
  // исследовательские заявки — по виду работы (requests.js): у каждой своя срочность и своя задача словами
  const URGENT_WORK = { contactColony: { ru: 'лоции Перевала стареют сейчас', en: "the Pass's charts are ageing now" },
    trace: { ru: 'след двадцать четвёртой стареет сейчас', en: "No. 24's trace is ageing now" },
    survey: { ru: 'Кольцо ждёт измерений', en: 'the Ring is waiting for the measurements' } };
  const urgentOf = (s, lang) => { const q = s.requestId && R.get(s.requestId), L = R.linkOf(q); if (L) return L.urgent[lang === 'ru' ? 0 : 1];
    const w = q && URGENT_WORK[q.work]; return (w || URGENT[s.mission || 'contact'])[lang]; };
  const URGENT = { contact: { ru: 'тридцать вторая молчит сейчас', en: 'the Thirty-Second is silent now' },
    supply: { ru: 'передатчик форпоста слабеет сейчас', en: "the outpost's transmitter is fading now" },
    rescue: { ru: 'капсулы Оттепели стареют сейчас', en: "Thaw's capsules are ageing now" } };
  // о чём наш отчёт домой
  const reportOn = (s, lang) => { const ru = lang === 'ru';
    if (s.mission === 'supply') return ru ? 'о форпосте Ксилона Ир и о мире у звезды Барнарда' : "on the Xylona Ir outpost and the world at Barnard's Star";
    if (s.mission === 'rescue') return ru ? `об Оттепели и о мире у ${nmG(s)}` : `on Thaw and the world at ${nm(s, 'en')}`;
    return ru ? `о мире у ${nmG(s)}` : `on the world at ${nm(s, 'en')}`; };
  // задача экспедиции словами — по миссии; у исследования — по виду работы заявки
  const GOAL_WORK = {
    contactColony: { ru: 'установить прямую связь с Перевалом, сверить лоции и, если у цели можно жить, построить там дом', en: 'establish a direct link with the Pass, reconcile the navigation records and, if the target can be lived on, build a home there' },
    trace: { ru: 'найти след двадцать четвёртой, передать протокол и, если у цели можно жить, построить там дом', en: "find No. 24's trace, transmit the report and, if the target can be lived on, build a home there" },
    survey: { ru: 'обследовать систему и её планету, передать измерения и, если у цели можно жить, построить там дом', en: 'survey the system and its planet, transmit the measurements and, if the target can be lived on, build a home there' }
  };
  const goalOf = (s, lang) => { const q = s.requestId && R.get(s.requestId), L = R.linkOf(q), k = lang === 'ru' ? 0 : 1;
    if (L) return lang === 'ru' ? `установить прямую связь ${L.with[0]}, ${L.whatV[0]} и, если у цели можно жить, построить там дом`
      : `establish a direct link ${L.with[1]}, ${L.whatV[1]} and, if the target can be lived on, build a home there`;
    return q && GOAL_WORK[q.work] ? GOAL_WORK[q.work][lang] : goalBase(s, lang); };
  const goalBase = (s, lang) => ({
    contact: { ru: 'найти тридцать вторую, понять сигнал и, если у цели можно жить, построить там дом', en: 'find the Thirty-Second, understand the signal and, if the target can be lived on, build a home there' },
    supply: { ru: 'вернуть форпосту Ксилона Ир связь и капсулы и остаться с ним', en: 'give the Xylona Ir outpost back its link and its capsules, and stay with it' },
    rescue: { ru: 'успеть к сорока спящим Оттепели и, если у цели можно жить, построить там дом', en: "reach Thaw's forty sleepers in time and, if the target can be lived on, build a home there" }
  })[s.mission || 'contact'][lang];
  const crewWord = (s, lang) => crewOf(s) < M.CREW ? (lang === 'ru' ? 'Четыреста шестьдесят' : 'Four hundred and sixty') : (lang === 'ru' ? 'Пятьсот' : 'Five hundred');
  // потери в пути: с моделью износа — история (смерти по журналу модели до даты, не позже её хода), без неё — прежняя
  // оценка модели первого порядка по нынешней вахте. Запрос истории на будущую дату, пока модель идёт, считается
  // (проверки); после сигнала бедствия модель остановлена — дальше людей ведёт модель спасения
  let LOSS_FUTURE = 0;
  const lossFuture = () => LOSS_FUTURE;                                  // счётчик — через функцию (части content.js связываются копиями)
  const lossesOf = (s, years) => {
    if (s.wear) { if (years > s.wear.t + 1e-6 && wearOn(s)) LOSS_FUTURE++; return W.losses(s.wear, Math.min(years, s.wear.t)); }
    return M.losses(years, s.watch, capsSafe(s), crewOf(s));
  };
  const supplyS = s => s.mission === 'supply';      // сюжет снабженца «То, что они разобрали» (DOC: спецификация Codex)
  const rescueS = s => s.mission === 'rescue';      // сюжет спасателя «Сорок мест» (DOC: спасатель v3, спецификация)
  const ownStory = s => supplyS(s) || rescueS(s);                        // у миссии свой дрейф: без компромисса Ирсона и корабля поддержки
  // снабженец (версия 2): в дрейфе пыль бьёт по охлаждению; в 30% партий треснул коллектор — прямое подключение холодильника
  // переносит отказ на весь контур: 12 погибших экипажа, аварийный сон и сигнал бедствия. Опрессовка видит трещину в 9 из 10.
  const SUPPLY = { collector: 0.3, cargoSense: 0.9, check: 2, isolate: 8, cargoDead: 12 };
  const collectorCracked = s => (hidden(s, 'supply.cargo.collector') ?? 1) < SUPPLY.collector;
  const coolerName = (s, lang) => s.kits.includes('request') ? (lang === 'ru' ? 'холодильник из груза заявки' : 'the request-cargo cooler') : (lang === 'ru' ? 'корабельный резервный холодильник' : "the ship's reserve cooler");
  const SOS_AT_cargo = s => Y(s, 0.5) + (s.cargoDays || 0) / 365.25;
  // буря у Барнарда — одна на всю операцию: u < 0,40 — сильный поток (повреждает и общую плату), 0,40–0,65 — умеренный,
  // но изношенная плата не выдерживает, ≥ 0,65 — восстановимый сбой. Обычная проверка платы видит повреждение в половине
  // случаев, под нагрузкой — в 9 из 10 (один ключ). Короткая схема при сильной буре — 18 местных; замена при повреждённой
  // плате — 24 местных и капсульная секция (независимые насосы спасают людей, но не секцию).
  const STORM = { strong: 0.4, board: 0.65, fastDead: 18, busDead: 24, protect: 6, block: 2, replace: 3, check: 1, deep: 8, split: 12 };
  const stormU = s => hidden(s, 'supply.storm') ?? 1;
  const boardDamaged = s => stormU(s) < STORM.board;
  const opYear = s => s.arrive + (s.supplyDays || 0) / 365.25;          // дата внутри операции у форпоста
  function cargoConnect(st) {                                           // прямое подключение: при трещине — общий отказ
    if (!collectorCracked(st)) return;
    st.cargoFailed = true; st.dead += SUPPLY.cargoDead; st.supplyCrewDead = SUPPLY.cargoDead;
    incident(st, 'supplyCargo', SUPPLY.cargoDead, { check: st.cargoMethod === 'check' ? 'pressure' : null, found: false, year: Y(st, 0.5) + st.cargoDays / 365.25 });
    st.sos = 'cargo';
  }
  // сектор щита пробит (удар облака или потока) и не заменён запасным
  const breached = s => !!s.shieldBreach && !s.shieldFixed;
  // облако: в 25% партий в крае — полоса крупной пыли; затмение видит её в 90% случаев
  const CLOUD = { band: 0.25, sense: 0.9, check: 2, dead: 8 };
  const cloudBand = s => (hidden(s, 'contact.cloud.band') ?? 1) < CLOUD.band;
  // край облака D2 — место на пути, не год (DOC «Симулятор v1 — время и щит», шаг 4): вход и выход, св. лет
  // от Солнца — из прежнего эталона (0,08c: вход на году 4,6, проход 21 сутки); на разгоне путь β·t²/(2·ACC).
  // Мелкая пыль края — 10 фонов; полоса крупной пыли (скрытый факт cloudBand) — средняя треть края, 40 фонов, и одно
  // крупное зерно 0,500–0,515 мм: его удар считает модель щита (энергия → выбоина → пробой, если не хватило остатка)
  const CLOUD_X = [0.1058, 0.108461292158756], CLOUD_RHO = { edge: 10, band: 40 };
  const cloudYear = (s, x) => Math.sqrt(2 * M.ACC * x / s.beta);
  const edgeIn = s => cloudYear(s, CLOUD_X[0]), edgeOut = s => cloudYear(s, CLOUD_X[1]);
  const edgeDays = s => Math.round((edgeOut(s) - edgeIn(s)) * 365.25);
  const edgeMonths = (s, lang) => { const m = Math.max(1, Math.round((edgeIn(s) - 4) * 12));
    return lang === 'ru' ? `${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}` : `${m} month${m === 1 ? '' : 's'}`; };
  // исход полосы для текстов — из модели щита
  const bandHit = s => !!s.cloudHit;
  const bandBreach = s => !!(s.cloudHit && s.cloudHit.breached);
  // контур воды (контакт): после пробуждения группы Б в 66,5% партий повреждена общая магистраль колец;
  // обычная проверка (7 суток, −2) видит дефект в половине случаев, углублённая (42 суток, −8) — в девяти из десяти
  const LOOP = { common: 0.665, ordinary: { days: 7, cost: 2, sense: 0.5 }, deep: { days: 42, cost: 8, sense: 0.9 }, dead: 31, materials: 20 };
  const loopCommon = s => (hidden(s, 'contact.loop.common') ?? 1) < LOOP.common;
  const loopAt = s => Y(s, 0.68) + 2;                                    // два года запаса от пробуждения группы Б
  // совместный план (снабженец v2): связь, капсулы, обе работы, места в кольцах корабля или признанный срыв.
  // relay/capsules/both — только при разделённом или исправном управлении; при потерянной секции — места до 45-го дня.
  const shelterPeople = s => Math.max(0, Math.min(90, 250 - (s.outpostDead || 0) - 160));
  const shelterFree = s => s.gridBlocks >= 2 && !s.supplyIndependent && s.materials >= SHELTER && (!s.capsLost || s.supplyDays + 7 <= 45);
  // переселение: связь из остатка, капсулы — только если секция цела (тот же расчёт для «После» и для исхода)
  function shelterBuild(st) {
    if (st.capsLost) st.relayOK = relayKit(st) || (st.materials >= BUILD.relay && (st.materials -= BUILD.relay, true));
    else supplyBuild(st, 'relay');
  }
  function deliverOptions(s) {
    const ok = s.busResolved && !s.capsLost, out = [];
    if (ok && (relayKit(s) || s.materials >= BUILD.relay)) out.push({ id: 'relay', label: { ru: 'Сначала постоянная связь', en: 'Permanent link first' },
      known: { ru: s => ['Связь через полгода; капсулы — через три года, если на них хватит материалов.', 'До приёмки капсул охлаждение зависит от корабля.', supplyForecast(s, 'relay').capsOK ? 'По расчёту обе системы встанут.' : 'Капсульный блок собрать будет не из чего.'],
        en: s => ['The link in half a year; capsules in three years if materials cover them.', 'Until the capsules are accepted, cooling depends on the ship.', supplyForecast(s, 'relay').capsOK ? 'By the estimate both systems will be in.' : 'There will be nothing to build the capsule unit from.'] },
      cost: st => { const t = supplyForecast(st, 'relay'); st.materials = t.materials; },
      effect: st => { st.deliver = 'relay'; supplyBuild(st, 'relay'); },
      record: { ru: s => `Сначала — связь. ${s.capsOK ? 'Капсульный блок ставят следом.' : 'Капсульного блока не будет: материалов не хватает.'}`, en: s => `The link first. ${s.capsOK ? 'The capsule unit follows.' : 'There will be no capsule unit: the materials are short.'}` } });
    if (ok && (capsKit(s) || s.materials >= BUILD.caps)) out.push({ id: 'capsules', label: { ru: 'Сначала независимые капсулы', en: 'Independent capsules first' },
      known: { ru: s => ['Капсулы принимают после монтажа — двенадцать суток; связь через три года, если хватит материалов.', supplyForecast(s, 'caps').relayOK ? 'По расчёту обе системы встанут.' : 'Передатчик собрать будет не из чего.'],
        en: s => ['The capsules are accepted after installation — twelve days; the link in three years if materials suffice.', supplyForecast(s, 'caps').relayOK ? 'By the estimate both systems will be in.' : 'There will be nothing to build the transmitter from.'] },
      cost: st => { const t = supplyForecast(st, 'caps'); st.materials = t.materials; },
      effect: st => { st.deliver = 'capsules'; st.supplyDays += 12; supplyBuild(st, 'caps'); },
      record: { ru: s => `Сначала — капсулы. ${s.relayOK ? 'Передатчик ставят следом.' : 'Передатчика не будет: материалы кончились на капсулах.'}`, en: s => `The capsules first. ${s.relayOK ? 'The transmitter follows.' : 'There will be no transmitter: the materials ran out on the capsules.'}` } });
    const both = supplyBothCost(s);
    if (ok && both != null && !s.supplyIndependent) out.push({ id: 'both', label: { ru: 'Две работы параллельно', en: 'Both jobs in parallel' },
      known: { ru: [`Второй монтажный комплект: −${both}% и недостающее оборудование.`, 'Нужны две свободные сети корабля: капсулы — за двенадцать суток, связь — через полгода.'], en: [`A second installation kit: −${both}% plus the missing equipment.`, "Requires two free ship grids: capsules in twelve days, the link in half a year."] },
      cost: st => { st.materials -= both; const t = supplyForecast(st, 'caps'); st.materials = t.materials; },
      effect: st => { st.materials -= both; st.deliver = 'both'; st.supplyDays += 12; supplyBuild(st, 'caps'); },
      record: { ru: 'Обе бригады работают одновременно; вторую питает вторая сеть корабля.', en: "Both crews work at once; the ship's second grid powers the second." } });
    if (shelterFree(s)) out.push({ id: 'shelter', label: { ru: 'Принять людей в кольца корабля', en: "House people in the ship's rings" },
      known: { ru: s => [`Материалы −${SHELTER}%, семь суток: места для ${ppl(shelterPeople(s))} и свободная вторая сеть.`, 'Корабль становится постоянной частью форпоста; оставшиеся материалы — на связь, затем на капсулы, если секция цела.'],
        en: s => [`Materials −${SHELTER}%, seven days: berths for ${shelterPeople(s)} and a free second grid.`, 'The ship becomes a permanent part of the outpost; the remaining materials go to the link, then to the capsules if the section survived.'] },
      cost: st => { st.materials -= SHELTER; shelterBuild(st); },
      effect: st => { st.materials -= SHELTER; st.deliver = 'shelter'; st.shelter = true; st.supplyDays += 7; st.shelterPeople = shelterPeople(st); shelterBuild(st); },
      record: { ru: s => `${cap(ppl(s.shelterPeople))} переходят в кольца сорок первой. Форпост впервые за годы спит не по очереди.`, en: s => `${s.shelterPeople} people move into the Forty-First's rings. For the first time in years the outpost sleeps without taking turns.` } });
    if (!out.length || (s.capsLost && !out.some(o => o.id === 'shelter'))) out.push({ id: 'abort', label: { ru: 'Признать срыв снабжения', en: 'Declare the supply mission failed' },
      known: { ru: ['Без расхода.', 'Постоянное обеспечение форпоста не восстановлено; судьба оставшихся не установлена.'], en: ['No expenditure.', "Permanent support is not restored; the remaining residents' fate is unknown."] },
      effect: st => { st.deliver = 'abort'; st.supplyFailed = true; },
      record: { ru: 'Совет признаёт срыв снабжения. В отчёт ложатся израсходованные материалы, занятые сети и дни, которых не хватило.', en: 'The council declares the supply mission failed. The report lists the materials spent, the grids taken and the days that ran short.' } });
    return out;
  }
  // общая плата (снабженец v2): повторное включение через повреждённую плату — 24 местных и капсульная секция
  function busRestart(st) {
    if (!boardDamaged(st)) { st.busResolved = true; return; }
    st.capsLost = true;
    const dead = st.supplyIndependent ? 0 : STORM.busDead;                 // независимые насосы сохраняют людей, не секцию
    st.outpostDead += dead; st.deadHere += dead;
    incident(st, 'supplyBus', dead, { check: st.busMethod === 'replace' ? null : st.busMethod, found: false, year: opYear(st) }, 'outpost');
  }
  function busCheck(st, sense) {
    st.busFound = boardDamaged(st) && (hidden(st, 'supply.bus.check') ?? 1) < sense;
    if (st.busFound) { st.materials -= busSplit(st); st.supplyDays += 12; st.busResolved = true; st.supplyIndependent = false; }
    else { st.materials -= STORM.replace; st.supplyDays += 2; busRestart(st); }
  }
  const busRecord = {
    ru: s => s.busFound ? 'Проверка находит повреждение общей платы. Двенадцать суток разделяют питание и управление капсул и связи.'
      : s.capsLost ? (s.busMethod === 'replace' ? 'Контроллер меняют и включают снова.' : 'Проверка повреждения не находит; контроллер меняют и включают снова.') + ` Плата не выдерживает: капсульная секция обесточена.${s.supplyIndependent ? ' Насосы на отдельной сети держат людей.' : ` Погибли ${ppl(STORM.busDead)} форпоста.`}`
      : s.busMethod === 'split' ? 'Двенадцать суток разделяют питание и управление. Новый холодильник больше не зависит от старого узла.'
      : 'Контроллер меняют; повторное испытание проходит. Местная смена разносит каналы до окончательной приёмки.',
    en: s => s.busFound ? 'The check finds damage on the common board. Twelve days go into separating power and controls for the capsules and the relay.'
      : s.capsLost ? (s.busMethod === 'replace' ? 'The controller is replaced and restarted.' : 'The check finds no damage; the controller is replaced and restarted.') + ` The board does not hold: the capsule section loses power.${s.supplyIndependent ? ' The pumps on the separate grid keep people alive.' : ` ${STORM.busDead} of the outpost are dead.`}`
      : s.busMethod === 'split' ? 'Twelve days go into separating power and controls. The new cooler no longer depends on the old node.'
      : 'The controller is replaced; the second trial passes. The local shift reroutes the channels before final acceptance.'
  };
  // ---- протокол происшествий: наблюдение → проверка → допущение → решение → причина → имена → что можно было
  // Имена погибших — из реестра рядовых членов экипажа (персонажи с репликами не гибнут за кадром и не говорят после).
  const FIRST = [['Аран', 'Aran'], ['Вела', 'Vela'], ['Дарен', 'Daren'], ['Ева', 'Eva'], ['Ильм', 'Ilm'], ['Кира', 'Kira'], ['Лей', 'Lei'], ['Мара', 'Mara'],
    ['Олен', 'Olen'], ['Рина', 'Rina'], ['Сав', 'Sav'], ['Тала', 'Tala'], ['Ульф', 'Ulf'], ['Фира', 'Fira'], ['Хал', 'Hal'], ['Эла', 'Ela'],
    ['Юн', 'Yun'], ['Яра', 'Yara'], ['Бор', 'Bor'], ['Гела', 'Gela'], ['Дин', 'Din'], ['Лин', 'Lin'], ['Мир', 'Mir'], ['Сая', 'Saya']];
  const LAST = [['Аск', 'Ask'], ['Бранд', 'Brand'], ['Вир', 'Vir'], ['Гест', 'Gest'], ['Дорн', 'Dorn'], ['Ирт', 'Irt'], ['Калев', 'Kalev'], ['Лунд', 'Lund'],
    ['Мейр', 'Meir'], ['Норр', 'Norr'], ['Остен', 'Osten'], ['Ранд', 'Rand'], ['Сайр', 'Sayr'], ['Толь', 'Tol'], ['Урс', 'Urs'], ['Фаль', 'Fal'],
    ['Хейм', 'Heim'], ['Эрн', 'Ern'], ['Юрт', 'Yurt'], ['Ярв', 'Yarv'], ['Бек', 'Bek'], ['Вал', 'Val'], ['Грин', 'Grin'], ['Рост', 'Rost']];
  // номер места → имя: сдвиг по сиду мира и шаг 7 (взаимно прост с 576) — в экспедиции имена не повторяются, в другом мире другие
  const crewName = (s, i, lang) => { const k = lang === 'ru' ? 0 : 1, off = s && s.riskSeed ? hashU32(JSON.stringify(['crew', s.riskSeed])) % 576 : 0, c = (7 * i + off) % 576;
    return `${FIRST[c % 24][k]} ${LAST[Math.floor(c / 24)][k]}`; };
  // сюжетный экипаж 41-й (Кассель остаётся на Земле во главе Совета); у следующих экспедиций будет свой состав
  const CAST = ['dasser', 'orin', 'lorn', 'kora', 'irson', 'marr', 'dan', 'naya', 'selina', 'tamir'];
  const castNames = lang => CAST.map(id => people[id] ? people[id][lang][0] : id);
  // погибшие — разные люди, выбор задан сидом (детерминирован); без сида имён нет
  function victims(s, key, n, pop) {
    const local = pop === 'outpost', field = local ? 'outpostDeadIds' : 'deadIds', size = local ? 250 : crewOf(s);
    const out = [], dead = new Set(s[field] || []);
    for (let k = 0; out.length < n && k < n * 20; k++) {
      const h = hidden(s, `victims.${key}.${k}`); if (h == null) break;
      const i = Math.floor(h * size); if (!dead.has(i) && (local || !CAST_SEATS.includes(i))) { dead.add(i); out.push(i); }   // сюжетные герои — не случайные жертвы
    }
    s[field] = [...dead];
    return out;
  }
  // реестры имён поселений — свои, не от сида партии: новое посещение не переименует жителей
  const POP_REG = { outpost: 'colony:xylona', thaw: 'colony:thaw' };
  const POP_STEP = { thaw: 107 };                                       // 7·107 ≡ 173 (mod 576): соседние номера — разные имена и фамилии
  const popName = (s, pop, i, lang) => POP_REG[pop] ? crewName({ riskSeed: POP_REG[pop] }, (POP_STEP[pop] || 1) * i % 576, lang) : crewName(s, i, lang);
  // extra.ids — заданные погибшие (реестр Оттепели: сроки капсул, секция), extra.beat — решение, к которому относится запись
  function incident(s, kind, dead, extra, pop) {
    const ids = extra && extra.ids ? extra.ids : victims(s, kind, dead, pop);
    const beat = extra && extra.beat || (kind === 'stream' && s.choices['d.streamRoute'] ? 'd.streamRoute' : INCIDENT_BEAT[kind]);
    (s.incidents = s.incidents || []).push(Object.assign({ kind, year: s.year, dead, ids, pop: pop || 'crew', names: { ru: ids.map(i => popName(s, pop, i, 'ru')), en: ids.map(i => popName(s, pop, i, 'en')) },
      rec: (s.recs || {})[beat] || null, choice: s.choices[beat] || null }, extra || {}));
  }
  const INCIDENT_NAME = { cloud: { ru: 'край облака', en: "the cloud's edge" }, loop: { ru: 'общая магистраль', en: 'the common main' }, stream: { ru: 'поток', en: 'the stream' },
    supplyCargo: { ru: 'охлаждение в дрейфе', en: 'cooling in the drift' }, supplyExposure: { ru: 'монтаж под вспышками', en: 'installation under the flares' }, supplyBus: { ru: 'общая плата', en: 'the common board' },
    rescueLate: { ru: 'сроки капсул Оттепели', en: "Thaw's capsule lives" }, rescueSection: { ru: 'протекающая секция склада', en: "the store's leaking section" },
    rescueDock: { ru: 'крепление склада', en: "the store's mount" }, brakeLost: { ru: 'торможение у цели', en: 'braking at the target' }, wearGroup: { ru: 'группа без охлаждения', en: 'a group without cooling' }, wearLost: { ru: 'ядро без охлаждения', en: 'the core without cooling' }, rescueWake: { ru: 'массовое пробуждение', en: 'mass waking' }, rescueWater: { ru: 'вода старой площадки', en: "the old site's water" } };
  const INCIDENT_BEAT = { cloud: 'd.cloud', loop: 'd.overload1', stream: 'd.stream', supplyCargo: 'd.supplyCooler', supplyExposure: 'd.supplyApproach2', supplyBus: 'd.supplyBus',
    rescueLate: 'd.rescue', rescueSection: 'd.rescueConnect', rescueDock: 'd.rescueConnect', rescueWake: 'd.rescue', rescueWater: 'd.home' };
  // старые записи без имён — прежний порядок реестра (номер места → имя без сдвига)
  const legacyName = (i, lang) => { const k = lang === 'ru' ? 0 : 1; return `${FIRST[i % 24][k]} ${LAST[Math.floor(i / 24) % 24][k]}`; };
  const namesLine = (inc, lang) => { const n = inc.names ? inc.names[lang] : inc.ids.map(i => legacyName(i, lang)), ru = lang === 'ru';
    return n.length <= 6 ? n.join(', ') : `${n.slice(0, 6).join(', ')} ${ru ? `и ещё ${n.length - 6}` : `and ${n.length - 6} more`}`; };
  const incYear = inc => /^rescue/.test(inc.kind) ? Math.round(inc.year) : Math.floor(inc.year);   // у склада и площадки — как в журнале
  // строки протокола для итога пути
  function incidentLines(s, lang) {
    const ru = lang === 'ru';
    return (s.incidents || []).map(inc => {
      // одна авария на площадке — две ведомости (жители и экипаж): вторая строка короткая
      if (inc.kind === 'rescueWater' && inc.pop !== 'thaw' && (s.incidents || []).some(z => z.kind === 'rescueWater' && z.pop === 'thaw' && z.year === inc.year))
        return ru ? `Год ${incYear(inc)} · Вода старой площадки — та же авария. Погибли ${ppl(inc.dead)} экипажа: ${namesLine(inc, 'ru')}.`
          : `Year ${incYear(inc)} · The old site's water — the same accident. Dead, ${inc.dead} of the crew: ${namesLine(inc, 'en')}.`;
      // торможение невыполнимо (шаг 4в): топлива на двигательный участок не хватило — корабль проходит систему, люди живы
      if (inc.kind === 'brakeLost' && inc.bound) return ru ? `Год ${incYear(inc)} · Сближение невыполнимо. Звезда цели уже захватила корабль, но топлива на сближение с планетой не хватило (недостаёт ${nf((inc.short || 0) * 299792.458, 0, 'ru')} км/с): баки теряли топливо. Корабль на орбите звезды. На борту ${ppl(inc.aboard || 0)}, все живы.`
        : `Year ${incYear(inc)} · The rendezvous cannot be flown. The target star has already captured the ship, but there was not enough propellant to reach the planet (${nf((inc.short || 0) * 299792.458, 0, 'en')} km/s short): the tanks had been losing propellant. The ship is in orbit around the star. There are ${inc.aboard || 0} people aboard, all alive.`;
      if (inc.kind === 'brakeLost') return ru ? `Год ${incYear(inc)} · Торможение невыполнимо. Топлива на последний участок — двигателем от 0,01c до нуля — не хватило (недостаёт ${nf((inc.short || 0) * 299792.458, 0, 'ru')} км/с): баки теряли топливо. Корабль прошёл систему цели. На борту ${ppl(inc.aboard || 0)}, все живы.`
        : `Year ${incYear(inc)} · Braking cannot be flown. There was not enough propellant for the last leg — the engine from 0.01c down to zero (${nf((inc.short || 0) * 299792.458, 0, 'en')} km/s short): the tanks had been losing propellant. The ship crossed the target system. There are ${inc.aboard || 0} people aboard, all alive.`;
      // рейс окончен: ядро без отвода тепла (шаг 3d)
      if (inc.kind === 'wearLost') return ru ? `Год ${incYear(inc)} · Ядро без охлаждения. Все контуры стояли дольше теплового запаса обязательного оборудования; рейс окончен. На борту было ${ppl(inc.aboard || 0)}.`
        : `Year ${incYear(inc)} · The core without cooling. Every loop was down longer than the essential equipment's thermal reserve; the voyage is over. There were ${inc.aboard || 0} people aboard.`;
      // гибель группы без охлаждения (модель износа): что отказало, что решали, чем кончилось
      if (inc.kind === 'wearGroup') {
        const polRu = inc.kept ? ' Совет прежде решил беречь запасной насос и оставить перестановку.' : '', polEn = inc.kept ? ' Earlier the council chose to keep the spare pump and the rerouting.' : '';
        return ru ? `Год ${incYear(inc)} · Группа ${inc.group} без охлаждения. Отказы контуров и холодильников не успели восстановить, а перестановкой и свободными капсулами группу не укрыть: тепловой резерв исчерпан.${polRu} Погибли ${ppl(inc.dead)}: ${namesLine(inc, 'ru')}.`
          : `Year ${incYear(inc)} · Group ${inc.group} without cooling. Loop and cooler failures were not restored in time, and neither rerouting nor free capsules could shelter the group: the thermal reserve ran out.${polEn} Dead, ${inc.dead}: ${namesLine(inc, 'en')}.`;
      }
      const recPart = inc.rec ? (inc.rec === inc.choice ? (ru ? 'по рекомендации Совета' : 'on the council\'s recommendation') : (ru ? 'вопреки рекомендации Совета' : 'against the council\'s recommendation')) : '';
      const P = {
        cloud: ru ? {
          what: 'Край облака', obs: 'край плотнее модели на шесть процентов; наибольший размер частиц не установлен',
          check: inc.check === 'measured' ? (inc.found ? 'затмение показало полосу крупной пыли' : 'затмение полосы не показало — метод пропускает одну из десяти') : 'край не проверяли',
          dec: 'идти без коррекции', assume: 'полосы крупной пыли нет', cause: 'полоса крупной пыли пробила сектор щита; за ним — жилой отсек', alt: 'обход края стоил бы около трёх процентов резерва' }
          : { what: "The cloud's edge", obs: 'the edge six percent denser than the model; the largest particle size not established',
          check: inc.check === 'measured' ? (inc.found ? 'the occultation showed a band of coarse dust' : 'the occultation showed no band — the method misses one in ten') : 'the edge was not checked',
          dec: 'go straight through', assume: 'there is no band of coarse dust', cause: 'a band of coarse dust broke through a shield sector; a living compartment was behind it', alt: 'going around the edge would have cost about three percent of the reserve' },
        loop: ru ? {
          what: 'Общая магистраль', obs: 'под нагрузкой давление проседало на семь процентов',
          check: inc.check === 'deep' ? (inc.found ? 'вскрытие магистрали нашло трещину' : 'вскрытие магистрали дефекта не нашло — оно пропускает один из десяти') : inc.check === 'ordinary' ? (inc.found ? 'проверка нашла трещину' : 'обычная проверка дефекта не нашла — она видит его лишь в половине случаев') : 'магистраль не проверяли',
          dec: 'тянуть на запасе', assume: 'общая магистраль исправна', cause: 'трещина на стыке колец раскрылась под нагрузкой', alt: 'усыпить группу Б или собрать второй контур' }
          : { what: 'The common main', obs: 'under load the pressure sagged by seven percent',
          check: inc.check === 'deep' ? (inc.found ? 'opening the main found the crack' : 'opening the main found no defect — it misses one in ten') : inc.check === 'ordinary' ? (inc.found ? 'the check found the crack' : 'the ordinary check found no defect — it sees one only half the time') : 'the main was not checked',
          dec: 'run on the reserve', assume: 'the common main is sound', cause: 'a crack at the junction of the rings opened under load', alt: 'putting group B back to sleep or building a second loop' },
        supplyCargo: ru ? {
          what: 'Охлаждение в дрейфе', obs: 'после серии пылевых ударов наружная панель теряла давление и после изоляции',
          check: inc.check ? 'опрессовка трещины не нашла — она пропускает одну из десяти' : 'коллектор не проверяли',
          dec: 'подключить холодильник напрямую', assume: 'коллектор цел', cause: 'трещина в коллекторе перенесла отказ на весь контур охлаждения', alt: 'собрать независимую секцию: −8% и двадцать суток' }
          : { what: 'Cooling in the drift', obs: 'after a series of dust impacts the external panel kept losing pressure even after isolation',
          check: inc.check ? 'the pressure test missed the crack — it misses one in ten' : 'the manifold was not checked',
          dec: 'connect the cooler directly', assume: 'the manifold is intact', cause: 'a crack in the manifold carried the failure to the whole cooling loop', alt: 'building an independent section: −8% and twenty days' },
        supplyExposure: ru ? {
          what: 'Монтаж под вспышками', obs: 'вспышка уже прошла, счётчик частиц ещё рос; управление общее с капсульной секцией',
          check: 'поток частиц не ограничен', dec: 'короткая схема, только роботы', assume: 'роботов достаточно', cause: 'частицы остановили автоматику и охлаждение занятой секции', alt: 'укрытый пост (−6%, десять суток) или отдельная сеть насосам' }
          : { what: 'Installation under the flares', obs: "the flare had passed, the particle counter was still rising; the controls were shared with the capsule section",
          check: 'the particle flux was not bounded', dec: 'the short procedure, robots only', assume: 'robots are enough', cause: 'particles stopped the automation and the cooling of an occupied section', alt: 'a sheltered station (−6%, ten days) or a separate grid for the pumps' },
        supplyBus: ru ? {
          what: 'Общая плата управления', obs: 'новый холодильник повторил ошибку снятого: тот же адрес остановки',
          check: inc.check === 'deep' ? 'проверка под нагрузкой повреждения не нашла — она пропускает одно из десяти' : inc.check === 'ordinary' ? 'обычная проверка повреждения не нашла — она видит лишь половину' : 'плату не проверяли',
          dec: 'заменить контроллер', assume: 'плата исправна', cause: 'повторное включение через повреждённую общую плату обесточило капсульную секцию', alt: 'разделить питание и управление: −12% и двенадцать суток' }
          : { what: 'The common control board', obs: "the new cooler repeated the removed unit's error: the same stop address",
          check: inc.check === 'deep' ? 'the load test found no damage — it misses one in ten' : inc.check === 'ordinary' ? 'the ordinary check found no damage — it sees only half' : 'the board was not checked',
          dec: 'replace the controller', assume: 'the board is sound', cause: 'restarting through the damaged common board cut power to the capsule section', alt: 'separating power and controls: −12% and twelve days' },
        rescueLate: ru ? {
          what: 'Сроки капсул Оттепели', obs: `капсулы склада отказывают по одной с года ${THAW_LOSS}; срок каждой известен по маяку`,
          check: 'проверка не требовалась: сроки установлены', dec: inc.op ? `${OP_NAME[inc.op].ru} — завершение в год ${f2(inc.end, 'ru')}` : 'помощь не завершена', assume: 'помощь успеет до следующего отказа',
          cause: 'исчерпан ресурс капсулы до завершения помощи', alt: 'раньше прибыть (паспорт), собрать переходники в пути или не тратить дни у склада' }
          : { what: "Thaw's capsule lives", obs: `the store's capsules have been failing one by one since year ${THAW_LOSS}; each one's life is known from the beacon`,
          check: 'no check needed: the lives were known', dec: inc.op ? `${OP_NAME[inc.op].en} — completed in year ${f2(inc.end, 'en')}` : 'assistance not completed', assume: 'assistance will finish before the next failure',
          cause: 'a capsule ran out of life before assistance was completed', alt: 'arriving earlier (the passport), building the adapters in flight, or spending fewer days at the store' },
        rescueSection: ru ? {
          what: 'Протекающая секция склада', obs: 'склад вращается; струя теплоносителя уносит тепло двенадцати капсул',
          check: inc.torn ? `крепление разрушилось при захвате: секции осталось ${dd(inc.tornLeft, 'ru')}` : inc.delay ? `торможение затянулось на ${inc.delay} суток: секции оставалось ${inc.left} суток` : `ближняя диагностика: секции оставалось ${inc.left} суток`,
          dec: SECTION_DEC[inc.choice] ? SECTION_DEC[inc.choice].ru : 'операция без отдельной помощи секции', assume: 'секция дождётся помощи',
          cause: 'секция лишилась охлаждения до стабилизации', alt: 'изоляция, испытанная в полёте (восемь суток), ранняя коррекция торможения или осмотр крепления' }
          : { what: "The store's leaking section", obs: 'the store is rotating; a coolant jet carries away the heat of twelve capsules',
          check: inc.torn ? `the mount failed during grappling: the section had ${dd(inc.tornLeft, 'en')} left` : inc.delay ? `braking ran ${inc.delay} days long: the section had ${inc.left} days left` : `close diagnostics: the section had ${inc.left} days left`,
          dec: SECTION_DEC[inc.choice] ? SECTION_DEC[inc.choice].en : 'the operation with no separate help for the section', assume: 'the section will last until help comes',
          cause: 'the section lost cooling before stabilisation', alt: 'isolation tested in flight (eight days), an early braking correction or a mount inspection' },
        rescueDock: ru ? {
          what: 'Крепление склада', obs: 'склад вращается; струя теплоносителя нагружает старые крепления',
          check: inc.check === 'inspect' ? 'осмотр надлома не нашёл — он пропускает один из десяти' : 'крепление не осматривали',
          dec: 'подключить повреждённую линию напрямую', assume: 'отказ не перейдёт в корабельный контур',
          cause: 'захват надломленного крепления сорвал трубопровод; прямое соединение перенесло отказ в охлаждение корабля', alt: 'изолированное подключение или отсечение секции' }
          : { what: "The store's mount", obs: 'the store is rotating; the coolant jet loads the old mounts',
          check: inc.check === 'inspect' ? 'the inspection missed the fracture — it misses one in ten' : 'the mount was not inspected',
          dec: 'connect the damaged line directly', assume: "the failure will not reach the ship's loop",
          cause: "grappling a fractured mount tore the pipe away; the direct connection carried the failure into the ship's cooling", alt: 'an isolated connection or cutting off the section' },
        rescueWake: ru ? {
          what: 'Массовое пробуждение', obs: 'медицинская смена рассчитана на постепенное пробуждение',
          check: 'медицинский расчёт: каждый десятый может не пережить экстренного пробуждения', dec: 'будить всех сразу', assume: 'медики справятся с потоком',
          cause: 'экстренное массовое пробуждение превысило возможности медицинской смены', alt: 'стабилизировать капсулы переносом или восстановлением склада' }
          : { what: 'Mass waking', obs: 'the medical shift is sized for gradual waking',
          check: 'the medical estimate: one in ten may not survive emergency waking', dec: 'wake everyone at once', assume: 'the medics will cope with the flow',
          cause: "mass emergency waking exceeded the medical shift's capacity", alt: 'stabilising the capsules by moving them or restoring the store' },
        rescueWater: ru ? {
          what: 'Вода старой площадки', obs: 'над старой площадкой — вулканический шлейф; Оттепель погибла от той же последовательности',
          check: inc.check === 'check' ? 'короткое испытание примеси не нашло — оно видит её лишь в половине случаев' : inc.check === 'deep' ? 'длительное испытание примеси не нашло — оно пропускает одну из двадцати' : 'воду не испытывали',
          dec: 'заселить старую площадку со старой очисткой', assume: 'очистка справится с водой после выброса',
          cause: 'примесь после выброса вывела из строя теплообменники энергетики; температурная авария', alt: 'замкнутый водяной цикл или орбитальный дом' }
          : { what: "The old site's water", obs: 'a volcanic plume over the old site; Thaw died of the same sequence',
          check: inc.check === 'check' ? 'the short test found no impurity — it sees one only half the time' : inc.check === 'deep' ? 'the extended test found no impurity — it misses one in twenty' : 'the water was not tested',
          dec: 'occupy the old site with the old treatment', assume: 'treatment will cope with the post-eruption water',
          cause: "post-eruption contamination disabled the power system's heat exchangers; a thermal accident", alt: 'a closed water loop or an orbital home' },
        stream: ru ? {
          what: 'Поток у Тёмной звезды', obs: 'счётчики ударов росли; модель давала 91% за безопасный проход',
          check: inc.check ? (inc.found ? 'измерение показало полосу на курсе' : 'измерение полосы не показало') : 'поток не измеряли',
          dec: inc.route === 'evade' ? 'уходить — слишком поздно' : 'пройти по краю', assume: inc.route === 'evade' ? 'манёвр сократит время в ядре потока' : 'опасная полоса не пересекает курс', cause: 'полоса крупных частиц на курсе', alt: 'уйти сразу, не дожидаясь измерений' }
          : { what: 'The stream at the Dark Star', obs: 'the impact counters were rising; the model gave 91% for a safe passage',
          check: inc.check ? (inc.found ? 'the measurement showed the band on course' : 'the measurement showed no band') : 'the stream was not measured',
          dec: inc.route === 'evade' ? 'leave — too late' : 'pass along the edge', assume: inc.route === 'evade' ? "the manoeuvre would shorten the time in the stream's core" : 'the dangerous band does not cross the course', cause: 'a band of coarse particles on the course', alt: 'leaving at once, without waiting for measurements' }
      }[inc.kind];
      return ru
        ? `Год ${incYear(inc)} · ${P.what}. Наблюдение: ${P.obs}. Проверка: ${P.check}. Решение: ${P.dec}${recPart ? ` (${recPart}; допущение — ${P.assume})` : ''}. Причина: ${P.cause}${inc.lost ? '; ранее пробитый сектор щита и нехватка мощности для быстрого ухода' : ''}. ${inc.lost ? `Корабль погиб: на борту было ${ppl(inc.aboard)}, среди них ${castNames('ru').join(', ')}.` : inc.dead ? `Погибли ${ppl(inc.dead)}${inc.pop === 'thaw' ? ' Оттепели' : /^rescue/.test(inc.kind) ? ' экипажа' : ''}: ${namesLine(inc, 'ru')}.` : 'Погибших нет: насосы на отдельной сети удержали людей; капсульная секция потеряна.'} Можно было: ${P.alt}.`
        : `Year ${incYear(inc)} · ${P.what}. Observed: ${P.obs}. Check: ${P.check}. Decision: ${P.dec}${recPart ? ` (${recPart}; assumption: ${P.assume})` : ''}. Cause: ${P.cause}${inc.lost ? '; a shield sector breached earlier and too little power for a quick escape' : ''}. ${inc.lost ? `The ship was lost: ${inc.aboard} were aboard, among them ${castNames('en').join(', ')}.` : inc.dead ? `Dead, ${inc.dead}${inc.pop === 'thaw' ? ' of Thaw' : /^rescue/.test(inc.kind) ? ' of the crew' : ''}: ${namesLine(inc, 'en')}.` : 'No one died: the pumps on the separate grid kept people alive; the capsule section was lost.'} Could have: ${P.alt}.`;
    });
  }
  // приветствие Оттепели (версия 3): говорит первый живой по реестру; после переноса и восстановления будят двоих представителей
  function greetR(s, L, lang) {
    const ru = lang === 'ru', first = thawAlive(s, Infinity)[0], who = thawName(first, lang), d = s.thawDead;
    return ru ? `${s.rescueOp === 'wake' ? '' : 'Через месяц после стабилизации будят двоих представителей Оттепели.\n\n'}${who} проводит пальцами по шву одеяла.

— Вы со склада?

— С сорок первой. Я Селина Вей. Мы пришли к Оттепели.

Селина показывает дату и ждёт.

— А остальные?

— Сейчас живы ${s.rescued}. Вот сорок имён: шестеро умерли до нашего рейса${d ? `, ${d} — пока шла помощь` : '; пока шла помощь, не умер никто'}. Я останусь, пока вы читаете.

${L > 0 ? `— Вы тоже потеряли людей?\n\n— Да. В пути умерли ${ppl(L)}.` : '— Долго вы летели?\n\nСелина придвигает экран с календарём рейса.'}

Между вопросом и ответом больше нет лет ожидания.`
      : `${s.rescueOp === 'wake' ? '' : "A month after stabilisation, two of Thaw's representatives are woken.\n\n"}${who} runs a hand along the blanket's seam.

"Are you from the store?"

"From the Forty-First. I'm Selina Vei. We came to Thaw."

Selina shows the date and waits.

"And the others?"

"${s.rescued} are alive now. Here are forty names: six died before our voyage${d ? `, ${d} while help was coming` : '; no one died while help was coming'}. I'll stay while you read."

${L > 0 ? `"Did you lose people too?"\n\n"Yes. ${L} died on the way."` : '"How long were you travelling?"\n\nSelina brings the voyage calendar closer.'}

There are no longer years of waiting between question and answer.`;
  }
  // приветствия у людей: сколько умерли в пути (фон и аварии) и чем встреча кончается у каждой колонии
  const roadDead = s => lossesOf(s, arrivalAt(s)).total + s.dead;
  const GREET_LAST = {
    shore: { ru: '— В вашем отчёте мы зависим от земных точных деталей. Давайте сверим, что теперь можете делать вы и что можем мы.', en: '"Your report says we depend on precision parts from Earth. Let\'s compare what you can make now with what we can."' },
    garden: { ru: '— Вы привезли врачей? Сначала познакомим ваши медицинские смены с нашими.', en: '"Did you bring physicians? First we\'ll introduce your medical teams to ours."' },
    pass: { ru: '— В старом отчёте у нас один ремонтный аппарат. Покажем вам нынешнюю ведомость рейсов.', en: '"The old report lists one repair vessel. We\'ll show you the current voyage schedule."' },
    yard: { ru: '— Прежде чем обещать док, сверим очередь работ и ваш инженерный журнал.', en: '"Before promising a dock, let\'s compare the work queue with your engineering log."' },
    default: { ru: '— Наш старый отчёт у вас есть. Начнём с того, что за годы вашего пути изменилось у нас.', en: '"You have our old report. Let\'s start with what has changed here during your voyage."' }
  };
  // погибшие в авариях пути — по причинам (облако, контур, поток)
  function deadCauses(s, lang) {
    const ru = lang === 'ru', c = [];
    if (s.cloudDead) c.push(ru ? `${s.cloudDead} — у края облака` : `${s.cloudDead} at the cloud's edge`);
    if (s.loopDead) c.push(ru ? `${s.loopDead} — при отказе контура воды` : `${s.loopDead} when the water loop failed`);
    const st = s.streamDead || 0;
    if (st) c.push(ru ? `${st} — в потоке у Тёмной звезды` : `${st} in the stream at the Dark Star`);
    return c.join(ru ? '; ' : '; ');
  }
  const gridAlive = s => { const c = M.colonyAt(s.target); return !!(c && c.awake > 0); };
  // энергия у цели из оснащения: второй блок переживает удар потока, одиночный реактор — нет; сеть — только у живой колонии
  const powerOK = s => { const e = eqOf(s).energy; return e === 'dual' || (e === 'reactor5' && s.streamHit < 2) || (e === 'grid' && gridAlive(s)); };
  const BLUEPRINT = { tools: 20, printQC: 10 };                          // материалов на капельный радиатор
  // профиль торможения от массы: при повороте масса та же, скорость другая
  const tm = (s, beta) => s.brakeMass == null ? null : M.magYears(s.brakeMass, beta);
  const tripOf = (s, d, beta) => M.trip(d, beta, tm(s, beta));
  // ---- прибор паспорта: что изменит выбор — полосы и вероятности (game.js: панель поверх 3D)
  // d — черновик паспорта { b, r, kits, eq }. Числа — та же модель, что у партии: профиль торможения от массы,
  // ожидаемые потери в пути (calc_life.py), известные затраты резерва (DV). Вероятности — на одного человека за путь.
  // общий расчёт паспорта: точные срок и бодрствование, потери по модели, вместимость (прибор и карточки оснащения)
  function passportNumbers(s, d) {
    const used = M.kitMass(d.kits) + M.eqMass(d.eq), cap = M.capacity(d.b, d.r), bm = M.brakeMass(d.b, d.r, used), tm = M.magYears(bm, d.b);
    const crew = M.crewOf(d.kits), T = M.trip(M.star(s.target).d, d.b, tm);
    return { used, cap, fits: cap >= 0 && used <= cap + 1e-9, bm, tm, T, crew, aw: M.awake(T, 48, crew), L: M.losses(T, 48, d.eq.caps === 'capsSafe', crew) };
  }
  function passportMetrics(s, d, lang) {
    const ru = lang === 'ru', safe = d.eq.caps === 'capsSafe';
    const { used, cap, bm, tm, crew, T, aw, L } = passportNumbers(s, d), drift = T - M.ACC - tm - M.ENGINE;
    const kms = d.r * 299792.458, wakings = 4 * T / 133, pWake = 1 - Math.pow(1 - (safe ? 0.002 : 0.004), wakings);
    const pCaps = 1 - Math.exp(-(safe ? 1e-4 : 2e-4) * (T - aw)), pCancer = 0.02 * 0.112 * aw;   // капсула — время во сне; рак — доза за годы вахты
    const n0 = x => Math.round(x), pc = x => `${f1(x * 100, lang)}%`, TMAX = 280;
    const rows = [
      { k: 'trip', type: 'segs', n: n0(T), label: ru ? `Путь — ${yrs(T)}` : `Road — ${yrsEn(T)}`,
        segs: [{ w: M.ACC / TMAX, c: 'acc' }, { w: drift / TMAX, c: 'drift' }, { w: tm / TMAX, c: 'mag' }, { w: M.ENGINE / TMAX, c: 'eng' }],
        note: ru ? `разгон 8 · дрейф ${n0(drift)} · магнит ${n0(tm)} · двигатель 4` : `acceleration 8 · drift ${n0(drift)} · magnet ${n0(tm)} · engine 4` },
      { k: 'awake', type: 'bar', n: n0(aw), label: ru ? `Бодрствование на человека — ${yrsG(aw)}` : `Waking years per person — ${n0(aw)}`,
        fill: aw / 30, c: aw > 25 ? 'bad' : aw > 20 ? 'warn' : 'ok',
        ticks: [{ at: 20 / 30, t: ru ? 'тонкая вахта' : 'thin watch' }, { at: 25 / 30, t: ru ? 'предел Совета' : 'Council limit' }] },
      { k: 'cargo', type: 'bar', n: Math.round(used * 10) / 10, label: ru ? `Груз — ${f1(used, 'ru')} из ${f1(Math.max(0, cap), 'ru')} тыс. т` : `Cargo — ${f1(used, 'en')} of ${f1(Math.max(0, cap), 'en')} kt`,
        fill: cap > 0 ? used / cap : 1, c: cap < 0 || used > cap + 1e-9 ? 'bad' : 'ok' },
      { k: 'brake', type: 'bar', n: n0(bm), label: ru ? `Масса к торможению — ${n0(bm)} тыс. т` : `Mass at braking — ${n0(bm)} kt`,
        fill: bm / 120, c: bm > 59 ? 'warn' : 'ok', ticks: [{ at: 59 / 120, t: ru ? 'расчёт магнита 59' : 'magnet design 59' }] },
      { k: 'reserve', type: 'bar', n: n0(kms), label: ru ? `Резерв манёвров — ${n0(kms)} км/с` : `Manoeuvre reserve — ${n0(kms)} km/s`,
        fill: kms / 3000, c: 'ok', ticks: [{ at: DV.probe / 3000, t: '' }, { at: DV.stream / 3000, t: '' }, { at: DV.streamWeak / 3000, t: '' }],
        note: ru ? `отметки — известные затраты: зонд ${DV.probe}, уход от потока ${DV.stream}, слабые коррекции ${DV.streamWeak} км/с` : `marks are known costs: probe ${DV.probe}, stream escape ${DV.stream}, weak corrections ${DV.streamWeak} km/s` },
      { k: 'loss', type: 'stack', n: L.total, label: ru ? `Ожидаемые потери в пути — ${ppl(L.total)} из ${crew} (${pc(L.total / crew)})` : `Expected losses on the road — ${L.total} of ${crew} (${pc(L.total / crew)})`,
        segs: [{ w: L.capsule / 40, c: 'caps', t: ru ? 'капсулы' : 'capsules' }, { w: L.revival / 40, c: 'wake', t: ru ? 'пробуждения' : 'wakings' }, { w: L.accident / 40, c: 'acc', t: ru ? 'аварии' : 'accidents' }, { w: L.cancer / 40, c: 'cancer', t: ru ? 'рак' : 'cancer' }],
        note: ru ? `капсулы ${L.capsule} · пробуждения ${L.revival} · аварии ${L.accident} · рак ${L.cancer}; ещё ≈${L.later} отложенных случаев рака — после прибытия. Оценка модели при вахте 48: ожидаемое, не гарантированное.` : `capsules ${L.capsule} · wakings ${L.revival} · accidents ${L.accident} · cancer ${L.cancer}; ≈${L.later} more delayed cancer cases after arrival. A model estimate with a watch of 48: expected, not guaranteed.` },
      { k: 'probs', type: 'probs', n: null, label: ru ? 'Вероятности на одного человека · шкала 0–8%' : 'Per-person probabilities · scale 0–8%',
        items: [{ t: ru ? 'отказ капсулы за годы сна' : 'capsule failure over the years asleep', v: pc(pCaps), p: pCaps, f: pCaps / 0.08 },
          { t: ru ? `гибель при пробуждениях (≈${n0(wakings)})` : `death on wakings (≈${n0(wakings)})`, v: pc(pWake), p: pWake, f: pWake / 0.08 },
          { t: ru ? 'рак от доз за годы вахты' : 'cancer from the watch-years dose', v: pc(pCancer), p: pCancer, f: pCancer / 0.08 }],
        note: ru ? 'риски по причинам не складываются: это разные события у одного человека' : 'the risks by cause do not add up: they are different events for one person' }
    ];
    if (s.mission === 'rescue') { const n = thawN(T), m = Math.round((THAW_LOSS - T) * 12);
      rows.push({ k: 'mission', type: 'bar', n: Math.round(T * 100) / 100, label: ru ? `Прибытие — год ${f2(T, 'ru')}; первая потеря на складе — год ${THAW_LOSS}` : `Arrival — year ${f2(T, 'en')}; the first loss at the store — year ${THAW_LOSS}`,
        fill: T / 160, c: n < THAW0 ? 'bad' : m < 3 ? 'warn' : 'ok', ticks: [{ at: THAW_LOSS / 160, t: ru ? 'первая потеря' : 'first loss' }],
        note: (n < THAW0 ? (ru ? `к прибытию живы ${n} из ${THAW0}` : `${n} of ${THAW0} alive at arrival`) : (ru ? `запас до первой потери — ${m} мес.; операция у склада — 1–6 мес.` : `margin to the first loss: ${m} months; the operation at the store takes 1–6 months`))
          + (d.kits.includes('berths') ? (ru ? ` · спасательный сектор: своих ${crew}, 40 мест для Оттепели` : ` · rescue sector: ${crew} of our own, 40 berths for Thaw`) : (ru ? ' · мест для спасённых нет: места погибших в пути — резерв экспедиции' : ' · no berths for the rescued: the places of those who die on the road are the expedition\'s reserve')) }); }
    if (s.mission === 'supply') rows.push({ k: 'mission', type: 'bar', n: n0(T), label: ru ? `Форпост без связи к прибытию — ${yrs(T - xyl().relayYears)}` : `Outpost without the link by arrival — ${yrsEn(T - xyl().relayYears)}`,
      fill: (T - xyl().relayYears) / 120, c: 'warn',
      note: d.kits.includes('request') ? (ru ? 'груз заявки на борту: передатчик и капсульный блок для форпоста' : 'request cargo aboard: a transmitter and a capsule unit for the outpost')
        : (ru ? `груза заявки нет: обе системы — из своих материалов, −${BUILD.relay + BUILD.caps}% у цели` : `no request cargo: both systems from our own materials, −${BUILD.relay + BUILD.caps}% at the target`) });
    return rows;
  }

  // ---- приборы: чего сколько осталось (HUD) и что останется после варианта решения (game.js).
  // Живые — по модели потерь на текущий год плюс гибель в авариях; зонды — готовые аппараты в трюме.
  const aliveOf = s => s.lostShip ? 0 : crewOf(s) - (lossesOf(s, Math.max(0, Math.min(s.year, arrivalAt(s)))).total + s.dead + s.deadHere - (s.outpostDead || 0));
  const probesOf = s => { const p = eqOf(s).probes, n = p === 'scout2' ? 2 : p === 'inspect' ? 1 : 0;
    return Math.max(0, n - (p === 'scout2' && s.choices['d.scout'] === 'launch' ? 1 : 0) - (n && s.choices['d.stream'] === 'probe' ? 1 : 0)); };
  const kms0 = s => Math.round(s.reserve / 100 * s.reserveDv * 299792.458);
  // ids — записи партии (интерфейс): «на вахте» — кто на ногах сейчас, как в отчёте вахты и на карте спящих
  function gauges(s, lang, ids) {
    if (!s || !s.eq || s.relief) return [];
    const ru = lang === 'ru', out = [];
    const g = (id, label, value, n) => out.push({ id, label, value, n });
    g('materials', ru ? 'материалы' : 'materials', `${pctM(s.materials, lang)}%`, s.materials);
    g('reserve', ru ? 'резерв манёвров' : 'manoeuvre reserve', `${pct(s.reserve, lang)}% · ${kms0(s)} ${ru ? 'км/с' : 'km/s'}`, s.reserve);
    g('alive', ru ? 'живы' : 'alive', `${aliveOf(s)}`, aliveOf(s));
    const aw = ids ? awakeOf(s, ids) : s.watch;
    g('watch', ru ? 'на вахте' : 'on watch', `${aw}`, aw);
    g('loop', ru ? 'контур' : 'cooling loop', s.highPower ? (ru ? 'полный' : 'full') : (ru ? 'без резерва мощности' : 'no high-power reserve'));
    if (s.shield) g('shield', ru ? 'щит' : 'shield', shieldGaugeV5(s, lang), SH.observe(s.shield).min); else
    g('shield', ru ? 'щит' : 'shield', breached(s) ? (ru ? 'сектор пробит' : 'sector breached') : (ru ? 'цел' : 'whole'));
    g('probes', ru ? 'зонды' : 'probes', `${probesOf(s)}`, probesOf(s));
    g('power', ru ? 'энергия у цели' : 'power at target', s.support === 'found' ? (ru ? 'топливо поддержки' : 'support fuel') : powerOK(s) ? M.eqOpt('energy', eqOf(s).energy)[lang].toLowerCase() : (ru ? 'только корабль' : 'the ship only'));
    if (s.support) g('support', ru ? 'поддержка' : 'support', s.support === 'found' ? (ru ? 'найдена' : 'found') : (ru ? 'потеряна' : 'lost'));
    if (s.mission === 'supply' && !s.deliver) g('request', ru ? 'груз заявки' : 'request cargo', relayKit(s) && capsKit(s) ? (ru ? 'передатчик и капсулы' : 'transmitter and capsules') : relayKit(s) ? (ru ? 'только передатчик' : 'transmitter only') : capsKit(s) ? (ru ? 'только капсулы' : 'capsules only') : (ru ? 'нет' : 'none'));   // C2 потерян — только передатчик
    if (s.mission === 'supply' && (s.deliver || s.outpostDead)) g('outpost', ru ? 'форпост' : 'outpost', (s.deliver ? [s.relayOK ? (ru ? 'связь есть' : 'link up') : (ru ? 'без связи' : 'no link'), s.capsOK ? (ru ? 'капсулы есть' : 'capsules up') : (ru ? 'без капсул' : 'no capsules')] : [])
      .concat(s.shelter ? [ru ? 'люди на корабле' : 'people aboard'] : []).concat(s.outpostDead ? [ru ? `погибли ${s.outpostDead}` : `${s.outpostDead} dead`] : []).join(', '));
    if (s.mission === 'supply' && s.gridBlocks < 2) g('grid', ru ? 'сеть корабля' : 'ship grid', ru ? 'один блок из двух' : 'one block of two');
    g('arrive', ru ? 'прибытие' : 'arrival', `${ru ? 'год' : 'year'} ${arrivalYear(s)}`, arrivalYear(s));
    return out;
  }
  // ---- состояние корабля — полоса и строка (приборы; автор, 08.10: «общее здоровье корабля — а не простыню надписей»,
  // «полосу здоровья сделай»). Не «очки здоровья»: каждый настоящий показатель модели переводится в запас 0…1 с общими
  // порогами (≥ 0,6 — в норме; 0,35–0,6 — без резерва: следующий отказ так легко не закрыть; 0,15–0,35 — дефицит: кто-то
  // или что-то уже без обеспечения; < 0,15 — критично: рейс под угрозой). Полоса — запас самого слабого места, причина — оно
  const HZ = [0.15, 0.35, 0.6];
  // кусочно-линейно: x ≤ t[0] → 0…0,15, t[0]…t[1] → 0,15…0,35, t[1]…t[2] → 0,35…0,6, t[2]…t[3] → 0,6…1
  const zoneOf = (x, t) => { const y = [0, ...HZ, 1], k = [0, ...t];
    for (let i = 1; i < k.length; i++) if (x <= k[i]) return y[i - 1] + (y[i] - y[i - 1]) * Math.max(0, (x - k[i - 1]) / (k[i] - k[i - 1] || 1));
    return 1; };
  const levelOf = m => m < HZ[0] ? 3 : m < HZ[1] ? 2 : m < HZ[2] ? 1 : 0;
  function shipHealth(s, lang) {
    if (!s || !s.eq || s.relief) return null;
    const ru = lang === 'ru', items = [], add = (m, ru1, en1) => items.push({ m: Math.max(0, Math.min(1, m)), text: ru ? ru1 : en1 });
    if (s.terminalAt != null) add(0, 'рейс окончен', 'the voyage is over');
    else if (s.lostShip) add(0, 'корабль потерян', 'the ship is lost');
    const w = s.wear;
    if (w && wearOn(s)) {
      const o = W.observe(w, Math.max(w.t, s.year)), warm = o.groups.filter(g => g.sleep && g.heat), n = W.LOOPS.length;
      if (!o.core.cooled) add(0.15 * o.core.heatH / o.core.cap, `ядро без охлаждения: запас ${nf(o.core.heatH, 0, 'ru')} ч`, `the core uncooled: ${nf(o.core.heatH, 0, 'en')} h left`);
      else if (o.independent < n) add([0.15, 0.2, 0.3, 0.5][o.independent], `охлаждение: ${o.independent} ${plural(o.independent, ['контур', 'контура', 'контуров'])} из ${n}`, `cooling: ${o.independent} of ${n} loops`);
      if (warm.length) add(0.3, `на тепловом резерве: ${warm.map(g => g.id).join(', ')}`, `on thermal reserve: ${warm.map(g => g.id).join(', ')}`);
      if (w.inv.pump === 0 && !pumpProspect(s)) add(0.5, 'запасных насосов нет', 'no spare pumps');
      if (w.shop && w.shop.lost) add(0.55, 'станков больше нет', 'no machine tools left');
      for (const r of (o.danger || []).filter(x => x.fam === 'bearing')) { const H = r.id.split('.')[0], rep = pendingFor(w, r.id);   // опора кольца
        if (r.ok && r.defect) add(0.5 - 0.35 * r.used / r.tol, `опора кольца ${H}: износ дорожки, израсходовано ${Math.round(100 * r.used / r.tol)}% допуска`, `ring ${H}'s bearing: track wear, ${Math.round(100 * r.used / r.tol)}% of margin used`);
        else if (!r.ok) add(rep ? 0.6 : r.defect === 'heavy' ? 0.3 : 0.4, rep ? `кольцо ${H} остановлено на ремонт опоры` : `кольцо ${H} ${r.defect === 'heavy' ? 'заклинило навсегда' : 'остановлено'}: в невесомости ${ppl(o.zeroG.n)}`,
          rep ? `ring ${H} stopped for a bearing repair` : `ring ${H} ${r.defect === 'heavy' ? 'seized for good' : 'stopped'}: ${o.zeroG.n} people in zero-g`); }
      for (const r of o.rads || []) { if (!r.defect) continue; const rep = pendingFor(w, r.id);   // опасный узел: секция радиатора
        if (r.ok) add(0.5 - 0.35 * r.used / r.tol, `течь секции радиатора ${r.id}: израсходовано ${Math.round(100 * r.used / r.tol)}% допуска`, `radiator section ${r.id} leaking: ${Math.round(100 * r.used / r.tol)}% of margin used`);
        else add(rep ? 0.6 : r.defect === 'heavy' ? 0.35 : 0.45, rep ? `секция радиатора ${r.id} в ремонте` : `секция радиатора ${r.id} ${r.defect === 'heavy' ? 'разрушена навсегда' : 'изолирована'}`,
          rep ? `radiator section ${r.id} under repair` : `radiator section ${r.id} ${r.defect === 'heavy' ? 'ruptured for good' : 'isolated'}`); }
      if (o.reg) { const b = o.reg.B / W.REG.D0;                         // отставание в годовых объёмах регламента
        if (b > 0.05) add(b < 0.25 ? 0.6 + 0.4 * (0.25 - b) / 0.2 : b < 0.5 ? 0.35 + 0.25 * (0.5 - b) / 0.25 : b < 1.5 ? 0.15 + 0.2 * (1.5 - b) : Math.max(0, 0.15 * (3 - b) / 1.5),
          `регламент: отставание ${nf(o.reg.B, 0, 'ru')} чел.-сут, старение ×${nf(o.reg.m, 2, 'ru')}`, `maintenance: ${nf(o.reg.B, 0, 'en')} person-days behind, ageing ×${nf(o.reg.m, 2, 'en')}`); }
    }
    if (s.shield) { const so = SH.observe(s.shield), open = s.shield.hits.some(x => x.state !== 'replaced' && x.residual <= 0);
      // пробоина — нулевой остаток (хуже любого тонкого места), не маскирует остальные панели
      add(zoneOf(open ? 0 : so.min, [0.5 * SH.RULES.service, SH.RULES.service, 2 * SH.RULES.service, 5 * SH.RULES.service]),
        open ? 'щит пробит' : `щит: минимум ${nf(so.min, 1, 'ru')} кг/м²`, open ? 'the shield is breached' : `shield: minimum ${nf(so.min, 1, 'en')} kg/m²`); }
    add(zoneOf(s.materials, [2, 5, 15, 40]), `материалы ${pctM(s.materials, lang)}%`, `materials ${pctM(s.materials, lang)}%`);
    add(zoneOf(s.reserve, [3, 10, 40, 80]), `резерв манёвров ${pct(s.reserve, lang)}%`, `manoeuvre reserve ${pct(s.reserve, lang)}%`);   // < 40% — у цели нет запасного участка (карточка высадки)
    const value = items.reduce((a, x) => Math.min(a, x.m), 1), level = levelOf(value), worst = items.filter(x => levelOf(x.m) === level);
    const LV = ru ? ['в норме', 'без резерва', 'дефицит', 'критично'] : ['nominal', 'no margin', 'shortfall', 'critical'];
    return { value, level, label: LV[level], reason: level ? worst.map(x => x.text).join('; ') : '', items };
  }

    return {
      names: {
        eqOf, hasIR, hasScouts, probesLeft, capsSafe, crewOf, contactRun, nmA, URGENT_WORK, urgentOf, URGENT, reportOn, GOAL_WORK, goalOf, goalBase,
        crewWord, LOSS_FUTURE, lossFuture, lossesOf, supplyS, rescueS, ownStory, SUPPLY, collectorCracked, coolerName, SOS_AT_cargo, STORM, stormU,
        boardDamaged, opYear, cargoConnect, breached, CLOUD, cloudBand, CLOUD_X, CLOUD_RHO, cloudYear, edgeIn, edgeOut, edgeDays, edgeMonths, bandHit,
        bandBreach, LOOP, loopCommon, loopAt, shelterPeople, shelterFree, shelterBuild, deliverOptions, busRestart, busCheck, busRecord, FIRST, LAST,
        crewName, CAST, castNames, victims, POP_REG, POP_STEP, popName, incident, INCIDENT_NAME, INCIDENT_BEAT, legacyName, namesLine, incYear,
        incidentLines, greetR, roadDead, GREET_LAST, deadCauses, gridAlive, powerOK, BLUEPRINT, tm, tripOf, passportNumbers, passportMetrics, aliveOf,
        probesOf, kms0, gauges, HZ, zoneOf, levelOf, shipHealth
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = outfit;
  else (root.M31Core = root.M31Core || {}).outfit = outfit;
})(typeof globalThis !== 'undefined' ? globalThis : this);
