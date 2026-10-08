/* М31 · срез: заявочный план, пролог и Акт I (годы 0–8).
   v2 по ревью Codex (DOC/Ревью Codex — драматургия и срез.md): пролог — сцена без ложного выбора,
   первое действие — сопоставить записи; Кору и Дана игрок видит до распоряжения их временем;
   очередь даёт отдачу у облака; цены — в единицах бюджета; передача полномочий — действием.
   v3: выбор цели в секторе и три ветки Акта I между общими узлами (концепт §7.8).
   Текст сразу на двух языках. Числа ресурсов — значения прототипа, не паспорт корабля. */
(function (root) {
  'use strict';

  const pct = (x, lang) => (lang === 'ru' ? x.toFixed(1).replace('.', ',') : x.toFixed(1));
  // материалы: целые — без десятых, дробные (ремонты и вторсырьё событий) — с десятыми
  const pctM = (x, lang) => Math.abs(x - Math.round(x)) < 0.05 ? String(Math.round(x)) : pct(x, lang);

  // Миссия: цель, паспорт, поворот курса — расчёты в mission.js (браузер: M31Mission).
  const M = root.M31Mission || require('./mission.js');
  // Щит как прибор (правила v5, симулятор): shield.js (браузер: M31Shield).
  const SH = root.M31Shield || require('./shield.js');
  // События v1 (DOC «События v1»): генератор эпизодов дрейфа — events.js (браузер: M31Events)
  const EVM = root.M31Events || require('./events.js');
  // Износ корабля (DOC «Долгий рейс — износ и смена курса», шаг 2): граф узлов, отказы, буферы групп — wear.js (браузер: M31Wear)
  const W = root.M31Wear || require('./wear.js');
  const R = root.M31Requests || require('./requests.js'), RQ = R;   // RQ — там, где R занято локально (досье: признаки маршрута)
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
    if (!eq || (!legacy && M.eqSwaps(eq, s.mission, s.riskVersion) > M.SWAPS)) return null;
    const kits = names.filter(k => M.KITS[k]), cargo = cargoOf(kits, eq), cap = M.capacity(b, r);
    if (cap < 0 || cargo > cap + 1e-9) return null;
    const bm = legacy ? null : M.brakeMass(b, r, cargo), tMag = legacy ? null : M.magYears(bm, b);
    const Tx = M.trip(M.star(s.target).d, b, tMag), T = Math.round(Tx);
    if (M.awake(T, 48, M.crewOf(kits)) > 25) return null;
    return passportOption(s, id, b, r, kits, eq, T, bm, tMag, Tx);
  }
  // список для экрана решения и выборочного обхода: рекомендованное оснащение миссии, все комплекты
  function passportOptions(s) {
    const eq = M.eqDefault(s.mission, s.riskVersion), code = M.eqCode(eq), out = [];
    for (const b of M.SPEEDS) for (const r of M.RESERVES) for (const kits of subsets(M.kitsFor(s.mission))) {
      const o = passportParse(s, `${b}|${r}|${kits.join('+')}|${code}`);
      if (o) out.push(o);
    }
    return out;
  }
  const kitList = (kits, lang) => kits.length ? kits.map(k => M.KITS[k][lang].toLowerCase()).join(', ') : (lang === 'ru' ? 'без груза сверх ядра' : 'nothing beyond the core');
  // оснащение словами: отличия от рекомендации Совета
  const eqList = (s, eq, lang) => { const d = M.eqDefault(s.mission, s.riskVersion), diff = M.EQUIP.filter(p => eq[p.id] !== d[p.id]);
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
  // Акт III: годы от прибытия; источник сигнала — ε Индейца
  const src = s => s.target === M.SOURCE;
  const vAt = (s, y) => M.speedAt(y, s.beta, s.arrive, s.tMag);
  const heatAgo = s => s.arrive - 5 - Y(s, 0.68);
  // ---- оснащение: что даёт каждая позиция (mission.js: EQUIP). До паспорта — базовое.
  const eqOf = s => s.eq || M.EQ_BASE;
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
  const lossesOf = (s, years) => {
    if (s.wear) { if (years > s.wear.t + 1e-6 && wearOn(s)) LOSS_FUTURE++; return W.losses(s.wear, Math.min(years, s.wear.t)); }
    return M.losses(years, s.watch, capsSafe(s), crewOf(s));
  };
  const shieldAllow = s => eqOf(s).shield === 'dust40' ? 1.5 : 0;       // удвоенный щит держит полтора года износа облака
  const v1 = s => s.riskVersion >= 1;                                   // правила цены ошибки (версия 0 — прежние)
  const supplyS = s => s.riskVersion >= 2 && s.mission === 'supply';      // сюжет снабженца «То, что они разобрали» (DOC: спецификация Codex)
  const rescueS = s => s.riskVersion >= 3 && s.mission === 'rescue';      // сюжет спасателя «Сорок мест» (DOC: спасатель v3, спецификация)
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
  // версия 1: пробой — установленное событие на краю облака, а не вывод из среднего износа
  const breached = s => v1(s) ? !!s.shieldBreach && !s.shieldFixed : s.shieldWear > shieldAllow(s) && !s.shieldFixed;
  // облако (версия 1): в 25% партий в крае — полоса крупной пыли; затмение видит её в 90% случаев
  const CLOUD = { band: 0.25, sense: 0.9, check: 2, dead: 8, patch: 5 };
  const cloudBand = s => (hidden(s, 'contact.cloud.band') ?? 1) < CLOUD.band;
  // правила v5: край облака D2 — место на пути, не год (DOC «Симулятор v1 — время и щит», шаг 4): вход и выход, св. лет
  // от Солнца — из прежнего эталона (0,08c: вход на году 4,6, проход 21 сутки); на разгоне путь β·t²/(2·ACC).
  // Мелкая пыль края — 10 фонов; полоса крупной пыли (скрытый факт cloudBand) — средняя треть края, 40 фонов, и одно
  // крупное зерно 0,500–0,515 мм: его удар считает модель щита (энергия → выбоина → пробой, если не хватило остатка)
  const CLOUD_X = [0.1058, 0.108461292158756], CLOUD_RHO = { edge: 10, band: 40 };
  const cloudYear = (s, x) => Math.sqrt(2 * M.ACC * x / s.beta);
  const edgeIn = s => cloudYear(s, CLOUD_X[0]), edgeOut = s => cloudYear(s, CLOUD_X[1]);
  const edgeAt = s => s.riskVersion >= 5 ? edgeOut(s) : 4.6;            // год записей о проходе края
  const edgeDays = s => Math.round((edgeOut(s) - edgeIn(s)) * 365.25);
  const edgeMonths = (s, lang) => { const m = Math.max(1, Math.round((edgeIn(s) - 4) * 12));
    return lang === 'ru' ? `${m} ${plural(m, ['месяц', 'месяца', 'месяцев'])}` : `${m} month${m === 1 ? '' : 's'}`; };
  // исход полосы для текстов: в v5 — из модели щита, раньше — из «полутора лет износа»
  const bandHit = s => s.riskVersion >= 5 ? !!s.cloudHit : s.shieldWear > 0;
  const bandBreach = s => s.riskVersion >= 5 ? !!(s.cloudHit && s.cloudHit.breached) : !!s.shieldBreach;
  // контур воды (версия 1, контакт): после пробуждения группы Б в 66,5% партий повреждена общая магистраль колец;
  // обычная проверка (7 суток, −2) видит дефект в половине случаев, углублённая (42 суток, −8) — в девяти из десяти
  const LOOP = { common: 0.665, ordinary: { days: 7, cost: 2, sense: 0.5 }, deep: { days: 42, cost: 8, sense: 0.9 }, dead: 31, materials: 20 };
  const loopCommon = s => (hidden(s, 'contact.loop.common') ?? 1) < LOOP.common;
  const loopV1 = s => v1(s) && (!s.mission || s.mission === 'contact');   // снабженец и спасатель — прежние правила
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
  // ---- протокол происшествий (версия 1): наблюдение → проверка → допущение → решение → причина → имена → что можно было
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
  // погибшие — разные люди, выбор задан сидом (детерминирован), в версии 0 имён нет
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
    rescueDock: { ru: 'крепление склада', en: "the store's mount" }, wearGroup: { ru: 'группа без охлаждения', en: 'a group without cooling' }, rescueWake: { ru: 'массовое пробуждение', en: 'mass waking' }, rescueWater: { ru: 'вода старой площадки', en: "the old site's water" } };
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
          dec: inc.route === 'evade' ? 'уходить — слишком поздно' : 'пройти по краю', assume: inc.route === 'evade' ? (s.riskVersion >= 5 ? 'манёвр сократит время в ядре потока' : 'манёвр успеет увести корабль из потока') : 'опасная полоса не пересекает курс', cause: 'полоса крупных частиц на курсе', alt: 'уйти сразу, не дожидаясь измерений' }
          : { what: 'The stream at the Dark Star', obs: 'the impact counters were rising; the model gave 91% for a safe passage',
          check: inc.check ? (inc.found ? 'the measurement showed the band on course' : 'the measurement showed no band') : 'the stream was not measured',
          dec: inc.route === 'evade' ? 'leave — too late' : 'pass along the edge', assume: inc.route === 'evade' ? (s.riskVersion >= 5 ? "the manoeuvre would shorten the time in the stream's core" : 'the manoeuvre would take the ship out of the stream in time') : 'the dangerous band does not cross the course', cause: 'a band of coarse particles on the course', alt: 'leaving at once, without waiting for measurements' }
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
  const roadDead = s => lossesOf(s, s.arrive).total + s.dead;
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
  const aliveOf = s => s.lostShip ? 0 : crewOf(s) - (lossesOf(s, Math.max(0, Math.min(s.year, s.arrive))).total + s.dead + s.deadHere - (s.outpostDead || 0));
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
    if (v5(s) && s.shield) g('shield', ru ? 'щит' : 'shield', shieldGaugeV5(s, lang), SH.observe(s.shield).min); else
    g('shield', ru ? 'щит' : 'shield', breached(s) && s.year < Y(s, 0.25) && !v1(s) ? (ru ? `износ ${pct(s.shieldWear, 'ru')} г. — пробьёт сектор` : `wear ${pct(s.shieldWear, 'en')} yr — will breach a sector`) : breached(s) ? (ru ? 'сектор пробит' : 'sector breached') : s.shieldWear > 0 ? (ru ? `износ ${pct(s.shieldWear, 'ru')} г.` : `wear ${pct(s.shieldWear, 'en')} yr`) : (ru ? 'цел' : 'whole'));
    g('probes', ru ? 'зонды' : 'probes', `${probesOf(s)}`, probesOf(s));
    g('power', ru ? 'энергия у цели' : 'power at target', s.support === 'found' ? (ru ? 'топливо поддержки' : 'support fuel') : powerOK(s) ? M.eqOpt('energy', eqOf(s).energy)[lang].toLowerCase() : (ru ? 'только корабль' : 'the ship only'));
    if (s.support) g('support', ru ? 'поддержка' : 'support', s.support === 'found' ? (ru ? 'найдена' : 'found') : (ru ? 'потеряна' : 'lost'));
    if (s.mission === 'supply' && !s.deliver) g('request', ru ? 'груз заявки' : 'request cargo', !capsKit(s) ? (ru ? 'нет' : 'none') : relayKit(s) ? (ru ? 'передатчик и капсулы' : 'transmitter and capsules') : (ru ? 'только капсулы' : 'capsules only'));
    if (s.mission === 'supply' && (s.deliver || s.outpostDead)) g('outpost', ru ? 'форпост' : 'outpost', (s.deliver ? [s.relayOK ? (ru ? 'связь есть' : 'link up') : (ru ? 'без связи' : 'no link'), s.capsOK ? (ru ? 'капсулы есть' : 'capsules up') : (ru ? 'без капсул' : 'no capsules')] : [])
      .concat(s.shelter ? [ru ? 'люди на корабле' : 'people aboard'] : []).concat(s.outpostDead ? [ru ? `погибли ${s.outpostDead}` : `${s.outpostDead} dead`] : []).join(', '));
    if (s.mission === 'supply' && s.gridBlocks < 2) g('grid', ru ? 'сеть корабля' : 'ship grid', ru ? 'один блок из двух' : 'one block of two');
    g('arrive', ru ? 'прибытие' : 'arrival', `${ru ? 'год' : 'year'} ${s.arrive}`, s.arrive);
    return out;
  }
  // ---- модель времени (правила v5, DOC «Симулятор v1 — время и щит», шаг 3): перемотка продвигает модель корабля.
  // Пока одна система — фронтальный щит: фоновая эрозия по скорости корабля, прибор и приборный журнал. Облако и поток
  // ещё на прежней механике (шаги 4–5); решений модель пока не требует.
  const v5 = s => s.riskVersion >= 5;
  const SIM_TITLE = { ru: 'Приборный журнал · щит', en: 'Instrument log · shield' };
  const SIM_NOTE = 0.05;                                                // кг/м²: шаг сводки износа в журнале
  // среда на пути: множитель фоновой плотности пыли на год y (край облака — только при проходе через край)
  const cloudThrough = s => M.episode(s) === 'cloud' && s.choices['d.cloud'] === 'trust';
  function cloudSpan(s) {
    const a = edgeIn(s), b = edgeOut(s);
    return { a, b, band: [a + (b - a) / 3, a + 2 * (b - a) / 3] };
  }
  const streamOn = src;                                                // предвестник — с точки предупреждения; ядро — по решению о маршруте
  function rhoAt(s, y) {
    const fk = EV.rhoK(s, y); if (fk) return fk;                         // пылевое волокно (события v1)
    if (streamOn(s)) {
      const P = streamPlan(s);
      if (P.coreEnd != null && y >= P.core && y <= P.coreEnd) return STREAM_RHO.core / SH.RULES.rhoDust;
      if (y >= P.warn && y <= P.preEnd) return STREAM_RHO.pre / SH.RULES.rhoDust;
    }
    if (!cloudThrough(s)) return 1;
    const c = cloudSpan(s);
    if (y < c.a || y > c.b) return 1;
    return cloudBand(s) && y >= c.band[0] && y <= c.band[1] ? CLOUD_RHO.band : CLOUD_RHO.edge;
  }
  // имя среды для сводки журнала
  function envOf(s, y) {
    if (EV.rhoK(s, y)) return 'filament';
    if (streamOn(s)) { const P = streamPlan(s);
      if (P.coreEnd != null && y >= P.core && y <= P.coreEnd) return 'core';
      if (y >= P.warn && y <= P.preEnd) return 'pre'; }
    if (cloudThrough(s)) { const c = cloudSpan(s); if (y >= c.a && y <= c.b) return 'cloud'; }
    return 'ism';
  }
  // удар зерна ядра: панель — по площади, радиус и момент — по сиду (только повреждение; последствия — на выходе из ядра)
  function streamGrain(s, t) {
    const beta = M.speedAt(t, s.beta, s.arrive, s.tMag);
    const panel = SH.panelAt(hidden(s, 'shield.stream.hit.0.position') ?? 0.5);
    const a = 1.9e-3 + 0.2e-3 * (hidden(s, 'shield.stream.hit.0.radius') ?? 0.5);
    const h = SH.hit(s.shield, { id: 'stream.hit.0', panel, radius: a, beta, at: t, energy: SH.grainEnergy(a, beta) });
    s.streamImpact = { panel, breached: h.breached, removed: h.removed, residual: h.residual, energy: h.energy, radius: a, beta, at: t };
  }
  // последствия на выходе из ядра: тяжесть — по реальным уязвимостям, а не по формуле прежних правил:
  // +1, если пыль ядра прожгла другое слабое место щита; +1, если после удара корабль оставался в ядре больше суток
  function streamOutcome(s, P) {
    const sh = s.shield, burnt = sh.hits.some(x => x.id !== 'stream.hit.0' && x.state !== 'replaced' && x.residual <= 0);
    const long = (P.coreEnd - P.g) * 365.25 > 1, lv = 1 + (burnt ? 1 : 0) + (long ? 1 : 0);
    s.streamHit = lv; s.streamCause = burnt ? 'shield' : 'power'; Object.assign(s.streamImpact, { level: lv, burnt, out: P.coreEnd, done: P.done });
    if (lv >= 3) { incident(s, 'stream', 0, { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, lost: true, aboard: aliveOf(s), year: P.coreEnd }); s.lostShip = true; return null; }
    s.dead += STREAM.dead[lv]; s.materials -= STREAM_MAT5[lv]; s.streamDead = STREAM.dead[lv]; s.shieldBreach = true; s.shieldFixed = false;
    incident(s, 'stream', STREAM.dead[lv], { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, year: P.coreEnd });
    const h = SH.hitOf(sh, 'stream.hit.0');
    return h.residual < SH.RULES.service ? { id: 'stream.hit.0', kind: 'shieldService', panel: h.panel, cause: 'stream' } : null;
  }
  // эрозия отрезка [y0, y1] при постоянном множителе среды и сводка журнала — не на каждую перемотку (тиков в
  // журнале нет): когда с прошлой снято SIM_NOTE кг/м², и у цели
  function erodeSpan(s, y0, y1, k) {
    const r = SH.erode(s.shield, y0, y1, y => M.speedAt(y, s.beta, s.arrive, s.tMag), SH.RULES.rhoDust * k);
    if (y1 > y0) s.shield.flux = { at: y1, w: r.energy / ((y1 - y0) * SH.YEAR_S) };   // последний измеренный поток, Вт/м² (для прогноза осмотра)
    const acc = s.shield.acc || (s.shield.acc = { y0, dSigma: 0, energy: 0, env: [] });
    acc.dSigma += r.dSigma; acc.energy += r.energy;
    const env = envOf(s, (y0 + y1) / 2); if (!(acc.env || (acc.env = [])).includes(env)) acc.env.push(env);
    if (acc.dSigma >= SIM_NOTE || (y1 >= s.arrive && acc.dSigma > 0)) {
      const o = SH.observe(s.shield);                                  // наблюдение — на момент сводки, не на момент выдачи в журнал
      SH.note(s.shield, { kind: 'summary', y0: acc.y0, y1, dSigma: acc.dSigma, flux: acc.energy / ((y1 - acc.y0) * SH.YEAR_S), env: acc.env,
        obs: { min: o.min, at: o.at, hurt: o.damaged.length > 0, bulk: Math.min(...s.shield.sigma) } });
      s.shield.acc = { y0: y1, dSigma: 0, energy: 0, env: [] };
    }
  }
  // удар крупного зерна полосы: панель — по площади, радиус и момент — по сиду; пробой — люди за сектором
  function cloudHit(s, t) {
    const sh = s.shield, beta = M.speedAt(t, s.beta, s.arrive, s.tMag);
    const panel = SH.panelAt(hidden(s, 'shield.cloud.hit.0.position') ?? 0.5);
    const a = (0.5 + 0.015 * (hidden(s, 'shield.cloud.hit.0.radius') ?? 0.5)) * 1e-3;
    const h = SH.hit(sh, { id: 'cloud.hit.0', panel, radius: a, beta, at: t, energy: SH.grainEnergy(a, beta) });
    s.cloudHit = { panel, breached: h.breached, removed: h.removed, residual: h.residual, energy: h.energy, radius: a, beta, at: t };
    if (h.breached) {                                                  // за сектором — жилой отсек: потери — сценарный слой
      s.shieldBreach = true; s.dead += CLOUD.dead; s.cloudDead = CLOUD.dead;
      incident(s, 'cloud', CLOUD.dead, { check: s.cloudCheck, found: s.cloudFound, year: t });
    }
    // решение — если в месте удара не осталось сервисного допуска (удвоенный щит держит с запасом — без решения)
    return h.residual < SH.RULES.service ? { id: 'cloud.hit.0', kind: 'shieldService', panel } : null;
  }
  // ---- общий календарь модели (DOC «Долгий рейс — износ и смена курса», шаг 1): ход идёт от границы к границе.
  // Следующая граница — ближайшая из источников на [t0, t1]; при равенстве дат — порядок источников в CAL (постоянный,
  // проверяется тестом). Между границами — непрерывная часть (эрозия щита при постоянной среде), на границе — дискретная:
  // событие, удар, выход из ядра. Источник одноразов на своей дате: после go() он её больше не предлагает. Каждая
  // граница — запись в журнал запасов и людей с причиной. Модель износа добавит отказы узлов, исчерпание буферов и
  // завершение ремонтов
  function envMarks(s) {                                               // где меняется множитель пыли: волокно, облако, поток
    const m = EV.marks(s);
    if (cloudThrough(s)) { const c = cloudSpan(s); m.push(c.a, c.b, c.band[0], c.band[1]); }
    if (streamOn(s)) { const P = streamPlan(s); m.push(P.warn, P.core, P.preEnd); if (P.coreEnd != null) m.push(P.coreEnd); }
    return m;
  }
  // ---- износ корабля (DOC «Долгий рейс — износ и смена курса», шаг 2; план — «Ревью Codex — износ, шаг 2»).
  // Модель — wear.js; здесь — подключение к партии: создание при отлёте, граница календаря, ответы на отказы.
  // Включена в правилах 5 (шаг 2f); ctx.wear: false — партия без модели (сравнение в калибровке).
  // модель идёт, пока экспедиция сама ведёт корабль: после сигнала бедствия людей ведёт модель спасения (M.survivors)
  const wearOn = s => v5(s) && !!s.wearOn && !s.sos && !s.lostShip && !s.dutchman;
  const wearRnd = s => key => hidden(s, key);
  // бодрствующие на год y: до года 2 на ногах весь экипаж, до передачи полномочий (год 8) — шестьдесят, дальше — вахта;
  // у цели (год прибытия) зал будят — капсулы больше не держат людей
  const awakeAt = s => [2, 8].concat(s.arrive ? [arriveView(s)] : []);
  // группа Б разбужена — двадцать на ногах сверх вахты, пока не случилась авария магистрали (дальше сюжет называет вахту сам)
  const awakeNowAt = (s, y) => y < 2 ? crewOf(s) : s.arrive && y >= arriveView(s) ? crewOf(s) : y < 8 ? 60 : s.watch + (s.groupB === 'woken' && !s.loopDead ? 20 : 0);
  const awakeNow = s => awakeNowAt(s, s.year);
  const WEAR_OPS = { reroute: 0.5, pump: 1, cooler: 0.25, control: 0.1, move: 0.25 };   // материалы, % запаса
  // места сюжетных героев на карте зала (game.js NAMED: Дассер, Дал, Лорн, Ландис, Осгер) — случайные отказы их не выбирают
  const CAST_SEATS = [0, 1, 50, 162, 282];
  // ложатся в капсулы на году 2: живые сверх шестидесяти на вахте (с моделью — по реестру)
  const sleepersAt2 = s => (s.wear ? s.wear.ps.split('').filter(c => c !== 'D').length : crewOf(s)) - 60;
  const WEAR_DAYS = { pump: 7, cooler: 0.5, control: 0.25, move: 0.5 };                 // сутки работы бригады
  // ремонтные бригады по двое: технических специалистов — вахта/6, двое из них заняты регламентом (ревью Codex, A5)
  const crews = s => Math.max(1, Math.floor((Math.floor(s.watch / 6) - 2) / 2));
  function wearStart(s) {
    if (!wearOn(s) || s.wear || !s.eq) return;
    s.wear = W.create({ crew: crewOf(s), watch: awakeNow(s), reserved: Math.max(0, M.CREW - crewOf(s)), safe: capsSafe(s), at: s.year, protect: CAST_SEATS });
  }
  // люди: погибшие сюжета и происшествий — в реестр модели, погибшие модели — в реестр сюжета (deadIds): никто не
  // погибает дважды (полный единый учёт людей — подшаг 2d)
  function wearSyncDead(s, t) {
    const w = s.wear; if (!w) return;
    const ids = new Set(s.deadIds || []);
    for (const x of s.incidents || []) if ((x.pop || 'crew') === 'crew') for (const i of x.ids || []) ids.add(i);
    const fresh = [...ids].filter(i => i < w.crew && w.ps[i] !== 'D');
    if (fresh.length) W.recordDeaths(w, fresh, Math.max(w.t, t));
  }
  const wearDead = (s, ids) => { s.deadIds = [...new Set((s.deadIds || []).concat(ids))]; };
  // вахта изменилась сценой или решением — люди в зале по новому счёту (с той же даты); заснувшие группы с неисправным
  // оборудованием получают ремонт
  function wearSync(s) {
    const w = s.wear; if (!w) return;
    wearSyncDead(s, s.year);
    const n = awakeNow(s), t = Math.max(w.t, s.year);
    W.setRoad(w, !(s.arrive && s.year >= arriveView(s)), t);             // фон пути — до прибытия
    if (n !== w.watchN) { W.setAwake(w, n, t); wearCheckGroups(s, t); }
    // снабженец: резервный блок сгорел под вспышками — блок PB2 выбыл, перемычка держит шину (причина — в журнале модели)
    if (s.gridBlocks < 2 && w.nodes.PB2.ok) { W.fail(w, 'PB2', t, 'supply.flares'); w.link.tie = true; W.recompute(w, t); }
  }
  // «Отказал насос L2 (поколение 1, коллектору — 84 года).»
  const pumpFail = (w, L, lang) => { const o = W.observe(w), x = o.loops.find(l => l.id === L);
    return lang === 'ru' ? `Отказал насос ${L} (поколение ${x.pumpGen + 1}, коллектору — ${yrs(x.collAge)}).` : `Pump ${L} failed (generation ${x.pumpGen + 1}; the collector is ${Math.round(x.collAge)} years old).`; };
  const layout = w => W.LOOPS.map(L => W.loopRuns(w, L) ? String(W.loopLoad(w, L)) : '–').join('·');
  function wearNote(s, ru, en) { const w = s.wear; w.noteK = (w.noteK || 0) + 1; w.notes.push({ at: s.year, ru, en, k: w.noteK }); }   // k — сквозной номер записи
  // группы контура L на работающие контуры: перестановка автоматикой (обратимая, сразу), 0,5% материалов (сколько есть).
  // Мест не хватает — переводится сколько помещается; возвращает { plan, left } (left — группы на тепловом резерве)
  function wearReroute(s, L, t) {
    const w = s.wear, r = W.reroutePlan(w, L);
    if (Object.keys(r.plan).length) { const d = Math.min(WEAR_OPS.reroute, Math.max(0, s.materials)); W.relink(w, r.plan, t); s.materials -= d;
      if (d) wearMove$(s, t, -d, `перестановка групп контура ${L}`, `rerouting loop ${L}'s groups`); }
    return r;
  }
  // операция: материалы и деталь — при запуске, исправность — при завершении (календарь модели). Бригада одна на работу:
  // свободной нет — работа ждёт ту, что освободится раньше. Аврал (urgent: группы без охлаждения) — все свободные сейчас
  // бригады разом: трудоёмкость делится на их число (14 человеко-суток насоса при трёх бригадах — 2,3 суток).
  // Материалов не хватает — работы нет (null)
  function wearOp(s, kind, id, t, urgent) {
    const w = s.wear, cost = WEAR_OPS[kind], n = crews(s);
    if (s.materials < cost - 1e-9) return null;
    const busy = (o, k) => !o.done && (o.crews ? o.crews.includes(k) : o.crew === k);
    const free = Array.from({ length: n }, (_, k) => w.ops.reduce((a, o) => busy(o, k) ? Math.max(a, o.until) : a, t));
    const idle = urgent ? free.map((f, k) => f <= t + 1e-12 ? k : -1).filter(k => k >= 0) : [];
    const crew = idle.length ? idle[0] : free.indexOf(Math.min(...free)), start = idle.length ? t : free[crew], team = idle.length > 1 ? idle : null;
    const op = { id: `op.${kind}.${id}.${w.ops.length}`, kind, target: id, at: t, start, until: start + WEAR_DAYS[kind] / (team ? team.length : 1) / 365.25, crew };
    if (team) op.crews = team;
    w.ops.push(op); s.materials -= cost;
    const u = id.split('.')[0], NM = { pump: [`замена насоса ${u}`, `replacing the ${u} pump`], cooler: [`замена холодильника группы ${u}`, `replacing group ${u}'s cooler`],
      control: [`замена управления группы ${u}`, `replacing group ${u}'s control`], move: [`перекладка группы ${u}`, `moving group ${u}`] }[kind];
    wearMove$(s, t, -cost, NM[0], NM[1]);
    if (kind === 'pump') w.inv.pump--; else if (kind === 'cooler') w.inv.cooler--; else if (kind === 'control') w.inv.control--;
    return op;
  }
  // изменение запаса работой износа — с причиной (отчёт вахты: «Материалы: −1% — замена насоса L2»)
  function wearMove$(s, t, d, ru, en) { (s.wear.moves = s.wear.moves || []).push({ at: t, key: 'materials', d, name: { ru, en } }); }
  const pendingFor = (w, target) => w.ops.some(o => !o.done && o.target === target);
  // спящих группы — в свободные исправные капсулы охлаждаемых групп (двое за 12 часов, 0,25% материалов); мест мало — никого
  function wearMove(s, g, t) {
    const w = s.wear, n = W.groupPeople(w, g).sleep.length, seats = W.freeSeats(w, g);
    if (!n || seats.length < n || pendingFor(w, g) || !wearOp(s, 'move', g, t)) return false;
    wearNote(s, `Группу ${g} переводят в свободные капсулы других групп: ${ppl(n)}, двенадцать часов работы.`, `Group ${g} is being moved into free capsules of other groups: ${n} people, twelve hours of work.`);
    return true;
  }
  // неисправный холодильник или управление занятой группы: замена из запаса, иначе перекладка, иначе — тепловой резерв
  function wearUnit(s, g, part, t) {
    const w = s.wear, kind = part === 'cool' ? 'cooler' : 'control';
    if (w.inv[kind] > 0 && wearOp(s, kind, `${g}.${part}`, t)) return;
    if (wearMove(s, g, t)) return;
    wearNote(s, `Отказал${kind === 'cooler' ? ' холодильник' : 'о управление'} группы ${g}; ${w.inv[kind] > 0 ? 'материалов на замену нет' : kind === 'cooler' ? 'запасных холодильников нет' : 'запасных блоков управления нет'}, свободных капсул мало. Группа на тепловом резерве.`,
      `Group ${g} ${kind === 'cooler' ? 'cooler' : 'control'} failed; ${w.inv[kind] > 0 ? 'no materials for the replacement' : `no spare ${kind === 'cooler' ? 'coolers' : 'control units'}`}, too few free capsules. The group is on its thermal reserve.`);
  }
  // занятые группы на остановленном контуре — перестановка автоматикой (сколько помещается, остальные — в свободные
  // капсулы); занятые группы с неисправным оборудованием и без начатой работы (группа заснула, работа сорвалась) — в работу
  function wearCheckGroups(s, t) {
    const w = s.wear;
    for (const L of W.LOOPS) if (!W.loopRuns(w, L) && W.loopLoad(w, L) > 0) { const rr = wearReroute(s, L, t); for (const g of rr.left) wearMove(s, g, t); }
    const c = W.census(w);
    for (const g of W.GIDS) {
      if (!c[g].sleep.length || pendingFor(w, g)) continue;
      for (const part of ['cool', 'ctrl']) if (!w.nodes[`${g}.${part}`].ok && !pendingFor(w, `${g}.${part}`)) { wearUnit(s, g, part, t); break; }
    }
  }
  function wearOpDone(s, id, t) {
    const w = s.wear, op = w.ops.find(o => o.id === id); if (!op || op.done) return null;
    op.done = true;
    if (op.kind === 'move') { const n = W.moveSleepers(w, op.target, t);
      wearNote(s, n ? `Группа ${op.target} переложена: ${ppl(n)} в капсулах других групп.` : `Группу ${op.target} переложить не удалось: свободных капсул не осталось.`,
        n ? `Group ${op.target} moved: ${n} people in other groups' capsules.` : `Group ${op.target} could not be moved: no free capsules left.`);
      wearCheckGroups(s, t); return null; }
    const unit = op.target.split('.')[0];
    W.install(w, op.target, t);
    const home = op.kind === 'pump' ? W.rehome(w, t) : 0;                // восстановленный контур забирает свои группы; чужие — домой, где есть место
    wearNote(s, op.kind === 'pump' ? `Насос ${unit} заменён из запаса${home ? '; группы вернулись на свои контуры' : ''}. Схема ${layout(w)}.`
      : op.kind === 'cooler' ? `Холодильник группы ${unit} заменён из запаса.` : `Управление группы ${unit} заменено из запаса.`,
      op.kind === 'pump' ? `The ${unit} pump replaced from stock${home ? '; the groups are back on their loops' : ''}. Layout ${layout(w)}.`
        : op.kind === 'cooler' ? `Group ${unit} cooler replaced from stock.` : `Group ${unit} control replaced from stock.`);
    wearCheckGroups(s, t);
    return null;
  }
  // острая гибель группы (буфер исчерпан) — происшествие с именами; одиночные отказы капсул — фон модели (учёт людей — 2d)
  function wearDeaths(s, rec) {
    if (!rec || !rec.ids || !rec.ids.length) return;
    wearDead(s, rec.ids);
    if (rec.kind === 'buffer') { const kept = !!(s.wearKept && s.wearKept[rec.group] != null && rec.at - s.wearKept[rec.group] < 0.05);   // остались без охлаждения при политике «беречь запас»
      s.dead += rec.ids.length; incident(s, 'wearGroup', rec.ids.length, { ids: rec.ids, group: rec.group, kept }); }
  }
  const pumpSpare = s => s.wear.inv.pump > 0 && s.materials >= WEAR_OPS.pump - 1e-9;
  // отказ узла: обратимая автоматика сразу; карточка — когда есть настоящий выбор (перестановка покрыла все группы, а
  // это первый отказ контура или последний запасной насос); иначе — принятая политика или единственный путь, в ведомость
  function wearRespond(s, rec) {
    const w = s.wear, t = rec.at, [unit, part] = rec.id.split('.');
    if (part === 'pump') {
      const rr = wearReroute(s, unit, t), full = !rr.left.length, spare = pumpSpare(s);
      // контур был пуст (зал ещё не спит) — выбирать нечего: штатная замена из запаса
      if (!Object.keys(rr.plan).length && !rr.left.length) {
        if (spare && wearOp(s, 'pump', rec.id, t)) wearNote(s, `${pumpFail(w, unit, 'ru').slice(0, -1)}; групп на нём нет. Насос меняют из запаса.`, `${pumpFail(w, unit, 'en').slice(0, -1)}; no groups on it. The pump is being replaced from stock.`);
        else wearNote(s, `${pumpFail(w, unit, 'ru').slice(0, -1)}; групп на нём нет. Запасного насоса нет.`, `${pumpFail(w, unit, 'en').slice(0, -1)}; no groups on it. No spare pump.`);
        return null;
      }
      if (spare && full && (!s.wearPolicy || w.inv.pump === 1)) { s.wearAsked = (s.wearAsked || 0) + 1; return { kind: 'wear', type: 'loop', loop: unit, plan: rr.plan, at: t }; }   // счёт карточек — для калибровки
      for (const g of rr.left) wearMove(s, g, t);                       // не поместились на контуры — в свободные капсулы, если есть
      // перестановка больше не покрывает отказ: политика «беречь запас» кончилась вместе с запасом мощности — сначала
      // аврал на этом контуре (все свободные бригады), затем, спокойно, насосы контуров, прежде оставленных выключенными
      const ended = !full && s.wearPolicy === 'reroute';
      if (ended) { s.wearPolicy = 'replace'; s.wearKept = Object.assign(s.wearKept || {}, Object.fromEntries(rr.left.map(g => [g, t]))); }   // их гибель — цена «беречь запас»
      if (spare && (s.wearPolicy === 'replace' || !full) && pumpSpare(s) && wearOp(s, 'pump', rec.id, t, !full)) {   // группы без охлаждения — аврал
        if (ended) for (const L2 of W.LOOPS) if (L2 !== unit && !w.nodes[L2 + '.pump'].ok && !pendingFor(w, L2 + '.pump') && w.inv.pump > 0 && pumpSpare(s)) wearOp(s, 'pump', L2 + '.pump', t);
        const op = w.ops.find(o => !o.done && o.target === rec.id), days = nf((op.until - op.start) * 365.25, 1, 'ru'), daysEn = nf((op.until - op.start) * 365.25, 1, 'en');
        wearNote(s, `${pumpFail(w, unit, 'ru')} ${full ? 'Группы переведены на другие контуры' : `Перестановкой всех групп не покрыть — насос меняют авралом: ${op.crews ? `${op.crews.length} бригады` : 'одна бригада'}, ${days} сут.`}${full ? '; насос меняют из запаса (неделя).' : ''}`,
          `${pumpFail(w, unit, 'en')} ${full ? 'The groups moved to other loops; the pump is being replaced from stock (a week).' : `Rerouting cannot cover every group — an all-hands pump replacement: ${op.crews ? `${op.crews.length} crews` : 'one crew'}, ${daysEn} days.`}`);
        return null;
      }
      wearNote(s, full ? `${pumpFail(w, unit, 'ru')} Группы переведены на другие контуры: схема ${layout(w)}.${w.inv.pump ? '' : ' Запасных насосов нет.'}`
        : `${pumpFail(w, unit, 'ru')} Перестановкой всех групп не покрыть — часть зала на тепловом резерве.`,
        full ? `${pumpFail(w, unit, 'en')} The groups moved to other loops: layout ${layout(w)}.${w.inv.pump ? '' : ' No spare pumps.'}`
          : `${pumpFail(w, unit, 'en')} Rerouting cannot cover every group — part of the hall is on its thermal reserve.`);
      return null;
    }
    if ((part === 'cool' || part === 'ctrl') && W.groupPeople(w, unit).sleep.length > 0) wearUnit(s, unit, part, t);   // пустая группа — при заселении (wearCheckGroups)
    return null;
  }
  function wearFire(s, b) {
    const w = s.wear, t = b.at;
    if (b.kind === 'awake') { wearSync(s); return null; }
    if (b.kind === 'op') return wearOpDone(s, b.id, t);
    if (b.kind === 'capsule') { wearDeaths(s, W.capsuleFail(w, b.id, t, wearRnd(s))); return null; }
    if (b.kind === 'med') { wearDeaths(s, W.bgDeath(w, b.id, t, wearRnd(s))); return null; }
    if (b.kind === 'buffer') { const r = W.bufferFail(w, b.id, t); wearDeaths(s, r);
      wearNote(s, `Группа ${r.group}: тепловой резерв исчерпан. Погибли ${ppl(r.ids.length)}.`, `Group ${r.group}: the thermal reserve ran out. ${r.ids.length} dead.`); return null; }
    if (b.kind === 'fail') return wearRespond(s, W.fail(w, b.id, t));
    return null;
  }
  // граница модели износа в [t0, t1]: смена числа бодрствующих (годы 2, 8, прибытие — пока не применена, в том числе на
  // дате, где уже сработал другой источник) — раньше отказов той же даты; затем граница модели
  function wearNext(s, t0, t1) {
    if (!wearOn(s) || !s.wear) return null;
    const w = s.wear, aw = awakeAt(s).filter(y => y >= t0 - 1e-12 && y <= t1 && awakeNowAt(s, y) !== w.watchN).sort((a, b) => a - b)[0];
    const b2 = W.nextBoundary(w, t0, aw != null ? aw : t1, wearRnd(s));
    const nx = aw != null && !(b2 && b2.at < aw - 1e-12) ? { at: Math.max(t0, aw), kind: 'awake', id: 'awake' } : b2;
    if (!nx) return null;
    return { at: nx.at, cause: `wear.${nx.kind}.${nx.id}`, go: () => { s.year = Math.max(s.year, nx.at); return wearFire(s, nx); } };
  }
  // карточка «Контур остановлен»: автоматика уже перевела группы; выбор — вернуть независимую схему или беречь запас
  function wearDecision(s, ev) {
    const L = ev.loop, full = true, moved = Object.keys(ev.plan || {});   // карточка — только когда перестановка покрыла все группы
    return {
      id: 'd.wear.loop', scene: 'vault', overlay: 'sleepers', kind: 'decision',
      title: { ru: `Контур ${L} остановлен`, en: `Loop ${L} stopped` },
      rec: x => ({ id: 'replace', why: { ru: 'независимая схема переживёт следующий отказ контура', en: 'an independent layout survives the next loop failure' } }),
      context: {
        ru: x => { const w = x.wear, o = W.observe(w);
          return `${pumpFail(w, L, 'ru')} ` + (full ? `Автоматика перевела ${moved.length} ${plural(moved.length, ['группу', 'группы', 'групп'])} на другие контуры: схема ${layout(w)}, предел контура — ${W.MAX}. ${(n => n ? `Свободной мощности — на ${n === 1 ? 'одну группу' : `${n} ${plural(n, ['группу', 'группы', 'групп'])}`}.` : 'Свободной мощности больше нет.')(o.loops.reduce((a, l) => a + (l.runs ? l.max - l.load : 0), 0))}`
            : `Перевести все группы на другие контуры нельзя: часть зала на тепловом резерве — ${W.BUF[w.safe ? 'safe' : 'std']} часов.`) + ` Насосов в запасе: ${w.inv.pump}.`; },
        en: x => { const w = x.wear, o = W.observe(w);
          return `${pumpFail(w, L, 'en')} ` + (full ? `The automation moved ${moved.length} group${moved.length === 1 ? '' : 's'} to other loops: layout ${layout(w)}, loop limit ${W.MAX}.`
            : `Not every group can move to other loops: part of the hall is on its thermal reserve — ${W.BUF[w.safe ? 'safe' : 'std']} hours.`) + ` Spare pumps: ${w.inv.pump}.`; }
      },
      options: x => [{
        id: 'replace',
        label: { ru: 'Поставить запасной насос', en: 'Fit a spare pump' },
        known: {
          ru: y => [`Неделя работы двух механиков; насос из запаса (останется ${y.wear.inv.pump - 1}), материалы −${WEAR_OPS.pump}%.`, full ? 'Группы вернутся на свой контур; независимая схема восстановится.' : 'Группы без охлаждения ждут неделю — дольше их теплового резерва.', `Коллектор ${L} остаётся прежним.`],
          en: y => [`A week for two mechanics; a pump from stock (${y.wear.inv.pump - 1} left), materials −${WEAR_OPS.pump}%.`, full ? 'The groups return to their loop; the independent layout is restored.' : 'The uncooled groups wait a week — longer than their thermal reserve.', `The ${L} collector stays the old one.`]
        },
        cost: y => { y.materials -= WEAR_OPS.pump; },
        effect: y => { y.wearPolicy = 'replace'; wearOp(y, 'pump', `${L}.pump`, y.year); },
        record: { ru: `Запасной насос ${L} ставят; группы вернутся на свой контур через неделю.`, en: `A spare ${L} pump is being fitted; the groups return to their loop in a week.` }
      }].concat(full ? [{
        id: 'reroute',
        label: { ru: 'Оставить перестановку', en: 'Keep the rerouting' },
        known: {
          ru: y => ['Насос остаётся в запасе.', `Схема ${layout(y.wear)}: перегруженные насосы стареют в ${nf(Math.pow(W.MAX / W.NOM, 3), 1, 'ru')} раза быстрее.`,
            `Следующий отказ контура перестановкой не покрыть: насос будут менять авралом, всеми бригадами вахты (${nf(WEAR_DAYS.pump / crews(y), 1, 'ru')} сут. при нынешней вахте), а теплового резерва у групп — ${W.BUF[y.wear.safe ? 'safe' : 'std']} часов.`],
          en: y => ['The pump stays in stock.', `Layout ${layout(y.wear)}: the overloaded pumps age ${nf(Math.pow(W.MAX / W.NOM, 3), 1, 'en')} times faster.`,
            `The next loop failure cannot be covered by rerouting: the pump will be replaced all-hands, by every crew of the watch (${nf(WEAR_DAYS.pump / crews(y), 1, 'en')} days with today's watch), and the groups' thermal reserve is ${W.BUF[y.wear.safe ? 'safe' : 'std']} hours.`]
        },
        effect: y => { y.wearPolicy = 'reroute'; },
        record: { ru: `Контур ${L} остаётся выключенным; группы работают на трёх контурах.`, en: `Loop ${L} stays off; the groups run on three loops.` }
      }] : [])
    };
  }
  const inSpan = (t, t0, t1) => t != null && t >= t0 && t <= t1;
  const CAL = [
    // события v1, работы, плановый совет; решение — вставка посреди перемотки
    { id: 'events', next: (s, t0, t1) => { const b = EV.next(s, t0, t1);
      return b && { at: b.at, cause: b.type ? `ev.${b.type}` : b.job ? `job.${b.job.id}` : 'ev.council', go: () => { s.year = b.at; return EV.fire(s, b); } }; } },
    // удар крупного зерна полосы облака
    { id: 'cloudHit', next: (s, t0, t1) => {
      if (!cloudThrough(s) || !cloudBand(s) || SH.hitOf(s.shield, 'cloud.hit.0')) return null;
      const c = cloudSpan(s), t = c.band[0] + (hidden(s, 'shield.cloud.hit.0.time') ?? 0.5) * (c.band[1] - c.band[0]);
      return inSpan(t, t0, t1) && { at: t, cause: 'cloud.hit', go: () => { const ev = cloudHit(s, t); if (ev) s.year = t; return ev; } }; } },
    // зерно ядра потока: только повреждение
    { id: 'streamGrain', next: (s, t0, t1) => {
      if (!streamOn(s)) return null;
      const P = streamPlan(s);
      return P.hit && !SH.hitOf(s.shield, 'stream.hit.0') && inSpan(P.g, t0, t1) && { at: P.g, cause: 'stream.grain', go: () => { streamGrain(s, P.g); return null; } }; } },
    // выход из ядра: последствия удара (перемотка могла встать между ударом и выходом)
    { id: 'streamOut', next: (s, t0, t1) => {
      if (!streamOn(s) || !(s.streamImpact && s.streamImpact.level == null)) return null;
      const P = streamPlan(s);
      return P.hit && inSpan(P.coreEnd, t0, t1) && { at: P.coreEnd, cause: 'stream.out', go: () => { const ev = streamOutcome(s, streamPlan(s)); if (ev || s.lostShip) s.year = P.coreEnd; return ev; } }; } },
    // границы среды: только смена множителя пыли (строго после t0 — граница, на которой стоим, пройдена)
    { id: 'env', next: (s, t0, t1) => { let m = null; for (const t of envMarks(s)) if (t > t0 && t <= t1 && (m == null || t < m)) m = t;
      return m != null && { at: m, cause: null, go: () => null }; } },
    // износ корабля: смена бодрствующих, завершение операций, отказы узлов, одиночные капсулы, исчерпание буферов
    { id: 'wear', next: wearNext }
  ];
  function calNext(s, t0, t1) {
    let nx = null;
    for (const src of CAL) { const c = src.next(s, t0, t1); if (c && (!nx || c.at < nx.at)) nx = c; }   // при равенстве — раньше по порядку
    return nx;
  }
  function simAdvance(s, target) {
    if (!s.shield && s.eq) { s.shield = SH.create(s.eq.shield); s.simYear = s.year; SH.note(s.shield, { kind: 'accept' }); }
    wearStart(s);
    const from = s.simYear != null ? s.simYear : s.year;
    // и при target === from: решение-вставка могло встать на дате, где осталась необработанная граница (удар на той же дате)
    if (s.shield && target >= from) {
      let t0 = from;
      for (let guard = 0; ; guard++) {
        if (guard > 100000) throw new Error(`Календарь модели не продвигается: год ${t0}`);
        const nx = calNext(s, t0, target), t1 = nx ? nx.at : target;
        if (t1 > t0) { erodeSpan(s, t0, t1, rhoAt(s, (t0 + t1) / 2)); t0 = t1; s.simYear = t1; if (s.wear && wearOn(s)) W.touch(s.wear, t1); }   // модель износа дошла до t1
        if (!nx) break;
        const ev = nx.go();
        if (s.wear) wearSyncDead(s, t1);                                // погибшие события или удара — и в реестре модели
        if (nx.cause) book(s, nx.cause, t1);
        if (ev) return ev;
      }
    }
    s.year = Math.max(s.year, target);                                   // перемотка ставит год цели; пройденная цель — уже достигнута
    return null;
  }
  // решение по повреждению щита (вставка модели посреди перемотки)
  const beltOf = id => SH.PANELS[SH.panelIndex(id)].belt;
  const canReplace = (s, panel) => !!s.repairQual && s.shield.spares[beltOf(panel)] > 0 && s.materials >= SHIELD_WORK.replace;
  const SHIELD_WORK = { patch: 5, replace: 3 };
  function serviceDecision(st, ev) {
    const panel = ev.panel, hitId = ev.id, cause = ev.cause || 'cloud', rec5 = s => cause === 'stream' ? s.streamImpact : s.cloudHit;
    if (cause === 'stream') return Object.assign(serviceOptions(panel, hitId, rec5, cause), {
      id: 'd.shieldService.stream', scene: 'shield', overlay: 'shield', inspect: panel, kind: 'decision',
      title: { ru: `Пробита панель щита ${panel}`, en: `Shield panel ${panel} breached` },
      context: {
        ru: s => { const h = s.streamImpact; return `Ядро потока. Зерно около ${nf(h.radius * 1000, 1, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж: панель ${panel} пробита насквозь. ${streamLossLine(s, 'ru')} Щит с открытой пробоиной в 0,06 м².`; },
        en: s => { const h = s.streamImpact; return `The stream's core. A grain of about ${nf(h.radius * 1000, 1, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ: panel ${panel} breached through. ${streamLossLine(s, 'en')} The shield has an open hole of 0.06 m².`; }
      }
    });
    return Object.assign(serviceOptions(panel, hitId, rec5, cause), {
      id: 'd.shieldService.cloud', scene: 'shield', overlay: 'shield', inspect: panel, kind: 'decision',
      title: { ru: `Пробита панель щита ${panel}`, en: `Shield panel ${panel} breached` },
      context: {
        ru: s => { const h = s.cloudHit; return `Полоса крупной пыли. Зерно около ${nf(h.radius * 1000, 2, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж. В месте удара выбито ${nf(h.removed, 1, 'ru')} кг/м² из ${s.shield.nominal}: панель ${panel} пробита насквозь. За ней — жилой отсек: разгерметизация, погибли ${ppl(s.cloudDead)} смены, отсек перекрыт. Щит с открытой пробоиной в 0,06 м².`; },
        en: s => { const h = s.cloudHit; return `A band of coarse dust. A grain of about ${nf(h.radius * 1000, 2, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ. ${nf(h.removed, 1, 'en')} kg/m² of ${s.shield.nominal} knocked out at the impact point: panel ${panel} is breached through. Behind it, a living compartment: decompression, ${s.cloudDead} of the shift dead, the compartment sealed. The shield has an open hole of 0.06 m².`; }
      }
    });
  }
  // варианты обслуживания пробитой панели (общие для облака и потока); rec5(s) — запись удара в состоянии
  // другие открытые повреждения щита (кроме панели panel) — для честных текстов замены
  const DMG = { breached: ['пробоина', 'hole'], patched: ['заплата', 'patch'], scarred: ['выбоина', 'scar'] };
  const otherDmg = (s, panel, lang) => SH.observe(s.shield).damaged.filter(d => d.panel !== panel)
    .map(d => `${d.panel} — ${DMG[d.state] ? DMG[d.state][lang === 'ru' ? 0 : 1] : d.state}`).join(', ');
  const fullLine = (s, panel, lang) => { const o = otherDmg(s, panel, lang);
    return lang === 'ru' ? (o ? `Панель ${panel} снова держит полный расчёт; другие повреждения щита остаются: ${o}.` : 'Щит снова держит полный расчёт.')
      : (o ? `Panel ${panel} holds its full rating again; other shield damage remains: ${o}.` : 'The shield holds its full rating again.'); };
  function serviceOptions(panel, hitId, rec5, cause) {
    return {
      rec: s => canReplace(s, panel) ? { id: 'replace', why: otherDmg(s, panel, 'ru') ? { ru: `запасная панель есть — панель ${panel} снова держит полный расчёт`, en: `a spare panel is aboard — panel ${panel} holds its full rating again` }
          : { ru: 'запасная панель есть — щит снова держит полный расчёт', en: 'a spare panel is aboard — the shield holds its full rating again' } }
        : { id: 'patch', why: { ru: 'открытая пробоина пропустит следующий удар', en: 'an open hole lets the next impact through' } },
      options: s => [{
        id: 'replace',
        label: { ru: `Заменить панель ${panel} запасной`, en: `Replace panel ${panel} with a spare` },
        known: {
          ru: x => [`Запасных панелей пояса ${beltOf(panel)} в трюме: ${x.shield.spares[beltOf(panel)]}.`, `Роботы с тыльной стороны, 16 часов; крепёж — материалы для высадки −${SHIELD_WORK.replace}%.`, fullLine(x, panel, 'ru')],
          en: x => [`Spare belt ${beltOf(panel)} panels in the hold: ${x.shield.spares[beltOf(panel)]}.`, `Robots from the rear side, 16 hours; fasteners from the landing materials −${SHIELD_WORK.replace}%.`, fullLine(x, panel, 'en')]
        },
        cost: x => { x.materials -= SHIELD_WORK.replace; },
        effect: x => { SH.replace(x.shield, panel, x.year); x.materials -= SHIELD_WORK.replace; EV.scrap(x, SHIELD_WORK.replace); x.shieldFixed = !SH.observe(x.shield).damaged.some(d => d.residual <= 0); rec5(x).repair = 'replace'; },
        record: { ru: x => `Панель ${panel} снята целиком, на её место встала запасная. ${fullLine(x, panel, 'ru')}`, en: x => `Panel ${panel} removed whole, a spare fitted in its place. ${fullLine(x, panel, 'en')}` }
      }, {
        id: 'patch',
        label: { ru: 'Поставить аварийную заплату', en: 'Fit an emergency patch' },
        known: {
          ru: [`48 часов работы; материалы для высадки −${SHIELD_WORK.patch}%.`, `Пробоина закрыта: в месте удара ${SH.RULES.patch} кг/м² вместо полного расчёта.`, cause === 'stream' ? 'Слабое место остаётся до прибытия.' : 'Слабое место остаётся — у потока это важно.'],
          en: [`48 hours of work; landing materials −${SHIELD_WORK.patch}%.`, `The hole is closed: ${SH.RULES.patch} kg/m² at the impact point instead of the full rating.`, cause === 'stream' ? 'A weak spot remains until arrival.' : 'A weak spot remains — it matters at the stream.']
        },
        cost: x => { x.materials -= SHIELD_WORK.patch; },
        effect: x => { SH.patch(x.shield, hitId, x.year); x.materials -= SHIELD_WORK.patch; EV.scrap(x, 1); rec5(x).repair = 'patch'; },
        record: { ru: `Пробоина в панели ${panel} закрыта заплатой: ${SH.RULES.patch} кг/м² в месте удара.`, en: `The hole in panel ${panel} is closed with a patch: ${SH.RULES.patch} kg/m² at the impact point.` }
      }, {
        id: 'defer',
        label: { ru: 'Отложить ремонт', en: 'Defer the repair' },
        known: {
          ru: ['Материалы целы.', 'Пробоина остаётся открытой: следующий удар в эту панель пройдёт насквозь.'],
          en: ['The materials are kept.', 'The hole stays open: the next impact on this panel goes straight through.']
        },
        effect: x => { rec5(x).repair = 'defer'; },
        record: { ru: `Ремонт панели ${panel} отложен. Пробоина открыта.`, en: `The repair of panel ${panel} is deferred. The hole is open.` }
      }].filter(o => o.id === 'replace' ? canReplace(s, panel) : o.id === 'patch' ? s.materials >= SHIELD_WORK.patch : true)
    };
  }
  const nf = (x, d, lang) => { const v = x.toFixed(d); return lang === 'ru' ? v.replace('.', ',') : v; };
  // измеренная среда отрезка (сводки щита и отчёт вахты)
  const ENV_NAME = { ism: ['средняя межзвёздная среда', 'average interstellar medium'], cloud: ['край облака D2', "the D2 cloud's edge"],
    pre: ['предвестник потока у Тёмной звезды', "the stream's precursor at the Dark Star"], core: ['ядро потока', "the stream's core"],
    filament: ['пылевое волокно', 'a dust filament'] };
  function noteText(s, n, lang) {
    const ru = lang === 'ru', sh = s.shield, o = SH.observe(sh), rho = SH.RULES.rhoDust.toExponential(1).replace('e-', '·10⁻').replace('24', '²⁴');
    if (n.kind === 'accept') {
      const sp = sh.spares.A;
      return ru ? `Приёмка фронтального щита. Пакет — 64 сменные панели в четырёх поясах и центральная защита носа, Ø 350 м. Норма — ${sh.nominal} кг/м² по проекции${sp ? `; в трюме запас — по ${sp} панелей каждого пояса` : ''}. Сервисный допуск — ${o.service} кг/м². Модель среды — средняя межзвёздная: пыль ${ru ? rho.replace('.', ',') : rho} кг/м³.`
        : `Forward shield acceptance. The pack: 64 replaceable panels in four belts and the central nose guard, 350 m across. Rating — ${sh.nominal} kg/m² of projected area${sp ? `; spares in the hold — ${sp} panels for each belt` : ''}. Service limit — ${o.service} kg/m². Environment model — average interstellar medium: dust ${rho} kg/m³.`;
    }
    const ob = n.obs || { min: o.min, at: o.at, hurt: o.damaged.length > 0, bulk: Math.min(...sh.sigma) };
    const done = (sh.nominal - ob.bulk) * 1000;                          // снятое пылью — без локальных повреждений
    const lim = ob.min < o.service ? (ru ? `ниже сервисного допуска (${o.service} кг/м²) — нужен ремонт` : `below the service limit (${o.service} kg/m²) — repair needed`)
      : ob.min < 2 * o.service ? (ru ? 'запас до сервисного допуска мал' : 'little margin above the service limit')
      : (ru ? 'до сервисного допуска далеко' : 'far from the service limit');
    const where = ob.hurt ? (ru ? ` (место удара на ${ob.at})` : ` (impact point on ${ob.at})`) : '';
    const fd = n.flux >= 100 ? 0 : n.flux >= 1 ? 2 : 4;                  // точность — по величине потока
    const short = n.y1 - n.y0 < 0.1, yd = n.y1 - n.y0 < 0.002 ? 4 : short ? 3 : 1;   // короткий отрезок — с сутками
    const dur = short ? (ru ? ` (${nf((n.y1 - n.y0) * 365.25, 1, 'ru')} сут.)` : ` (${nf((n.y1 - n.y0) * 365.25, 1, 'en')} days)`) : '';
    const env = (n.env && n.env.length ? n.env : ['ism']).map(k => ENV_NAME[k][ru ? 0 : 1]).join(', ');
    const Env = env[0].toUpperCase() + env.slice(1);
    return ru ? `Годы ${nf(n.y0, yd, 'ru')}–${nf(n.y1, yd, 'ru')}${dur}. ${Env}. Средний поток энергии пыли на щит — ${nf(n.flux, fd, 'ru')} Вт/м². Снято за отрезок — ${nf(n.dSigma * 1000, 1, 'ru')} г/м² проекции, с приёмки — ${nf(done, 1, 'ru')} г/м². Минимум по щиту — ${nf(ob.min, 3, 'ru')} кг/м²${where}, ${lim}.`
      : `Years ${nf(n.y0, yd, 'en')}–${nf(n.y1, yd, 'en')}${dur}. ${Env}. Mean dust energy flux on the shield — ${nf(n.flux, fd, 'en')} W/m². Removed over the interval — ${nf(n.dSigma * 1000, 1, 'en')} g/m² of projected area, since acceptance — ${nf(done, 1, 'en')} g/m². Shield minimum — ${nf(ob.min, 3, 'en')} kg/m²${where}, ${lim}.`;
  }
  // потери удара потока v5 — одной строкой (тяжесть — streamOutcome)
  function streamLossLine(s, lang) {
    const ru = lang === 'ru', h = s.streamImpact;
    if (!h || h.level == null) return '';
    if (h.level === 1) return ru ? `В носовом отсеке гибнут ${ppl(s.streamDead)}.` : `${s.streamDead} die in the forward compartment.`;
    return h.burnt ? (ru ? `Пыль ядра прожгла старое место у облака: удар проходит в зал анабиоза. Погибли ${ppl(s.streamDead)}.` : `The core dust burned through the old spot from the cloud: the strike reaches the anabiosis hall. ${s.streamDead} are dead.`)
      : (ru ? `Без резерва мощности корабль уходит из ядра сутками: поток успевает пройти по корпусу. Погибли ${ppl(s.streamDead)}.` : `Without the high-power reserve the ship takes days to leave the core: the stream has time to sweep the hull. ${s.streamDead} are dead.`);
  }
  // журнал прохода края облака в v5: сутки прохода — из профиля, удар и ремонт — из модели щита
  function edgeLogV5(s, lang) {
    const ru = lang === 'ru', d = edgeDays(s), h = s.cloudHit, kg = ru ? 'кг/м²' : 'kg/m²';
    const head = ru ? `Проход края облака: ${d} ${plural(d, ['сутки', 'суток', 'суток'])}.` : `Passage through the cloud's edge: ${d} days.`;
    if (!h) return head + (ru ? `\nУдары пыли — в пределах прогноза модели. Щит: ${shieldGaugeV5(s, 'ru')}.\nРезерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.`
      : `\nDust impacts within the model forecast. Shield: ${shieldGaugeV5(s, 'en')}.\nManoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.`);
    const band = ru ? ` В средней трети — полоса крупной пыли: мелкой пыли в сорок раз больше фона и одно крупное зерно, около ${nf(h.radius * 1000, 2, 'ru')} мм, ${nf(h.energy / 1e6, 0, 'ru')} МДж.`
      : ` In the middle third, a band of coarse dust: forty times the background in fine dust and one coarse grain, about ${nf(h.radius * 1000, 2, 'en')} mm, ${nf(h.energy / 1e6, 0, 'en')} MJ.`;
    if (!h.breached) return head + band + (ru ? `\nУдвоенный щит держит: на панели ${h.panel} выбито ${nf(h.removed, 1, 'ru')} ${kg} на 0,06 м², в месте удара осталось ${nf(h.residual, 1, 'ru')} ${kg}. Сквозного пробоя нет, ремонт не нужен.`
      : `\nThe doubled shield holds: ${nf(h.removed, 1, 'en')} ${kg} knocked out of panel ${h.panel} over 0.06 m², ${nf(h.residual, 1, 'en')} ${kg} left at the impact point. No breach through, no repair needed.`);
    const fix = h.repair === 'replace' ? (ru ? `Панель заменена запасной, −${SHIELD_WORK.replace}% материалов.` : `The panel was replaced with a spare, −${SHIELD_WORK.replace}% of materials.`)
      : h.repair === 'patch' ? (ru ? `Заплата: ${SH.RULES.patch} ${kg} в месте удара, −${SHIELD_WORK.patch}% материалов.` : `Patch: ${SH.RULES.patch} ${kg} at the impact point, −${SHIELD_WORK.patch}% of materials.`)
      : (ru ? 'Ремонт отложен: пробоина открыта.' : 'Repair deferred: the hole is open.');
    return head + band + (ru ? `\nЗерно пробивает панель ${h.panel}; за ней — жилой отсек кольца. Разгерметизация.\nПогибли ${ppl(s.cloudDead)} смены. Отсек перекрыт. ${fix}`
      : `\nThe grain breaks through panel ${h.panel}; behind it, a living compartment of the ring. Decompression.\n${s.cloudDead} of the shift are dead. The compartment is sealed. ${fix}`);
  }
  function streamLogV5(s, lang) {
    const ru = lang === 'ru', h = s.streamImpact;
    const head = s.streamRoute === 'evade' ? (ru ? 'Манёвр опоздал: корабль ещё в потоке. ' : 'The manoeuvre came too late: the ship is still in the stream. ')
      : (ru ? 'Корабль идёт по краю потока — и ядро потока на курсе. ' : 'The ship runs along the edge of the stream — and the stream\'s core is on its course. ');
    if (!h) return head;
    const grain = ru ? `Зерно около ${nf(h.radius * 1000, 1, 'ru')} мм на ${nf(h.beta * 100, 1, 'ru')}% c — ${nf(h.energy / 1e6, 0, 'ru')} МДж — пробивает панель ${h.panel}. `
      : `A grain of about ${nf(h.radius * 1000, 1, 'en')} mm at ${nf(h.beta * 100, 1, 'en')}% c — ${nf(h.energy / 1e6, 0, 'en')} MJ — breaks through panel ${h.panel}. `;
    if (s.lostShip) return head + grain;
    const fix = h.repair === 'replace' ? (ru ? ` Панель заменена запасной, −${SHIELD_WORK.replace}%.` : ` The panel was replaced with a spare, −${SHIELD_WORK.replace}%.`)
      : h.repair === 'patch' ? (ru ? ` Заплата на пробоину, −${SHIELD_WORK.patch}%.` : ` A patch over the hole, −${SHIELD_WORK.patch}%.`)
      : h.repair === 'defer' ? (ru ? ' Ремонт отложен: пробоина открыта.' : ' Repair deferred: the hole is open.') : '';
    return head + grain + streamLossLine(s, lang) + (ru ? ` Отсеки — материалы для высадки −${STREAM_MAT5[h.level]}%.` : ` The compartments — landing materials −${STREAM_MAT5[h.level]}%.`) + fix;
  }
  // сводки износа (summary) — не в ленту, а в ведомость ближайшего отчёта вахты (fold); приёмка — отдельной записью
  const WEAR_TITLE = { ru: 'Приборный журнал · охлаждение', en: 'Instrument log · cooling' };
  function simNotes(s) {
    const evNotes = EV.take(s).concat(s.wear ? W.take(s.wear).map(n => ({ id: `sim.wear.${n.k}`, kind: 'instrument', title: WEAR_TITLE,
      text: { ru: n.ru, en: n.en }, fold: true })) : []);
    if (!s.shield) return evNotes;
    return SH.take(s.shield).map(n => ({ id: `sim.shield.${n.kind}.${nf(n.y1 != null ? n.y1 : s.year, 3, 'en')}`, kind: 'instrument', title: SIM_TITLE,
      text: { ru: noteText(s, n, 'ru'), en: noteText(s, n, 'en') }, fold: n.kind === 'summary', env: n.env || [] })).concat(evNotes);
  }

  // ---- отчёт вахты (DOC «Симулятор v2 — видимость», шаг 1): что случилось на корабле за период — от прошлого отчёта
  // до конца перемотки или до остановки модели на событии. Только зарегистрированное и рассчитанное: кто на вахте,
  // расчётные потери по категориям модели, происшествия, удары по щиту, резерв, материалы, путь. Состояние не меняет.
  // На вахте: до года 2 на ногах весь экипаж, до передачи полномочий — шестьдесят, дальше — штат (один счёт для отчёта,
  // прибора HUD и карты спящих)
  // с моделью износа (пока она ведёт людей, до прибытия) — по реестру мест: группа Б, разбуженные без капсулы
  const awakeOf = (s, ids) => s.wear && wearOn(s) && s.year < arriveView(s) ? s.wear.ps.split('').filter(c => c === 'A').length
    : s.year < 2 && !ids.has('a1.empty') ? crewOf(s) : ids.has('a1.handover') ? s.watch : 60;
  function observeShip(s, log) {
    if (!s.eq || s.relief || !s.arrive) return null;
    const ids = new Set((log || []).map(i => i.beat.id));
    return { year: s.year, watch: s.watch, awake: awakeOf(s, ids), crew: crewOf(s), alive: aliveOf(s), dead: s.dead || 0, deadHere: s.deadHere || 0, out: s.outpostDead || 0,
      L: lossesOf(s, Math.max(0, Math.min(s.year, s.arrive))), reserve: s.reserve, materials: s.materials, highPower: !!s.highPower,
      inc: (s.incidents || []).length, shield: s.shield ? { eroded: s.shield.erodedKg / SH.AREA, hits: s.shield.hits.length } : null };
  }
  const LOSS_KEYS = ['capsule', 'revival', 'accident', 'cancer'];
  const LOSS_NAME = { capsule: ['отказы капсул', 'capsule failures'], revival: ['при пробуждении', 'on waking'], accident: ['несчастные случаи на вахте', 'accidents on watch'],
    cancer: ['рак в пути', 'cancers on the road'] };
  const phaseAt = (s, y) => { const A = arriveView(s), b0 = M.brakeStart(A, s.tMag);
    return y < M.ACC ? 'acc' : y >= A ? 'home' : y < b0 ? 'drift' : s.tMag != null && y >= A - M.ENGINE ? 'eng' : 'mag'; };
  const txt = (v, lang, st) => { const x = v && v[lang]; return typeof x === 'function' ? x(st) : (x || ''); };
  const yWhole = y => Math.abs(y - Math.round(y)) < 1e-6;
  function spanText(y0, y1, lang) {
    const ru = lang === 'ru', d = y1 - y0, k = d < 0.002 ? 4 : d < 0.1 ? 3 : 1, f = y => nf(y, yWhole(y) ? 0 : k, lang).replace(/[.,]0$/, '');
    const days = d < 0.1 ? (ru ? ` (${nf(d * 365.25, 1, 'ru')} сут.)` : ` (${nf(d * 365.25, 1, 'en')} days)`) : '';
    return `${ru ? 'годы' : 'years'} ${f(y0)}–${f(y1)}${days}`;
  }
  // изменения запаса за период — по записям периода: разность снимка записи и предыдущего; причина — решение или запись
  // изменения внутри хода модели (удар, выход из ядра) записи не имеют — остаток относим к происшествиям периода
  function resourceMoves(base, items, key, lang, s, incs) {
    const ru = lang === 'ru', out = [];
    let prev = base[key], py = base.year;
    const wIn = (a, b) => s.wear ? (s.wear.moves || []).filter(m => m.key === key && m.at > a + 1e-9 && m.at <= b + 1e-9) : [];   // работы износа
    const evIn = (a, b) => EV.movesIn(s, key, a, b).concat(wIn(a, b)).reduce((x, m) => x + m.d, 0);
    for (const m of EV.movesIn(s, key, base.year, s.year).concat(wIn(base.year, s.year))) out.push({ d: m.d, why: m.name[lang] });
    for (const it of items) {
      const v = it.state[key], d = v - prev - evIn(py, it.state.year); prev = v; py = Math.max(py, it.state.year);
      if (Math.abs(d) < 0.05) continue;
      const b = it.beat, title = txt(b.title, lang, it.state);
      const why = b.kind === 'decision' && it.option ? (ru ? `решение «${title}» — ${txt(it.option.label, lang, it.state).toLowerCase()}` : `decision “${title}” — ${txt(it.option.label, lang, it.state).toLowerCase()}`)
        : title ? (ru ? `«${title}»` : `“${title}”`) : '';
      out.push({ d, why });
    }
    const d = s[key] - prev - evIn(py, s.year);
    if (Math.abs(d) >= 0.05) out.push({ d, why: incs.map(x => lc1(HEADLINE_NAME[x.kind] ? HEADLINE_NAME[x.kind][ru ? 0 : 1] : x.kind)).join(', ') });
    return out;
  }
  const endDot = x => /\.$/.test(x) ? x : x + '.';
  // особая среда, через которую корабль прошёл за [y0, y1]: край облака, предвестник и ядро потока — по тем же
  // границам, что и износ (rhoAt); после y1 ничего не смотрим
  function envsPassed(s, y0, y1) {
    const over = (a, b) => a != null && b != null && a < y1 && b > y0, out = [];
    if (s.ev && s.ev.media && s.ev.media.some(m => over(m.a, m.b))) out.push('filament');
    if (cloudThrough(s)) { const c = cloudSpan(s); if (over(c.a, c.b)) out.push('cloud'); }
    if (streamOn(s)) { const P = streamPlan(s);
      if (over(P.warn, P.preEnd)) out.push('pre');
      if (P.coreEnd != null && over(P.core, P.coreEnd)) out.push('core'); }
    return out;
  }
  const lc1 = x => x[0].toLowerCase() + x.slice(1);
  const POP_WHO = { outpost: [' форпоста', ' of the outpost'], thaw: [' из Оттепели', ' of Thaw'] };
  function watchReport(s, base, items, folded, ev, lang, now) {
    const ru = lang === 'ru', y0 = base.year, y1 = s.year, A = s.arrive;
    const yr = y => `${ru ? 'год' : 'year'} ${nf(y, yWhole(y) ? 0 : 2, lang)}`;
    // что передаём: остановка модели, происшествия, удары по щиту
    const incs = (s.incidents || []).slice(base.inc);
    const hits = s.shield && base.shield ? s.shield.hits.slice(base.shield.hits) : [];
    const burnt = s.shield ? s.shield.hits.filter(h => h.burntAt != null && h.burntAt > y0 + 1e-9 && h.burntAt <= y1 + 1e-9) : [];
    const hitLine = h => ru ? `удар в панель ${h.panel} (${yr(h.at)}) — ${h.first === 'breached' ? 'сквозной пробой' : 'выбоина, щит держит'}`
      : `an impact on panel ${h.panel} (${yr(h.at)}) — ${h.first === 'breached' ? 'breached through' : 'a scar, the shield holds'}`;
    const events = incs.map(x => { const nm = HEADLINE_NAME[x.kind] ? HEADLINE_NAME[x.kind][ru ? 0 : 1] : INCIDENT_NAME[x.kind] ? INCIDENT_NAME[x.kind][lang] : x.kind;
      const who = POP_WHO[x.pop] ? POP_WHO[x.pop][ru ? 0 : 1] : '';
      return `${lc1(nm)} (${ru ? 'год' : 'year'} ${incYear(x)})${x.dead ? (ru ? ` — погибли ${ppl(x.dead)}${who}` : ` — ${x.dead}${who} dead`) : ''}`; })
      .concat(hits.filter(h => !(ev && ev.id === h.id)).map(hitLine))
      .concat(burnt.map(h => ru ? `пыль прожгла место удара на ${h.panel} (${yr(h.burntAt)})` : `the dust burned through the impact point on ${h.panel} (${yr(h.burntAt)})`))
      .concat(EV.since(s, y0, y1).filter(e => !(ev && ev.id === e.id)).map(e => `${EV.TYPES[e.type].name[lang]} (${yr(e.at)})`))
      .concat(s.wear ? s.wear.log.filter(e => e.kind === 'fail' && e.at > y0 + 1e-9 && e.at <= y1 + 1e-9 && !(ev && ev.kind === 'wear' && ev.at === e.at)).map(e => `${wearPart(e.id, lang)} (${yr(e.at)})`) : []);
    const head = [];
    if (ev) head.push(ev.kind === 'shieldService' ? (ru ? `Требуется решение совета: пробита панель щита ${ev.panel}.` : `Council decision required: shield panel ${ev.panel} is breached.`)
      : ev.kind === 'event' ? (ru ? `Требуется решение совета: ${EV.TYPES[ev.type].name.ru}.` : `Council decision required: ${EV.TYPES[ev.type].name.en}.`)
      : ev.kind === 'wear' ? (ru ? `Требуется решение совета: остановлен контур охлаждения ${ev.loop}.` : `Council decision required: cooling loop ${ev.loop} has stopped.`)
      : (ru ? 'Требуется решение совета.' : 'Council decision required.'));
    if (events.length) head.push((ru ? 'За период: ' : 'Over the period: ') + events.join('; ') + '.');
    // среда, пройденная за период (уже пройденное — не прогноз), если не обычная межзвёздная
    const envs = envsPassed(s, y0, y1);
    if (envs.length) head.push((ru ? 'Приборы фиксируют среду: ' : 'The instruments register: ') + envs.map(k => ENV_NAME[k][ru ? 0 : 1]).join(', ') + '.');
    // люди: расчётные потери периода при нынешних параметрах; смена штата вахты пересчитывает оценку за прошлые годы
    const Lre = lossesOf(s, Math.max(0, Math.min(y0, A))), dk = {}; let dl = 0;
    for (const k of LOSS_KEYS) { dk[k] = Math.max(0, now.L[k] - Lre[k]); dl += dk[k]; }
    // погибшие своего экипажа (люди форпоста — в deadHere, но не наши); чужие — отдельной строкой по поселениям
    const reest = Lre.total - base.L.total, dInc = (now.dead - base.dead) + (now.deadHere - base.deadHere) - (now.out - base.out);
    const others = ['outpost', 'thaw'].map(p => [p, incs.filter(x => x.pop === p).reduce((a, x) => a + (x.dead || 0), 0)]).filter(x => x[1]);
    const cats = LOSS_KEYS.filter(k => dk[k]).map(k => `${LOSS_NAME[k][ru ? 0 : 1]} — ${dk[k]}`).join(', ');
    const watchLine = now.awake === now.crew ? (ru ? 'На ногах весь экипаж' : 'The whole crew is awake')
      : (ru ? `На вахте — ${now.awake}${now.awake !== base.awake ? ` (было: ${base.awake === now.crew ? 'весь экипаж' : base.awake})` : ''}` : `On watch — ${now.awake}${now.awake !== base.awake ? ` (was: ${base.awake === now.crew ? 'the whole crew' : base.awake})` : ''}`);
    // запасы: изменения — с причиной; без изменений — одной строкой
    const res = resourceMoves(base, items, 'reserve', lang, s, incs), mat = resourceMoves(base, items, 'materials', lang, s, incs);
    const why = (ms, f) => ms.slice(0, 2).map(m => `${f(m.d)}${m.why ? ` — ${m.why}` : ''}`).join('; ') + (ms.length > 2 ? (ru ? `; и ещё ${ms.length - 2}` : `; and ${ms.length - 2} more`) : '');
    const resNow = `${pct(s.reserve, lang)}% (${kms0(s)} ${ru ? 'км/с' : 'km/s'})`, matNow = `${pctM(s.materials, lang)}%`;
    const sgn = (d, k) => `${d > 0 ? '+' : '−'}${nf(Math.abs(d), k, lang)}`;
    const sgnM = d => sgn(d, Math.abs(Math.abs(d) - Math.round(Math.abs(d))) < 0.05 ? 0 : 1);   // материалы: дробные — с десятыми
    const g = s.shield && base.shield ? (now.shield.eroded - base.shield.eroded) * 1000 : 0;
    const shieldNow = s.shield ? shieldGaugeV5(s, lang).replace(' · ', ', ') : '';
    const shieldSame = !s.shield || (g < 0.005 && !hits.length && !burnt.length);
    const gT = g >= 1000 ? `${nf(g / 1000, 2, lang)} ${ru ? 'кг/м²' : 'kg/m²'}` : `${nf(g, g < 10 ? 2 : 1, lang)} ${ru ? 'г/м²' : 'g/m²'}`;
    // путь: скорость, задержка связи, смена фазы полёта, сводки Кольца
    const AV = arriveView(s), beta = M.speedAt(y1, s.beta, AV, s.tMag), ly = M.distLy(y1, s.beta, AV, s.tMag, M.star(s.target).d);
    const p0 = phaseAt(s, y0), p1 = phaseAt(s, y1), PH = ui[lang].tlPhase;
    const lagT = ly * 12 < 1 ? (ru ? `${Math.max(1, Math.round(ly * 365.25))} сут.` : `${Math.max(1, Math.round(ly * 365.25))} days`)
      : ly < 2 ? `${nf(ly * 12, 0, lang)} ${ru ? 'мес.' : 'months'}` : `${nf(ly, 1, lang)} ${ru ? 'г.' : 'years'}`;
    const way = [p1 === 'home' ? endDot(ru ? `Корабль у цели; сигнал до Земли идёт ${lagT}` : `The ship is at the target; a signal takes ${lagT} to reach Earth`)
      : endDot(ru ? `Скорость — ${nf(beta, 3, 'ru')}c, сигнал до Земли идёт ${lagT}` : `Velocity — ${nf(beta, 3, 'en')}c, a signal takes ${lagT} to reach Earth`)];
    if (p0 !== p1) way.unshift(ru ? `Фаза полёта: ${PH[p0]} → ${PH[p1]}.` : `Flight phase: ${PH[p0]} → ${PH[p1]}.`);
    const bul = items.filter(i => i.beat.kind === 'bulletin').length;
    if (bul) way.push(ru ? (bul === 1 ? 'Принята сводка Кольца.' : `Приняты сводки Кольца: ${bul}.`) : (bul === 1 ? 'A Ring bulletin was received.' : `Ring bulletins received: ${bul}.`));
    // ведомость: потери с отлёта по категориям модели, все изменения запасов, сводки износа щита
    const Lall = now.L, det = [ru ? `С отлёта, по расчёту модели: ${LOSS_KEYS.map(k => `${LOSS_NAME[k][0]} — ${Lall[k]}`).join(', ')}; в происшествиях — ${now.dead + now.deadHere - now.out}. Отложенный риск — рак после пробуждения у цели: около ${ppl(Lall.later)}.`
      : `Since departure, by the model: ${LOSS_KEYS.map(k => `${LOSS_NAME[k][1]} — ${Lall[k]}`).join(', ')}; in incidents — ${now.dead + now.deadHere - now.out}. Deferred risk — cancers after waking at the target: about ${Lall.later}.`];
    if (res.length > 2) det.push((ru ? 'Резерв манёвров: ' : 'Manoeuvre reserve: ') + res.map(m => `${sgn(m.d, 1)} ${ru ? 'п.п.' : 'pp'} — ${m.why}`).join('; ') + '.');
    if (mat.length > 2) det.push((ru ? 'Материалы: ' : 'Materials: ') + mat.map(m => `${sgnM(m.d)}% — ${m.why}`).join('; ') + '.');
    if (s.wear) det.push(coolLine(s.wear, lang));
    for (const f of folded) det.push(txt(f.text, lang));
    const title = ev ? (ru ? `Донесение вахты · ${spanText(y0, y1, 'ru')}` : `Watch report · ${spanText(y0, y1, 'en')} · interrupted`)
      : (ru ? `Отчёт вахты · ${spanText(y0, y1, 'ru')}` : `Watch report · ${spanText(y0, y1, 'en')}`);
    // спокойный период — две строки: без событий, потерь, работ и перемен
    const data = { y0, y1, losses: dl, reest, crewDead: dInc, alive: now.alive, interrupted: !!ev };   // числа периода — для перемотки и проверок
    const calm = !ev && !events.length && !envs.length && !dl && !dInc && !others.length && !reest && !res.length && !mat.length && shieldSame && now.awake === base.awake && now.highPower === base.highPower
      && !(s.wear && W.observe(s.wear).groups.some(g => g.sleep && g.heat));   // группы на тепловом резерве — не спокойный период
    if (calm) return { title, data, details: det.join('\n\n'), text: [ru ? `Передаём корабль без происшествий. ${watchLine}, живы — ${now.alive}; запасы${s.shield ? ' и щит' : ''} без изменений.`
      : `We hand over the ship with no incidents. ${watchLine}, alive — ${now.alive}; stores${s.shield ? ' and shield' : ''} unchanged.`, way.join(' ')].join('\n\n') };
    if (!events.length && !ev) head.unshift(ru ? 'Передаём корабль без происшествий.' : 'We hand over the ship with no incidents.');
    const people = [`${watchLine}.`, dl ? (ru ? `Расчётные потери за период — ${ppl(dl)}: ${cats}.` : `Estimated losses over the period — ${dl}: ${cats}.`)
      : (ru ? 'Расчётных потерь за период нет.' : 'No estimated losses over the period.')];
    if (dInc) people.push(ru ? `В происшествиях погибли ${ppl(dInc)} экипажа.` : `${dInc} of the crew died in incidents.`);
    if (others.length) people.push(ru ? `Погибли ${others.map(([p, n]) => `${ppl(n)}${POP_WHO[p][0]}`).join(' и ')}.` : `${others.map(([p, n]) => `${n}${POP_WHO[p][1]}`).join(' and ')} died.`);
    if (reest) people.push(ru ? `Оценка потерь за прошлые годы пересчитана под новый штат вахты: ${reest > 0 ? '+' : '−'}${Math.abs(reest)}.`
      : `The estimate for past years is recalculated for the new watch roster: ${reest > 0 ? '+' : '−'}${Math.abs(reest)}.`);
    people.push(ru ? `Живы — ${now.alive}.` : `Alive — ${now.alive}.`);
    const sys = [!res.length && !mat.length
      ? (ru ? `Резерв манёвров — ${resNow}, материалы — ${matNow}: без изменений.` : `Manoeuvre reserve — ${resNow}, materials — ${matNow}: unchanged.`)
      : [res.length ? (ru ? `Резерв манёвров — ${resNow}: ${why(res, d => `${sgn(d, 1)} п.п.`)}.` : `Manoeuvre reserve — ${resNow}: ${why(res, d => `${sgn(d, 1)} pp`)}.`)
          : (ru ? `Резерв манёвров — ${resNow}.` : `Manoeuvre reserve — ${resNow}.`),
        mat.length ? (ru ? `Материалы — ${matNow}: ${why(mat, d => `${sgnM(d)}%`)}.` : `Materials — ${matNow}: ${why(mat, d => `${sgnM(d)}%`)}.`)
          : (ru ? `Материалы — ${matNow}.` : `Materials — ${matNow}.`)].join(' ')];
    if (now.highPower !== base.highPower) sys.push(now.highPower ? (ru ? 'Контуру вернули резерв мощности.' : 'The loop has its high-power reserve back.')
      : (ru ? 'Контур остался без резерва мощности.' : 'The loop is left without its high-power reserve.'));
    if (s.wear) sys.push(coolLine(s.wear, lang));
    if (s.shield) sys.push(shieldSame ? (ru ? `Щит без изменений: ${shieldNow}.` : `Shield unchanged: ${shieldNow}.`)
      : (ru ? `Щит: за период пыль сняла ${gT} проекции; ${shieldNow}.` : `Shield: the dust removed ${gT} of projected area over the period; ${shieldNow}.`));
    return { title, data, text: [head.join(' '), people.join(' '), sys.join(' '), way.join(' ')].join('\n\n'), details: det.join('\n\n') };
  }
  // охлаждение и питание (износ, шаг 2): нагрузка контуров, независимость, запас деталей
  const wearPart = (id, lang) => { const [u, p] = id.split('.'), ru = lang === 'ru';
    return p === 'pump' ? (ru ? `отказ насоса контура ${u}` : `loop ${u} pump failure`) : p === 'cool' ? (ru ? `отказ холодильника группы ${u}` : `group ${u} cooler failure`)
      : p === 'ctrl' ? (ru ? `отказ управления группы ${u}` : `group ${u} control failure`) : (ru ? `отказ ${id}` : `${id} failure`); };
  function coolLine(w, lang) {
    const o = W.observe(w), ru = lang === 'ru', loops = o.loops.map(l => l.runs ? `${l.id} ${l.load}/${l.max}` : `${l.id} ${ru ? 'стоит' : 'stopped'}`).join(' · ');
    const warm = o.groups.filter(g => g.sleep && g.heat), inv = o.inv;
    return ru ? `Охлаждение: ${loops}; независимых контуров — ${o.independent}.${warm.length ? ` На тепловом резерве: ${warm.map(g => `${g.id} (${nf(g.heatH, 0, 'ru')} ч)`).join(', ')}.` : ''} Запас: насосы ${inv.pump}, холодильники ${inv.cooler}, управление ${inv.control}. Питание — ${o.power === 2 ? 'два независимых канала' : o.tie ? 'один канал, вторая шина — через перемычку' : 'один канал'}.`
      : `Cooling: ${loops}; independent loops — ${o.independent}.${warm.length ? ` On thermal reserve: ${warm.map(g => `${g.id} (${nf(g.heatH, 0, 'en')} h)`).join(', ')}.` : ''} Stock: pumps ${inv.pump}, coolers ${inv.cooler}, controls ${inv.control}. Power — ${o.power === 2 ? 'two independent channels' : o.tie ? 'one channel, the second bus through the tie' : 'one channel'}.`;
  }
  function simReport(s, base, log, mark, folded, ev) {
    const now = observeShip(s, log);
    if (!base || !now || s.lostShip || !(s.year > base.year)) return null;
    const items = log.slice(mark), ru = watchReport(s, base, items, folded, ev, 'ru', now), en = watchReport(s, base, items, folded, ev, 'en', now);
    return { id: `sim.watch.${nf(s.year, 4, 'en')}`, kind: 'watch', title: { ru: ru.title, en: en.title }, text: { ru: ru.text, en: en.text },
      details: { ru: ru.details, en: en.details }, parts: folded, data: ru.data };
  }
  // события v1: разрешено ли событие семьи family в год t — только дрейф, не у сюжетных узлов (±1 год от дат решений и
  // перемоток сюжета), жизнеобеспечение и охлаждение — не во время истории контура Ирсона
  function storyMarks(s) {
    const out = [];
    for (const b of beats) {
      const v = b.kind === 'skip' ? b.toYear : b.kind === 'decision' ? b.year : undefined;
      if (v === undefined) continue;
      try { if (b.when && !b.when(s)) continue; const y = typeof v === 'function' ? v(s) : v; if (isFinite(y)) out.push(y); } catch (e) { /* дата из будущего состояния */ }
    }
    return out;
  }
  function evWindow(s, t, family) {
    if (!s.arrive || s.lostShip || s.relief || s.outcome) return false;
    if (t < M.ACC + 1 || t > M.brakeStart(arriveView(s), s.tMag) - 1) return false;
    if ((family === 'lifeSupport' || family === 'cooling') && !ownStory(s) && t > Y(s, 0.6) - 1 && t < Y(s, 0.75) + 1) return false;
    return !storyMarks(s).some(y => Math.abs(t - y) < 1);
  }
  // свои живые по реестру: без погибших в происшествиях (номера — как у victims)
  // погибшие в происшествиях и в реестре сюжета (deadIds — с моделью износа туда входят и фоновые смерти модели)
  const aliveIds = s => { const dead = new Set((s.incidents || []).filter(x => (x.pop || 'crew') === 'crew').flatMap(x => x.ids || []).concat(s.deadIds || []));
    return [...Array(crewOf(s)).keys()].filter(i => !dead.has(i)); };
  const EV = EVM.create({ hidden: (s, k) => hidden(s, k), name: (s, i) => ({ ru: crewName(s, i, 'ru'), en: crewName(s, i, 'en') }), alive: aliveIds, window: evWindow,
    dvPct, kms: kms0, nf, prod: s => eqOf(s).prod, sensors: s => eqOf(s).sensors, thin: s => s.watch < 40,
    caps: s => eqOf(s).caps, probes: s => eqOf(s).probes, highPower: s => !!s.highPower, taught: s => !!s.taught, repairQual: s => !!s.repairQual,
    cargo: s => s.kits.includes('request') ? 'request' : s.kits.includes('berths') ? 'berths' : 'none',
    pickName: (s, u, not) => { const a = aliveIds(s).filter(i => i !== not), i = a.length ? a[Math.floor(u * a.length) % a.length] : 0; return { ru: crewName(s, i, 'ru'), en: crewName(s, i, 'en') }; },   // not — номер, который исключить
    beta: (s, y) => M.speedAt(y, s.beta, s.arrive, s.tMag),
    erosion: (s, a, b, k) => SH.erode(SH.create('dust20'), a, b, y => M.speedAt(y, s.beta, s.arrive, s.tMag), SH.RULES.rhoDust * k).dSigma,   // прогноз на свежей копии
    shieldMin: s => s.shield ? SH.observe(s.shield).min : 0, service: () => SH.RULES.service, eroded: s => s.shield ? s.shield.erodedKg / SH.AREA : 0,
    lag: s => lag(s, s.year), yrs: (n, lang) => lang === 'ru' ? yrs(n) : yrsEn(n),
    book: (s, cause) => book(s, cause) });                             // журнал — до снимка записи события
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
  const sim = { active: v5, advance: simAdvance, notes: simNotes,
    decision: (s, ev) => ev.kind === 'event' ? EV.decision(s, ev) : ev.kind === 'wear' ? wearDecision(s, ev) : serviceDecision(s, ev),
    decided: (s, beat) => { EV.decided(s); wearSync(s); track(s, beat ? `${beat.id}/${s.choices[beat.id]}` : 'model'); },   // плановый совет, вахта в зале, ревизия маршрута, журнал
    applied: (s, beat) => { wearSync(s); track(s, beat.id); }, observe: observeShip, report: simReport, calendar: CAL.map(c => c.id) };
  // прибор щита v5: минимум остатка по панелям — среднее скрыло бы опасную дыру
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
    rescueDock: ['Срыв крепления склада', "The store's mount gives way"], wearGroup: ['Группа без охлаждения', 'A group without cooling'], rescueWake: ['Массовое пробуждение', 'Mass waking'], rescueWater: ['Вода старой площадки', "The old site's water"] };
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
    if (!(v5(s) && s.shield)) return null;
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
  // окно у потока: 30 суток; проверка + манёвр должны уложиться
  const WINDOW = 30, CHECK = { probe: 10, kora: 21, student: 26, model: 0 };
  const burnDays = s => s.highPower ? 0.25 : 12;
  const CHECK_PLUS = { student: 18 };                                   // расширенная спектрометрия: ученики читают поток быстрее; Кору будят три недели в любом случае
  const checkDays = (s, k) => eqOf(s).sensors === 'spectraPlus' && CHECK_PLUS[k] ? CHECK_PLUS[k] : CHECK[k];
  // поток (версия 1): в 30% партий опасная полоса пересекает номинальный курс. Зонд (10 суток) видит её в 9 из 10,
  // Кора (21) — в 19 из 20, ученики (26, со спектрометрией 18) — в 8 из 10. Удар — при проходе или опоздавшем уходе:
  // целый щит и полная мощность — 8 погибших, нет одного — 27, нет обоих — гибель корабля
  const STREAM = { wide: 0.3, sense: { probe: 0.9, kora: 0.95, student: 0.8 }, dead: { 1: 8, 2: 27 }, mat: { 1: 10, 2: 15 } };
  const streamWide = s => (hidden(s, 'contact.stream.wide') ?? 1) < STREAM.wide;
  // правила v5: поток у Тёмной звезды — место на пути, отсчитанное от цели (DOC «Симулятор v1 — время и щит», шаг 5):
  // предупреждение и вход в ядро — на 0,0328 и 0,0315 св. года до цели (на эталоне — «прибытие − 5» и 30 суток до
  // ядра), ядро толщиной 0,00012 св. года (около трёх суток на 0,015c). Предвестник — 10⁻¹⁸ кг/м³; ядро на курсе —
  // только при широкой полосе (скрытый факт streamWide): 10⁻¹⁶ кг/м³ и одно зерно 1,9–2,1 мм.
  const STREAM_X = { warn: 0.032809771231847, core: 0.031545807335968, thick: 0.00012, dark: 1900 / 63241.077 };   // dark — ближайший проход пары карликов, 1900 а.е. до цели вдоль пути
  const STREAM_RHO = { pre: 1e-18, core: 1e-16 }, STREAM_MAT5 = { 1: 5, 2: 10 };   // v5: отсеки; щит — отдельным решением
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
    const lead = v1(s) && s.streamRoute === 'pass' ? (ru ? 'Край потока проводит' : 'The edge of the stream takes') : (ru ? 'Изменённая траектория проводит' : 'The changed trajectory takes');
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
  const warnAt = s => s.riskVersion >= 5 && src(s) ? streamTimes(s).warn : s.arrive - 5;   // v5: вход в систему — точка предупреждения
  const streamAt = s => s.riskVersion >= 5 && s.streamImpact && s.streamImpact.out != null ? s.streamImpact.out : s.arrive - 5;   // v5: выход из ядра после удара
  const sosAtStream = s => s.riskVersion >= 5 && s.streamImpact && s.streamImpact.out != null ? Math.max(s.streamImpact.out, s.streamImpact.done ?? s.streamImpact.out) : s.arrive - 5;   // сигнал — после манёвра ухода
  const days = (n, lang) => lang === 'ru' ? `${n} ${plural(n, ['сутки', 'суток', 'суток'])}` : `${n} day${n === 1 ? '' : 's'}`;
  // сколько снимает пыль ядра за весь проход (кг/м²) — для подсказки о слабом месте; на свежей копии, без скрытых фактов
  const coreLoss = s => { const T = streamTimes(s); return SH.erode(SH.create('dust20'), T.core, T.exit, y => M.speedAt(y, s.beta, s.arrive, s.tMag), STREAM_RHO.core).dSigma; };
  const win = s => s.riskVersion >= 5 ? Math.round(streamWin(s)) : WINDOW;
  // план прохода v5: когда начат и закончен манёвр ухода, когда удар зерна, сколько корабль в предвестнике и в ядре
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
  const lateV1 = s => (s.streamDays || 0) + burnDays(s) > (s.riskVersion >= 5 ? streamWin(s) : WINDOW);   // граница включительна: ровно 30 — вовремя
  const streamHitNow = s => streamWide(s) && (s.streamRoute === 'pass' || (s.streamRoute === 'evade' && lateV1(s)));
  const windowLine1 = (s, lang) => { const ru = lang === 'ru', d = s.streamDays || 0, bd = s.highPower ? (ru ? '6 часов' : '6 hours') : (ru ? '12 суток' : '12 days'), W = s.riskVersion >= 5 ? streamWin(s) : WINDOW, over = d + burnDays(s) - W;
    return ru ? `Окно — ${days(win(s), 'ru')}: прошло ${d}, манёвр — ${bd}.` + (over > 0 ? ` Не успеваем на ${Math.ceil(over)} сут.` : ' Успеваем.')
      : `Window: ${days(win(s), 'en')} — ${d} gone, manoeuvre ${bd}.` + (over > 0 ? ` Too late by ${Math.ceil(over)} days.` : ' In time.'); };
  // версия 1: проверка у потока даёт сведения; маршрут — отдельным решением (d.streamRoute)
  function streamCheckEffect(st, k) {
    st.streamCheck = k; st.streamDays = checkDays(st, k);
    st.streamFound = streamWide(st) && (hidden(st, 'contact.stream.check') ?? 1) < STREAM.sense[k];
  }
  // v5: ответ приходит в свой срок — в совете о маршруте; в записи выбора — только начало проверки
  const streamFoundRecord = { ru: s => s.riskVersion >= 5 ? `Проверка начата: ответ — через ${days(s.streamDays, 'ru')}.` : s.streamFound ? 'Ответ: крупных частиц больше расчётного — опасная полоса пересекает наш курс.' : 'Ответ: опасной полосы на нашем курсе не видно. Метод может её не захватить.',
    en: s => s.riskVersion >= 5 ? `The check has begun: the answer in ${days(s.streamDays, 'en')}.` : s.streamFound ? 'The answer: more coarse particles than calculated — the dangerous band crosses our course.' : 'The answer: no dangerous band on our course. The method may not catch it.' };
  const probeOK = s => probesLeft(s) || s.materials >= 5;              // зонд: готовый или из материалов
  const pctFrom = (p, lang) => lang === 'ru' ? { 0.9: 'в девяти случаях из десяти', 0.95: 'в девятнадцати случаях из двадцати', 0.8: 'в восьми случаях из десяти' }[p] : { 0.9: 'nine times in ten', 0.95: 'nineteen times in twenty', 0.8: 'eight times in ten' }[p];
  function streamOptions1(s) {
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
        ru: s => [`Резерв манёвров −${f1(streamDv(s), 'ru')}% паспортного.`, windowLine1(s, 'ru'), 'Опасна ли полоса — так и не узнаем.'],
        en: s => [`Manoeuvre reserve −${f1(streamDv(s), 'en')}% of rated.`, windowLine1(s, 'en'), 'Whether the band was dangerous we will never know.']
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
  const late = (s, k) => k === 'model' || checkDays(s, k) + burnDays(s) > WINDOW || s.reserve < dvPct(s, s.highPower ? DV.stream : DV.streamWeak);
  const hitLevel = s => 1 + (breached(s) ? 1 : 0) + (s.highPower ? 0 : 1);
  // долг обслуживания: тонкая вахта без допуска ремонтников пережила аварию в контуре воды
  const maintDebt = s => s.watch < 48 && !s.repairQual;
  // энергия у цели: груз поддержки или работающий изомерный контур
  const energyOK = s => s.support === 'found' || powerOK(s);
  function strike(st, k) {                                            // удар потока, если не успели или доверились модели
    if (st.preview) return;                                           // прогноз «После» показывает известные затраты, не исход
    if (!late(st, k)) return;
    st.streamHit = hitLevel(st);
    if (st.streamHit === 1) { st.dead += 2; st.materials -= 10; st.streamDead = 2; }
    else if (st.streamHit === 2) { st.dead += 27; st.materials -= 15; st.streamDead = 27; }
    else st.lostShip = true;
  }
  const windowLine = (s, k, lang) => {
    const t = checkDays(s, k) + burnDays(s), over = t - (s.riskVersion >= 5 ? streamWin(s) : WINDOW), ru = lang === 'ru', bd = s.highPower ? (ru ? '6 часов' : '6 hours') : (ru ? '12 суток' : '12 days');
    return ru ? `Окно — ${days(win(s), 'ru')}: проверка ${checkDays(s, k)}, манёвр ${bd}.` + (over > 0 ? ` Не успеваем на ${Math.ceil(over)} сут.` : '')
      : `Window: ${days(win(s), 'en')} — check ${checkDays(s, k)}, manoeuvre ${bd}.` + (over > 0 ? ` Too late by ${Math.ceil(over)} days.` : '');
  };
  const riskLine = (s, lang) => { const ru = lang === 'ru', r = [];
    if (s.riskVersion >= 5 && s.shield) {                              // v5: слабое место — по модели щита (ядро снимает ~10 кг/м²)
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
  // поворот к источнику в год t

  // ---------------------------------------------------------------- оснащение: досье, вопросы, карточки, цена (DOC: оснащение v4)
  // Анкета показывает только публичное: цель, каталог, архив на день старта, расчёт паспорта. Скрытое (сид) не используется.
  const eqRules = s => s.riskVersion >= 4;
  // скрытые в анкете варианты: без применения в этой миссии (паспорт со старым id остаётся валидным)
  function eqHidden(s, pos, opt) {
    if (supplyS(s)) return pos === 'energy' || pos === 'sensors' || (pos === 'shield' && opt !== 'dust20') || opt === 'inspect' || (opt === 'printQC' && !eqRules(s));
    if (rescueS(s)) return ['energy', 'sensors', 'prod'].includes(pos) || (pos === 'shield' && opt !== 'dust20') || opt === 'inspect';
    return false;
  }
  const eqPosHidden = (s, pos) => M.EQUIP.find(p => p.id === pos).opts.filter(o => !o.era && !eqHidden(s, pos, o.id)).length < 2;
  const EQ_Q = {
    caps: { ru: 'Как снизить потери во сне и при пробуждении?', en: 'How do we reduce losses during sleep and waking?' },
    energy: { ru: 'На чём пережить первую зиму после высадки?', en: 'What will power the first winter after landing?' },
    sensors: { ru: 'Какие слабые признаки мы хотим прочитать?', en: 'Which faint signals do we want to read?' },
    probes: { ru: 'Везти готовые зонды или собирать их в пути?', en: 'Carry ready probes or build them en route?' },
    shield: { ru: 'Как пережить повреждение пылевого щита?', en: 'How do we cope with dust-shield damage?' },
    prod: { ru: 'Чем восстановить резерв мощности?', en: 'How do we restore the high-power reserve?' },
    prodSupply: { ru: 'Чем изготовить детали для восстановления форпоста?', en: 'How do we make parts to restore the outpost?' }
  };
  const eqQuestion = (s, pos, lang) => (pos === 'prod' && s.mission === 'supply' ? EQ_Q.prodSupply : EQ_Q[pos])[lang];
  // публичные признаки маршрута (по черновику паспорта): облако — та же ветка, что M.episode; ε Индейца; красный карлик; колония в архиве
  function routeSigns(s, d) {
    const T = d ? Math.round(passportNumbers(s, d).T) : s.arrive, c = M.knownAtStart().find(o => o.kind === 'colony' && o.star === s.target);
    return { cloud: s.mission === 'contact' && M.episode(Object.assign({}, s, { arrive: T })) === 'cloud', source: s.target === M.SOURCE,
      red: M.isRedDwarf(s.target), colony: c && c.status !== 'dead' && c.awake > 0 ? c : null };
  }
  // польза / условие / основание — по миссии и версии правил
  function eqCard(s, opt, lang) {
    const ru = lang === 'ru', R = routeSigns(s), L = (r, e) => ru ? r : e;
    const red = R.red && !R.source, sup = supplyS(s), res = rescueS(s), v4 = eqRules(s);
    const C = {
      capsStd: [L('Не добавляют массы к штатному кораблю.', 'Add no mass to the standard ship.'), L('Сохраняются штатные риски отказа капсулы и пробуждения.', 'Standard capsule-failure and waking risks remain.'), L('Меньшая масса сокращает путь; прогноз потерь — ниже.', 'Lower mass shortens the voyage; the loss estimate is below.')],
      capsSafe: [L('Вдвое снижают фоновые отказы капсул и смерти при пробуждении.', 'Halve background capsule failures and deaths on waking.'),
        res ? L('Не защищают капсулы Оттепели и не продлевают их срок; добавленная масса задерживает прибытие.', "Do not protect Thaw's capsules or extend their life; the added mass delays arrival.") : L('Не защищают от пробоя и общего отказа охлаждения.', 'Do not protect against breaches or a shared cooling failure.'),
        L('Долгий сон и повторные пробуждения входят в план рейса.', 'Long sleep and repeated wakings are part of the voyage plan.')],
      shipOnly: [L('Не требуют отдельного энергетического груза.', 'Require no separate power cargo.'), L('После высадки нужен другой источник или решение энергетического дефицита.', 'After landing, another source or a solution to the energy shortage is needed.'), L('Корабельной энергии может не хватить поселению.', "Ship power may not cover the settlement's needs.")],
      grid: [L('Дают энергию поселению от местной сети.', 'Supply settlement power from the local grid.'), L('Работают только при действующей колонии у цели.', 'Work only with an active colony at the target.'),
        R.colony ? L('Последнее сообщение описывает работающую колонию; состояние сети к прибытию неизвестно.', "The last report describes an active colony; its grid's condition on arrival is unknown.") : L('В архиве нет подтверждения доступной работающей сети.', 'The archive does not confirm an available working grid.')],
      reactor5: [L('Обеспечивает энергию для первой зимы без местной сети.', 'Supplies first-winter power without a local grid.'), L('Тяжёлый удар потока может разбить реактор в грузовом отсеке.', 'A severe stream strike can destroy the reactor in the cargo bay.'), L('Работающая внешняя сеть к прибытию не гарантирована.', 'A working external grid on arrival is not guaranteed.')],
      dual: [L('Сохраняют источник энергии после потери одного блока.', 'Retain a power source after one unit is lost.'), L('Помогают после пережитого тяжёлого удара; гибель корабля не предотвращают.', "Help after a survivable severe strike; do not prevent the ship's destruction."), L('Один энергетический блок может быть повреждён в пути.', 'A single power unit may be damaged en route.')],
      spectra: [L('Штатные наблюдения без добавочной массы.', 'Standard observations without added mass.'), L('Слабые спектры читают подготовленные люди; проверка потока учениками — 26 суток.', 'Trained people read faint spectra; students need 26 days to check the stream.'), L('Время и подготовка смены заменяют часть возможностей приборов.', "Time and crew training provide part of the instruments' capability.")],
      ir: [L(`Позволяет найти поддержку без подготовленного читателя слабых спектров; ${red ? 'сохраняет 5% материалов ремонта при раннем предупреждении о вспышке' : 'ведёт тепловые наблюдения'}.`, `Can find the support ship without a trained reader of faint spectra; ${red ? 'saves 5% of repair materials through early flare warning' : 'provides thermal observations'}.`),
        L('Нужен выбранный поиск; проверки пыли, магистрали и потока ИК не улучшает.', 'A search must be chosen; IR does not improve dust, main-loop or stream checks.'),
        L(`В пути возможны слабые тепловые следы; ${red ? 'красный карлик требует наблюдения активности' : 'время и место возможных событий неизвестны'}.`, `Faint heat traces may occur en route; ${red ? 'the red dwarf requires activity monitoring' : 'the timing and location of possible events are unknown'}.`)],
      spectraPlus: [L('Сокращает проверку потока учениками с 26 до 18 суток.', "Cuts the students' stream check from 26 to 18 days."), L('Нужны обученные ученики или Ная после работы с Корой; чувствительность не меняется.', 'Requires trained students or Naya after working with Kora; sensitivity is unchanged.'), L('Уход от потока должен уложиться в ограниченное окно.', 'Escaping the stream must fit within a limited window.')],
      none: [L('Не добавляет массы зондов.', 'Adds no probe mass.'),
        sup || res ? L('Ранний разведчик требует 10% материалов и, без допуска ремонтников, 120 км/с резерва.', 'The early scout needs 10% of materials and, without qualified repair hands, 120 km/s of reserve.') : L('Разведчик требует 10% материалов, зонд потока — 5%; разведчику без допуска нужно ещё 120 км/с резерва.', 'A scout needs 10% of materials, a stream probe 5%; an unqualified scout launch also needs 120 km/s of reserve.'),
        L('Аппарат можно собрать из запасов, если выбран запуск.', 'A probe can be built from stock if a launch is chosen.')],
      scout2: sup ? [L('Сохраняет 10% материалов и, без допуска, 120 км/с при раннем запуске.', 'Saves 10% of materials and, without qualification, 120 km/s on an early launch.'), L('Второй аппарат в этой миссии применения не имеет; будущую бурю разведчик не предсказывает.', 'The second probe has no use in this mission; the scout does not predict the future storm.'), L('Разведка планет нужна до прибытия, а материалы — для форпоста.', 'Planetary reconnaissance is needed before arrival, while materials are needed for the outpost.')]
        : res ? [L('Сохраняет 10% материалов и, без допуска, 120 км/с при раннем запуске.', 'Saves 10% of materials and, without qualification, 120 km/s on an early launch.'), L('Данные среды помогают проверке торможения, как и у самодельного зонда; второй аппарат не используется.', 'Medium data support the braking check, just as with a built probe; the second probe is unused.'), L('Торможение зависит от среды; состояния склада разведчик не устанавливает.', "Braking depends on the medium; the scout does not establish the store's condition.")]
        : [L('Сохраняет 10% материалов раннего разведчика и 5% зонда потока; без допуска — ещё 120 км/с.', 'Saves 10% of materials for the early scout and 5% for the stream probe; without qualification also 120 km/s.'), L('Выгода — при соответствующих запусках; готовый зонд не повышает чувствительность измерения.', 'Benefits require the corresponding launches; a ready probe does not improve measurement sensitivity.'), L('Запасы для разведки конкурируют с ремонтом и высадкой.', 'Survey stock competes with repairs and landing needs.')],
      inspect: [L('Сохраняет 5% материалов при измерении потока.', 'Saves 5% of materials when measuring the stream.'), L('Не заменяет раннего разведчика; измерение занимает те же 10 суток.', 'Does not replace the early scout; measurement still takes 10 days.'), L('Готовый аппарат сохраняет посадочный запас.', 'A ready probe preserves landing stock.')],
      dust20: [L('Не добавляет массы сверх штатного щита.', 'Adds no mass beyond the standard shield.'), L('Полоса крупной пыли при прямом проходе может пробить щит; за ним — жилой отсек.', 'Crossing a coarse-dust band directly can breach the shield; a living compartment is behind it.'), L('Наличие опасной полосы на курсе заранее не установлено.', 'A dangerous band on our course has not been established in advance.')],
      dust40: [L('Выдерживает удар полосы крупной пыли у облака без сквозного пробоя.', "Withstands the cloud's coarse-dust band without a through-breach."), L('Ремонт наружного слоя требует 5% материалов; отдельной защиты от потока нет.', 'Outer-layer repair needs 5% of materials; it provides no separate stream immunity.'), L('Сохранённая целостность щита важна и при последующих ударах.', 'Keeping the shield intact also matters during later strikes.')],
      sectors: [L('Позволяют восстановить полный расчёт щита после пробоя.', "Restore the shield's full rating after a breach."), L('Нужны допуск ремонтников и 3% материалов; первоначальные потери не отменяются.', 'Require repair qualification and 3% of materials; initial losses are not reversed.'), L('Заплата закрывает пробой, но не заменяет целый сектор.', 'A patch seals the breach but does not replace an intact sector.')],
      repair: sup ? [L('Не добавляет производственной массы.', 'Adds no manufacturing mass.'), L(`Второй монтажный комплект стоит 30% материалов; разделение платы — ${busSplitFor(s, 'repair')}%.`, `The second installation kit costs 30% of materials; board separation costs ${busSplitFor(s, 'repair')}%.`), L('Детали придётся брать из общего запаса.', 'Parts must come from the shared stock.')]
        : [L('Не добавляет массы производственного оборудования.', 'Adds no production-equipment mass.'), L('Изготовить капельный радиатор этим набором нельзя.', 'This kit cannot manufacture a droplet radiator.'), L('Для возвращения утраченного резерва мощности может понадобиться производство.', 'Restoring a lost high-power reserve may require manufacturing.')],
      tools: sup ? [L(`Второй монтажный комплект — 10% материалов вместо 30${v4 ? `; разделение платы — ${busSplitFor(s, 'tools')}% вместо 12` : ''}.`, `The second installation kit costs 10% of materials instead of 30${v4 ? `; board separation ${busSplitFor(s, 'tools')}% instead of 12` : ''}.`),
          v4 ? L('Производство не обнаруживает дефект и не ускоряет работы; монтаж требует свободных сетей.', 'Manufacturing neither detects damage nor speeds up work; installation requires free grids.') : L('Нужны две свободные сети и материалы на недостающее оборудование; разделение платы стоит 12%.', 'Two free grids and materials for missing equipment are required; board separation costs 12%.'),
          L('Изготовление на борту сохраняет запас форпоста.', "Onboard manufacturing preserves the outpost's stock.")]
        : [L('Позволяют изготовить радиатор за 20% материалов и вернуть резерв мощности.', 'Allow a radiator to be built for 20% of materials, restoring the high-power reserve.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Require lost high power, the blueprint and repair qualification.'), L('Восстановление контура требует изготовления деталей.', 'Restoring the loop requires manufactured parts.')],
      printQC: sup ? [L(`Второй монтажный комплект — 10% материалов${v4 ? `; разделение платы — ${busSplitFor(s, 'printQC')}% вместо 12` : ''}.`, `The second installation kit costs 10% of materials${v4 ? `; board separation ${busSplitFor(s, 'printQC')}% instead of 12` : ''}.`),
          v4 ? L('Производство не обнаруживает дефект и не ускоряет работы; на 2 тыс. т тяжелее станков.', 'Manufacturing neither detects damage nor speeds up work; 2 kt heavier than machine tools.') : L('Эффект совпадает со станками, но масса больше на 2 тыс. т.', 'The effect matches machine tools, with 2 kt more mass.'),
          L('Изготовленные детали сокращают расход общего запаса.', 'Manufactured parts reduce use of the shared stock.')]
        : [L('Позволяет изготовить радиатор за 10% материалов вместо 20 на станках.', 'Allows a radiator to be built for 10% of materials instead of 20 with machine tools.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Requires lost high power, the blueprint and repair qualification.'), L('Печать экономит материалы ценой большей массы оборудования.', 'Printing saves materials at the cost of greater equipment mass.')]
    };
    if (!v1(s) && s.mission === 'contact') Object.assign(C, {                 // версия 0: щит — износ у облака, без полосы и ремонта слоя
      dust20: [L('Не добавляет массы сверх штатного щита.', 'Adds no mass beyond the standard shield.'), L('Износ у края облака пробивает сектор щита.', "Wear at the cloud's edge breaches a shield sector."), L('Плотность края облака заранее не измерена.', "The density of the cloud's edge has not been measured in advance.")],
      dust40: [L('Держит полтора года износа у облака без пробоя.', 'Holds a year and a half of cloud wear without a breach.'), L('Отдельной защиты от потока нет.', 'It provides no separate stream immunity.'), L('Износ зависит от времени в крае облака.', "Wear depends on the time spent in the cloud's edge.")],
      sectors: [L('Пробитый сектор меняют на запасной.', 'A breached sector is replaced with a spare.'), L('Нужны допуск ремонтников и 3% материалов.', 'Requires repair qualification and 3% of materials.'), L('Заплата закрывает пробой, но не заменяет целый сектор.', 'A patch seals the breach but does not replace an intact sector.')] });
    return C[opt] || [];
  }
  // аварийная польза — отдельной условной строкой, без частот генератора
  function eqIf(s, opt, lang, d) {
    const ru = lang === 'ru', R = routeSigns(s, d);
    if (opt === 'dust40' && s.mission === 'contact' && v1(s) && R.cloud) return ru ? 'Если пройдём полосу крупной пыли у облака: удвоенный щит предотвращает пробой; расчётная разница аварийных потерь — 8 человек.' : "If we cross the cloud's coarse-dust band: the doubled shield prevents a breach; the estimated difference in incident losses is 8 people.";
    if (['grid', 'reactor5', 'dual'].includes(opt) && s.mission === 'contact') return ru ? 'Если поселению не хватит энергии и другого источника не будет: энергетический груз предотвращает зимний дефицит; потери без него зависят от выбранного поселения.' : 'If the settlement lacks power and no other source is available: power cargo prevents the winter shortage; losses without it depend on the settlement chosen.';
    return null;
  }
  // цена замены: от рекомендации в этой позиции, прочие ответы те же
  const sgn = (x, lang, dg) => { const v = Math.abs(x) < 0.5 * Math.pow(10, -dg) ? 0 : x, t = (lang === 'ru' ? f1 : f1)(Math.abs(v), lang);
    return v === 0 ? (x === 0 ? '0' : (x > 0 ? '+<0' : '−<0') + (lang === 'ru' ? ',1' : '.1')) : `${v > 0 ? '+' : '−'}${dg === 2 ? (lang === 'ru' ? Math.abs(v).toFixed(2).replace('.', ',') : Math.abs(v).toFixed(2)) : t}`; };
  function eqCost(s, d, pos, lang) {
    const ru = lang === 'ru', rec = M.eqDefault(s.mission, s.riskVersion)[pos];
    if (d.eq[pos] === rec) return [];
    const a = passportNumbers(s, Object.assign({}, d, { eq: Object.assign({}, d.eq, { [pos]: rec }) })), b = passportNumbers(s, d);
    const dt = (b.T - a.T) * 365.25, dtTxt = Math.abs(dt) < 30 ? `${sgn(dt, lang, 1)} ${ru ? 'сут.' : 'days'}` : `${sgn((b.T - a.T) * 12, lang, 1)} ${ru ? 'мес.' : 'months'}`;
    const out = [ru ? `От рекомендации в этой позиции: масса ${sgn(b.used - a.used, lang, 2)} тыс. т; прибытие ${dtTxt}; бодрствование ${sgn((b.aw - a.aw) * 365.25, lang, 1)} сут. на человека.`
      : `Relative to the recommendation for this position: mass ${sgn(b.used - a.used, lang, 2)} kt; arrival ${dtTxt}; waking time ${sgn((b.aw - a.aw) * 365.25, lang, 1)} days per person.`,
      ru ? `Ожидаемые фоновые потери: ${a.L.total} → ${ppl(b.L.total)} (${b.L.total - a.L.total > 0 ? '+' : b.L.total - a.L.total < 0 ? '−' : ''}${Math.abs(b.L.total - a.L.total)}); оценка модели, не гарантия.`
      : `Expected background losses: ${a.L.total} → ${b.L.total} people (${b.L.total - a.L.total > 0 ? '+' : b.L.total - a.L.total < 0 ? '−' : ''}${Math.abs(b.L.total - a.L.total)}); a model estimate, not a guarantee.`];
    if (s.mission === 'rescue') { const m = T => T <= THAW_LOSS ? (ru ? `${f1((THAW_LOSS - T) * 12, 'ru')} мес.` : `${f1((THAW_LOSS - T) * 12, 'en')} months`) : (ru ? `просрочка ${Math.round((T - THAW_LOSS) * 365.25)} сут.` : `overdue by ${Math.round((T - THAW_LOSS) * 365.25)} days`);
      out.push(ru ? `Расчётный запас до первой потери Оттепели: ${m(a.T)} → ${m(b.T)}; время работ у склада ещё не вычтено.` : `Estimated margin before Thaw's first loss: ${m(a.T)} → ${m(b.T)}; work at the store has not yet been deducted.`); }
    if (!b.fits) out.push(ru ? `Превышение грузоподъёмности: ${f1(b.used - Math.max(0, b.cap), 'ru')} тыс. т. Для этого варианта нужно изменить другие ответы.` : `Cargo capacity exceeded by ${f1(b.used - Math.max(0, b.cap), 'en')} kt. This option requires changing other answers.`);
    return out;
  }
  // рекомендация Совета: «предлагаем X, потому что Y; принимаем риск Z»
  function eqCouncil(s, lang) {
    const ru = lang === 'ru';
    if (s.mission === 'supply' && !eqRules(s)) return ru ? 'В этой версии Совет предложил станки и подключение к колонии. Станки экономят материалы второго монтажного комплекта; подключение монтажу не помогает и добавляет массу. Комплект сохранён по правилам этого паспорта.'
      : 'In this version, the Council proposed machine tools and a colony grid link. The tools save materials for the second installation kit; the link does not help installation and adds mass. The loadout is retained under this passport\'s rules.';
    return ({
      contact: ru ? 'Совет предлагает ИК-обсерваторию и штатное остальное оснащение, потому что предстоит искать слабые тепловые следы; принимает риск повреждения щита и необходимость отдельно обеспечить энергию поселению.' : 'The Council proposes an IR observatory with otherwise standard equipment because we must seek faint heat traces; it accepts the risk of shield damage and the need to secure settlement power separately.',
      supply: ru ? 'Совет предлагает станки без отдельного энергетического груза, потому что ведомость форпоста требует восстановления оборудования, а две монтажные сети уже есть на корабле; принимает расход материалов на разведчик и остаточный риск проверок старых узлов.' : "The Council proposes machine tools without separate power cargo because the outpost's inventory calls for equipment restoration and the ship already has two installation grids; it accepts the material cost of a scout and the residual risk of checks on old components.",
      rescue: ru ? 'Совет предлагает надёжные капсулы, потому что экипажу предстоят долгий сон и пробуждения; принимает задержку от их массы, сокращающую запас времени Оттепели. Капсулы склада этот комплект не защищает.' : "The Council proposes reliable capsules because the crew faces long sleep and repeated wakings; it accepts the delay from their mass, which reduces Thaw's time margin. This equipment does not protect the store's capsules."
    })[s.mission || 'contact'];
  }
  // досье миссии: что предстоит, чего опасаемся, чего пока не знаем — только публичные сведения
  function missionDossier(s, d, lang) {
    const ru = lang === 'ru', R = routeSigns(s, d), H = ru ? ['Что предстоит', 'Чего опасаемся', 'Чего пока не знаем'] : ['What lies ahead', 'What concerns us', 'What remains unknown'];
    if (s.mission === 'supply' && supplyS(s)) return H.map((h, i) => [h, ru ? ['Доставить передатчик и капсульный блок форпосту Ксилона Ир; в заявке есть ведомость разобранного оборудования.', 'Отказа охлаждения в пути, частиц от вспышки Барнарда и зависимости новых систем от старых общих узлов.', 'Состояния коллектора и общей платы; силы будущей бури и остатка исправного оборудования к прибытию.'][i]
      : ['Deliver a transmitter and capsule unit to the Xylona Ir outpost; the request includes an inventory of dismantled equipment.', "Cooling failure en route, particles from a Barnard's Star flare and new systems depending on old shared components.", "The collector's and common board's condition; the future storm's strength and the equipment still working on arrival."][i]]);
    if (s.mission === 'rescue' && rescueS(s)) return H.map((h, i) => [h, ru ? ['Дойти до склада Оттепели у Росс 128; по последнему сообщению заняты сорок капсул, расчётный срок — год 125.', 'Опоздания из-за торможения, отказов старых капсул и повреждений при подключении склада.', 'Сколько людей живы сейчас, состояния крепления и охлаждения склада; условий будущей площадки.'][i]
      : ["Reach Thaw's store at Ross 128; the last report lists forty occupied capsules, with rated life to year 125.", 'Braking delays, ageing capsule failures and damage while connecting the store.', "How many people are alive now, the mount's and store cooling's condition, and conditions at the future site."][i]]);
    if (s.mission && s.mission !== 'contact') return null;
    const route = [], hz = [], unk = [];
    if (R.cloud) { route.push(ru ? 'На пути потребуется уточнить пылевую среду.' : 'The dust environment along the route needs checking.'); hz.push(ru ? 'пробоя щита крупной пылью;' : 'a shield breach from coarse dust;'); unk.push(ru ? 'Размер частиц и наличие плотной полосы неизвестны.' : 'Particle sizes and the presence of a dense band are unknown.'); }
    if (R.source) { route.push(ru ? 'Предстоят наблюдения системы, включая малосветящиеся компоненты.' : 'We will observe the system, including its faint components.'); hz.push(ru ? 'потока частиц при сближении;' : 'a particle stream during approach;'); unk.push(ru ? 'Пересечёт ли поток наш курс, неизвестно.' : 'Whether a stream will cross our course is unknown.'); }
    if (R.red && !R.source) { hz.push(ru ? 'звёздных вспышек;' : 'stellar flares;'); unk.push(ru ? 'Время вспышек и сила потока частиц заранее неизвестны.' : 'Flare timing and particle flux are not known in advance.'); }
    if (R.colony) { const age = Math.round(-R.colony.observedAt); route.push(ru ? `По последнему отчёту у цели действует «${R.colony.ru}»; сведениям ${yrs(age)}.` : `The last report lists ${R.colony.en} as active at the target; the information is ${yrsEn(age)} old.`); unk.push(ru ? 'Работает ли её сеть сейчас и сможет ли она принять нас, не подтверждено.' : "Its grid's current operation and its ability to receive us are unconfirmed."); }
    else route.push(ru ? 'Подключение к работающей местной сети не подтверждено.' : 'Access to a working local grid is unconfirmed.');
    const work = s.task && s.task.work, LK = s.task && RQ.linkByStar(s.task.star), DO = {
      contactColony: LK ? [`Дойти до ${nmG(s)}, установить прямую связь ${LK.with[0]}, ${LK.whatV[0]} и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, establish a direct link ${LK.with[1]}, ${LK.whatV[1]} and assess prospects for settlement. `] : [`Дойти до ${nmG(s)}, установить прямую связь с Перевалом, сверить лоции и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, establish a direct link with the Pass, reconcile the navigation records and assess prospects for settlement. `],
      trace: [`Дойти до ${nmG(s)}, обследовать район последней орбиты двадцать четвёртой и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, survey the region of No. 24's last orbit and assess prospects for settlement. `],
      survey: [`Дойти до ${nmG(s)}, обследовать систему и её планету и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, survey the system and its planet and assess prospects for settlement. `]
    }[work] || [`Дойти до ${nmG(s)}, искать след тридцать второй и оценить возможность поселения. `, `Reach ${nm(s, 'en')}, seek traces of the Thirty-Second and assess prospects for settlement. `];
    const UNK = { contactColony: LK ? [`Нынешнее состояние ${LK.gen[0]}`, `${LK.gen[1].replace(/^./, x => x.toUpperCase())} present state`] : ['Нынешнее состояние Перевала', "The Pass's present state"], trace: ['Сохранность корабля двадцать четвёртой и его журнала', "The state of No. 24's ship and its log"],
      survey: ['Поверхность планеты', "The planet's surface"] }[work] || ['Судьба тридцать второй', "The Thirty-Second's fate"];
    return [[H[0], DO[ru ? 0 : 1] + route.join(' ')],
      [H[1], ru ? `Отказов капсул в долгом пути; ${hz.join(' ')} нехватки энергии после высадки.` : `Capsule failures during the long voyage; ${hz.join(' ')} an energy shortage after landing.`],
      [H[2], (ru ? `${UNK[0]}, условия будущего поселения и фактическая среда на курсе не установлены. ` : `${UNK[1]}, settlement conditions and the actual medium along our course are unconfirmed. `) + unk.join(' ')]];
  }
  // разделение общей платы снабженца (версия 4: станки и печать удешевляют)
  const busSplitFor = (s, prod) => eqRules(s) && supplyS(s) ? ({ repair: 12, tools: 10, printQC: 8 })[prod] : STORM.split;
  const busSplit = s => busSplitFor(s, eqOf(s).prod);
  // итог оснащения после пути: что помогло, что не понадобилось, чего не хватило — по установленным событиям партии.
  // ids — сцены, которые прошли. Контрфакт — только для события, которое случилось; оценки капсул помечены как расчёт.
  function eqSummary(s, lang, ids) {
    const ru = lang === 'ru', eq = eqOf(s), help = [], miss = [], used = new Set(), had = id => ids.has(id), L = (r, e) => ru ? r : e;
    const rq = s.repairQual ? '' : L(` и ${DV.probe} км/с резерва манёвров`, ` and ${DV.probe} km/s of manoeuvre reserve`);
    if (s.riskVersion >= 5 && s.cloudHit) {                            // v5: исход полосы — из модели щита
      const h = s.cloudHit;
      if (!h.breached) { help.push(L(`Удвоенный щит выдержал удар крупного зерна у облака: на панели ${h.panel} выбоина, сквозного пробоя нет, ремонт не понадобился.`, `The doubled shield withstood the coarse grain at the cloud: a scar on panel ${h.panel}, no through-breach, no repair needed.`)); used.add('shield'); }
      else {
        miss.push(L(`Щит пробит крупным зерном у облака (панель ${h.panel}). Удвоенный слой выдержал бы этот удар; расчётная разница потерь — ${CLOUD.dead} человек.`, `The shield was breached by a coarse grain at the cloud (panel ${h.panel}). A doubled layer would have held this impact; the estimated loss difference is ${CLOUD.dead} people.`));
        if (h.repair === 'replace') { help.push(L(`Запасная панель установлена ремонтниками с допуском: щит снова держит полный расчёт; крепёж — ${SHIELD_WORK.replace}% материалов.`, `Qualified repair hands fitted a spare panel: the shield holds its full rating again; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
        else if (eq.shield === 'sectors' && !s.repairQual) miss.push(L('Запасную панель не поставили: нет допуска к работе под тягой.', 'No spare panel was fitted: no qualification for work under thrust.'));
      }
    } else if (had('a1.edge.t1') && v1(s) && s.shieldWear > 0) {
      if (eq.shield === 'dust40') { help.push(L(`Удвоенный щит выдержал полосу крупной пыли у облака: сквозного пробоя нет; на наружный слой ушло ${CLOUD.patch}% материалов.`, `The doubled shield withstood the cloud's coarse-dust band: no through-breach; the outer layer took ${CLOUD.patch}% of materials.`)); used.add('shield'); }
      else miss.push(L(`Щит пробит полосой крупной пыли. По зарегистрированному удару удвоенный слой выдержал бы нагрузку; расчётная разница потерь — ${CLOUD.dead} человек.`, `The shield was breached by the coarse-dust band. For the recorded impact a doubled layer would have held; the estimated loss difference is ${CLOUD.dead} people.`));
    }
    if (s.riskVersion >= 5) {                                          // v5: замена панели — решение у пробоя (облако — выше, поток — здесь)
      const h = s.streamImpact;
      if (h && h.repair === 'replace') { help.push(L(`После удара потока запасная панель ${h.panel} установлена ремонтниками с допуском; крепёж — ${SHIELD_WORK.replace}% материалов.`, `After the stream strike qualified repair hands fitted a spare panel ${h.panel}; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
      else if (h && h.level != null && !s.lostShip && eq.shield === 'sectors' && !s.repairQual) miss.push(L('После удара потока запасную панель не поставили: нет допуска к работе под тягой.', 'After the stream strike no spare panel was fitted: no qualification for work under thrust.'));
    }
    else if (had('a2.sector')) { help.push(L('Запасной сектор установлен ремонтниками с допуском: щит снова держит полный расчёт; крепёж — 3% материалов.', 'Qualified repair hands fitted the spare sector: the shield holds its full rating again; fasteners took 3% of materials.')); used.add('shield'); }
    else if ((s.shieldBreach || had('a2.breach')) && eq.shield === 'sectors' && !s.repairQual) miss.push(L('Полный сектор не установлен: нет допуска к работе под тягой. Заплата не восстанавливает полный расчёт щита.', 'No full sector was fitted: no qualification for work under thrust. The patch does not restore the shield\'s full rating.'));
    if (s.scout > 0) {
      if (hasScouts(s)) { help.push(L(`Выпущен готовый разведчик: сохранены 10% материалов${rq}.`, `A ready scout was launched: 10% of materials saved${rq}.`)); used.add('probes'); }
      else miss.push(L(`Готового разведчика не было: сборка потребовала 10% материалов${rq}.`, `No ready scout: assembly used 10% of materials${rq}.`));
    }
    if (s.choices['d.stream'] === 'probe') {
      if (probesLeft(s)) { help.push(L('Готовый зонд сохранил 5% материалов. Измерение — 10 суток; чувствительность та же, что у собранного аппарата.', 'The ready probe saved 5% of materials. Measurement took 10 days; sensitivity matches a built probe.')); used.add('probes'); }
      else miss.push(L('Готового зонда не было: аппарат собран из посадочного запаса, расход — 5% материалов.', 'No ready probe: one was built from landing stock, using 5% of materials.'));
    }
    if (s.choices['d.stream'] === 'student') {
      if (eq.sensors === 'spectraPlus') { help.push(L('Расширенная спектрометрия сократила проверку потока с 26 до 18 суток.', 'Extended spectrometry cut the stream check from 26 to 18 days.')); used.add('sensors'); }
      else miss.push(L('Проверка потока штатными приборами заняла 26 суток; расширенная спектрометрия сократила бы её на 8.', 'The standard-instrument stream check took 26 days; extended spectrometry would have shortened it by 8.'));
    }
    if (s.choices['d.support'] === 'search') {
      if (s.support === 'found' && !s.taught && !s.koraYear && hasIR(s)) { help.push(L('ИК-обсерватория прочитала слабый тепловой след без подготовленного читателя: поддержка найдена.', 'The IR observatory read the faint heat trace without a trained reader: the support ship was found.')); used.add('sensors'); }
      else if (s.support === 'lost') miss.push(L('Слабый след прочитать не удалось: нет подготовленного читателя и ИК-обсерватории.', 'The faint trace could not be read: neither a trained reader nor an IR observatory was available.'));
    }
    if (had('a3.flare')) {
      if (hasIR(s)) { help.push(L('Раннее ИК-предупреждение о вспышке: корабль развернули заранее, 5% материалов ремонта сохранены.', 'Early IR warning of the flare: the ship turned in time, saving 5% of repair materials.')); used.add('sensors'); }
      else miss.push(L('Раннего ИК-предупреждения о вспышке не было; ремонт потребовал 5% материалов.', 'There was no early IR warning of the flare; repairs used 5% of materials.'));
    }
    if (had('a4.energy') && s.support !== 'found' && powerOK(s)) { const src = { grid: L('Сеть колонии обеспечила', 'The colony grid supplied'), reactor5: L('Реактор 5 МВт обеспечил', 'The 5 MW reactor supplied'), dual: L('Независимый блок обеспечил', 'An independent unit supplied') }[eq.energy];
      help.push(L(`${src} энергию поселению: дефицита первой зимы нет.`, `${src} the settlement: no first-winter energy shortage.`)); used.add('energy'); }
    if (had('a4.winter')) miss.push(L(`Поселению не хватило энергии: действующего дополнительного источника не было. Зимние потери — ${ppl(s.winterDead)}.`, `The settlement lacked power: no additional source was operating. Winter losses: ${s.winterDead}.`));
    // производство: глагол — по варианту (станки — мн. ч., печать — ж. р.)
    const prodName = { tools: L('Станки', 'Machine tools'), printQC: L('Металлопечать', 'Metal printing') }[eq.prod], pv = (pl, f) => eq.prod === 'printQC' ? f : pl;
    if (s.blueprint === 'built' && prodName) { help.push(L(`${prodName} ${pv('позволили', 'позволила')} восстановить резерв мощности: капельный радиатор — ${BLUEPRINT[eq.prod]}% материалов.`, `${prodName} restored the high-power reserve: the droplet radiator took ${BLUEPRINT[eq.prod]}% of materials.`)); used.add('prod'); }
    if (supplyS(s) && eqRules(s) && prodName && (s.busMethod === 'split' || s.busFound)) { help.push(L(`${prodName} ${pv('сократили', 'сократила')} расход на разделение платы: ${busSplit(s)}% вместо ${STORM.split}.`, `${prodName} cut the board-separation cost: ${busSplit(s)}% instead of ${STORM.split}.`)); used.add('prod'); }
    if (s.mission === 'supply' && s.deliver === 'both' && prodName) { help.push(L(`${prodName} ${pv('сохранили', 'сохранила')} 20% материалов: второй монтажный комплект — 10% вместо 30.`, `${prodName} saved 20% of materials: the second installation kit cost 10% instead of 30.`)); used.add('prod'); }
    if (eq.caps === 'capsSafe') { const T = Math.min(s.year, s.arrive), a = M.losses(T, s.watch, true, crewOf(s)).total, b = M.losses(T, s.watch, false, crewOf(s)).total;
      help.push(L(`Расчёт: надёжные капсулы — фоновые потери за путь ${a} вместо ${b}; это оценка модели, не список спасённых.`, `Estimate: reliable capsules — background losses on the road ${a} instead of ${b}; a model estimate, not a list of people saved.`)); used.add('caps'); }
    const idle = M.EQUIP.filter(p => !p.fixed && eq[p.id] !== M.EQ_BASE[p.id] && !used.has(p.id))
      .map(p => L(`${M.eqOpt(p.id, eq[p.id]).ru}: применение в пройденных событиях не зарегистрировано.`, `${M.eqOpt(p.id, eq[p.id]).en}: no use was recorded in the events encountered.`));
    let cost = null;
    const pp = String(s.choices['d.passport'] || '').split('|');
    if (pp.length === 4 && s.eq) {
      const sp = Object.assign({}, s, { target: s.taskHistory && s.taskHistory.length ? s.taskHistory[0].star : reqOf(s) ? reqOf(s).star : s.target }), d0 = { b: Number(pp[0]), r: Number(pp[1]), kits: pp[2] ? pp[2].split('+') : [], eq: s.eq };
      const cur = passportNumbers(sp, d0), base = passportNumbers(sp, Object.assign({}, d0, { eq: M.EQ_BASE })),
        rec = passportNumbers(sp, Object.assign({}, d0, { eq: M.eqDefault(s.mission, s.riskVersion) })), mo = x => `${sgn(x * 12, lang, 1)} ${ru ? 'мес.' : 'months'}`;
      const same = Math.abs(cur.used - rec.used) < 1e-9;
      cost = L(`Оснащение сверх штатного: ${f1(cur.used - base.used, 'ru')} тыс. т, расчётная задержка от массы ${mo(cur.T - base.T)}; ${same ? 'по массе совпадает с комплектом Совета.' : `от комплекта Совета: ${sgn(cur.used - rec.used, 'ru', 2)} тыс. т, ${mo(cur.T - rec.T)}`}`,
        `Equipment above standard: ${f1(cur.used - base.used, 'en')} kt, estimated mass-related delay ${mo(cur.T - base.T)}; ${same ? "by mass it matches the Council's loadout." : `relative to the Council's loadout: ${sgn(cur.used - rec.used, 'en', 2)} kt, ${mo(cur.T - rec.T)}.`}`);
    }
    return { help, idle, miss, cost };
  }
  const eqApi = { passportNumbers, eqHidden, eqPosHidden, eqQuestion, eqCard, eqIf, eqCost, eqCouncil, missionDossier, eqSummary };

  // ---- авария с живыми: сон, сигнал бедствия и спасатели (mission.js: rescuers, survivors)
  // Автономность H: 90 лет — вахта из двенадцати сменяется из спящих, реакторы и радиаторы исправны;
  // 60 — пробит зал (часть охлаждения на обходных магистралях); +30 — есть ремонтники с допуском.
  const WATCH_SOS = 12;
  // после отказа охлаждения в дрейфе держит только изолированное аварийное охлаждение зала — как при пробитом зале
  const sosHold = s => (s.streamHit === 2 || s.sos === 'cargo' || s.sos === 'rescueDock' ? 60 : 90) + (s.repairQual ? 30 : 0);
  let WORLD = { passTug: true };                                         // память мира между партиями (game.js)
  const setWorld = w => { WORLD = Object.assign({ passTug: true }, w || {}); };
  // cargo: год сигнала — целый (сутки работ — в журнале)
  // год сигнала — целый (у склада — после консервации зала: прибытие округляется вверх)
  const SOS_AT = { cargo: SOS_AT_cargo, drift: s => loopV1(s) ? loopAt(s) : Y(s, 0.75) + 2, stream: sosAtStream, home: s => s.arrive + 1, rescueDock: s => Math.max(s.arrive, Math.ceil(storeNow(s))) };
  function incidentOf(s, cause) {
    const sent = SOS_AT[cause](s), alive = crewOf(s) - (lossesOf(s, Math.min(sent, s.arrive)).total + s.dead + (s.rescueCrewDead || 0));
    return { id: `${s.target}|${sent}|${cause}`, cause, target: s.target, beta: s.beta, arrive: s.arrive, tMag: s.tMag, capRate: capsSafe(s) ? 1e-4 : 2e-4, sent, mission: s.mission,
      alive, watch: WATCH_SOS, sleepers: alive - WATCH_SOS, hold: sosHold(s), deadline: sent + sosHold(s) };
  }
  // названия баз в падежах: именительный, родительный, предложный с предлогом
  const PLACE = {
    pass: { ru: ['Перевал', 'Перевала', 'на Перевале'], en: 'the Pass' },
    earth: { ru: ['Земля', 'Земли', 'на Земле'], en: 'Earth' },
    shore: { ru: ['Ближний берег', 'Ближнего берега', 'на Ближнем берегу'], en: 'Near Shore' },
    yard: { ru: ['Верфь Эридана', 'Верфи Эридана', 'на Верфи Эридана'], en: 'the Eridani Yard' },
    garden: { ru: ['Сад', 'Сада', 'в Саду'], en: 'the Garden' }
  };
  const baseKey = r => r.id === 'local' ? r.colony : r.id;
  const place = (r, lang, k = 0) => lang === 'ru' ? PLACE[baseKey(r)].ru[k] : PLACE[baseKey(r)].en;
  const cap = x => x.charAt(0).toUpperCase() + x.slice(1);
  const yr = y => Math.round(y);
  function sosKnown(s, cause, lang) {
    const inc = incidentOf(s, cause), R = M.rescuers(inc, WORLD), c = R.council, ru = lang === 'ru';
    const best = R.list.reduce((a, b) => b.complete < a.complete ? b : a), m = inc.deadline - best.complete;
    return [
      best === c
        ? (ru ? `Сигнал первым услышит ${place(c, 'ru')} — в год ${yr(c.hear)} — и сможет помочь к году ${yr(c.complete)}.` : `${cap(place(c, 'en'))} will hear the signal first — in year ${yr(c.hear)} — and can help by year ${yr(c.complete)}.`)
        : (ru ? `Сигнал первым услышит ${place(c, 'ru')}, в год ${yr(c.hear)}; быстрее всех поможет ${place(best, 'ru')} — к году ${yr(best.complete)}.` : `${cap(place(c, 'en'))} will hear first, in year ${yr(c.hear)}; ${place(best, 'en')} can help soonest — by year ${yr(best.complete)}.`),
      ru ? `Капсулы с вахтой из двенадцати продержатся до года ${inc.deadline}.` + (m >= 0 ? ` Запас — ${yrs(m)}.` : ' Никто не успевает.')
        : `Capsules with a watch of twelve will hold until year ${inc.deadline}.` + (m >= 0 ? ` Margin: ${yrsEn(m)}.` : ' No one makes it in time.'),
      ru ? 'Экспедиция на этом кончается: дальше решают те, кто услышит.' : 'The expedition ends here: those who hear will decide the rest.'
    ];
  }
  const sosOption = cause => ({
    id: 'sos',
    label: { ru: 'Спать и звать помощь', en: 'Sleep and call for help' },
    known: { ru: s => sosKnown(s, cause, 'ru'), en: s => sosKnown(s, cause, 'en') },
    effect: st => { st.sos = cause; },
    record: {
      ru: 'Совет решает спать и ждать. Сигнал бедствия уходит к колониям и на Землю; двенадцать остаются на вахте.',
      en: 'The council decides to sleep and wait. The distress signal goes out to the colonies and to Earth; twelve stay on watch.'
    }
  });
  // конец партии: люди живы, экспедиция прекращена; следующую партию начинает совет, услышавший первым
  const SOS_WHERE = {
    cargo: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${s.arrive}${s.kits.includes('request') ? '; груз заявки — в трюме' : ''}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${s.arrive}${s.kits.includes('request') ? '; the request cargo is in the hold' : ''}.` },
    drift: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${s.arrive}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${s.arrive}.` },
    stream: { ru: s => `Корабль дотормаживает к ${nmD(s)}: орбита — около года ${s.arrive}.`, en: s => `The ship finishes braking toward ${nm(s, 'en')}: orbit around year ${s.arrive}.` },
    home: { ru: s => `Корабль на орбите у ${nmG(s)}.`, en: s => `The ship is in orbit at ${nm(s, 'en')}.` },
    rescueDock: { ru: s => `Корабль на орбите у ${nmG(s)}, рядом со складом Оттепели; живые Оттепели остаются в капсулах склада, их последняя диагностика — в сигнале.`, en: s => `The ship is in orbit at ${nm(s, 'en')}, beside Thaw's store; Thaw's living remain in the store's capsules, their last diagnostics in the signal.` }
  };
  // «Звать помощь?» после отказа контура — одна форма для версии 0 и версии 1
  const sosDrift = (id, when) => ({
    id, scene: 'ring', kind: 'decision', when,
    title: { ru: 'Звать помощь?', en: 'Call for help?' },
    context: {
      ru: s => `Контур воды перекрыт и залатан. На вахте ${ppl(s.watch)}, ${s.repairQual ? 'ремонтники с допуском есть, но магистраль держится на заплатах' : 'ремонтников с допуском нет'}. До ${nmG(s)} — ${yrs(s.arrive - SOS_AT.drift(s))}; корабль дойдёт и затормозит сам, по программе.

Можно жить дальше на заплатах. Можно перевести зал в консервацию — глубже холод, реже обслуживание — и уснуть всем, кроме двенадцати: вахта сменяется из спящих, а сигнал бедствия услышат колонии и Земля. Для перевода нужны руки, которые пока есть.`,
      en: s => `The water loop is sealed and patched. ${s.watch} people are on watch, ${s.repairQual ? 'with qualified repair hands, but the main holds on patches' : 'with no qualified repair hands'}. ${nm(s, 'en')} is ${yrsEn(s.arrive - SOS_AT.drift(s))} away; the ship will get there and brake by itself, by programme.

They can go on living on the patches. Or they can put the hall into conservation — deeper cold, rarer maintenance — and everyone but twelve can go to sleep: the watch is relieved from among the sleepers, and the colonies and Earth will hear the distress signal. The switch needs hands, and there are still enough.`
    },
    options: [{
      id: 'carry',
      label: { ru: 'Жить дальше на заплатах', en: 'Go on living on the patches' },
      known: {
        ru: s => ['Экспедиция продолжается: вахта, агрозалы, дом у цели.', s.repairQual ? 'Ремонтники с допуском есть, но магистраль — на заплатах: следующая поломка может стать последней.' : 'Ремонтников с допуском нет: каждая следующая поломка — надолго.'],
        en: s => ['The expedition goes on: the watch, the agro halls, a home at the target.', s.repairQual ? 'There are qualified repair hands, but the main holds on patches: the next breakdown may be the last.' : 'No qualified repair hands: every next breakdown will take long.']
      },
      effect: st => {},
      record: {
        ru: 'Совет решает жить дальше. Заплаты проверяют каждую смену.',
        en: 'The council decides to go on living. The patches are checked every shift.'
      }
    }, sosOption('drift')]
  });
  // «Летучий голландец»: некому обслуживать зал. Версия 0 списывает отказ здесь; версия 1 — уже в a2.loopEnd1
  const dutchmanEnd = (id, when, year, effect) => ({
    id, scene: 'drift', kind: 'end', year, when, effect,
    title: { ru: '«Летучий голландец»', en: 'The Flying Dutchman' },
    text: {
      ru: s => `Контур воды отказал в обоих кольцах. Группа Б и одиннадцать человек вахты погибли; оставшихся ${ppl(s.watch)} не хватило, чтобы обслуживать зал анабиоза. Капсулы отказывают по одной.

Автоматика ведёт корабль дальше. Плазменный магнит включится по программе, корабль встанет на орбиту у ${nmG(s)} около года ${s.arrive} — и так и будет кружить с экипажем на борту, без живых. Маяк будет передавать, пока хватит питания.

Экспедиция окончена. Для следующей — к другой цели — это будет находка: журнал, имена, последняя запись вахты.`,
      en: s => `The water loop failed in both rings. Group B and eleven of the watch died; the remaining ${s.watch} were too few to maintain the anabiosis hall. The capsules fail one by one.

The automation flies the ship on. The plasma magnet will switch on by programme, and the ship will enter orbit at ${nm(s, 'en')} around year ${s.arrive} — and will keep circling there with its crew aboard, none of them alive. The beacon will transmit as long as there is power.

The expedition is over. For the next one — to another target — it will be a find: the log, the names, the watch's last entry.`
    }
  });
  const sosEnd = (cause, scene) => ({
    id: 'x.sos.' + cause, scene, kind: 'end', year: SOS_AT[cause], when: s => s.sos === cause,
    effect: st => { st.incident = incidentOf(st, cause); st.outcome = 'sos'; },
    title: { ru: 'Люди живы. Экспедиция прекращена', en: 'The people are alive. The expedition is over' },
    text: {
      ru: s => { const inc = s.incident, R = M.rescuers(inc, WORLD);
        return `Бодрствуют двенадцать; вахта сменяется из спящих по графику. В капсулах — ${ppl(inc.sleepers)}. ${SOS_WHERE[cause].ru(s)}

Сигнал бедствия ушёл в год ${inc.sent}: журнал, координаты, число живых, неисправности и дата последнего гарантированного пробуждения — год ${inc.deadline}. Помочь могут: ${R.list.map(r => `${place(r, 'ru')} — сигнал дойдёт в год ${yr(r.hear)}`).join('; ')}.

Экспедиция прекращена. Что будет со спящими, решит тот, кто услышит первым: ${place(R.council, 'ru')}.`; },
      en: s => { const inc = s.incident, R = M.rescuers(inc, WORLD);
        return `Twelve are awake; the watch is relieved from among the sleepers on a schedule. ${inc.sleepers} are in the capsules. ${SOS_WHERE[cause].en(s)}

The distress signal went out in year ${inc.sent}: the log, the coordinates, the number of living, the faults and the date of the last guaranteed waking — year ${inc.deadline}. Those who can help: ${R.list.map(r => `${place(r, 'en')} — the signal arrives in year ${yr(r.hear)}`).join('; ')}.

The expedition is over. What happens to the sleepers will be decided by whoever hears first: ${place(R.council, 'en')}.`; }
    }
  });

  // ---- снабженец: откуда берутся системы для форпоста. Из груза заявки — бесплатно; иначе из своих материалов:
  // передатчик −35%, капсульный блок −40% (без груза заявки обе системы — три четверти запаса).
  // Передатчик заявки мог уйти на холодильник капсульного блока (d.supplyRepair).
  const BUILD = { relay: 35, caps: 40 };                                 // из своих материалов: передатчик, капсульный блок
  const relayKit = s => s.kits.includes('request') && s.cooler !== 'relayParts';
  const capsKit = s => s.kits.includes('request');
  const supplyNeed = s => (relayKit(s) ? 0 : BUILD.relay) + (capsKit(s) ? 0 : BUILD.caps);   // материалов на обе системы
  // второй монтажный комплект: 30% материалов, со станками — 10%; нужен запас и на сами системы
  // вторую бригаду питает вторая сеть корабля: отданный под вспышками блок закрывает «всё сразу»
  const supplyBothCost = s => { const c = ['tools', 'printQC'].includes(eqOf(s).prod) ? 10 : 30; return s.gridBlocks >= 2 && s.materials >= supplyNeed(s) + c ? c : null; };
  // переселение: койки и регенерация воздуха для девяноста (−15%), отдельная сеть для их колец
  const SHELTER = 15;
  const shelterOK = s => s.gridBlocks >= 2 && s.materials >= SHELTER;
  // прогноз: что будет поставлено при выбранном порядке (для «Что известно» — те же правила, что у эффекта)
  const supplyForecast = (s, first, extra = 0) => { const t = { kits: s.kits, cooler: s.cooler, materials: s.materials - extra, relayOK: false, capsOK: false }; supplyBuild(t, first); return t; };
  // поставить системы: из груза заявки или из своих материалов, пока их хватает (сначала связь, потом капсулы — порядок работ в тексте)
  // порядок — выбранный: при нехватке материалов достаётся то, что ставят первым
  function supplyBuild(st, first) {
    const relay = () => { st.relayOK = relayKit(st) || (st.materials >= BUILD.relay && (st.materials -= BUILD.relay, true)); };
    const caps = () => { st.capsOK = capsKit(st) || (st.materials >= BUILD.caps && (st.materials -= BUILD.caps, true)); };
    if (first === 'caps') { caps(); relay(); } else { relay(); caps(); }
  }
  const supplySrc = (s, lang) => { const ru = lang === 'ru', r = relayKit(s), c = capsKit(s);
    if (r && c) return ru ? 'Передатчик и капсульный блок — из груза заявки.' : 'The transmitter and the capsule unit come from the request cargo.';
    const need = supplyNeed(s), parts = [!r && (ru ? 'передатчик' : 'the transmitter'), !c && (ru ? 'капсульный блок' : 'the capsule unit')].filter(Boolean).join(ru ? ' и ' : ' and ');
    return ru ? `${cap(parts)} придётся собирать из своих материалов: −${need}%${s.materials < need ? ` — а их ${Math.round(s.materials)}%, на всё не хватит` : ''}.` : `${cap(parts)} must be built from our own materials: −${need}%${s.materials < need ? ` — and there are ${Math.round(s.materials)}%, not enough for everything` : ''}.`; };
  // вариант «сначала …» — только если эту систему есть из чего поставить
  const supplyOptions = (s, opts) => opts.filter(o => (o.id !== 'relay' || relayKit(s) || s.materials >= BUILD.relay) && (o.id !== 'capsules' || capsKit(s) || s.materials >= BUILD.caps) && (o.id !== 'shelter' || shelterOK(s)));

  // ---- протокол совета на следующие три года (a4.plan): решённая задача, средства, ограничения — по фактам.
  // План записывается отдельно от результата: «решили восстановить связь» не значит «связь восстановлена».
  // что осталось у цели: форпост с кораблём, поселение внизу, орбитальный дом, база на спутниках, обитаемый маяк, стоянка
  const homeKind = s => s.mission === 'supply' ? 'outpost' : rescueS(s) ? (['old', 'closed'].includes(s.site) ? 'colony' : s.site === 'orbit' ? 'orbital' : 'ship') : livable(s) ? (s.settle === 'orbit' ? 'orbital' : 'colony')
    : ({ moons: 'moons', beacon: 'beacon', return: 'return' })[s.home] || 'orbital';
  const PLAN_WHO = {
    outpost: { ru: 'Протокол совета форпоста', en: 'Minutes of the outpost council' },
    colony: { ru: 'Протокол совета колонии', en: 'Minutes of the colony council' },
    orbital: { ru: 'Протокол совета орбитального дома', en: 'Minutes of the orbital home council' },
    moons: { ru: 'Протокол совета базы', en: 'Minutes of the base council' },
    beacon: { ru: 'Протокол совета вахты', en: 'Minutes of the watch council' },
    return: { ru: 'Протокол совета экспедиции', en: 'Minutes of the expedition council' },
    ship: { ru: 'Протокол совета корабля', en: "Minutes of the ship's council" }
  };
  const planWho = (s, lang) => PLAN_WHO[homeKind(s)][lang];
  function planText(s, lang) {
    const ru = lang === 'ru', m = Math.round(s.materials), plan = [], means = [], limits = [];
    if (s.mission === 'supply' && s.supplyFailed) {
      plan.push(ru ? 'держать связь с форпостом и передать отчёт о срыве; что станет с его людьми, корабль решить не может' : "keep in contact with the outpost and send the report of the failure; the ship cannot decide what becomes of its people");
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      limits.push(ru ? 'постоянного обеспечения форпоста нет; судьба оставшихся не установлена' : "the outpost has no permanent support; the remaining residents' fate is unknown");
    } else if (s.mission === 'supply') {
      if (!s.relayOK) plan.push(ru ? `собрать передатчик, когда хватит материалов: нужно ${BUILD.relay}%, есть ${m}%` : `build a transmitter once there are materials: ${BUILD.relay}% needed, ${m}% at hand`);
      if (!s.capsOK) plan.push(ru ? `собрать капсульный блок: нужно ${BUILD.caps}%, есть ${m}%` : `build a capsule unit: ${BUILD.caps}% needed, ${m}% at hand`);
      if (s.relayOK && s.capsOK) plan.push(ru ? 'держать связь и капсулы, восстановить ремонтный запас форпоста' : "keep the link and the capsules running, rebuild the outpost's repair stock");
      if (s.shelter) plan.push(ru ? `поддерживать кольца корабля для ${s.shelterPeople ? ppl(s.shelterPeople) : 'девяноста человек'} форпоста` : `keep the ship's rings running for ${s.shelterPeople || 'ninety'} of the outpost's people`);
      means.push(s.gridBlocks >= 2 ? (ru ? `материалы ${m}%; корабль — модуль форпоста, его реакторы — вторая сеть` : `materials ${m}%; the ship is a module of the outpost, its reactors a second grid`)
        : (ru ? `материалы ${m}%; корабль — модуль форпоста` : `materials ${m}%; the ship is a module of the outpost`));
      if (s.gridBlocks < 2) limits.push(ru ? 'резервный блок выгорел под вспышками — у корабля одна сеть, резерва нет' : 'the reserve block burned out under the flares — the ship has one grid, no backup');
      if (s.outpostDead) limits.push(ru ? `потери форпоста — ${ppl(s.outpostDead)}` : `the outpost has lost ${s.outpostDead}`);
    } else if (rescueS(s)) {
      plan.push(({ old: ru ? 'обживать старую площадку Оттепели' : "settle Thaw's old site", closed: ru ? 'обживать старую площадку на замкнутой воде; местную воду в энергетику не пускать' : 'settle the old site on a closed water loop; keep local water out of the power system',
        orbit: ru ? 'орбитальный дом: кольца корабля и обеспечение на годы' : "an orbital home: the ship's rings and supply for years", evacuated: ru ? 'площадка закрыта после аварии: жить на корабле, искать новое место' : 'the site is closed after the accident: live aboard the ship, look for a new place' })[s.site]
        || (ru ? 'жить на корабле; дом пока не выбран' : 'live aboard the ship; the home is not yet chosen'));
      if (s.rescued) plan.push(s.housed ? (ru ? `выходить спасённых Оттепели — ${ppl(s.rescued)}` : `nurse the ${s.rescued} rescued from Thaw back to health`)
        : (ru ? `построить жильё для спасённых Оттепели — ${ppl(s.rescued)}; до тех пор ${s.thawPlace === 'store' ? 'они спят на восстановленном складе' : `лазарет — их временное убежище до года ${yr(s.infirmaryUntil)}`}` : `build housing for the ${s.rescued} rescued from Thaw; until then ${s.thawPlace === 'store' ? 'they sleep in the restored store' : `the infirmary is their temporary shelter until year ${yr(s.infirmaryUntil)}`}`));
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      if (s.rescued && !s.housed && s.thawPlace === 'infirmary') limits.push(ru ? `жилья к сроку лазарета (год ${yr(s.infirmaryUntil)}) совет не строит — обязательство будет сорвано` : `the council builds no housing before the infirmary term (year ${yr(s.infirmaryUntil)}) — the commitment will fail`);
      if (s.rescued && s.thawDead) limits.push(ru ? `Оттепель потеряла ${ppl(s.thawDead)} из ${THAW0}, пока шла помощь` : `Thaw lost ${s.thawDead} of ${THAW0} while help was coming`);
      if (!s.rescued) limits.push(ru ? 'Оттепели помочь не успели' : 'Thaw could not be helped in time');
    } else if (livable(s)) {
      if (s.settle === 'orbit') plan.push(ru ? 'корабль — город на орбите; внизу полигон, разведка, поля под куполами' : 'the ship is a town in orbit; below — a test ground, the survey, fields under domes');
      else {
        plan.push(ru ? 'обжить поселение внизу, будить людей по мере жилья' : 'settle the ground below, waking people as housing allows');
        plan.push(energyOK(s) ? (ru ? 'энергии на зимы хватает — расширять агрозалы' : 'there is energy for the winters — expand the agro halls')
          : (ru ? 'вторая зима без надёжной энергии: искать местный источник' : 'a second winter without reliable power: find a local source'));
      }
      if (s.mission === 'rescue' && s.rescued) plan.push(s.housed ? (ru ? `выходить спасённых Оттепели — ${ppl(s.rescued)}` : `nurse the ${s.rescued} rescued from Thaw back to health`)
        : (ru ? `построить жильё для спасённых Оттепели — ${ppl(s.rescued)}; до тех пор ${s.rescueOp === 'restore' ? 'они спят на восстановленном складе' : 'лазарет — их временное убежище на три года'}` : `build housing for the ${s.rescued} rescued from Thaw; until then ${s.rescueOp === 'restore' ? 'they sleep in the restored store' : 'the infirmary is their temporary shelter for three years'}`));
      if (s.mission === 'rescue' && s.rescued && s.thawDead) limits.push(ru ? `Оттепель потеряла ${ppl(s.thawDead)} из ${THAW0}, пока шла помощь` : `Thaw lost ${s.thawDead} of ${THAW0} while help was coming`);
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
      if (s.settle === 'surface') limits.push(ru ? 'посадочный модуль разобран на каркас — пути наверх нет' : 'the lander is taken apart for the frame — there is no way up');
      if (s.mission === 'rescue' && !s.rescued) limits.push(ru ? 'Оттепели помочь не успели' : 'Thaw could not be helped in time');
    } else {
      plan.push(({
        orbit: ru ? 'расширять кольца, будить людей по мере мест' : 'extend the rings, waking people as room allows',
        moons: ru ? 'строить базу на твёрдом из местного камня' : 'build the base on solid ground from local stone',
        beacon: ru ? 'передавать наблюдения и ждать следующих' : 'transmit observations and wait for those who follow',
        return: ru ? 'добыча у гиганта: до ступени обратного пути — десятилетия' : 'mining at the giant: the return stage is decades away'
      })[s.home] || (ru ? 'держать корабль' : 'keep the ship going'));
      means.push(ru ? `материалы ${m}%` : `materials ${m}%`);
    }
    if (s.deadHere && s.mission !== 'supply') limits.push(ru ? `потери у цели — ${ppl(s.deadHere)}${!s.winterDead ? '' : s.winterDead === s.deadHere ? ', все — в первую зиму' : `, из них в первую зиму — ${s.winterDead}`}` : `${s.deadHere} died at the target${s.winterDead ? `, ${s.winterDead} of them in the first winter` : ''}`);
    const d = Math.round(M.star(s.target).d), lines = (rescueS(s) ? [ru ? `Отчёт подписывают участники экспедиции${s.rescued ? ' и пробуждённые жители Оттепели' : ''}. В нём — даты помощи, имена погибших, работающие контуры и фактические места. Спящих не записывают подписантами.`
      : `The report is signed by the expedition${s.rescued ? " and Thaw's awakened residents" : ''}. It holds the dates of assistance, the names of the dead, the working loops and the actual places. Sleepers are not listed as signatories.`] : []).concat([
      (ru ? 'Решено: ' : 'Resolved: ') + plan.join('; ') + '.',
      (ru ? 'Средства: ' : 'Means: ') + means.join('; ') + '.'
    ]);
    if (limits.length) lines.push((ru ? 'Ограничения: ' : 'Limits: ') + limits.join('; ') + '.');
    lines.push(ru ? `Отчёт в Кольцо уходит сейчас; Земля получит его около года ${Y4(s) + d}. Это план, а не итог: что из него выйдет, узнают следующие.` : `The report goes to the Ring now; Earth will receive it around year ${Y4(s) + d}. This is a plan, not an outcome: those who come next will learn what came of it.`);
    return lines.join('\n');
  }
  // итог спасателя v3: полнота отдельно от названия исхода
  function endR(s, lang) {
    const ru = lang === 'ru', placed = s.housed ? s.rescued : 0, full = s.rescued === THAW0 && s.housed && !s.rescueCrewDead;
    const done = !s.rescued ? (ru ? 'Спасательная задача сорвана.' : 'The rescue mission failed.') : outcomeOf(s) === 'rescueFailed' ? (ru ? 'Обязательство не выполнено: срок лазарета истёк без постоянного жилья.' : 'The commitment failed: the infirmary term ran out without permanent housing.') : full ? (ru ? 'Обязательство выполнено полностью.' : 'The commitment is fully met.') : (ru ? 'Результат частичный.' : 'The result is partial.');
    return ru ? `Исход: ${OUTCOME[outcomeOf(s)].ru.toLowerCase()}. Живы после помощи ${s.rescued}; устроены ${placed}; дополнительные потери Оттепели — ${s.thawDead}, экипажа в происшествиях — ${s.rescueCrewDead || 0}. ${done} Позади ${yrs(Yepi(s))}: путь, склад, дом, ответ. Имена, причины и обязательства — в итоге ниже.`
      : `Outcome: ${OUTCOME[outcomeOf(s)].en.toLowerCase()}. Alive after assistance: ${s.rescued}; housed: ${placed}; additional Thaw losses: ${s.thawDead}; crew incident losses: ${s.rescueCrewDead || 0}. ${done} ${yrsEn(Yepi(s))} are behind: the road, the store, the home, the answer. Names, causes and commitments are in the summary below.`;
  }
  // ---- запись экспедиции в мир — один раз по id; Земля узнаёт об итоге, когда дойдёт отчёт
  const MISSION_NAME = { contact: { ru: 'контакт', en: 'contact' }, supply: { ru: 'снабжение', en: 'supply' }, rescue: { ru: 'спасение', en: 'rescue' } };
  function expeditionEvent(s, exp) {
    const d = Math.round(M.star(s.target).d), end = s.lostShip ? 'lost' : s.dutchman ? 'dutchman' : s.outcome || outcomeOf(s);
    // когда Земля узнает: отчёт первого утра дома; последняя передача погибшего; о «голландце» и аварии — не по отчёту
    const reportAt = end === 'lost' ? s.year + d : ['dutchman', 'sos'].includes(end) ? null : Y4(s) + d;
    const ok = !['lost', 'dutchman', 'sos'].includes(end);
    // задание заявки: выполнено ли и когда отчёт о нём дойдёт до Земли (DOC «Ревью Codex — заявки из мира», шаг 5)
    // выполнение — одно правило с эпилогом (у снабжения и спасения — по их итогу, отчёт — с отчётом экспедиции)
    const task = s.task ? Object.assign({}, s.task, { done: ok && missionComplete(s),
      reportEarthAt: s.task.reportAt != null ? Math.round(s.task.reportAt + d) : ok && missionComplete(s) ? reportAt : null }) : null;
    return { id: `${exp}|done`, expedition: { id: exp, number: 41, mission: s.mission, target: s.target, outcome: end, arrive: s.arrive, endedAt: s.year, reportAt,
      request: s.requestId || null, task,
      home: ok && end !== 'supplyFailed' ? homeKind(s) : null, alive: ok ? aliveOf(s) : null,
      incidents: JSON.parse(JSON.stringify(s.incidents || [])),
      hull: end === 'lost' ? 'wreck' : end === 'dutchman' ? 'orbitDead' : end === 'sos' ? 'sleeping' : null,
      cast: CAST.map(id => ({ id, ru: people[id].ru[0], en: people[id].en[0], fate: end === 'lost' || end === 'dutchman' ? 'dead' : end === 'sos' ? 'asleep' : 'alive' })),
      facts: rescueS(s) ? thawFacts(s, end) : !ok ? null : s.mission === 'supply' ? { relayOK: s.relayOK, capsOK: s.capsOK, shelter: !!s.shelter, shelterPeople: s.shelterPeople || null, outpostDead: s.outpostDead || 0, capsLost: !!s.capsLost, failed: !!s.supplyFailed }
        : s.mission === 'rescue' ? { rescued: s.rescued, housed: !!s.housed, op: s.rescueOp, thawDead: s.thawDead } : null } };
  }
  // спасатель v3: реестр Оттепели в памяти мира — живые по номерам, где живут, погибшие; при аварии — последняя диагностика склада
  function thawFacts(s, end) {
    const stranded = !s.thawStable && !!s.thawConfirmed;
    return { v: 3, rescued: s.rescued, housed: !!s.housed, op: s.rescueOp, thawDead: s.thawDead, stranded,
      alive: stranded ? thawAlive(s, storeNow(s)) : thawAlive(s, Infinity).filter(() => s.rescued > 0), deadIds: (s.thawDeadIds || []).slice(),
      site: s.site || null, place: s.thawPlace || null, crewDead: s.rescueCrewDead || 0, failed: end === 'rescueFailed', infirmaryUntil: s.infirmaryUntil };
  }
  const THAW_PLACE = { sector: { ru: 'в спасательном секторе корабля', en: "in the ship's rescue sector" }, module: { ru: 'в жилом модуле', en: 'in the living module' },
    store: { ru: 'спят на восстановленном складе, ждут жилья', en: 'asleep in the restored store, awaiting housing' }, infirmary: { ru: 'в лазарете корабля', en: "in the ship's infirmary" },
    old: { ru: 'на старой площадке Оттепели', en: "at Thaw's old site" }, closed: { ru: 'на старой площадке, на замкнутой воде', en: 'at the old site, on a closed water loop' }, orbit: { ru: 'в орбитальном доме', en: 'in the orbital home' } };
  function thawWorld(f, lang) {
    const ru = lang === 'ru', n = f.alive.length;
    if (f.stranded) return ru ? `Оттепель: помощь не завершена — сорок первая уснула у склада. По последней диагностике на складе живы ${n}${n ? `: ${namesShort(f.alive, 'ru')}` : ''}.`
      : `Thaw: assistance was not completed — the Forty-First went to sleep beside the store. By the last diagnostics ${n} are alive in the store${n ? `: ${namesShort(f.alive, 'en')}` : ''}.`;
    if (!f.rescued) return ru ? 'Оттепель: помощь опоздала — живых на складе не осталось.' : 'Thaw: help came too late — no one was left alive in the store.';
    const where = THAW_PLACE[f.place] ? THAW_PLACE[f.place][lang] : (ru ? 'на корабле' : 'aboard the ship');
    return ru ? `Оттепель: спасены ${f.rescued === THAW0 ? `все ${THAW0}` : `${f.rescued} из ${THAW0}`} — ${where}${f.failed ? '; срок лазарета истёк без жилья — обязательство не выполнено' : ''}. В реестре — ${namesShort(f.alive, 'ru')}.`
      : `Thaw: ${f.rescued === THAW0 ? `all ${THAW0}` : `${f.rescued} of ${THAW0}`} rescued — ${where}${f.failed ? '; the infirmary term ran out without housing — the commitment failed' : ''}. The register lists ${namesShort(f.alive, 'en')}.`;
  }
  // строки «Мир после экспедиции»: что помнит мир (экспедиции, аппарат Перевала, поселения спасённых)
  const HOME_KIND = {
    outpost: { ru: 'форпост, корабль — его модуль', en: 'the outpost, with the ship as its module' },
    colony: { ru: 'поселение на поверхности', en: 'a settlement on the surface' },
    orbital: { ru: 'орбитальный дом', en: 'an orbital home' },
    moons: { ru: 'база на спутниках', en: 'a base on the moons' },
    beacon: { ru: 'обитаемый маяк', en: 'an inhabited beacon' },
    return: { ru: 'стоянка перед возвращением', en: 'a camp before the return' },
    ship: { ru: 'корабль на орбите — дом не построен', en: 'the ship in orbit — no home built' }
  };
  function worldLines(world, lang) {
    const ru = lang === 'ru', out = [];
    for (const x of (world && world.expeditions) || []) {
      const where = M.nameOf(x.target, lang), at = ru ? nmG({ target: x.target }) : where, f = x.facts;
      const res = {
        lost: ru ? 'корабль погиб в потоке Тёмной звезды; следующим останутся измеренный поток, журнал и координаты остова' : "the ship was lost in the Dark Star's stream; the measured stream, the log and the wreck's coordinates remain for those who follow",
        dutchman: ru ? `вахты не хватило на зал анабиоза; автоматика ведёт пустой корабль к ${nmD({ target: x.target })}, орбита — около года ${x.arrive}. Для следующих это будет находка` : `the watch was too few for the anabiosis hall; the automation flies the empty ship to ${where}, orbit around year ${x.arrive}. For those who follow it will be a find`,
        sos: ru ? 'авария, люди в анабиозе, сигнал бедствия ушёл' : 'an accident; the people are in anabiosis, the distress signal has gone out'
      }[x.outcome] || (OUTCOME[x.outcome] || { ru: x.outcome, en: x.outcome })[lang];
      const mis = MISSION_NAME[x.mission] ? MISSION_NAME[x.mission][lang] : '';
      out.push((ru ? `Экспедиция №${x.number} — ${mis} · ${where}: ${res}.` : `Expedition No. ${x.number} — ${mis} · ${where}: ${res}.`)
        + (x.reportAt == null ? '' : x.reportAt <= x.endedAt ? (ru ? ` Отчёт получен на Земле около года ${x.reportAt}.` : ` The report was received on Earth around year ${x.reportAt}.`)
          : x.outcome === 'lost' ? (ru ? ` Последняя передача дойдёт до Земли около года ${x.reportAt}.` : ` The last transmission will reach Earth around year ${x.reportAt}.`)
          : (ru ? ` Отчёт дойдёт до Земли около года ${x.reportAt}.` : ` The report will reach Earth around year ${x.reportAt}.`)));
      if (x.task && TASK_NAME[x.task.work]) { const n = taskName(x.task, lang), at = x.task.reportEarthAt;
        out.push(x.task.done ? (ru ? `Задание — ${n}: выполнено${at != null ? `; отчёт дойдёт до Земли около года ${at}` : ''}.` : `The task — ${n}: done${at != null ? `; the report will reach Earth around year ${at}` : ''}.`)
          : (ru ? `Задание — ${n}: не выполнено.` : `The task — ${n}: not done.`)); }
      if (f && x.mission === 'supply' && (f.capsLost || f.failed)) out.push(ru ? `Ксилона Ир: ${f.failed ? 'снабжение сорвано — постоянного обеспечения нет' : 'капсульная секция потеряна при повторном включении'}.` : `Xylona Ir: ${f.failed ? 'the supply mission failed — no permanent support' : 'the capsule section was lost on restart'}.`);
      if (f && x.mission === 'rescue' && f.v !== 3) out.push(!f.rescued ? (ru ? 'Оттепель: помощь опоздала — живых на складе не осталось.' : 'Thaw: help came too late — no one was left alive in the store.')
        : ru ? `Оттепель: спасены ${f.rescued === THAW0 ? `все ${THAW0}` : `${f.rescued} из ${THAW0}`} — ${f.housed ? 'устроены' : f.op === 'restore' ? 'спят на восстановленном складе, ждут жилья' : 'в лазарете, ждут жилья'}.`
        : `Thaw: ${f.rescued === THAW0 ? `all ${THAW0}` : `${f.rescued} of ${THAW0}`} rescued — ${f.housed ? 'housed' : f.op === 'restore' ? 'asleep in the restored store, awaiting housing' : 'in the infirmary, awaiting housing'}.`);
      else if (f && x.mission === 'rescue') out.push(thawWorld(f, lang));    // спасатель v3: имена остаются там, где люди живут
      else if (f && x.mission === 'supply') out.push(ru ? `Ксилона Ир: связь ${f.relayOK ? 'восстановлена' : 'не восстановлена'}, капсулы ${f.capsOK ? 'работают' : 'не восстановлены'}${f.shelter ? `, в кольцах корабля живут ${f.shelterPeople ? ppl(f.shelterPeople) : 'девяносто'}` : ''}${f.outpostDead ? `; потери форпоста — ${ppl(f.outpostDead)}` : ''}.`
        : `Xylona Ir: link ${f.relayOK ? 'restored' : 'not restored'}, capsules ${f.capsOK ? 'running' : 'not restored'}${f.shelter ? `, ${f.shelterPeople || 'ninety'} live in the ship's rings` : ''}${f.outpostDead ? `; ${f.outpostDead} of the outpost died` : ''}.`);
      if (x.incidents && x.incidents.length) out.push(ru ? `Протокол: ${x.incidents.map(i => `год ${incYear(i)} — ${INCIDENT_NAME[i.kind].ru}, ${i.lost ? 'гибель корабля' : i.dead ? `погибли ${i.dead}` : 'без жертв'}`).join('; ')}.`
        : `Minutes: ${x.incidents.map(i => `year ${incYear(i)} — ${INCIDENT_NAME[i.kind].en}, ${i.lost ? 'the ship lost' : i.dead ? `${i.dead} dead` : 'no one died'}`).join('; ')}.`);
      if (x.cast && x.cast.length) { const n = x.cast.map(c => c[lang]).join(', ');
        out.push(x.hull === 'wreck' ? (ru ? `На борту остова — ${n}.` : `Aboard the wreck: ${n}.`)
          : x.hull === 'orbitDead' ? (ru ? `На борту «голландца» — ${n}.` : `Aboard the Flying Dutchman: ${n}.`)
          : x.hull === 'sleeping' ? (ru ? `Уснули на корабле, когда ушёл сигнал бедствия, — ${n}.` : `Went to sleep aboard the ship when the distress signal went out: ${n}.`)
          : x.home === 'colony' ? (ru ? `Основатели колонии у ${at} — ${n}.` : `Founders of the colony at ${where}: ${n}.`)
          : x.home === 'outpost' ? (ru ? `С форпостом остались — ${n}.` : `Staying with the outpost: ${n}.`)
          : (ru ? `У ${at} живут — ${n}.` : `Living at ${where}: ${n}.`)); }
      if (x.hull === 'wreck') out.push(ru ? 'Остов уходит от ε Индейца по прежней траектории, кувыркаясь; его траектория передана — следующие смогут его найти.' : 'The wreck tumbles away from ε Indi along its former trajectory; its trajectory has been transmitted — those who follow can find it.');
      if (x.hull === 'orbitDead') out.push(ru ? `Корабль на орбите у ${at} — с экипажем на борту, без живых. Маяк передаёт, пока хватает питания.` : `The ship is in orbit at ${where} — with its crew aboard, none alive. The beacon transmits while power lasts.`);
      if (x.home) out.push(ru ? `У ${at}: ${HOME_KIND[x.home].ru}; экипаж — ${ppl(x.alive)}.` : `At ${where}: ${HOME_KIND[x.home].en}; crew: ${x.alive} people.`);
    }
    if (world && world.passTug === false) out.push(ru ? 'Перевал: межзвёздный аппарат ушёл спасать сорок первую.' : 'The Pass: the interstellar vessel went to rescue the Forty-First.');
    for (const x of (world && world.settled) || []) {
      const at = ru ? nmG({ target: x.star }) : M.nameOf(x.star, lang), when = x.year ? (ru ? `, с года ${x.year}` : `, from year ${x.year}`) : '';
      out.push(x.joined ? (ru ? `У ${at}: колония «${M.colony(x.joined).ru}» приняла спасённых — ${ppl(x.people)}${when}.` : `At ${at}: ${M.colony(x.joined).en} took in the rescued — ${x.people} people${when}.`)
        : (ru ? `У ${at}: поселение спасённых — ${ppl(x.people)}${when}.` : `At ${at}: a settlement of the rescued — ${x.people} people${when}.`));
    }
    out.push(ru ? 'Продолжение этого мира — экспедиция №42 — пока не представлено в срезе.' : 'The continuation of this world — expedition No. 42 — is not in the slice yet.');
    return out;
  }

  // ---- цена ошибки (DOC «Ревью Codex — цена ошибки, спецификация v1»): скрытые состояния задаются сидом экспедиции
  // заранее и не перебрасываются. Версия 0 — старые сохранения: скрытого нет, прежние правила до конца экспедиции.
  // hidden(s, key) ∈ [0, 1): FNV-1a по UTF-8 с финализацией; ключ постоянный (без токенов, вариантов, языка, preview).
  function hashU32(str) {
    let h = 2166136261;
    for (const b of new TextEncoder().encode(str)) { h ^= b; h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }
  const RISK = 5;                                                       // версия правил новых экспедиций: 1 — цена ошибки контакта, 2 — сюжет снабженца, 3 — сюжет спасателя, 4 — оснащение (Совет снабженцу без сети колонии; станки и печать удешевляют разделение платы); 5 — симулятор: время, щит, облако и поток на модели
  // публичное состояние — то, что знает экипаж: без сида скрытое недоступно (hidden → null). По нему строятся
  // тексты карточки, «Что известно», рекомендация Совета и «После»; исход — только эффектом на полном состоянии.
  const publicOf = s => { const p = JSON.parse(JSON.stringify(s)); p.riskSeed = null; if (p.wear) p.wear = W.publicOf(p.wear); return EV.strip(p); };
  const hidden = (s, key) => s.riskVersion >= 1 && s.riskSeed ? hashU32(JSON.stringify([s.riskVersion, s.riskSeed, key])) / 4294967296 : null;

  function initialState(ctx) {
    const st = {
      riskVersion: ctx && ctx.riskVersion >= 1 && ctx.riskSeed ? ctx.riskVersion : 0,   // правила цены ошибки
      riskSeed: ctx && ctx.riskVersion >= 1 && ctx.riskSeed ? String(ctx.riskSeed) : null,
      evOff: !!(ctx && ctx.events === false),
      worldSeed: ctx && typeof ctx.worldSeed === 'string' && ctx.worldSeed ? ctx.worldSeed : null,   // сид мира: события Кольца
      agenda: ctx && Array.isArray(ctx.agenda) ? ctx.agenda.slice() : null,   // повестка Совета на старт экспедиции (requests.js)   // события v1 выключены (проверки и калибровка: те же сиды без событий)
      year: 0,
      reserve: 100,        // резерв манёвров, % паспортного
      shieldWear: 0,       // износ фронтального щита сверх нормы, лет из ~150 расчётных
      agroDelay: 0,        // задержка резервного агромодуля, лет
      koraYear: false,     // Кора осталась на вахте ещё на год
      repairQual: false,   // ремонтники допущены к монтажу под тягой
      measured: false,     // плотность края облака измерена (версия 1: проверка нашла полосу крупной пыли)
      cloudCheck: null,    // версия 1: measured | skipped — проверка края затмением
      cloudFound: false,   // версия 1: проверка нашла полосу крупной пыли
      cloudDead: 0,        // версия 1: погибли у края облака
      shieldBreach: false, // версия 1: сектор щита пробит (установлено)
      loopCheck: null,     // версия 1: ordinary | deep | skipped — проверка общей магистрали
      loopFound: false,    // версия 1: проверка нашла дефект общей магистрали
      loopDead: 0,         // погибли при отказе контура воды
      streamCheck: null,   // версия 1: probe | kora | student — чем проверяли поток
      streamFound: false,  // версия 1: проверка увидела опасную полосу на курсе
      streamDays: 0,       // версия 1: дни окна, ушедшие на проверку
      streamRoute: null,   // версия 1: evade | pass
      streamDead: 0,       // погибли в потоке
      streamCause: null,   // версия 1: shield | power — почему удар тяжёлый
      cargoMethod: null,   // снабженец v2: direct | check | isolate — как подключали холодильник в дрейфе
      cargoFound: false,   // опрессовка нашла трещину
      cargoDays: 0,        // дни работ в дрейфе
      cargoFailed: false,  // общий отказ охлаждения
      supplyCrewDead: 0,   // погибли из экипажа при работах снабжения
      supplyDays: 0,       // сутки операции у форпоста (временный контур держит 45)
      supplyProtected: false, // укрытый пост и отдельное управление монтажом
      supplyIndependent: false, // вторая сеть отдана насосам (до разделения систем)
      busMethod: null,     // replace | check | deep | split — что делали с общей платой
      busFound: false,     // проверка нашла повреждение платы
      busResolved: false,  // управление разделено или плата исправна
      capsLost: false,     // капсульная секция форпоста потеряна
      outpostDeadIds: [],  // погибшие местные (реестр Ксилоны)
      shelterPeople: 0,    // сколько местных переселили в кольца корабля
      supplyFailed: false, // снабжение сорвано: ни один план не держит людей
      koraAwake: 2,        // лет бодрствования Коры Ландис
      target: null,        // имя системы в каталоге (ship-builder/data/stars.js)
      beta: 0.1,           // крейсерская скорость по паспорту, c
      reserveDv: 0.01,     // резерв манёвров по паспорту, c (= 100%)
      kits: [],            // комплекты груза
      arrive: 133,         // год прибытия
      materials: 100,      // материалы для высадки, % запаса
      scout: 0,            // год запуска зонда вперёд (0 — не запущен)
      scoutTuned: false,   // программа спектрометра зонда — Коры
      watch: 48,           // людей на вахте в дрейфе
      ageShift: 0,         // на сколько лет старше экипаж придёт к цели
      agroAtRisk: false,   // решение затронуло монтаж резервного агромодуля
      taught: false,       // Кору будили в дрейфе учить интерпретаторов
      highPower: true,     // резерв повышенной мощности в контуре охлаждения
      groupB: 'ok',        // группа Б: ok | saved | woken
      worldSeen: null,     // что известно о мире цели до прибытия
      lost: 0,             // погибли в пути (медицинский журнал)
      dead: 0,             // из них — в авариях Акта III
      koraLast: false,     // Кору будили в последний раз
      home: null,          // где будет дом: land | orbit | domes | moons | beacon | return
      settle: null,        // окончательно: surface | keep | orbit
      deadHere: 0,         // погибли у цели
      support: null,       // корабль поддержки: found — нашли и он придёт; lost — потерян
      streamHit: 0,        // удар потока у Тёмной звезды: 0 — ушли, 1–2 — потери, 3 — гибель корабля
      lostShip: false,     // экспедиция погибла
      overload: null,      // перегрузка жизнеобеспечения в дрейфе: sleep | materials | hold
      dutchman: false,     // «Летучий голландец»: некому обслуживать капсулы
      winterDead: 0,       // погибли в первую зиму у цели
      outcome: null,       // исход партии
      mission: null,       // contact | supply | rescue
      rescued: 0,          // спасённые Оттепели (живы после операции)
      crew: 500,           // своих в экспедиции: 460 со спасательным сектором
      arriveExact: null,   // точное прибытие, годы (срок Оттепели считается по нему)
      rescuePrep: false,   // переходники к складу собраны в пути
      rescueShelter: false, // жилой модуль на сорок у цели
      rescueOp: null,      // move | restore | wake (старые: gradual)
      housed: false,       // у спасённых есть постоянные места
      thawDead: 0,         // Оттепель: умерли из 34 живых на год 124,5
      rescueEvidence: false, // спасатель v3: два отчёта Оттепели приложены к паспорту
      rescuePromise: null, // обязательство: { eta — паспортное прибытие, places — sector | housing }
      tornLeft: null,      // сутки секции после разрыва линии
      rescueIsolation: false, // аварийная изоляция испытана в полёте (независимый контур за 8 суток)
      brakeMethod: null,   // wait | burn | measure — торможение в разреженной среде
      brakeFound: false,   // передовые данные показали протяжённый участок
      brakeDelay: 0,       // сутки опоздания из-за разрежения
      arrivePlan: null,    // точное прибытие по паспорту (до поправки торможения)
      rescueDays: 0,       // сутки у склада от прибытия
      sectionEnd: null,    // год, когда протекающая секция останется без тепла
      sectionLeft: null,   // сутки секции на момент диагностики
      sectionSafe: false,  // секция на независимом контуре
      dockMethod: null,    // grab | inspect
      dockFound: false,    // осмотр нашёл надлом крепления
      pipeTorn: false,     // крепление разрушилось и сорвало трубопровод секции
      connect: null,       // isolate | direct | cut | proceed
      thawConfirmed: 0,    // живы по ближней диагностике
      thawDeadIds: [],     // реестр Оттепели: дополнительно погибшие (номера 6–39)
      thawStable: false,   // операция закончена: капсулы больше не стареют
      rescueCrewDead: 0,   // погибли из экипажа у склада и на площадке
      siteMethod: null,    // reuse | check | deep | closed | orbit | stay — дом после выброса
      siteFound: false,    // испытание нашло примесь
      site: null,          // old | closed | orbit | evacuated | null (не выбрано)
      siteDays: 0,         // сутки подготовки площадки
      thawPlace: null,     // где спасённые сейчас: sector | module | store | infirmary | old | closed | orbit
      infirmaryUntil: null, // срок лазарета (три года от приёма)
      deliver: null,       // снабженец: relay | capsules | both
      sos: null,           // спать и звать помощь: drift | stream | home
      cooler: null,        // снабженец: холодильник капсульного блока — own | relayParts | tools
      approach: null,      // снабженец: монтаж под вспышками — protect | wait | block
      gridBlocks: 2,       // независимых блоков корабельной сети
      relayOK: false, capsOK: false, shelter: false,   // снабженец: что работает у форпоста
      outpostDead: 0,      // погибли люди форпоста (входят в deadHere, но не в живых сорок первой)
      eq: null,            // оснащение: вариант по каждой из восьми позиций (mission.js: EQUIP)
      tMag: null,          // лет работы плазменного магнита (null — прежний профиль: 20 лет торможения)
      brakeMass: null,     // масса к началу торможения, тыс. т
      shieldFixed: false,  // пробитый сектор щита заменён запасным
      blueprint: null,     // капельный радиатор по чертежу Кольца: built | archived
      incident: null,      // авария с живыми — для партии спасателей
      earlyNews: null,     // пакет наблюдений Кольца года 3: { family, change, objects, from, received }
      earlyCouncil: null,  // решение совета «Новые сведения»: { at, family, choice: turn | stay, from, to, dvKms }
      route: null,         // излом траектории после поворота: { knee: { at, x, from }, D — длина пути }
      wearOn: !(ctx && ctx.wear === false), // модель износа (правила 5); ctx.wear: false — без неё (сравнение в калибровке)
      wear: null,          // граф корабля, люди по местам, операции (wear.js)
      wearPolicy: null,    // ответ на первый отказ контура: replace — менять насос из запаса, reroute — беречь запас
      taskHistory: [],     // снятые с программы задания
      choices: {}
    };
    if (v5(st)) startBooks(st);                                         // журнал запасов и людей, ревизии маршрута (v5)
    return st;
  }

  // ---------------------------------------------------------------- задание заявки: итог исследовательской работы
  // search32 — источник локализован и журнал принят (диск у Тёмной звезды); contactColony — связь с поселением состоялась;
  // trace — район последней орбиты обследован (корпус найден или нет — по сиду; проверка следа и есть задание);
  // survey — первичная съёмка, «пригодного мира нет» — тоже результат
  function taskResult(s) {
    const w = s.task && s.task.work;
    if (w === 'search32') return { done: !!s.sourceFound, found: null };
    if (w === 'contactColony') return { done: !!s.colonyLink, found: null };
    if (w === 'trace') return { done: true, found: (hidden(s, 'task.e24.hull') ?? 0) < 0.7 };
    return { done: true, found: null };
  }
  const TASK_NAME = { search32: ['поиск тридцать второй', 'the search for the Thirty-Second'], contactColony: ['связь с Перевалом', 'the link with the Pass'],
    trace: ['след двадцать четвёртой', "No. 24's trace"], survey: ['обследование системы', 'the system survey'] };
  // «связь с Перевалом», «связь с Садом»… — по колонии у звезды задания
  const taskName = (task, lang) => { const L = task.work === 'contactColony' && R.linkByStar(task.star), k = lang === 'ru' ? 0 : 1;
    return L ? (lang === 'ru' ? `связь ${L.with[0]}` : `the link ${L.with[1]}`) : TASK_NAME[task.work][k]; };
  const SURVEY_WORLD = {
    open: ['Мир у звезды пригоден для жизни — после проверки на месте.', 'The world at the star is fit to live on — once checked on site.'],
    dome: ['Жить можно только под куполами.', 'Life is possible only under domes.'],
    hostile: ['Высадки не будет: база — только на орбите.', 'There will be no landing: a base can only be in orbit.'],
    ruined: ['Высадки не будет: база — только на орбите.', 'There will be no landing: a base can only be in orbit.'],
    none: ['Пригодного мира нет — это тоже результат программы.', 'There is no habitable world — that is a result of the programme too.']
  };
  function taskReportText(s, lang) {
    const ru = lang === 'ru', k = ru ? 0 : 1, T = s.task, L = Math.max(1, Math.round(lag(s, s.year)));
    const way = ru ? ` До Земли отчёт идёт ${yrs(L)}.` : ` The report takes ${yrsEn(L)} to reach Earth.`;
    if (T.work === 'search32') return (T.done
      ? (ru ? 'Отчёт уходит на Землю. Источник сигнала локализован у Тёмной звезды; журнал тридцать второй принят полностью и приложен. Задание Совета выполнено.'
        : "The report goes out to Earth. The signal source is located at the Dark Star; the Thirty-Second's log is received in full and attached. The Council's task is done.")
      : (ru ? 'Отчёт уходит на Землю. Источник сигнала не локализован; следа тридцать второй нет. Задание Совета не выполнено.'
        : "The report goes out to Earth. The signal source has not been located; there is no trace of the Thirty-Second. The Council's task is not done.")) + way;
    if (T.work === 'contactColony') { const LK = R.linkByStar(T.star) || R.linkOf(R.get('req:contact:pass')), cap1 = x => x.replace(/^./, c => c.toUpperCase());
      return (T.done
        ? (ru ? `Отчёт уходит на Землю. Связь ${LK.with[0]} двусторонняя; ${LK.what[0]} сверены, расхождения отмечены. Задание ${LK.svcG[0]} выполнено.`
          : `The report goes out to Earth. The link ${LK.with[1]} is two-way; ${LK.what[1]} are reconciled, the discrepancies marked. ${cap1(LK.svcG[1])} task is done.`)
        : (ru ? `${LK.nom[0]} не отвечает на вызовы. Протокол вызовов и снимки поселения уходят на Землю; задание ${LK.svcG[0]} не выполнено.`
          : `${LK.nom[1]} does not answer the calls. The call log and images of the settlement go out to Earth; ${LK.svcG[1]} task is not done.`)) + way; }
    if (T.work === 'trace') return (T.found
      ? (ru ? 'Протокол поиска уходит на Землю. В районе последней орбиты — корпус двадцать четвёртой: питания нет, автоматика молчит, людей на борту нет — как она и сообщала. Журнал снят через внешний порт. Задание архивной комиссии выполнено.'
        : "The search report goes out to Earth. In the region of the last orbit lies No. 24's hull: no power, the automation silent, nobody aboard — just as it reported. The log was read through the outer port. The archive commission's task is done.")
      : (ru ? 'Протокол поиска уходит на Землю. В расчётном районе корпуса нет: за полвека орбиту могло увести. В протоколе — карта просмотренных орбит и пределы обнаружения. Задание архивной комиссии выполнено: след проверен.'
        : "The search report goes out to Earth. There is no hull in the predicted region: in half a century the orbit may have drifted. The report holds a map of the orbits searched and the detection limits. The archive commission's task is done: the trace has been checked.")) + way;
    const w = s.worldSeen || M.worldOf(s.target);
    return (ru ? `Первичная съёмка закончена, измерения уходят на Землю: среда системы, массы и орбиты известных тел, условия для базы. ${SURVEY_WORLD[w][0]} Задание научной программы выполнено.`
      : `The first survey is finished and the measurements go out to Earth: the system's environment, the masses and orbits of the known bodies, the conditions for a base. ${SURVEY_WORLD[w][1]} The science programme's task is done.`) + way;
  }
  // выполнено ли обязательство заявки — одно правило для эпилога и калибровки
  function missionComplete(s) {
    if (s.mission === 'supply') return ['delivered', 'sheltered'].includes(s.outcome);
    if (s.mission === 'rescue') return !!s.housed || s.outcome === 'housed';
    return !!(s.task && s.task.done && s.task.reportAt != null);
  }

  // ---------------------------------------------------------------- совет «Новые сведения» (ранний поворот, год 3)
  // DOC «Повороты по обстановке Кольца», «Ревью Codex — ранний срез поворотов» (C), «Ревью Codex — заявки из мира» (шаг 6).
  // Курс меняют сведения Кольца, а не напоминания: к году 3 приходит пакет наблюдений (на Земле обработан на году 2,5,
  // отправлен на 2,75, корабль ещё у Солнца) — изменился сигнал источника либо уточнены миры у звёзд исследовательских
  // заявок. Совет — только если есть физически доступный поворот к звезде другой исследовательской заявки повестки;
  // иначе — только запись. Снабжение и спасение адресны: им пакет не меняет курса. Один совет за рейс, «держать курс» —
  // всегда, без штрафа. Поворот — импульс: модуль скорости сохраняется, Δv = 2v·sin(θ/2) — из резерва манёвров, с
  // запасом на увод ступени; разгон продолжается к новой цели; траектория — с изломом в точке поворота
  const NEWS = { at: 3, earth: 2.5, sent: 2.75, none: 0.35, signal: 0.5 };
  const CKMS = 299792.458;
  const unitOf = n => { const st = M.star(n); return [st.x / st.d, st.y / st.d, st.z / st.d]; };
  const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // план пакета: есть ли сведения и какие — скрытый факт партии; объекты — звёзды исследовательских заявок повестки
  // (текущая цель и до двух ближайших по направлению)
  // события Кольца — факты мира: при одном мире у разных кораблей одна и та же новость (ревью Codex, шаг 6)
  const worldU = (s, key) => s.worldSeed ? hashU32(JSON.stringify(['world', s.worldSeed, key])) / 4294967296 : hidden(s, key);
  // дата приёма пакета кораблём: свет, ушедший на году NEWS.sent, догоняет корабль — t = sent + путь(t) (c = 1 св. год/год)
  function newsReceived(s) {
    let lo = NEWS.sent, hi = NEWS.at;
    for (let i = 0; i < 60; i++) { const m = (lo + hi) / 2; if (m - NEWS.sent < M.distLy(m, s.beta)) lo = m; else hi = m; }
    return (lo + hi) / 2;
  }
  function newsPlan(s) {
    if (s.mission !== 'contact' || !s.target) return null;
    const u = worldU(s, 'ring.early.family');
    if (u == null || u < NEWS.none) return null;
    const family = u < NEWS.signal ? 'signal' : 'world', u0 = unitOf(s.target);
    const others = agendaOf(s).map(id => R.get(id)).filter(q => q && q.branch === 'contact' && q.star !== s.target)
      .sort((a, b) => dot3(unitOf(b.star), u0) - dot3(unitOf(a.star), u0) || (a.star < b.star ? -1 : 1));
    const objects = family === 'signal' ? [M.SOURCE] : [s.target].concat(others.slice(0, 2).map(q => q.star));
    // наблюдения фиксируются в пакете при получении: карточка и решения читают пакет, а не истинный мир
    const observed = family === 'world' ? Object.fromEntries(objects.map(n => [n, M.worldOf(n)])) : {};
    return { family, change: (worldU(s, 'ring.early.signal') ?? 0.5) < 0.5 ? 'pattern' : 'stopped', objects, observed, from: s.target, received: newsReceived(s) };
  }
  // расчёт поворота к звезде заявки q на году NEWS.at; null — недоступен (резерв, увод ступени, срок, бодрствование)
  function earlyTurnQuote(s, q) {
    if (!q || !s.target || q.star === s.target || !s.reserveDv) return null;
    const t = NEWS.at, v = s.beta * t / M.ACC, x = M.distLy(t, s.beta), u0 = unitOf(s.target), to = M.star(q.star);
    const P = u0.map(k => k * x), w = [to.x - P[0], to.y - P[1], to.z - P[2]], L = Math.hypot(...w), u1 = w.map(k => k / L);
    const th = Math.acos(Math.max(-1, Math.min(1, dot3(u0, u1)))), dv = 2 * v * Math.sin(th / 2), D = x + L;
    let pf; try { pf = M.flightProfile(D, s.beta, s.tMag); } catch (e) { return null; }
    const A = pf.arrive, sy = M.brakeStart(A, s.tMag) + M.brakeDist(s.beta, s.tMag) / s.beta - M.ACC;   // ступень до прохода новой цели
    const stage = M.divert(sy, s.reserveDv).dv / CKMS, R0 = s.reserveDv * s.reserve / 100;
    if (dv + stage > R0 + 1e-12 || A > M.REACH || M.awake(A, 48, crewOf(s)) > 25) return null;
    const A0 = s.arriveExact != null ? s.arriveExact : s.arrive;
    return { req: q.id, to: q.star, angle: th * 180 / Math.PI, dv, dvKms: dv * CKMS, stageKms: stage * CKMS, reserveBefore: R0 * CKMS,
      reserveAfter: (R0 - dv) * CKMS, reservePct: 100 * dv / s.reserveDv, arriveExact: A, arrive: Math.round(A), delta: A - A0,
      awakeDelta: s.watch * (A - A0) / crewOf(s), x, D };
  }
  const newsCandidates = s => !s.earlyNews || s.earlyCouncil ? [] : (s.earlyNews.family === 'signal' ? [M.SOURCE] : s.earlyNews.objects.slice(1))
    .map(n => agendaOf(s).map(id => R.get(id)).find(q => q && q.branch === 'contact' && q.star === n)).filter(Boolean)
    .map(q => earlyTurnQuote(s, q)).filter(Boolean).sort((a, b) => a.dv - b.dv || a.arriveExact - b.arriveExact || (a.to < b.to ? -1 : 1)).slice(0, 2);
  // что сообщает пакет о мире звезды: только опубликованные признаки (класс мира — истина, текст — наблюдение)
  const NEWS_WORLD = {
    open: ['планета подтверждена; признаки воды и атмосферы; пригодность для дыхания не подтверждена', 'the planet is confirmed; signs of water and an atmosphere; breathability unconfirmed'],
    dome: ['сильные различия условий на поверхности; есть район для закрытого поселения', 'strong contrasts across the surface; there is a region worth checking for a closed settlement'],
    hostile: ['экстремальные условия на поверхности; работы возможны только с орбиты', 'extreme surface conditions; work is possible only from orbit'],
    ruined: ['разрушенная поверхность и обломки', 'a shattered surface and debris'],
    none: ['пригодный мир не подтверждён', 'no habitable world is confirmed']
  };
  const nameAt = (n, lang) => lang === 'ru' ? nmG({ target: n }) : M.nameOf(n, 'en');
  function newsText(s, lang) {
    const ru = lang === 'ru', N = s.earlyNews, f2 = y => nf(y, 2, lang), recv = f2(N.received);
    const dates = n => { const ep = Math.round(NEWS.earth - M.star(n).d), y = `${ep < 0 ? '−' : ''}${Math.abs(ep)}`;
      return ru ? `наблюдаемое состояние — год ${y}` : `the state observed is that of year ${y}`; };
    const head = ru ? `Служба наблюдений Кольца обработала данные на году ${f2(NEWS.earth)} и отправила пакет на году ${f2(NEWS.sent)}; на борту он принят на году ${recv}.`
      : `The Ring's observation service processed the data in year ${f2(NEWS.earth)} and sent the packet in year ${f2(NEWS.sent)}; it reached us in year ${recv}.`;
    let body;
    if (N.family === 'signal') body = ru ? `Источник в направлении ε Индейца: ${N.change === 'pattern' ? 'повторяющаяся последовательность изменилась' : 'прежняя последовательность прекратилась'} (${dates(M.SOURCE)}). Причина неизвестна; о людях пакет ничего не сообщает.`
      : `The source in the direction of ε Indi: ${N.change === 'pattern' ? 'the repeating sequence has changed' : 'the old sequence has stopped'} (${dates(M.SOURCE)}). The cause is unknown; the packet says nothing about people.`;
    else body = N.objects.map(n => ru ? `У ${nameAt(n, 'ru')}: ${NEWS_WORLD[N.observed[n]][0]} (${dates(n)}).` : `At ${nameAt(n, 'en')}: ${NEWS_WORLD[N.observed[n]][1]} (${dates(n)}).`).join(' ')
      + (ru ? ' Это состояние прошлых лет, а не нынешняя обстановка у звёзд.' : " These are past years' conditions, not the stars' present situation.");
    const cand = newsCandidates(s), tail = cand.length ? (ru ? ' Ирсон пересчитал доступные маршруты по оставшемуся резерву: вопрос — на совет.' : ' Irson has recalculated the available routes on the remaining reserve: the question goes to the council.')
      : (ru ? ' Ирсон пересчитал маршруты по оставшемуся резерву: доступной смены курса до отделения ступени нет.' : ' Irson has recalculated the routes on the remaining reserve: no course change is available before stage separation.');
    return `${head}\n\n${body}${tail}`;
  }
  const taskLabel = (q, lang) => { const T = R.TEXT[q.id], X = RESEARCH[q.id]; return T ? T.label[lang] : X ? X.label[lang] : q.id; };
  function turnOption(qt) {
    const q = R.get(qt.req), id = `accept:${q.id}`, fk = (x, lang) => nf(x, 0, lang);
    const yd = (d, lang) => `${d >= 0 ? '+' : '−'}${nf(Math.abs(d), 1, lang).replace(/[.,]0$/, '')}`;
    return { id,
      label: { ru: s => `Повернуть — ${taskLabel(q, 'ru')}`, en: s => `Turn — ${taskLabel(q, 'en')}` },
      known: {
        ru: s => [`Новое задание — ${taskLabel(q, 'ru')}; прежнее будет снято с программы.`,
          `Поворот на ${nf(qt.angle, 1, 'ru')}° при ${nf(s.beta * NEWS.at / M.ACC, 3, 'ru')}c: Δv ${fk(qt.dvKms, 'ru')} км/с.`,
          `Резерв манёвров: ${fk(qt.reserveBefore, 'ru')} → ${fk(qt.reserveAfter, 'ru')} км/с; из остатка ${fk(qt.stageKms, 'ru')} км/с — на увод ступени.`,
          `Прибытие — около года ${qt.arrive} (${yd(qt.delta, 'ru')} г.); бодрствование при вахте ${s.watch} — ${yd(qt.awakeDelta, 'ru')} г. на человека.`],
        en: s => [`New task — ${taskLabel(q, 'en')}; the old one comes off the programme.`,
          `A ${nf(qt.angle, 1, 'en')}° turn at ${nf(s.beta * NEWS.at / M.ACC, 3, 'en')}c: Δv ${fk(qt.dvKms, 'en')} km/s.`,
          `Manoeuvre reserve: ${fk(qt.reserveBefore, 'en')} → ${fk(qt.reserveAfter, 'en')} km/s; ${fk(qt.stageKms, 'en')} km/s of the rest goes to clearing the stage.`,
          `Arrival around year ${qt.arrive} (${yd(qt.delta, 'en')} yr); waking time at a watch of ${s.watch} — ${yd(qt.awakeDelta, 'en')} yr per person.`]
      },
      cost: st => { st.reserve -= qt.reservePct; },                      // «После»: только публичная цена манёвра
      effect: st => {
        const t2 = earlyTurnQuote(st, q); if (!t2) return;               // повторная проверка на полном состоянии
        const from = st.target;
        st.reserve -= t2.reservePct;
        (st.taskHistory = st.taskHistory || []).push(Object.assign({}, st.task, { status: 'abandoned', at: st.year }));
        st.requestId = q.id; st.target = q.star; st.task = { work: q.work, star: q.star, done: false, found: null, reportAt: null };
        st.arriveExact = t2.arriveExact; st.arrive = t2.arrive;
        st.route = { knee: { at: st.year, x: t2.x, from }, D: t2.D };
        st.earlyCouncil = { at: st.year, family: st.earlyNews.family, choice: 'turn', from, to: q.star, dvKms: t2.dvKms };
      },
      record: {
        ru: s => `Совет меняет курс: с ${nameAt(s.earlyCouncil ? s.earlyCouncil.from : q.star, 'ru')} на ${nameAt(q.star, 'ru')}. Ирсон заносит расход ${fk(qt.dvKms, 'ru')} км/с и новое прибытие — около года ${s.arrive}. Прежнее задание снято с программы; принято: ${taskLabel(q, 'ru')}. Уведомление уходит на Землю.`,
        en: s => `The council changes course: from ${M.nameOf(s.earlyCouncil ? s.earlyCouncil.from : q.star, 'en')} to ${M.nameOf(q.star, 'en')}. Irson enters ${fk(qt.dvKms, 'en')} km/s spent and the new arrival — around year ${s.arrive}. The old task comes off the programme; accepted: ${taskLabel(q, 'en')}. A notice goes out to Earth.`
      } };
  }
  const stayOption = {
    id: 'stay',
    label: { ru: s => `Держать курс на ${nameAt(s.target, 'ru')}`, en: s => `Hold the course for ${M.nameOf(s.target, 'en')}` },
    known: {
      ru: s => [`Задание прежнее — ${reqOf(s) ? taskLabel(reqOf(s), 'ru') : '—'}; прибытие — около года ${s.arrive}.`, 'Резерв манёвров сохраняется. Сведения остаются в программе наблюдений.'],
      en: s => [`The task stays — ${reqOf(s) ? taskLabel(reqOf(s), 'en') : '—'}; arrival around year ${s.arrive}.`, 'The manoeuvre reserve is kept. The information stays in the observation programme.']
    },
    effect: st => { st.earlyCouncil = { at: st.year, family: st.earlyNews.family, choice: 'stay', from: st.target, to: st.target }; },
    record: {
      ru: s => `Совет сохраняет курс на ${nameAt(s.target, 'ru')} и задание. Пакет приложен к решению; манёвра нет.`,
      en: s => `The council keeps the course for ${M.nameOf(s.target, 'en')} and the task. The packet is attached to the decision; no manoeuvre.`
    }
  };

  // ---------------------------------------------------------------- голосование Совета по заявкам
  // DOC «Повороты по обстановке Кольца» (заявки из мира) и «Ревью Codex — заявки из мира». Вариант голосования — заявка
  // повестки (requests.js): она задаёт ветку сюжета, звезду и работу. Отдельного выбора звезды нет; карта — обзор.
  // MISSION_BASE — тексты веток (контакт, снабжение, спасение); у исследовательских заявок — своё «за что» и курс Орина
  const MISSION_BASE = [
          {
            id: 'contact',
            label: { ru: 'Исследование и контакт', en: 'Research and contact' },
            known: {
              ru: ['Звезду выбирает экспедиция — любую достижимую; задание уточнят по сведениям о системе: поиск тридцать второй и источника сигнала, обследование системы или прямая связь с поселением.', 'Форпосту Ксилона Ир обещают специалиста через четыре года — передатчик к тому времени может замолчать.'],
              en: ['The expedition chooses the star — any it can reach; the task is set from what is known of the system: searching for the Thirty-Second and the signal source, surveying the system, or a direct link with a settlement.', 'Xylona Ir is promised a specialist in four years — its transmitter may be silent by then.']
            },
            effect: st => { st.mission = 'contact'; },
            record: {
              ru: `Совет утверждает исследовательскую экспедицию. Форпосту обещают специалиста в следующем цикле, через четыре года. Дассер знает, что это значит для передатчика, и записывает результат. Карту Ксилона Ир он пока не убирает.
  
  — Я поведу эту экспедицию.
  
  Кассель не спешит записывать его имя.
  
  — Вы голосовали за форпост.
  
  — Голосовал.
  
  — Тогда я — штурман, — говорит Орин. — Выберем, куда и за чем лететь.`,
              en: `The Council approves a research expedition. The outpost is promised a specialist next cycle, in four years. Dasser knows what that means for the transmitter, and records the result. He doesn't put the Xylona Ir chart away yet.
  
  "I'll lead this expedition."
  
  Kassel doesn't hurry to note his name.
  
  "You voted for the outpost."
  
  "I did."
  
  "Then I'm navigator," says Orin. "Now we choose where to go, and what for."`
            }
          },
          {
            id: 'supply',
            label: { ru: 'Форпост Ксилона Ир: связь и запчасти', en: 'Xylona Ir outpost: the link and spares' },
            known: {
              ru: ['Звезда Барнарда, 6 св. лет — ближе всех. Специалист дальней связи, передатчик, запас для капсул.', 'Исследование сектора сигнала ждёт следующей экспедиции.'],
              en: ["Barnard's Star, 6 ly — the nearest. A deep-relay specialist, a transmitter, capsule spares.", 'Research in the signal sector waits for the next expedition.']
            },
            effect: st => { st.mission = 'supply'; },
            record: {
              ru: `Совет голосует за форпост. Исследование Орина обещают следующей экспедиции.
  
  — Я поведу, — говорит Дассер.
  
  Орин молча переносит координаты сигнала в свой журнал.
  
  — Тогда я — штурман. Сигнал подождёт; передатчик — нет.`,
              en: `The Council votes for the outpost. Orin's research is promised to the next expedition.
  
  "I'll lead," says Dasser.
  
  Orin silently copies the signal's coordinates into his log.
  
  "Then I'm navigator. The signal can wait; the transmitter can't."`
            }
          },
          {
            id: 'rescue',
            label: { ru: 'Оттепель: сорок спящих', en: 'Thaw: forty sleepers' },
            known: {
              ru: [`Росс 128, 11 св. лет. Капсулы держат до года ${thawDeadline()}: успеть можно только на 0,1c — с запасом в месяцы.`, 'На 0,1c почти нет места для груза. Сорок мест для спасённых — это сорок своих, оставшихся на Земле.'],
              en: [`Ross 128, 11 ly. The capsules hold until year ${thawDeadline()}: only 0.1c gets there in time — with a margin of months.`, 'At 0.1c there is almost no room for cargo. Forty berths for the rescued mean forty of our own staying on Earth.']
            },
            effect: st => { st.mission = 'rescue'; },
            record: {
              ru: `Совет голосует за Оттепель. Кассель записывает срок: год ${thawDeadline()}.
  
  — Я поведу, — говорит Дассер.
  
  — Тогда я — штурман, — говорит Орин. — И считать будем каждый день.`,
              en: `The Council votes for Thaw. Kassel writes down the deadline: year ${thawDeadline()}.
  
  "I'll lead," says Dasser.
  
  "Then I'm navigator," says Orin. "And we'll count every day."`
            }
          }
        ];
  // повестка — снимок на старт экспедиции (ctx.agenda: мир после финала меняется, повтор партии — нет); без снимка — первая
  const agendaOf = s => { const a = s && Array.isArray(s.agenda) ? s.agenda.filter(id => R.get(id)) : null; return a && a.length ? a : R.agenda(null); };
  const reqOf = s => s.requestId ? R.get(s.requestId) : null;
  const RESEARCH = {
    'req:search32:e32': {
      label: { ru: 'ε Индейца: след тридцать второй и источник сигнала', en: "ε Indi: the Thirty-Second's trace and the signal source" },
      task: { ru: 'Совет: найти след тридцать второй и источник сигнала, передать записи Кольцу. Путь — по заявленному маршруту тридцать второй.', en: "The Council: find the Thirty-Second's trace and the signal source, and transmit the records to the Ring. The road follows the Thirty-Second's filed route." },
      vote: { ru: 'Совет голосует за поиск тридцать второй у ε Индейца.', en: 'The Council votes for the search for the Thirty-Second at ε Indi.' },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Пойдём дорогой тридцать второй. Если они оставили след, он на ней.', en: '"Then I\'m navigator," says Orin. "We take the Thirty-Second\'s road. If they left a trace, it\'s on it."' }
    },
    'req:contact:pass': {
      vote: { ru: 'Совет голосует за заявку службы навигации — Перевал.', en: "The Council votes for the navigation service's request — the Pass." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на Лакайль 9352. Их лоции пригодятся нам раньше, чем им — наши.', en: '"Then I\'m navigator," says Orin. "Course for Lacaille 9352. We\'ll need their charts sooner than they need ours."' }
    },
    'req:trace:e24': {
      vote: { ru: 'Совет голосует за заявку архивной комиссии — след двадцать четвёртой.', en: "The Council votes for the archive commission's request — No. 24's trace." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на 61 Лебедя. Их автоматика довела корабль без людей — посмотрим, что она видела.', en: '"Then I\'m navigator," says Orin. "Course for 61 Cygni. Their automation brought the ship in with nobody aboard — let\'s see what it saw."' }
    },
    'req:survey:gl338': {
      vote: { ru: 'Совет голосует за заявку научной программы — Gl 338.', en: "The Council votes for the science programme's request — Gl 338." },
      course: { ru: '— Тогда я — штурман, — говорит Орин. — Курс на Gl 338. Дальше всех — значит, считать точнее всех.', en: '"Then I\'m navigator," says Orin. "Course for Gl 338. Farthest of all — so we count more carefully than anyone."' }
    }
  };
  const COURSE = {
    supply: { ru: 'Орин прокладывает курс на звезду Барнарда — к форпосту Ксилона Ир.', en: "Orin lays in the course for Barnard's Star, for the Xylona Ir outpost." },
    rescue: { ru: 'Орин прокладывает курс на Росс 128 — к складу Оттепели.', en: "Orin lays in the course for Ross 128, for Thaw's store." }
  };
  const swap = (text, a, b) => { if (!text.includes(a)) throw new Error(`Нет текста для замены: ${a}`); return text.replace(a, b); };
  function requestOption(id) {
    const q = R.get(id), base = MISSION_BASE.find(o => o.id === q.branch), T = R.TEXT[id], L = R.linkOf(q);
    const X = RESEARCH[id] || (L && L.vote ? { vote: { ru: L.vote[0], en: L.vote[1] }, course: { ru: L.course[0], en: L.course[1] } } : null);
    const effect = st => { st.requestId = q.id; st.mission = q.branch; st.target = q.star; st.arrive = Math.round(M.trip(M.star(q.star).d, st.beta, M.stdMag(st.beta)));
      st.task = { work: q.work, star: q.star, done: false, found: null, reportAt: null }; };   // задание заявки; итог — в отчёте у цели
    if (q.branch !== 'contact') return Object.assign({}, base, { id, effect,
      record: { ru: `${base.record.ru}\n\n${COURSE[q.branch].ru}`, en: `${base.record.en}\n\n${COURSE[q.branch].en}` } });
    const lines = lang => (T ? T.known(q, lang) : [R.roadLine(q, lang), X.task[lang]]).concat(base.known[lang].slice(-1));   // последняя строка — цена для Ксилоны
    return { id, effect, label: T ? T.label : X.label, known: { ru: () => lines('ru'), en: () => lines('en') },
      record: {
        ru: swap(swap(base.record.ru, 'Совет утверждает исследовательскую экспедицию.', X.vote.ru), '— Тогда я — штурман, — говорит Орин. — Выберем, куда и за чем лететь.', X.course.ru),
        en: swap(swap(base.record.en, 'The Council approves a research expedition.', X.vote.en), '"Then I\'m navigator," says Orin. "Now we choose where to go, and what for."', X.course.en)
      } };
  }
  // стенограмма Совета — по повестке: кто какую заявку докладывает
  const NUMW = { ru: ['', '', 'две', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять', 'десять'], en: ['', '', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'] };
  function councilText(s, lang) {
    const A = agendaOf(s), n = A.length, ru = lang === 'ru', has = id => A.includes(id), W = id => R.TEXT[id].council[lang];
    const N = ru ? NUMW.ru[n] : NUMW.en[n].replace(/^./, c => c.toUpperCase());
    const out = [ru ? `— Заявок ${N}, экспедиция одна, — говорит Ирина Кассель. — Решаем, какую берёт сорок первая: заявка задаёт и звезду, и работу. Паспорт утвердим потом.`
        : `"${N} requests, one expedition," says Irina Kassel. "We decide which one the Forty-First takes on: a request sets both the star and the work. The passport comes after."`,
      ru ? `На общей карте ${N} ${plural(n, ['отметка', 'отметки', 'отметок'])}. Ни одна ещё не соединена с Землёй линией курса.` : `${N} markers stand on the shared chart. None is yet joined to Earth by a course line.`];
    if (has('req:supply:xylona')) out.push(ru ? 'Нил Дассер касается первой.' : 'Nil Dasser touches the first.',
      ru ? '— Ксилона Ир, звезда Барнарда. Передатчик слабеет: ещё десять лет без специалиста дальней связи — и форпост перестанет слышать Кольцо. Им нужны специалист, детали передатчика и запас для капсул.'
        : '"Xylona Ir, Barnard\'s Star. Its transmitter is failing: ten more years without a deep-relay specialist and the outpost stops hearing the Ring. They need a specialist, transmitter parts and capsule spares."');
    if (has('req:rescue:thaw')) out.push(ru ? 'Ива Лорн касается второй.' : 'Iva Lorn touches the second.',
      ru ? '— Оттепель, Росс 128. База погибла, сорок человек ушли в капсулы на орбитальный склад. Капсулы держат сто пятьдесят лет; двадцать пять уже прошло. Сколько из сорока живы, мы не знаем.'
        : '"Thaw, Ross 128. The base is dead; forty people went into capsules at the orbital store. The capsules hold a hundred and fifty years; twenty-five have passed. How many of the forty are alive, we don\'t know."');
    const extra = ['req:trace:e24', 'req:survey:gl338'].filter(has).map(W).join(' ');
    out.push(ru ? 'Орин Дал увеличивает участок карты с сектором сигнала.' : 'Orin Dal enlarges the region of the chart with the signal sector.',
      ru ? `— Исследование. Тридцать вторая шла к ε Индейца; её последняя передача оборвана, а из того же сектора идёт сигнал, которого нет в каталогах Кольца. Это моя первая кандидатура.${extra ? ' ' + extra : ''}`
        : `"Research. The Thirty-Second was bound for ε Indi; its last transmission broke off, and from the same sector comes a signal that is in none of the Ring's catalogues. That is my first candidate.${extra ? ' ' + extra : ''}"`);
    // заявки колоний — одной репликой Кассель: Перевал (служба навигации), затем остальные (Ближний берег, Верфь, Сад)
    const cols = A.filter(id => id !== 'req:contact:pass' && R.get(id).work === 'contactColony'), cn = cols.length, items = cols.map(W).join(' ');
    const more = cn ? (ru ? (cn === 1 ? 'Ещё одна заявка — от колонии. ' : `Ещё ${NUMW.ru[cn]} — от колоний. `) : (cn === 1 ? 'One more, from a colony. ' : `${NUMW.en[cn].replace(/^./, c => c.toUpperCase())} more, from the colonies. `)) + items : '';
    if (has('req:contact:pass')) out.push(!cn ? W('req:contact:pass') : ru ? `${W('req:contact:pass')} ${more}` : `${W('req:contact:pass').replace(/"$/, '')} ${more}"`);
    else if (cn) out.push(ru ? `— ${cn === 1 ? 'И ещё одна заявка — от колонии' : `И ещё ${NUMW.ru[cn]} — от колоний`}, — говорит Кассель. — ${items}`
      : `"${cn === 1 ? 'And one more, from a colony' : `And ${NUMW.en[cn]} more, from the colonies`}," says Kassel. "${items}"`);
    out.push(ru ? '— Остальные заявки останутся в очереди, — говорит Кассель. — Голосуем.' : '"The other requests stay in the queue," says Kassel. "We vote."');
    return out.join('\n\n');
  }

  const beats = [
    // ------------------------------------------------------------ ЗАЯВОЧНЫЙ ПЛАН
    {
      id: 'p.opening', kind: 'cinematic', scene: 'space',
      label: { ru: 'Заявочный план', en: 'Opening' },
      // F — точка фокуса в св. годах (галактические координаты), dist — в св. годах; ship — ракурс корабля
      shots: [
        { F: [13000, 0, 0], dist: 140000, yaw: -2.3, pitch: 1.2, frame: 'galactic', cut: true, dur: 6000, ru: '', en: '' },
        { F: [1500, 0, 0], dist: 32000, yaw: -2.0, pitch: 0.8, frame: 'galactic', move: 5500, ring: 1, dur: 6500,
          ru: 'Кольцо. Сеть цивилизаций.', en: 'The Ring. A network of civilisations.' },
        { F: [300, 0, 0], dist: 2600, yaw: -1.7, pitch: 0.6, frame: 'galactic', move: 5000, ring: 1, link: true, dur: 8500,
          ru: 'Между вопросом и ответом проходят жизни.', en: 'Lifetimes pass between a question and its answer.' },
        { F: 'sun', dist: 55, yaw: -1.0, pitch: 0.9, frame: 'galactic', move: 5000, dur: 6500,
          ru: 'Земные экспедиции.', en: "Earth's expeditions." },
        { ship: 'depart', dur: 7500, move: 6500, ru: '', en: '' },
        { ship: 'passing', dur: 7500, ru: 'Путь в один конец.', en: 'A one-way road.' }
      ]
    },

    // ------------------------------------------------------------ ПРОЛОГ
    {
      id: 'p.council', scene: 'council', kind: 'transcript', year: 0,
      title: { ru: 'Совет Звездоплавания', en: 'Council of Star Navigation' },
      text: { ru: s => councilText(s, 'ru'), en: s => councilText(s, 'en') }
    },
    {
      // голосование — по заявкам повестки; рядом карта-обзор (ui: 'agenda'): звёзды можно смотреть, курс задаёт заявка
      id: 'd.mission', scene: 'agenda', kind: 'decision', year: 0, ui: 'agenda',
      title: { ru: 'Какую заявку берёт сорок первая', en: 'Which request the Forty-First takes on' },
      context: {
        ru: 'Совет голосует. Заявка задаёт и звезду, и работу; остальные остаются в очереди — их возьмут следующие экспедиции, через годы.',
        en: 'The Council votes. A request sets both the star and the work; the rest stay in the queue for later expeditions — years from now.'
      },
      options: s => agendaOf(s).map(requestOption)
    },
    {
      id: 'p.station', scene: 'council', kind: 'archive', year: 0, inline: 'probe', when: s => s.requestId === 'req:search32:e32',
      place: { ru: 'Земля, Совет Звездоплавания · приложение к исследовательской заявке', en: 'Earth, Council of Star Navigation · research request annex' },
      text: {
        ru: `В приложении — две записи станции связи Кольца из одного сектора неба.

Первая — обрывок последней передачи тридцать второй, принятый шесть лет назад:

«…красивее всего, что мы видели…»

Вторая пришла в тот же год. Последовательность повторяется каждые сорок минут; её кода нет в каталогах Кольца.

Направления сопоставлены: области погрешности перекрываются. Общий район возможен, связь записей не доказана.

Орин прикладывает заявленный маршрут тридцать второй — к ε Индейца.

— Там можно искать её след и источник сигнала, — говорит он. — Для другой звезды запишем другое задание.`,
        en: `The annex holds two recordings from the Ring's contact station, from the same sector of sky.

The first is a fragment of the Thirty-Second's last transmission, received six years ago:

'…more beautiful than anything we've seen…'

The second arrived the same year. Its sequence repeats every forty minutes; its code is in none of the Ring's catalogues.

The directions have been compared: the uncertainty regions overlap. A common origin is possible; a link between the recordings is not proven.

Orin attaches the Thirty-Second's declared route — to ε Indi.

"That is where to search for its trace and the signal source," he says. "Another star will get another task."`
      }
    },
    {
      id: 'p.requestEvidence', scene: 'council', kind: 'archive', year: 0, when: s => !!(s.requestId && R.TEXT[s.requestId]),
      place: { ru: 'Земля, Совет Звездоплавания · приложение к заявке', en: 'Earth, Council of Star Navigation · request annex' },
      text: { ru: s => R.TEXT[s.requestId].annex.ru, en: s => R.TEXT[s.requestId].annex.en }
    },
    {
      id: 'p.supplyEvidence', scene: 'council', kind: 'archive', year: 0, when: supplyS,
      place: { ru: 'Земля, Совет Звездоплавания · приложение к заявке', en: 'Earth, Council of Star Navigation · request annex' },
      text: {
        ru: `В приложении к заявке Ксилоны Ир — ведомость разобранного оборудования.

Напротив мастерской стоит: «насосы переданы капсульной смене». Напротив привода антенны: «оставлен ручной».

Нил Дассер задерживает запись на подписи местного совета.

— Они просят две вещи, — говорит он. — Но платят за них всем остальным.

Ирина Кассель велит приложить ведомость к паспорту экспедиции.`,
        en: `Attached to Xylona Ir's request is a list of dismantled equipment.

Beside the workshop: "Pumps transferred to the capsule shift." Beside the antenna drive: "Manual operation retained."

Nil Dasser pauses the record at the local council's signature.

"They ask for two things," he says. "But they are paying with everything else."

Irina Kassel has the list attached to the expedition passport.`
      }
    },
    {
      id: 'p.rescueEvidence', scene: 'council', kind: 'archive', year: 0, when: rescueS,
      effect: s => { s.rescueEvidence = true; },
      place: { ru: 'Земля, Совет Звездоплавания · последние передачи Оттепели', en: "Earth, Council of Star Navigation · Thaw's last transmissions" },
      text: {
        ru: `В техническом отчёте Оттепели: «Хранение штатное. Занято сорок капсул». Медицинское приложение обрывается посреди перечня каналов.

Ирина Кассель кладёт документы рядом.

— Сорок занятых мест ещё не означают сорок живых людей. В паспорт войдут оба отчёта.`,
        en: `Thaw's technical report reads: "Storage nominal. Forty capsules occupied." The medical attachment stops halfway through the channel list.

Irina Kassel lays the documents side by side.

"Forty occupied places do not yet mean forty living people. Both reports go into the passport."`
      }
    },
    {
      id: 'd.passport', scene: 'fitting', kind: 'decision', year: 0, ui: 'passport',
      title: { ru: 'Паспорт экспедиции', en: 'Expedition passport' },
      context: {
        ru: s => `Кольцо выделило 1,24 млн т D+³He. Больше не будет: гелий-3 добывают годами, а ${urgentOf(s, 'ru')}. Ядро корабля неизменно; решаем, сколько топлива уйдёт на скорость, сколько — на резерв и груз.`,
        en: s => `The Ring has allotted 1.24 million tonnes of D+³He. There will be no more: helium-3 takes years to mine, and ${urgentOf(s, 'en')}. The ship's core is fixed; we decide how much fuel goes to speed and how much to reserve and cargo.`
      },
      options: s => passportOptions(s),
      option: (s, id) => passportParse(s, id)
    },
    {
      id: 'p.supplyPromise', scene: 'register', kind: 'document', year: 0, when: supplyS,
      title: { ru: 'Обязательство перед Ксилоной Ир', en: 'The commitment to Xylona Ir' },
      text: {
        ru: s => `В обязательстве записаны капсулы, дальняя связь и подготовленная местная смена.

Феб Ирсон сверяет ведомость с выбранным паспортом: ${s.kits.includes('request') ? 'готовый груз заявки' : 'изготовление у цели из своих материалов'}.

— Накладная докажет, что мы привезли. Она не докажет, что у них работает.

Дассер оставляет обе подписи: свою и подпись совета Ксилоны.

— Изменится груз — передадим новую ведомость. Изменится работа — решим вместе.`,
        en: s => `The commitment names capsules, deep communication and a trained local shift.

Feb Irson checks the manifest against the chosen passport: ${s.kits.includes('request') ? 'the finished request cargo' : 'manufacture at the target from our own materials'}.

"The manifest proves what we brought. It cannot prove what works for them."

Dasser keeps both signatures: his own and Xylona's council's.

"If the cargo changes, we send a new manifest. If the work changes, we decide together."`
      }
    },
    {
      id: 'p.rescuePromise', scene: 'register', kind: 'document', year: 0, when: rescueS,
      effect: s => { s.rescuePromise = { eta: arriveX(s), places: crewOf(s) < M.CREW ? 'sector' : 'housing' }; },
      title: { ru: 'Для кого места', en: 'Who the places are for' },
      text: {
        ru: s => `В обязательстве записаны помощь капсулам и дом для тех, кто дождётся.

Ива Лорн вписывает: ${crewOf(s) < M.CREW ? 'сорок мест спасательного сектора' : 'обязательство построить отдельное жильё'}. Орин подписывает расчёт прибытия, Кассель — принятый запас времени.

— Это прогноз, — говорит она. — Если он изменится, обещание придётся исполнить другим способом.`,
        en: s => `The commitment names help for the capsules and a home for those who survive until arrival.

Iva Lorn enters: ${crewOf(s) < M.CREW ? 'forty berths in the rescue sector' : 'a commitment to build separate housing'}. Orin signs the arrival calculation; Kassel signs the accepted time margin.

"This is a forecast," she says. "If it changes, the promise will need another way of being kept."`
      }
    },
    {
      id: 'p.register', scene: 'register', kind: 'archive', year: 0,
      place: { ru: 'Реестр Кольца', en: 'Ring register' },
      text: {
        ru: s => (s.mission === 'contact' && M.colonyAt(s.target) ? `${colonyTie(s.target, 'ru')} Идём по программе контакта; возможности поселения известны по старому отчёту.

` : '') + `Экспедиция сорок первая. Цель — ${nm(s, 'ru')}. ${crewWord(s, 'ru')} человек в один конец: ${goalOf(s, 'ru')}.

Экипаж не выбирал цель. Каждый выбирал, лететь ли к ней.`,
        en: s => (s.mission === 'contact' && M.colonyAt(s.target) ? `${colonyTie(s.target, 'en')} We go by the contact programme; the settlement's means are known from an old report.

` : '') + `Expedition Forty-One. Destination: ${nm(s, 'en')}. ${crewWord(s, 'en')} people, one way: ${goalOf(s, 'en')}.

The crew didn't choose the destination. Each of them chose whether to fly toward it.`
      }
    },

    // ------------------------------------------------------------ АКТ I
    { id: 's.depart', kind: 'skip', toYear: 0,
      label: { ru: 'Сорок дней спустя · отлёт', en: 'Forty days later · departure' } },
    {
      id: 'a1.depart', scene: 'depart', kind: 'archive', year: 0,
      place: { ru: 'Орбита Земли, отлёт', en: 'Earth orbit, departure' },
      act: { ru: 'Акт I · Разгон', en: 'Act I · Acceleration' },
      text: {
        ru: s => `${crewWord(s, 'ru')} человек на ногах: первые два года корабль полон${crewOf(s) < M.CREW ? ', кроме сорока мест спасательного сектора' : ''}. Восемь лет импульсного термояда — до ${fb(s.beta, 'ru')}.

Земля ещё месяцы видна диском в телескоп обсерватории, и у телескопа всегда кто-нибудь стоит.`,
        en: s => `${crewWord(s, 'en')} people on their feet: for the first two years the ship is full${crewOf(s) < M.CREW ? ', but for the forty berths of the rescue sector' : ''}. Eight years of pulsed fusion, up to ${fb(s.beta, 'en')}.

For months Earth still shows as a disc in the observatory telescope, and there is always someone at the eyepiece.`
      }
    },
    { id: 's.y1', kind: 'skip', toYear: 1, label: { ru: 'Промотать до года 1', en: 'Skip ahead to year 1' } },
    {
      id: 'a1.projector', illus: 'kora-class', scene: 'ring', kind: 'transcript', year: 1,
      title: { ru: 'Класс спектрального разбора', en: 'Spectral analysis class' },
      text: {
        ru: `Одиннадцать учеников. Посреди разбора гаснет проектор.

— Вызовем техника, — говорит Кора Ландис.

Дан Осгер, младший, пятнадцать лет, уже снял крышку. Через четыре минуты свет возвращается; спектр на стене дрожит и выравнивается. Дан улыбается впервые за урок.

— Теперь смотри сюда. — Кора кладёт ладонь на красное крыло линии. — Что здесь не так?

Дан смотрит на линии. Потом — на отвёртку у себя в руке.

— Не знаю.

После урока Кора не выключает проектор. Она знает, что его нельзя удерживать силой. И думает, как удержать.`,
        en: `Eleven students. Halfway through the session the projector dies.

"We'll call a technician," says Kora Landis.

Dan Osger, the youngest, fifteen, already has the cover off. Four minutes later the light is back; the spectrum on the wall trembles and settles. For the first time this lesson, Dan smiles.

"Now look here." Kora lays her palm on the red wing of a line. "What's wrong with it?"

Dan looks at the lines. Then at the screwdriver in his hand.

"I don't know."

After the lesson Kora leaves the projector on. She knows he can't be held by force. She thinks about how to hold him.`
      }
    },
    { id: 's.y2', kind: 'skip', toYear: 2, label: { ru: 'Промотать до года 2', en: 'Skip ahead to year 2' } },
    {
      id: 'a1.queue', illus: 'ring-council', scene: 'ring', kind: 'transcript', year: 2,
      title: { ru: 'Первый совет смены', en: 'First watch council' },
      text: {
        ru: `Ива Лорн выводит на панель очередь пробуждений.

— Шестьдесят мест на вахте. Каждый год бодрствования — воздух, еда и чья-то жизнь.

— Дайте мне ещё год, — говорит Кора. — Я подготовлю интерпретатора, который прочтёт неоднозначный спектр без меня.

— Не меня, — говорит Дан. — Я иду к ремонтникам. Сам.

Феб Ирсон, старший инженер, не поднимает глаз от своего списка.

— Год Коры — это шесть мест в смене. На этих местах я допущу людей к монтажу под тягой. Без допуска любая работа снаружи — только в окна, когда двигатель молчит.

— Решает совет, — говорит Лорн.`,
        en: `Iva Lorn puts the wake queue up on the display.

"Sixty places on watch. Every waking year is air, food and someone's life."

"Give me one more year," says Kora. "I'll train an interpreter who can read an ambiguous spectrum without me."

"Not me," says Dan. "I'm going to the repair crew. My choice."

Feb Irson, the chief engineer, doesn't look up from his list.

"Kora's year is six places on the watch. With those places I qualify people to work outside under thrust. Without it, any outside job waits for a window when the engine is quiet."

"The council decides," says Lorn.`
      }
    },
    {
      id: 'd.queue', scene: 'ring', kind: 'decision', year: 2,
      title: { ru: 'Кому отдать места в первой вахте?', en: 'Who gets the places on the first watch?' },
      context: {
        ru: 'Решает совет смены. Годы бодрствования не возвращаются.',
        en: 'The watch council decides. Waking years do not come back.'
      },
      options: [
        {
          id: 'kora',
          label: { ru: 'Продлить вахту Коры на год', en: "Extend Kora's watch by a year" },
          known: {
            ru: ['Кора проживёт на борту на год больше, чем по графику.',
                 'Появится интерпретатор, который прочтёт неоднозначный спектр без неё.',
                 'Ремонтники не получат допуска к монтажу под тягой.'],
            en: ['Kora lives one more year aboard than scheduled.',
                 'An interpreter will be able to read an ambiguous spectrum without her.',
                 'The repair crew does not get qualified to work under thrust.']
          },
          effect: s => { s.koraYear = true; s.koraAwake = 3; },
          record: {
            ru: `Совет продлевает вахту Коры. Ирсон вычёркивает шесть строк из своего списка.

Кора берёт в ученицы Наю Сорн, семнадцатилетнюю, самую тихую в классе. Дан уходит в ремонтную смену и больше не приходит на разбор. Кора замечает это каждый день.`,
            en: `The council extends Kora's watch. Irson strikes six lines off his list.

Kora takes on Naya Sorn, seventeen, the quietest in the class. Dan joins the repair watch and stops coming to the sessions. Kora notices every day.`
          }
        },
        {
          id: 'repair',
          label: { ru: 'Отдать места ремонтной подготовке', en: 'Give the places to repair training' },
          known: {
            ru: ['Ремонтная смена получит допуск к монтажу под тягой.',
                 'Кора уйдёт в сон по графику; школа останется незавершённой.',
                 'Неоднозначный спектр до её пробуждения читать будет некому.'],
            en: ['The repair watch gets qualified to work under thrust.',
                 'Kora goes to sleep on schedule; her school stays unfinished.',
                 'Until she wakes, no one will be able to read an ambiguous spectrum.']
          },
          effect: s => { s.repairQual = true; },
          record: {
            ru: `Совет отдаёт места ремонтникам. Кора кивает и остаётся в классе до вечера — дописывает методичку, которую пока никто не сможет читать без неё.

Дан получает первый допуск к монтажу. Ирсон проверяет его дважды.`,
            en: `The council gives the places to the repair crew. Kora nods and stays in the classroom until evening, finishing a manual no one can yet read without her.

Dan gets his first qualification for outside work. Irson checks him twice.`
          }
        }
      ]
    },
    {
      id: 'a1.empty', scene: 'vault', overlay: 'sleepers', kind: 'archive', year: 2,
      place: { ru: 'Зал анабиоза', en: 'Anabiosis hall' },
      text: {
        ru: s => `${(n => n === 440 ? 'Четыреста сорок человек' : ppl(n).replace(/^./, c => c.toUpperCase()))(sleepersAt2(s))} ложатся в капсулы по группам — двадцать групп, у каждой своё охлаждение и своё резервное питание. На вахте остаются шестьдесят.` +
          (s.koraYear ? ` Кора остаётся: её группа уходит в сон без неё.` : ` Кора ложится одной из первых.`) + `

Корабль впервые пустеет. В кольцах слышно, как работает вентиляция.`,
        en: s => `${(n => n === 440 ? 'Four hundred and forty people' : `${n} people`)(sleepersAt2(s))} lie down in their capsules, group by group — twenty groups, each with its own cooling and backup power. Sixty remain on watch.` +
          (s.koraYear ? ` Kora stays: her group goes to sleep without her.` : ` Kora is among the first to lie down.`) + `

For the first time the ship is empty. In the rings you can hear the ventilation running.`
      }
    },
    { id: 's.y3', kind: 'skip', toYear: 3, label: { ru: 'Промотать до года 3', en: 'Skip ahead to year 3' } },
    {
      id: 'a1.seedlings', illus: 'agro-watch', scene: 'ring', kind: 'transcript', year: 3,
      title: { ru: 'Агрономическая смена', en: 'Agronomy watch' },
      text: {
        ru: `Тея Марр показывает совету поддоны с рассадой.

— Резервный агромодуль монтируем в окно без тяги на шестом году. К концу разгона — свежие овощи. Первый урожай — детям вахты.

На поддонах подписаны имена.`,
        en: `Teya Marr shows the council trays of seedlings.

"We mount the backup agro module in the no-thrust window in year six. By the end of acceleration — fresh vegetables. The first harvest goes to the watch's children."

The trays have names on them.`
      }
    },
    {
      // пакет наблюдений Кольца (совет «Новые сведения»): сведения — всегда записью; совет — если есть доступный поворот
      id: 'a1.newInfo', scene: 'ring', kind: 'bulletin', year: NEWS.at, when: s => !s.earlyNews && !!newsPlan(s),
      effect: s => { s.earlyNews = newsPlan(s); },
      title: { ru: 'Пакет наблюдений Кольца', en: "The Ring's observation packet" },
      text: { ru: s => newsText(s, 'ru'), en: s => newsText(s, 'en') }
    },
    {
      id: 'd.newInfo', scene: 'ring', kind: 'decision', year: NEWS.at, when: s => newsCandidates(s).length > 0,
      title: { ru: 'Новые сведения · совет о курсе', en: 'New information · course council' },
      context: {
        ru: s => `Пакет Кольца изменил то, что мы знаем. Курс можно сменить до отделения ступени — к звезде другой заявки; прежнее задание тогда снимается с программы. Наше задание сейчас — ${reqOf(s) ? taskLabel(reqOf(s), 'ru') : '—'}.`,
        en: s => `The Ring's packet has changed what we know. The course can change before stage separation — to the star of another request; the old task then comes off the programme. Our task now — ${reqOf(s) ? taskLabel(reqOf(s), 'en') : '—'}.`
      },
      options: s => newsCandidates(s).map(turnOption).concat([stayOption])
    },
    { id: 's.y4', kind: 'skip', toYear: 4, label: { ru: 'Промотать до года 4 · середина разгона', en: 'Skip ahead to year 4 · mid-acceleration' } },
    {
      id: 'a1.cloud', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: 4,
      when: s => M.episode(s) === 'cloud',
      title: { ru: 'Научная модель · навигационный прогноз', en: 'Science model · navigation forecast' },
      text: {
        ru: s => `Скорость ${fb(s.beta / 2, 'ru')}. На курсе — газово-пылевое облако класса D2, край пересекается через ${s.riskVersion >= 5 ? edgeMonths(s, 'ru') : '7 месяцев'}.
Обнаружено на подлёте: линии поглощения в спектрах звёзд за ним, счётчики щита выше фона. С Земли не наблюдалось — слишком мало и темно.
Проход без коррекции: безопасен. Уверенность 94% — при условии, что модель верна и набор гипотез полон.
Модель проверена для облаков D1–D3 плотностью до 40 частиц/см³.
Ресурс фронтального щита: ~150 лет дрейфа.` + (v1(s) ? `
Не установлено: наибольший размер частиц у края. За фронтальным щитом в этом секторе — жилые отсеки кольца: крупная частица, пробив щит, убьёт людей.` : ''),
        en: s => `Velocity ${fb(s.beta / 2, 'en')}. A class D2 gas-and-dust cloud on course; edge crossing in ${s.riskVersion >= 5 ? edgeMonths(s, 'en') : '7 months'}.
Detected on approach: absorption lines in the spectra of stars behind it, shield counters above background. Not observed from Earth — too small and too dark.
Passage without correction: safe. Confidence 94% — given the model is correct and the hypothesis set complete.
Model validated for D1–D3 clouds up to 40 particles/cm³.
Forward shield service life: ~150 years of drift.` + (v1(s) ? `
Not established: the largest particle size at the edge. Behind the forward shield in this sector are the ring's living quarters: a coarse particle that breaks through will kill people.` : '')
      }
    },
    {
      id: 'a1.recheck', scene: 'cloud', overlay: 'trajectory', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'cloud',
      title: { ru: 'Совет смены · облако на курсе', en: 'Watch council · cloud on course' },
      text: {
        ru: `— Протокол для класса D2 требует ручной проверки, — говорит Орин Дал. — Плотность нити у края у меня на шесть процентов выше, чем у модели. Спектр с такого расстояния не различает, мелкая там пыль или крупная. Мелкая — ничего. Крупная — полтора года ресурса щита.

— А манёвр? — спрашивает Дассер.

— Обход края. Три процента резерва — это одна плановая коррекция у цели. И манёвр сдвигает окна без тяги.

Тея Марр, стоящая у двери, понимает раньше остальных, что это значит для рассады.`,
        en: `"The protocol for class D2 requires a manual check," says Orin Dal. "My density for the filament at the edge is six percent above the model's. At this range the spectrum can't tell whether the dust is fine or coarse. Fine means nothing. Coarse means a year and a half of the shield's life."

"And the manoeuvre?" Dasser asks.

"We go around the edge. Three percent of reserve — one planned correction at the target. And the manoeuvre moves the no-thrust windows."

Teya Marr, standing by the door, understands before anyone else what that means for the seedlings.`
      }
    },
    {
      id: 'a1.test.kora', scene: 'cloud', overlay: 'trajectory', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'cloud' && s.koraYear && !v1(s),
      effect: s => { s.measured = true; },
      title: { ru: 'Проверка по затмению', en: 'Occultation check' },
      text: {
        ru: `— Есть способ проверить, — говорит Кора. — Через три недели край облака пройдёт перед фоновой звездой. Крупная пыль гасит её свет сильнее, чем мелкая.

Наблюдение ведёт Ная Сорн. Кора стоит за её спиной и ни разу не трогает приборы.

Через три недели звезда гаснет в 1,4 раза сильнее прогноза модели. Пыль крупная.`,
        en: `"There's a way to check," says Kora. "In three weeks the edge of the cloud passes in front of a background star. Coarse dust dims its light more than fine."

Naya Sorn runs the observation. Kora stands behind her and never once touches the instruments.

Three weeks later the star dims 1.4 times more than the model predicts. The dust is coarse.`
      }
    },
    {
      id: 'a1.test.none', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: 4,
      when: s => M.episode(s) === 'cloud' && !s.koraYear && !v1(s),
      title: { ru: 'Журнал вахты', en: 'Watch log' },
      text: {
        ru: `Запрос: проверка размера частиц у края облака.
Метод: затмение фоновой звезды — требует интерпретатора спектров.
Интерпретатор на вахте: нет. Ландис К. — в анабиозе, группа 7.`,
        en: `Request: particle-size check at the cloud edge.
Method: background-star occultation — requires a spectral interpreter.
Interpreter on watch: none. Landis K. — in anabiosis, group 7.`
      }
    },
    {
      id: 'a1.test.v1', scene: 'cloud', overlay: 'trajectory', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'cloud' && v1(s),
      title: { ru: 'Проверка по затмению', en: 'Occultation check' },
      text: {
        ru: s => `— Проверить можно, — говорит ${s.koraYear ? 'Кора' : 'Ная Сорн'}. — Край облака пройдёт перед фоновой звездой. Крупная пыль гасит её свет сильнее, чем мелкая.

${s.koraYear ? 'Кора на вахте ещё год: наблюдение и разбор — две недели.' : 'Коры на вахте нет; Ная справится одна, но медленнее — три недели.'} Детекторы придётся калибровать из материалов для высадки.

— Узкую полосу метод может пропустить, — добавляет ${s.koraYear ? 'Кора' : 'Ная'}. — Если звезда погаснет по модели, это не значит, что полосы нет. Это значит, что мы её не увидели.`,
        en: s => `"There's a way to check," says ${s.koraYear ? 'Kora' : 'Naya Sorn'}. "The cloud's edge will pass in front of a background star. Coarse dust dims its light more than fine."

${s.koraYear ? 'Kora is on watch for another year: observation and analysis take two weeks.' : 'Kora is not on watch; Naya can do it alone, but slower — three weeks.'} The detectors will have to be calibrated from the landing materials.

"The method can miss a narrow band," ${s.koraYear ? 'Kora' : 'Naya'} adds. "If the star dims as the model says, that doesn't mean there's no band. It means we didn't see it."`
      }
    },
    {
      id: 'd.cloudCheck', scene: 'cloud', overlay: 'trajectory', kind: 'decision', year: 4,
      when: s => M.episode(s) === 'cloud' && v1(s),
      title: { ru: 'Проверить край облака?', en: "Check the cloud's edge?" },
      context: { ru: s => s.riskVersion >= 5 ? `До края — ${edgeMonths(s, 'ru')}: время на проверку есть.` : 'До края — семь месяцев: время на проверку есть.',
        en: s => s.riskVersion >= 5 ? `${edgeMonths(s, 'en')} to the edge: there is time for a check.` : 'Seven months to the edge: there is time for a check.' },
      rec: s => ({ id: 'measure', why: { ru: 'проверка дешевле ошибки', en: 'a check costs less than a mistake' } }),
      options: s => [{
        id: 'measure',
        label: { ru: 'Наблюдать затмение', en: 'Observe the occultation' },
        known: {
          ru: s => [`Материалы для высадки −${CLOUD.check}%: калибровка детекторов.`, `${s.koraYear ? 'Две недели работы Коры и Наи.' : 'Три недели работы Наи.'}`, 'Метод видит полосу крупной пыли в девяти случаях из десяти: «не обнаружено» — не «безопасно».'],
          en: s => [`Landing materials −${CLOUD.check}%: detector calibration.`, `${s.koraYear ? 'Two weeks of work for Kora and Naya.' : 'Three weeks of work for Naya.'}`, 'The method sees a band of coarse dust nine times in ten: "not detected" does not mean "safe".']
        },
        cost: st => { st.materials -= CLOUD.check; },
        effect: st => { st.materials -= CLOUD.check; st.cloudCheck = 'measured';
          st.cloudFound = cloudBand(st) && (hidden(st, 'contact.cloud.check') ?? 1) < CLOUD.sense; st.measured = st.cloudFound; },
        record: {
          ru: s => s.cloudFound ? 'Звезда гаснет в 1,4 раза сильнее прогноза модели. В крае — полоса крупной пыли.' : 'Звезда гаснет так, как предсказывает модель. Признак крупной пыли не обнаружен.',
          en: s => s.cloudFound ? 'The star dims 1.4 times more than the model predicts. There is a band of coarse dust in the edge.' : 'The star dims as the model predicts. No sign of coarse dust detected.'
        }
      }, {
        id: 'skip',
        label: { ru: 'Не проверять', en: 'Skip the check' },
        known: {
          ru: ['Материалы и время целы.', 'Решать у края придётся по модели: 94% — при условии, что модель верна.'],
          en: ['The materials and the time are kept.', 'The decision at the edge will rest on the model: 94% — given the model is correct.']
        },
        effect: st => { st.cloudCheck = 'skipped'; },
        record: { ru: 'Совет решает не тратить материалы на проверку.', en: 'The council decides not to spend materials on a check.' }
      }].filter(o => o.id !== 'measure' || s.materials >= CLOUD.check)
    },
    {
      id: 'd.cloud', scene: 'cloud', overlay: 'trajectory', kind: 'decision', year: 4,
      when: s => M.episode(s) === 'cloud',
      title: { ru: 'Облако на курсе', en: 'Cloud on course' },
      context: {
        ru: 'Через семь месяцев корабль будет у края. Решение не отменить.',
        en: 'In seven months the ship will be at the edge. The decision cannot be undone.'
      },
      rec: s => !v1(s) ? null : s.cloudFound ? { id: 'manoeuvre', why: { ru: 'проверка нашла полосу крупной пыли', en: 'the check found a band of coarse dust' } }
        : { id: 'trust', why: s.cloudCheck === 'measured' ? { ru: 'проверка не нашла крупной пыли', en: 'the check found no coarse dust' } : { ru: 'модель даёт 94%', en: 'the model gives 94%' },
          assume: { ru: 'полосы крупной пыли в крае нет', en: 'there is no band of coarse dust in the edge' } },
      options: [
        {
          id: 'manoeuvre',
          label: { ru: 'Манёвр в обход края', en: 'Manoeuvre around the edge' },
          known: {
            ru: s => [`Резерв манёвров: −${f1(3.2 * 0.01 / s.reserveDv, 'ru')}% паспортного — одна плановая коррекция у цели.`,
              s.repairQual ? 'Ремонтники с допуском смонтируют агромодуль под тягой — урожай не сдвинется.'
                           : 'Монтаж агромодуля уходит на два года: рассада Теи не дождётся модуля.',
              s.measured ? 'Край, по измерению, опасен: манёвр обходит известный риск.' : 'Была ли опасность, скорее всего, так и не узнаем.'],
            en: s => [`Manoeuvre reserve: −${f1(3.2 * 0.01 / s.reserveDv, 'en')}% of rated — one planned correction at the target.`,
              s.repairQual ? 'The qualified repair crew mounts the agro module under thrust — the harvest keeps its date.'
                           : "Agro module assembly slips two years: Teya's seedlings won't live to see it.",
              s.measured ? 'The edge is measured dangerous: the manoeuvre avoids a known risk.' : 'Whether there was any danger, we will most likely never know.']
          },
          effect: s => { s.reserve -= 3.2 * 0.01 / s.reserveDv; s.agroAtRisk = true; s.agroDelay = s.repairQual || s.kits.includes('agro') ? 0 : 2; },
          record: {
            ru: 'Совет голосует за манёвр.',
            en: 'The council votes for the manoeuvre.'
          }
        },
        {
          id: 'trust',
          label: { ru: 'Идти без коррекции', en: 'Go straight through' },
          known: {
            ru: s => v1(s) ? ['Резерв манёвров сохраняется полностью.',
              s.cloudFound ? 'В крае — полоса крупной пыли: обычный щит её не держит; за сектором — жилые отсеки.'
                : s.cloudCheck === 'measured' ? 'Признак крупной пыли не обнаружен; метод пропускает примерно одну полосу из десяти.'
                : 'Крупна ли пыль у края — не измерено. Если там полоса крупных частиц, обычный щит пробьёт; за сектором — жилые отсеки.',
              eqOf(s).shield === 'dust40' ? 'Щит удвоенный: на такую полосу рассчитан — сквозного пробоя не ожидается, наружный слой пострадает.'
                : eqOf(s).shield === 'sectors' ? 'Сектора сменные: пробитый заменят, если есть ремонтники с допуском; погибших это не вернёт.'
                : 'Окна без тяги остаются на месте: монтаж агромодуля — по графику.'] : ['Резерв манёвров сохраняется полностью.',
              s.measured ? 'Пыль крупная: щит потеряет около полутора лет ресурса из ста пятидесяти.'
                         : 'Если пыль крупная, щит потеряет около полутора лет ресурса из ста пятидесяти.',
              eqOf(s).shield === 'dust40' ? 'Щит удвоенный: полтора года износа — в пределах запаса, пробоя не будет.' : eqOf(s).shield === 'sectors' ? 'Сектора сменные: пробитый заменят, если есть ремонтники с допуском.' : 'Окна без тяги не сдвигаются: агромодуль — по графику.'],
            en: s => v1(s) ? ['The manoeuvre reserve stays whole.',
              s.cloudFound ? 'There is a band of coarse dust in the edge: an ordinary shield will not hold it; the living quarters are behind the sector.'
                : s.cloudCheck === 'measured' ? 'No sign of coarse dust detected; the method misses about one band in ten.'
                : 'Whether the dust at the edge is coarse has not been measured. If there is a band of coarse particles, an ordinary shield will be breached; the living quarters are behind the sector.',
              eqOf(s).shield === 'dust40' ? 'The shield is doubled: it is rated for such a band — no breach through is expected, the outer layer will suffer.'
                : eqOf(s).shield === 'sectors' ? 'The sectors are replaceable: a breached one will be swapped if there are qualified repair hands; that will not bring back the dead.'
                : 'The no-thrust windows stay put: the agro module keeps its schedule.'] : ['The manoeuvre reserve stays whole.',
              s.measured ? 'The dust is coarse: the shield loses about a year and a half of its hundred and fifty.'
                         : 'If the dust is coarse, the shield loses about a year and a half of its hundred and fifty.',
              eqOf(s).shield === 'dust40' ? 'The shield is doubled: a year and a half of wear is within its margin — no breach.' : eqOf(s).shield === 'sectors' ? 'The sectors are replaceable: a breached one will be swapped if there are qualified repair hands.' : 'The no-thrust windows stay put: the agro module keeps its schedule.']
          },
          effect: s => { if (!v1(s)) s.shieldWear += 1.5; },             // версия 1: исход — у края (a1.edge.t1)
          record: {
            ru: 'Совет голосует идти без коррекции. Орин просит внести в протокол своё несогласие — как данные.',
            en: 'The council votes to go straight through. Orin asks for his dissent to be entered in the minutes — as data.'
          }
        }
      ]
    },
    // ветка Лакайль 9352: зонд вперёд — материалы
    {
      id: 'a1r.measure', scene: 'ring', kind: 'instrument', year: 4, when: s => rescueS(s) && M.episode(s) === 'probe',
      title: { ru: 'Среда впереди', en: 'The medium ahead' },
      text: {
        ru: `Зонду, если его выпустят, задают две работы: снять спектры системы и измерить среду впереди участка торможения. Кора вносит в программу плотность и ионизацию.

— Магниту мало знать расстояние до звезды. Нужно знать, обо что мы будем тормозить. Карта поможет, но не сделает невидимый участок известным.`,
        en: `The probe, if it is launched, gets two jobs: take spectra of the system and measure the medium ahead of the braking leg. Kora adds density and ionisation to its programme.

"The magnet needs more than the distance to the star. We need to know what we will brake against. A map will help; it cannot make an unseen stretch known."`
      }
    },
    {
      id: 'a1.scout', scene: 'ring', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'probe' && !rescueS(s),
      title: { ru: 'Зонд вперёд', en: 'A probe ahead' },
      text: {
        ru: s => (hasScouts(s) ? `Феб Ирсон открывает на столе паспорт груза: два зонда-разведчика в трюме, заправленные и собранные.` : `Феб Ирсон кладёт на стол чертёж: сбрасываемый бак ступени, малый термоядерный двигатель из запасных частей, спектрометр.`) + `

— Мы идём к ${nmD(s)} и всё равно придём через ${yrs(s.arrive - 4)}. Зонд не тормозит: он пройдёт систему насквозь за сутки и пришлёт спектры планет лет за сорок до нас.

— Сорок лет знать, куда садиться, — говорит Тея Марр. — Или сорок лет гадать.

` + (hasScouts(s) ? `— Зонд взяли для этого, — говорит Ирсон. — Вопрос только, когда пускать.` : `— Цена — материалы для высадки, — говорит Ирсон. — Каждый килограмм зонда — из запаса на посадочные модули.`),
        en: s => (hasScouts(s) ? `Feb Irson opens the cargo passport on the table: two scout probes in the hold, fuelled and assembled.` : `Feb Irson lays a drawing on the table: a drop tank from the stage, a small fusion motor from spares, a spectrometer.`) + `

"We're going to ${nm(s, 'en')} and we'll still arrive in ${yrsEn(s.arrive - 4)}. A probe doesn't brake: it crosses the system in a day and sends planetary spectra some forty years ahead of us."

"Forty years of knowing where to land," says Teya Marr. "Or forty years of guessing."

` + (hasScouts(s) ? `"That's what we brought it for," says Irson. "The only question is when to launch."` : `"The price is landing materials," says Irson. "Every kilogram of probe comes out of the stock for the landers."`)
      }
    },
    {
      id: 'a1.scout.kora', scene: 'ring', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'probe' && s.koraYear && !rescueS(s),
      title: { ru: 'Программа спектрометра', en: 'Spectrometer programme' },
      text: {
        ru: `Кора садится с Наей Сорн над программой спектрометра.

— Зонд будет смотреть на каждую планету меньше часа. Всё искать он не успеет. Выбираем: кислород, вода, метан — и тепловой спектр ночной стороны. Если хоть одна планета держит атмосферу, мы это увидим.

Ная переписывает список линий от руки, чтобы запомнить.`,
        en: `Kora sits down with Naya Sorn over the spectrometer programme.

"The probe gets less than an hour on each planet. It can't look for everything. We choose: oxygen, water, methane — and the thermal spectrum of the night side. If even one planet holds an atmosphere, we'll see it."

Naya copies the list of lines out by hand, to remember it.`
      }
    },
    {
      id: 'a1.scout.none', scene: 'ring', kind: 'instrument', year: 4,
      when: s => M.episode(s) === 'probe' && !s.koraYear && !rescueS(s),
      title: { ru: 'Журнал вахты', en: 'Watch log' },
      text: {
        ru: `Запрос: программа спектрометра зонда для атмосфер планет.
Специалист глубокого спектрального анализа — в капсуле, группа 7.
Программа по умолчанию: общий обзор, без приоритета линий.`,
        en: `Request: probe spectrometer programme for planetary atmospheres.
Deep spectral analysis specialist — in a capsule, group 7.
Default programme: general survey, no line priority.`
      }
    },
    {
      id: 'd.scout', scene: 'ring', kind: 'decision', year: 4,
      when: s => M.episode(s) === 'probe',
      title: { ru: 'Зонд вперёд', en: 'A probe ahead' },
      context: {
        ru: 'Зонд строится из запаса материалов для высадки. Пока ступень работает, в её баках есть топливо, но собирать зонд под тягой можно только с допуском.',
        en: 'The probe is built from the landing-materials stock. While the stage is firing its tanks still hold propellant, but assembling a probe under thrust needs qualification.'
      },
      options: [
        {
          id: 'launch',
          label: { ru: 'Строить и запустить зонд', en: 'Build and launch the probe' },
          known: {
            ru: s => [hasScouts(s) ? 'Зонд из комплекта: материалы для высадки целы.' : 'Материалы для высадки: −10% запаса.',
              hasScouts(s) ? (s.repairQual ? 'Допуск есть: выпуск под тягой на шестом году; топливо своё.' : 'Допуска нет: выпуск в окне в конце разгона; топливо своё.')
                : s.repairQual ? 'Допуск есть: сборка под тягой, зонд заправят из баков ступени. Запуск на шестом году.'
                : `Допуска нет: сборка в окне в конце разгона, когда баки ступени уже пусты. Топливо зонда — из резерва манёвров, −${f1(dvPct(s, DV.probe), 'ru')}%.`,
              'Спектры планет придут примерно за сорок лет до прибытия.',
              s.koraYear ? 'Программа спектрометра — Коры: кислород, вода, метан.' : 'Программа спектрометра — общая, без приоритета линий.'].concat(rescueS(s) ? ['Данные среды помогут проверить торможение; ни состояние склада, ни будущую площадку они не предскажут.'] : []),
            en: s => [hasScouts(s) ? 'Probe from the cargo kit: landing materials intact.' : 'Landing materials: −10% of stock.',
              hasScouts(s) ? (s.repairQual ? 'Qualified: release under thrust in year six; own fuel.' : 'Not qualified: release in the window at the end of acceleration; own fuel.')
                : s.repairQual ? 'Qualified: assembly under thrust, fuelled from the stage tanks. Launch in year six.'
                : `Not qualified: assembly in the window at the end of acceleration, when the stage tanks are already empty. Probe fuel from the manoeuvre reserve, −${f1(dvPct(s, DV.probe), 'en')}%.`,
              'Planetary spectra arrive about forty years before we do.',
              s.koraYear ? "Spectrometer programme by Kora: oxygen, water, methane." : 'Spectrometer programme: general, no line priority.'].concat(rescueS(s) ? ['Medium data will help check the braking; they predict neither the state of the store nor the future site.'] : [])
          },
          effect: s => { const kit = hasScouts(s); if (!kit) s.materials -= 10; s.scout = s.repairQual ? 6 : 8; if (!s.repairQual && !kit) s.reserve -= dvPct(s, DV.probe); s.scoutTuned = s.koraYear; },
          record: {
            ru: s => `Совет отдаёт материалы. ${s.repairQual ? 'Дан и ещё пятеро собирают зонд у кормы под тягой, на магнитных подошвах.' : 'Сборку откладывают до окна в конце разгона: без допуска снаружи под тягой не работают.'}

На корпусе зонда кто-то пишет мелом: «Посмотри за нас».`,
            en: s => `The council gives up the materials. ${s.repairQual ? 'Dan and five others assemble the probe at the stern under thrust, on magnetic soles.' : 'Assembly waits for the window at the end of acceleration: without qualification no one works outside under thrust.'}

Someone chalks on the probe's hull: "Look for us."`
          }
        },
        {
          id: 'keep',
          label: { ru: s => hasScouts(s) ? 'Не выпускать зонд' : 'Сберечь материалы', en: s => hasScouts(s) ? 'Keep the probe aboard' : 'Keep the materials' },
          known: {
            ru: ['Материалы для высадки целы.', 'О планетах узнаем, только подойдя к системе, — за несколько лет до прибытия.', 'Зонд можно построить и в дрейфе, но из пустых баков и на резерве манёвров.'],
            en: ['Landing materials intact.', 'We learn about the planets only on approach — a few years before arrival.', 'A probe can still be built in the drift, but from empty tanks and on the manoeuvre reserve.']
          },
          record: {
            ru: `Чертёж уходит в архив. Ирсон ставит пометку: «Вернуться к расчёту в дрейфе».

Тея Марр откладывает список семян для открытого грунта: примерять его пока не к чему.`,
            en: `The drawing goes to the archive. Irson adds a note: "Return to the calculation in the drift."

Teya Marr puts away her list of seeds for open ground: there is nothing to measure it against yet.`
          }
        }
      ]
    },

    // ветка δ Павлина: долгая дорога — годы людей
    {
      id: 'a1.long', scene: 'vault', overlay: 'sleepers', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'long',
      title: { ru: 'Долгая дорога', en: 'The long road' },
      text: {
        ru: s => `Врач выводит на панель расчёт, который прежде делали только для ближних целей.

— ${yrs(s.arrive)}. На вахте сорок восемь человек — значит, каждый проживёт в пути ${yrs(M.awake(s.arrive, 48, crewOf(s)))}, а не тринадцать, как на ближней дороге. Мы придём к ${nmD(s)} на ${yrs(M.awake(s.arrive, 48, crewOf(s)) - 13)} старше.

Ива Лорн смотрит на ряды огней в зале анабиоза.

— А если мы хотим тринадцать?

— Тогда на вахте ${ppl(thinWatch(s.arrive))}. Коридоры колец неделями будут пустыми.

— Тридцать — это каждая авария на тех, кто окажется рядом, — говорит Ирсон.`,
        en: s => `The physician puts up a calculation that until now was only run for near targets.

"${yrsEn(s.arrive)}. Forty-eight people on watch means each of us lives ${yrsEn(M.awake(s.arrive, 48, crewOf(s)))} on the road, not thirteen as on the short route. We arrive at ${nm(s, 'en')} ${yrsEn(M.awake(s.arrive, 48, crewOf(s)) - 13)} older."

Iva Lorn looks at the rows of lights in the anabiosis hall.

"And if we want thirteen?"

"Then ${thinWatch(s.arrive)} on watch. The ring corridors will stand empty for weeks."

"Thirty means every accident falls on whoever happens to be near," says Irson.`
      }
    },
    {
      id: 'a1.long.kora', scene: 'vault', overlay: 'sleepers', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'long' && s.koraYear,
      title: { ru: 'Интерпретатор', en: 'The interpreter' },
      text: {
        ru: `— Меня можно не будить до цели, — говорит Кора. — Ная прочтёт неоднозначный спектр. Не так, как я. Но прочтёт.

Ная Сорн не спорит. Она уже держит вахту обсерватории одна.`,
        en: `"You needn't wake me before the target," says Kora. "Naya can read an ambiguous spectrum. Not the way I do. But she can read it."

Naya Sorn doesn't argue. She already keeps the observatory watch alone.`
      }
    },
    {
      id: 'a1.long.none', scene: 'vault', overlay: 'sleepers', kind: 'instrument', year: 4,
      when: s => M.episode(s) === 'long' && !s.koraYear,
      title: { ru: 'Журнал вахты', en: 'Watch log' },
      text: {
        ru: `Запрос: интерпретатор спектров для тонкой вахты.
Единственный специалист — Кора Ландис, группа 7.
Каждое её пробуждение — годы из её лимита циклов.`,
        en: `Request: spectral interpreter for a thin watch.
Only specialist — Kora Landis, group 7.
Every waking costs years from her cycle limit.`
      }
    },
    {
      id: 'd.long', scene: 'vault', overlay: 'sleepers', kind: 'decision', year: 4,
      when: s => M.episode(s) === 'long',
      title: { ru: 'Размер вахты', en: 'Size of the watch' },
      context: {
        ru: 'Решение действует до прибытия. Следующие смены смогут его пересмотреть, но прожитые годы не вернуть.',
        en: 'The decision holds until arrival. Later watches can revise it, but years already lived do not come back.'
      },
      options: [
        {
          id: 'thin',
          label: { ru: s => `Тонкая вахта — ${ppl(thinWatch(s.arrive))}`, en: s => `A thin watch — ${thinWatch(s.arrive)} people` },
          known: {
            ru: s => [`Каждый проживёт в пути около ${yrsG(M.awake(s.arrive, thinWatch(s.arrive), crewOf(s)))} — как на ближней дороге.`,
              'Меньше рук: ремонт медленнее, ошибки дороже.',
              s.repairQual ? 'Допуск к монтажу под тягой есть: агромодуль монтируют в срок.' : 'Без допуска к монтажу под тягой агромодуль ждёт окна: два года задержки.',
              s.koraYear ? 'Интерпретатор спектров на вахте есть — Ная Сорн.' : 'Интерпретатор спектров — только Кора, и каждое её пробуждение идёт из её лимита.'],
            en: s => [`Each of us lives about ${yrsEn(M.awake(s.arrive, thinWatch(s.arrive), crewOf(s)))} on the road — as on the short route.`,
              'Fewer hands: repairs slower, mistakes costlier.',
              s.repairQual ? 'Qualified for work under thrust: the agro module goes in on schedule.' : 'Not qualified for work under thrust: the agro module waits for a window, two years late.',
              s.koraYear ? 'There is a spectral interpreter on watch — Naya Sorn.' : 'The only spectral interpreter is Kora, and every waking comes out of her limit.']
          },
          effect: s => { s.watch = thinWatch(s.arrive); s.agroAtRisk = true; s.agroDelay = s.repairQual || s.kits.includes('agro') ? 0 : 2; },
          record: {
            ru: s => `Совет утверждает ${ppl(s.watch)}. Лорн переписывает очередь: у каждого теперь больше снов и меньше соседей по вахте.`,
            en: s => `The council approves ${s.watch}. Lorn rewrites the queue: everyone now has more sleep and fewer watchmates.`
          }
        },
        {
          id: 'full',
          label: { ru: 'Полная вахта — сорок восемь', en: 'A full watch — forty-eight' },
          known: {
            ru: s => ['Рук хватает на всё: ремонт и агромодуль — в срок.', `Каждый проживёт в пути около ${yrsG(M.awake(s.arrive, 48, crewOf(s)))}: экипаж придёт на ${yrs(M.awake(s.arrive, 48, crewOf(s)) - 13)} старше.`, 'У старших лимит циклов кончится до цели: последние десятилетия они проспят без пробуждений.'],
            en: s => ['Enough hands for everything: repairs and the agro module on schedule.', `Each of us lives about ${yrsEn(M.awake(s.arrive, 48, crewOf(s)))} on the road: the crew arrives ${yrsEn(M.awake(s.arrive, 48, crewOf(s)) - 13)} older.`, 'The eldest will run out of cycles before the target and sleep through the last decades without waking.']
          },
          effect: s => { s.watch = 48; s.ageShift = Math.round(M.awake(s.arrive, 48, crewOf(s)) - 13); },
          record: {
            ru: `Совет оставляет сорок восемь. Врач заводит в медицинском журнале новую графу: «возраст к прибытию».

Лорн вписывает туда первой себя.`,
            en: `The council keeps forty-eight. The physician adds a new column to the medical log: "age at arrival".

Lorn enters herself first.`
          }
        }
      ]
    },

    // вне сектора: петиция о повороте — последний шанс, дорого

    // общее последствие: монтаж агромодуля (облако или тонкая вахта)
    {
      id: 'a1.agro.lost', scene: 'ring', kind: 'transcript', year: 4,
      when: s => s.agroDelay > 0,
      title: { ru: 'Агрономическая смена', en: 'Agronomy watch' },
      text: {
        ru: `— Два года, — повторяет Тея Марр. — Значит, первая смена дрейфа будет есть сушёное и консервированное.

— Будет, — говорит Дассер.

— Переживём. — Она помолчала. — Запишите, что это вы нам сказали, а не график.

Он записывает. Поддоны с именами переезжают на склад.`,
        en: `"Two years," Teya Marr repeats. "So the first drift watch eats dried and preserved food."

"It does," says Dasser.

"We'll live." She paused. "Put it on record that you told us — not the schedule."

He puts it on record. The trays with names go to storage.`
      }
    },
    {
      id: 'a1.agro.kept', scene: 'ring', kind: 'transcript', year: 4,
      when: s => s.agroAtRisk && s.agroDelay === 0,
      title: { ru: 'Монтаж под тягой', en: 'Assembly under thrust' },
      text: {
        ru: `Дан и ещё пятеро выходят монтировать агромодуль под тягой — на магнитных подошвах, с двойной страховкой. Ирсон следит за каждым креплением с поста.

Тея принимает работу молча. Вечером поддоны с именами переезжают в новый модуль.`,
        en: `Dan and five others go out to mount the agro module under thrust — magnetic soles, double tethers. Irson watches every fastening from his post.

Teya accepts the work without a word. That evening the trays with names move into the new module.`
      }
    },
    { id: 's.edge', kind: 'skip', when: s => M.episode(s) === 'cloud', toYear: edgeAt, label: { ru: 'Промотать до края облака', en: "Skip ahead to the cloud's edge" } },
    {
      id: 'a1.edge.m', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: edgeAt,
      when: s => s.choices['d.cloud'] === 'manoeuvre',
      title: { ru: 'Навигационный журнал', en: 'Navigation log' },
      text: {
        ru: s => `Коррекция выполнена. Край облака пройден в стороне.
Резерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.` + (s.measured ? '' : v1(s) ? `
Был ли в крае опасный слой — так и не узнаем.` : `
Спектрограф при боковом обзоре: край плотнее прогноза модели; насколько — по таким данным не определить.`),
        en: s => `Correction complete. The cloud's edge passed at a distance.
Manoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.` + (s.measured ? '' : v1(s) ? `
Whether there was a dangerous layer in the edge we will never know.` : `
Side-view spectrograph: the edge is denser than the model forecast; by how much cannot be determined from this data.`)
      }
    },
    {
      id: 'a1.edge.t', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: edgeAt,
      when: s => s.choices['d.cloud'] === 'trust' && !v1(s),
      title: { ru: 'Журнал фронтального щита', en: 'Forward shield log' },
      text: {
        ru: `Проход края облака: три недели.
Удары пыли: в 1,4 раза выше прогноза модели.
Износ щита за проход — как за полтора года дрейфа. В пределах допуска.
Резерв манёвров: 100,0% паспортного.`,
        en: `Passage through the cloud's edge: three weeks.
Dust impacts: 1.4 times the model forecast.
Shield wear during passage equals a year and a half of drift. Within tolerance.
Manoeuvre reserve: 100.0% of rated.`
      }
    },
    {
      id: 'a1.edge.t1', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: edgeAt,
      when: s => s.choices['d.cloud'] === 'trust' && v1(s),
      effect: s => { if (s.riskVersion >= 5 || !cloudBand(s)) return;          // v5: проход и удар считает модель щита
        s.shieldWear += 1.5; s.materials -= CLOUD.patch;
        if (eqOf(s).shield !== 'dust40') { s.shieldBreach = true; s.dead += CLOUD.dead; s.cloudDead = CLOUD.dead;
          incident(s, 'cloud', CLOUD.dead, { check: s.cloudCheck, found: s.cloudFound, year: 4.6 }); } },
      title: { ru: 'Журнал фронтального щита', en: 'Forward shield log' },
      text: {
        ru: s => s.riskVersion >= 5 ? edgeLogV5(s, 'ru') : !s.shieldWear ? `Проход края облака: три недели.
Удары пыли — в пределах прогноза модели. Износ щита — в норме.
Резерв манёвров: 100,0% паспортного.`
          : !s.shieldBreach ? `Проход края облака: три недели. На второй неделе — полоса крупной пыли: удары в сорок раз выше прогноза.
Удвоенный щит держит: наружный слой выбит на участке в двенадцать метров, сквозного пробоя нет.
Заплата — из материалов для высадки, −${CLOUD.patch}%.`
          : `Проход края облака: три недели. На второй неделе — полоса крупной пыли.
Частица массой в несколько миллиграммов пробивает сектор фронтального щита; за ним — жилой отсек кольца. Разгерметизация.
Погибли ${ppl(s.cloudDead)} смены. Отсек перекрыт; заплата — из материалов для высадки, −${CLOUD.patch}%.`,
        en: s => s.riskVersion >= 5 ? edgeLogV5(s, 'en') : !s.shieldWear ? `Passage through the cloud's edge: three weeks.
Dust impacts within the model forecast. Shield wear normal.
Manoeuvre reserve: 100.0% of rated.`
          : !s.shieldBreach ? `Passage through the cloud's edge: three weeks. In the second week, a band of coarse dust: impacts forty times the forecast.
The doubled shield holds: the outer layer is knocked out over twelve metres, no breach through.
Patch from the landing materials, −${CLOUD.patch}%.`
          : `Passage through the cloud's edge: three weeks. In the second week, a band of coarse dust.
A particle of a few milligrams breaks through a sector of the forward shield; behind it, a living compartment of the ring. Decompression.
${s.cloudDead} of the shift are dead. The compartment is sealed; patch from the landing materials, −${CLOUD.patch}%.`
      }
    },
    {
      id: 'a1.orin.t1', scene: 'cloud', overlay: 'trajectory', kind: 'note', year: edgeAt,
      when: s => s.choices['d.cloud'] === 'trust' && v1(s),
      author: { ru: 'Орин Дал', en: 'Orin Dal' },
      text: {
        ru: s => !bandHit(s) ? (s.cloudCheck === 'measured' ? 'Проверка и модель сошлись: край чистый. Записываю расчёт и результат рядом.' : 'Модель была права: край чистый. Проверку мы не делали — значит, нам повезло, а не мы угадали. Записываю и это.')
          : !bandBreach(s) ? 'Полоса была. Удвоенный щит её выдержал — за него на Земле спорили дольше, чем за любой другой узел. Записываю расчёт, проверку и результат рядом.'
          : (s.cloudFound ? 'Проверка нашла полосу — и совет всё равно пошёл через край.' : s.cloudCheck === 'measured' ? 'Проверка не увидела полосу: одну из десяти метод пропускает — и это была она.' : 'Мы не проверяли край.') + ` ${s.cloudDead === 8 ? 'Восемь человек' : ppl(s.cloudDead)}. Записываю в протокол наблюдение, допущение и решение — рядом с их именами. Своё несогласие я внёс как данные; этого оказалось мало.`,
        en: s => !bandHit(s) ? (s.cloudCheck === 'measured' ? 'The check and the model agreed: the edge was clean. I am writing the calculation and the result side by side.' : 'The model was right: the edge was clean. We did not check — so we were lucky, not right. I am writing that down too.')
          : !bandBreach(s) ? 'There was a band. The doubled shield held it — on Earth they argued over it longer than over any other part. I am writing the calculation, the check and the result side by side.'
          : (s.cloudFound ? 'The check found the band — and the council went through the edge anyway.' : s.cloudCheck === 'measured' ? 'The check did not see the band: the method misses one in ten — and this was the one.' : 'We did not check the edge.') + ` ${s.cloudDead} people. I am entering the observation, the assumption and the decision in the minutes — next to their names. I entered my dissent as data; it was not enough.`
      }
    },
    {
      id: 'a1.orin.t', scene: 'cloud', overlay: 'trajectory', kind: 'note', year: edgeAt,
      when: s => s.choices['d.cloud'] === 'trust' && !s.measured && !v1(s),
      author: { ru: 'Орин Дал', en: 'Orin Dal' },
      text: {
        ru: `Модель ошиблась на краю — на шесть процентов, как я и считал. Щит заплатил полтора года. Резерв цел.

Записываю рядом расчёт и результат. Пусть следующий, кто будет решать такое, видит оба.`,
        en: `The model was wrong at the edge — by six percent, as I'd calculated. The shield paid a year and a half. The reserve is intact.

I'm writing the calculation and the result side by side. Let the next person who has to decide something like this see both.`
      }
    },
    { id: 's.y6', kind: 'skip', toYear: 6, label: { ru: 'Промотать до года 6', en: 'Skip ahead to year 6' } },
    {
      id: 'a1.ring', scene: 'ring', kind: 'bulletin', year: 6,
      title: { ru: 'Сводка Кольца · отправлена с Земли около трёх месяцев назад', en: 'Ring bulletin · sent from Earth about three months ago' },
      text: {
        ru: s => `Совет Звездоплавания подтверждает благополучный старт сорок первой экспедиции к ${nmD(s)}.

Рассматривается снаряжение лёгкого корабля поддержки вслед экспедиции: ³He, теплообменники, материалы для высадки.

Форпост Ксилона Ир: передатчик теряет мощность. Специалист дальней связи будет отправлен через два года.`,
        en: s => `The Council of Star Navigation confirms the Forty-First Expedition's safe departure for ${nm(s, 'en')}.

A light support ship to follow the expedition is under consideration: ³He, heat exchangers, landing materials.

Xylona Ir outpost: the transmitter is losing power. A deep-relay specialist will be sent in two years.`
      }
    },
    {
      id: 'a1.scout.early', scene: 'scout', kind: 'instrument', year: 6,
      when: s => s.scout === 6,
      title: { ru: 'Инженерный журнал · зонд', en: 'Engineering log · probe' },
      text: {
        ru: s => `Зонд отделён от кормы. ${hasScouts(s) ? 'Топливо — своё, из комплекта.' : 'Топливо — из баков ступени разгона.'}
Собственная тяга: 14 месяцев. Расчётная скорость: ${fb(probeTimes(s, 6).vp, 'ru')}.
Пролёт ${nm(s, 'ru')}: около года ${probeTimes(s, 6).flyby}. Спектры на борту: около года ${probeTimes(s, 6).data}.
Программа спектрометра: ${s.scoutTuned ? 'Коры Ландис — кислород, вода, метан, ночная сторона' : 'общий обзор'}.`,
        en: s => `Probe separated from the stern. ${hasScouts(s) ? 'Own fuel, from the kit.' : 'Fuel from the acceleration-stage tanks.'}
Own thrust: 14 months. Design velocity: ${fb(probeTimes(s, 6).vp, 'en')}.
${nm(s, 'en')} flyby: around year ${probeTimes(s, 6).flyby}. Spectra on board: around year ${probeTimes(s, 6).data}.
Spectrometer programme: ${s.scoutTuned ? "Kora Landis's — oxygen, water, methane, night side" : 'general survey'}.`
      }
    },
    { id: 's.y8', kind: 'skip', toYear: 8, label: { ru: 'Промотать до года 8 · конец разгона', en: 'Skip ahead to year 8 · end of acceleration' } },
    {
      id: 'a1.stage', scene: 'stage', kind: 'instrument', year: 8,
      effect: s => { s.reserve -= stageOff(s).reservePct; },
      title: { ru: 'Инженерный журнал', en: 'Engineering log' },
      text: {
        ru: s => `Тяга ступени разгона снята. Скорость ${fb(s.beta, 'ru')}.
Ступень разгона отделена. Последние ${stageOff(s).days} ${plural(stageOff(s).days, ['сутки', 'суток', 'суток'])} тяга шла под углом 10°: ступень уходит вбок, ${kms(stageOff(s).dv)} км/с. Ядро погасило свою боковую скорость — резерв манёвров −${pct(stageOff(s).reservePct, 'ru')}%.
Ступень пройдёт ${nm(s, 'ru')} в тысяче а.е. в стороне около года ${Math.round(M.ACC + stageYears(s))}, за ${yrs(s.arrive - M.ACC - stageYears(s))} до нас, и уйдёт дальше. По прямой она догнала бы ядро в первые сутки торможения и вошла бы в систему цели на ${fb(s.beta, 'ru')}: ${String(M.STAGE_DRY).replace('.', ',')} тыс. т — ${f1(M.stageMt(s.beta), 'ru')} млн мегатонн.
Плазменный магнит: включение на году ${Math.round(brake(s))}.
Резерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.
Цель: ${nm(s, 'ru')} · прибытие около года ${s.arrive}.` +
          (s.materials !== 100 ? `\nМатериалы для высадки: ${s.materials}% запаса.` : '') +
          (s.earlyCouncil && s.earlyCouncil.choice === 'turn' ? `\nКурс изменён на году ${s.earlyCouncil.at}: к ${nameAt(s.target, 'ru')}.` : '') +
          (s.riskVersion >= 5 && s.shield ? `\nФронтальный щит: ${shieldGaugeV5(s, 'ru')}.` : s.shieldWear > 0 ? `\nФронтальный щит: износ сверх нормы — ${pct(s.shieldWear, 'ru')} года из ~${eqOf(s).shield === 'dust40' ? 300 : 150}.` : ''),
        en: s => `Acceleration-stage thrust cut. Velocity ${fb(s.beta, 'en')}.
Acceleration stage separated. For the last ${stageOff(s).days} days thrust was angled 10°: the stage drifts off sideways at ${kms(stageOff(s).dv)} km/s. The core cancelled its own sideways velocity — manoeuvre reserve −${pct(stageOff(s).reservePct, 'en')}%.
The stage will pass ${nm(s, 'en')} a thousand AU aside around year ${Math.round(M.ACC + stageYears(s))}, ${yrsEn(s.arrive - M.ACC - stageYears(s))} ahead of us, and fly on. On a straight line it would have caught the core on the first day of braking and entered the target system at ${fb(s.beta, 'en')}: ${M.STAGE_DRY} kt — ${f1(M.stageMt(s.beta), 'en')} million megatons.
Plasma magnet: switch-on in year ${Math.round(brake(s))}.
Manoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.
Target: ${nm(s, 'en')} · arrival around year ${s.arrive}.` +
          (s.materials !== 100 ? `\nLanding materials: ${s.materials}% of stock.` : '') +
          (s.earlyCouncil && s.earlyCouncil.choice === 'turn' ? `\nCourse changed in year ${s.earlyCouncil.at}: for ${M.nameOf(s.target, 'en')}.` : '') +
          (s.riskVersion >= 5 && s.shield ? `\nForward shield: ${shieldGaugeV5(s, 'en')}.` : s.shieldWear > 0 ? `\nForward shield: wear beyond norm — ${pct(s.shieldWear, 'en')} years of ~${eqOf(s).shield === 'dust40' ? 300 : 150}.` : '')
      }
    },
    {
      id: 'a1.scout.late', scene: 'scout', kind: 'instrument', year: 8,
      when: s => s.scout === 8,
      title: { ru: 'Инженерный журнал · зонд', en: 'Engineering log · probe' },
      text: {
        ru: s => `Окно без тяги. ${hasScouts(s) ? 'Зонд из комплекта выпущен от кормы. Топливо — своё.' : 'Зонд собран за девять дней и отделён от кормы. Топливо — из резерва манёвров.'}
Расчётная скорость: ${fb(probeTimes(s, 8).vp, 'ru')}. Пролёт ${nm(s, 'ru')}: около года ${probeTimes(s, 8).flyby}. Спектры на борту: около года ${probeTimes(s, 8).data}.
Программа спектрометра: ${s.scoutTuned ? 'Коры Ландис — кислород, вода, метан, ночная сторона' : 'общий обзор'}.`,
        en: s => `Window without thrust. ${hasScouts(s) ? 'The kit probe is released from the stern. Own fuel.' : 'The probe is assembled in nine days and separated from the stern. Fuel from the manoeuvre reserve.'}
Design velocity: ${fb(probeTimes(s, 8).vp, 'en')}. ${nm(s, 'en')} flyby: around year ${probeTimes(s, 8).flyby}. Spectra on board: around year ${probeTimes(s, 8).data}.
Spectrometer programme: ${s.scoutTuned ? "Kora Landis's — oxygen, water, methane, night side" : 'general survey'}.`
      }
    },
    {
      id: 'a1.instruction', scene: 'ring', kind: 'document', year: 8,
      title: { ru: 'Инструкция вахте при росте плотности среды · автор О. Дал', en: 'Watch instruction for rising medium density · by O. Dal' },
      text: {
        ru: `1. Счётчики ударов фронтального щита сравнивать со средним за последние 30 суток.
2. Рост до трёхкратного — штатный скачок плотности межзвёздной среды: записать, продолжать программу.
3. Рост выше трёхкратного — будить штурмана.
4. Не менять режим тяги и паруса без штурмана.`,
        en: `1. Compare forward-shield impact counters with the average over the last 30 days.
2. A rise up to threefold is a routine density fluctuation of the interstellar medium: log it, continue the programme.
3. A rise above threefold: wake the navigator.
4. Do not change thrust or sail mode without the navigator.`
      }
    },
    {
      id: 'a1.handover', illus: 'handover', scene: 'vault', overlay: 'sleepers', kind: 'transcript', year: 8,
      title: { ru: 'Передача полномочий', en: 'Handover' },
      text: {
        ru: `Дассер и Орин ложатся в капсулы: их годы берегут для прибытия.

Врач закрепляет датчики. Ива Лорн наклоняется к Дассеру:

— Если через двадцать лет совет захочет пересмотреть очередь — будить вас?

Дассер не отвечает. Сон пришёл раньше.

Лорн выпрямляется и, не дожидаясь утра, переносит вахту обсерватории на неделю раньше. Это первое решение, которое никто не утверждал.`,
        en: `Dasser and Orin lie down in their capsules: their years are being saved for arrival.

The physician fixes the sensors. Iva Lorn bends over Dasser:

"If in twenty years the council wants to revise the queue — do we wake you?"

Dasser doesn't answer. Sleep came first.

Lorn straightens up and, without waiting for morning, moves the observatory watch a week earlier. It is the first decision no one approved.`
      }
    },
    {
      id: 'a1.medical', scene: 'vault', overlay: 'lifelines', kind: 'instrument', year: 8,
      title: { ru: 'Медицинский журнал · учёт лет бодрствования', en: 'Medical log · waking-years register' },
      text: {
        ru: s => `Дассер Нил — бодрствовал 8 лет; первый долгий сон.
Дал Орин — бодрствовал 8 лет; первый долгий сон.
Лорн Ива — бодрствовала 8 лет; передаёт совет смене года 8.
Ландис Кора — бодрствовала ${s.koraAwake} года; группа 7.
Осгер Дан — ${s.repairQual ? 'ремонтная смена, допуск к монтажу под тягой' : 'ремонтная смена'}; возраст 16.`,
        en: s => `Dasser, Nil — awake 8 years; first long sleep.
Dal, Orin — awake 8 years; first long sleep.
Lorn, Iva — awake 8 years; hands the council to the year-8 watch.
Landis, Kora — awake ${s.koraAwake} years; group 7.
Osger, Dan — ${s.repairQual ? 'repair watch, qualified for work under thrust' : 'repair watch'}; age 16.`
      }
    },
    {
      id: 'a1.end', scene: 'drift', kind: 'archive', year: 8,
      place: { ru: 'Корабль переходит в дрейф', en: 'The ship enters the drift' },
      text: {
        ru: s => `Впереди ${yrs(brake(s) - M.ACC)} дрейфа и ${yrs(s.arrive - brake(s))} торможения. На вахте — ${ppl(s.watch)}.`,
        en: s => `Ahead: ${yrsEn(brake(s) - M.ACC)} of drift and ${yrsEn(s.arrive - brake(s))} of braking. ${s.watch} people on watch.`
      }
    },
    // ------------------------------------------------------------ АКТ II · ДРЕЙФ
    Object.assign(skipTo(0.12, 'дрейф', 'drift'), { id: 's.d1' }),
    {
      id: 'a2.support', scene: 'ring', kind: 'bulletin', year: s => Y(s, 0.12), when: s => !ownStory(s),
      act: { ru: 'Акт II · Дрейф', en: 'Act II · Drift' },
      title: bulletinTitle(0.12),
      text: {
        ru: s => `Вслед за сорок первой вышел корабль поддержки: лёгкий, без жилых колец, семь человек — все спят весь путь. Он везёт ³He, запас теплообменников и материалы для высадки. Встреча — у ${nmG(s)} вскоре после нашего прибытия.

Раз в несколько лет от него будут приходить короткие сообщения.`,
        en: s => `A support ship has set out after the Forty-First: light, no habitat rings, seven people — all asleep the whole way. It carries ³He, spare heat exchangers and landing materials. Rendezvous at ${nm(s, 'en')} shortly after our arrival.

Every few years it will send a short message.`
      }
    },
    {
      id: 'a2.supplyNote', scene: 'ring', kind: 'bulletin', year: s => Y(s, 0.12), when: supplyS,
      act: { ru: 'Акт II · Дрейф', en: 'Act II · Drift' },
      title: bulletinTitle(0.12),
      text: {
        ru: s => `Кольцо пересылает последний отчёт Ксилоны Ир, полученный до нашего отлёта: форпост разобрал мастерскую под насосы капсульной смены и перевёл антенну на ручной привод.

Отчёт короткий; в конце — просьба передать сорок первой журнал ремонтов. Он идёт к нам следом, в общей сводке.`,
        en: s => `The Ring forwards Xylona Ir's last report, received before our departure: the outpost has taken its workshop apart for the capsule shift's pumps and switched the antenna to manual drive.

The report is short; at the end, a request to send the Forty-First the repair log. It follows us in the general bulletin.`
      }
    },

    Object.assign(skipTo(0.25), { id: 's.d2' }),
    {
      id: 'a2.review', illus: 'watch-review', scene: 'ring', kind: 'transcript', year: s => Y(s, 0.25),
      title: { ru: 'Разбор при пересменке', en: 'Handover review' },
      text: {
        ru: s => `Уходящая вахта впервые разбирает свои решения не перед советом, а перед теми, кто просыпается: все, включая ошибочные. Разбор идёт шесть часов. Последним пунктом — ${lastCall(s, 'ru')}.` + (s.mission === 'contact' ? `

В эти годы на корабле появляется присказка. «Красивее всего, что мы видели», — говорят о том, ради чего летят.` : '') + (supplyS(s) ? '\n\nОчередной отчёт Ксилоны не получен; последнее подтверждённое состояние остаётся прежним.' : rescueS(s) ? '\n\nНового полного медицинского отчёта Оттепели нет.' : ''),
        en: s => `For the first time the outgoing watch reviews its decisions not before the council but before those who are waking: all of them, including the mistakes. The review takes six hours. The last item — ${lastCall(s, 'en')}.${supplyS(s) ? "\n\nXylona's next report has not arrived; its last confirmed state remains unchanged." : rescueS(s) ? "\n\nThere is no new complete medical report from Thaw." : ''}${s.mission === 'contact' ? `

A saying appears aboard in these years. "More beautiful than anything we've seen," people say of what they are flying for.` : ''}`
      }
    },
    {
      id: 'a2.breach', scene: 'drift', kind: 'instrument', year: s => Y(s, 0.25),
      when: s => s.shieldWear > shieldAllow(s) && !v1(s),
      effect: s => { s.materials -= 5; },
      title: { ru: 'Инженерный журнал · пробой щита', en: 'Engineering log · shield breach' },
      text: {
        ru: s => `Пробой фронтального щита: частица массой около миллиграмма на ${fb(s.beta, 'ru')}. Энергия удара — как у сотни килограммов взрывчатки.
Щит изношен сверх нормы у края облака D2; в месте удара слой был тоньше расчётного.
Ремонт — заплата из материалов для высадки, −5% запаса. Жертв нет.`,
        en: s => `Forward shield breach: a particle of about a milligram at ${fb(s.beta, 'en')}. Impact energy comparable to a hundred kilograms of explosive.
The shield was worn beyond norm at the D2 cloud edge; at the impact point the layer was thinner than designed.
Repair: a patch from landing materials, −5% of stock. No casualties.`
      }
    },
    {
      id: 'a2.sector', scene: 'drift', kind: 'instrument', year: s => Y(s, 0.25),
      when: s => s.riskVersion < 5 && (v1(s) ? s.shieldBreach : s.shieldWear > shieldAllow(s)) && eqOf(s).shield === 'sectors' && s.repairQual,
      effect: s => { s.shieldFixed = true; s.materials -= 3; },
      title: { ru: 'Инженерный журнал · замена сектора', en: 'Engineering log · sector replacement' },
      text: {
        ru: 'Пробитый сектор щита снимают целиком и ставят запасной из оснащения. Работа под тягой — только для ремонтников с допуском: две смены снаружи, крепёж — из материалов для высадки, −3%. Щит снова держит полный расчёт.',
        en: 'The breached shield sector is removed whole and a spare from the equipment is fitted. Work under thrust is for qualified repair hands only: two shifts outside, fasteners from the landing materials, −3%. The shield holds its full rating again.'
      }
    },

    Object.assign(skipTo(0.35), { id: 's.d3' }),
    {
      id: 'a2.epoch2', scene: 'ring', kind: 'bulletin', year: s => Y(s, 0.35),
      title: bulletinTitle(0.35),
      text: {
        ru: `На Земле зажгли безнейтронный термояд. Двигатели нового поколения легче, тише и не делают корпус радиоактивным.

Для корабля это новость, не возможность: наш двигатель уже отделён и уходит по параллельному курсу.`,
        en: `Aneutronic fusion has been lit on Earth. The new generation of engines is lighter, quieter and doesn't make the hull radioactive.

For the ship this is news, not an opportunity: our engine has already been cast off and drifts on a parallel course.`
      }
    },
    {
      id: 'a2.teach', illus: 'kora-asleep', scene: 'vault', overlay: 'sleepers', kind: 'transcript', year: s => Y(s, 0.35),
      title: { ru: 'Единственный интерпретатор', en: 'The only interpreter' },
      text: {
        ru: s => `Кора Ландис спит с восьмого года. ${s.koraYear ? 'Ная Сорн читает спектры одна — пока на вахте нет ничего неоднозначного.' : 'Кроме неё, неоднозначный спектр на борту прочесть некому.'}

Лорн выносит на совет вопрос, который ещё не раз зададут другие смены: разбудить Кору на два года, чтобы она выучила интерпретаторов, или беречь её годы до цели.

— Умение сохранится, — говорит врач. — Но в ней одной, во сне.`,
        en: s => `Kora Landis has been asleep since year eight. ${s.koraYear ? 'Naya Sorn reads the spectra alone — so far nothing on watch has been ambiguous.' : 'Apart from her, no one aboard can read an ambiguous spectrum.'}

Lorn brings to the council a question other watches will ask again: wake Kora for two years to train interpreters, or save her years for the target.

"The skill will be kept," says the physician. "But in her alone, asleep."`
      }
    },
    {
      id: 'd.teach', scene: 'vault', overlay: 'sleepers', kind: 'decision', year: s => Y(s, 0.35),
      title: { ru: 'Будить Кору учить?', en: 'Wake Kora to teach?' },
      context: {
        ru: 'Два года бодрствования — из её лимита циклов; воздух и пища на неё и учеников.',
        en: 'Two waking years — from her cycle limit; air and food for her and her students.'
      },
      options: [
        {
          id: 'wake',
          label: { ru: 'Разбудить Кору на два года', en: 'Wake Kora for two years' },
          known: {
            ru: s => ['Кора потратит два года из своего лимита циклов.', `На подходе к цели неоднозначный спектр прочтут ${s.koraYear ? 'трое' : 'двое'}, не считая её.`],
            en: s => ['Kora spends two years of her cycle limit.', `On approach, ${s.koraYear ? 'three people' : 'two people'} besides her will be able to read an ambiguous spectrum.`]
          },
          effect: s => { s.taught = true; s.koraAwake += 2; },
          record: {
            ru: `Кору будят. Первую неделю она заново учится ходить, вторую — уже ведёт разбор. Учеников двое; одного она находит среди ремонтников.`,
            en: `Kora is woken. The first week she learns to walk again; by the second she is running reviews. She has two students; she finds one of them among the repair crew.`
          }
        },
        {
          id: 'keep',
          label: { ru: 'Беречь её до цели', en: 'Save her for the target' },
          known: {
            ru: s => ['Кора придёт к цели с нетронутым лимитом.', s.koraYear ? 'На вахте одна Ная; если с ней что-то случится — никого.' : 'Неоднозначный спектр на подходе прочтёт только Кора — её будут будить в спешке.'],
            en: s => ['Kora reaches the target with her limit intact.', s.koraYear ? 'Only Naya on watch; if anything happens to her, there is no one.' : 'On approach only Kora can read an ambiguous spectrum — she will be woken in a hurry.']
          },
          record: {
            ru: `Совет решает беречь Кору. Решение разумно, и его ещё не раз повторят другие советы — каждый по отдельности и без злого умысла.`,
            en: `The council decides to save Kora. The decision is reasonable, and other councils will repeat it more than once — each on its own, with no ill intent.`
          }
        }
      ]
    },

    Object.assign(skipTo(0.5), { id: 's.d4' }),
    {
      id: 'a2.queue', scene: 'ring', kind: 'transcript', year: s => Y(s, 0.5),
      title: { ru: 'Очередь пробуждений', en: 'The wake queue' },
      text: {
        ru: `Очередь пробуждений разбирают на каждой пересменке. Двое, чьи вахты совпадают одна из трёх, просят их свести. Кто-то предлагает отдать свои годы другому.

Совет запрещает обмен годами: годы жизни не должны становиться платой. Просьбы о совпадении вахт разбирают открыто, одну за другой.

Дан Осгер просит ставить его на ремонтные смены почти подряд. В личной записи — причина: он не хочет каждый раз просыпаться в корабле, где никого не знает. Он стареет быстрее всех, и это его выбор.`,
        en: `The wake queue is reviewed at every handover. Two people whose watches overlap one time in three ask for them to be aligned. Someone offers to give their years to another.

The council forbids trading years: years of life must not become currency. Requests to align watches are heard openly, one by one.

Dan Osger asks to be put on repair watches almost back to back. His personal log gives the reason: he doesn't want to wake up each time on a ship where he knows no one. He is ageing faster than anyone, and it is his choice.`
      }
    },
    {
      id: 'a2.thin', scene: 'ring', kind: 'instrument', year: s => Y(s, 0.5),
      when: s => (s.watch < 48) && !ownStory(s),
      effect: s => { if (!s.repairQual) s.materials -= 3; },
      title: { ru: 'Журнал вахты · авария в контуре воды', en: 'Watch log · water loop failure' },
      text: {
        ru: s => `Разрыв в контуре воды жилого кольца. На вахте ${ppl(s.watch)}; ближайший ремонтник — в другом кольце, двадцать минут пути.
${s.repairQual ? 'Дан Осгер перекрывает контур за шесть минут: его смены почти подряд, и он живёт рядом с узлом.' : 'Пока ремонтник добирается, кольцо теряет четыре тонны воды. Восполнение — из материалов для высадки, −3% запаса.'}`,
        en: s => `Rupture in the habitat ring water loop. ${s.watch} people on watch; the nearest repair hand is in the other ring, twenty minutes away.
${s.repairQual ? 'Dan Osger shuts the loop in six minutes: his watches are almost back to back and he lives next to the node.' : 'By the time the repair hand arrives, the ring has lost four tonnes of water. Replaced from landing materials, −3% of stock.'}`
      }
    },

    {
      id: 'a2r.telemetry', scene: 'vault', kind: 'instrument', year: s => Y(s, 0.5), when: s => s.mission === 'rescue',
      title: { ru: 'Журнал вахты · телеметрия Оттепели', en: "Watch log · Thaw's telemetry" },
      text: {
        ru: s => rescueS(s) ? `Маяк склада Оттепели — сигнал шёл ${yrs(thawLag(s))}. В принятом пакете снова написано: «Хранение штатное». Медицинские каналы отвечают не все; Селина оставляет число живых незаполненным.

Ирсон показывает старую схему охлаждения.

— Для переноса нужны переходники. Для аварийного подключения понадобится ещё испытанная изоляция: чужая неисправность не должна войти в наш зал.`
          : `Маяк склада Оттепели — сигнал шёл ${yrs(thawLag(s))}. Склад цел, живы ${THAW0}. Но теплоноситель склада старого образца: напрямую к нашему залу и к нашей сети его не подключить — нужны переходники и насосы на сорок капсул.`,
        en: s => rescueS(s) ? `The beacon of Thaw's store — the signal took ${yrsEn(thawLag(s))}. The received packet again says: "Storage nominal." Not every medical channel responds; Selina leaves the living count blank.

Irson shows the old cooling diagram.

"Moving them requires adapters. An emergency connection also needs tested isolation: their fault must not enter our hall."`
          : `The beacon of Thaw's store — the signal took ${yrsEn(thawLag(s))}. The store is intact, ${THAW0} alive. But its coolant is of the old pattern: it cannot be connected directly to our hall or our grid — adapters and pumps are needed for forty capsules.`
      }
    },
    {
      id: 'd.rescuePrep', scene: 'vault', kind: 'decision', when: s => s.mission === 'rescue',
      rec: s => !rescueS(s) ? null : s.materials >= PREP ? { id: 'adapters', why: { ru: 'комплект сокращает штатную помощь с трёх месяцев до одного', en: 'the kit cuts normal assistance from three months to one' },
        assume: { ru: 'осмотр крепления позволит обойтись без аварийного подключения', en: 'a mount inspection will avoid an emergency connection' } }
        : { id: 'defer', why: { ru: 'материалов на комплект нет', en: 'there are no materials for the kit' }, assume: { ru: 'у склада хватит времени собрать его на месте', en: 'there will be time to build it at the store' } },
      title: { ru: 'Переходники для склада', en: 'Adapters for the store' },
      context: {
        ru: 'Работа внутри летящего корабля: скорость и срок прибытия не меняются. Меняется, сколько времени займёт операция у склада.',
        en: 'Work inside the flying ship: neither speed nor arrival changes. What changes is how long the operation at the store will take.'
      },
      options: s => (rescueS(s) && s.materials >= RESCUE.tested ? [{
        id: 'tested',
        label: { ru: 'Переходники и аварийная изоляция', en: 'Adapters and emergency isolation' },
        known: {
          ru: [`Материалы для высадки −${RESCUE.tested}%: переходники, насосы и независимый контур.`, `Штатная операция у склада — за месяц, аварийный независимый контур — за ${RESCUE.isoFast} суток. Работы и испытание — в полёте.`],
          en: [`Landing materials −${RESCUE.tested}%: adapters, pumps and an independent loop.`, `Normal operation at the store in a month; emergency independent cooling in ${RESCUE.isoFast} days. Work and testing proceed in flight.`]
        },
        effect: st => { st.materials -= RESCUE.tested; st.rescuePrep = true; st.rescueIsolation = true; },
        record: {
          ru: 'Ремонтники собирают переходники и независимый контур; Дан два дня гоняет контур на стенде. На каждом переходнике — номер капсулы Оттепели.',
          en: 'The repair hands build the adapters and an independent loop; Dan runs the loop on the bench for two days. Each adapter carries the number of a Thaw capsule.'
        }
      }] : []).concat([{
        id: 'adapters',
        label: { ru: 'Собрать сейчас', en: 'Build them now' },
        known: {
          ru: [`Материалы для высадки −${PREP}%: переходники и насосы.`, 'У склада перенос или подключение к нашей сети — за месяц.'].concat(rescueS(s) ? [`Аварийная изоляция не испытана: собрать её у склада — ${RESCUE.isoSlow} суток.`] : []),
          en: [`Landing materials −${PREP}%: adapters and pumps.`, 'At the store, moving or connecting to our grid takes a month.'].concat(rescueS(s) ? [`Emergency isolation is untested: building it at the store takes ${RESCUE.isoSlow} days.`] : [])
        },
        effect: st => { st.materials -= PREP; st.rescuePrep = true; },
        record: {
          ru: 'Ремонтники собирают переходники в мастерской дрейфа. На каждом — номер капсулы Оттепели.',
          en: "The repair hands build the adapters in the drift workshop. Each carries the number of a Thaw capsule."
        }
      }, {
        id: 'defer',
        label: { ru: 'Решить у склада', en: 'Decide at the store' },
        known: {
          ru: ['Материалы целы.', 'У склада переходники собирают на месте: перенос или подключение — три месяца.'].concat(rescueS(s) ? ['Сводка склада неполна: если там есть что-то срочнее старения капсул, трёх месяцев может не быть.'] : []),
          en: ['The materials are kept.', 'At the store the adapters are built on site: moving or connecting takes three months.'].concat(rescueS(s) ? ["The store's summary is incomplete: if something there is more urgent than capsule ageing, three months may not be available."] : [])
        },
        effect: st => { st.rescuePrep = false; },
        record: {
          ru: 'Материалы остаются на высадку. Переходники соберут у склада — на это уйдёт три месяца.',
          en: 'The materials stay for the landing. The adapters will be built at the store — that will take three months.'
        }
      }]).filter(o => o.id !== 'adapters' || s.materials >= PREP)
    },
    {
      id: 'a2r.test', scene: 'vault', kind: 'instrument', year: s => Y(s, 0.5) + 2 / YD, when: rescueS,
      title: { ru: 'Проверка на стенде', en: 'The bench test' },
      text: {
        ru: s => `${s.rescueIsolation ? 'Испытаны переходники и независимый контур.' : s.rescuePrep ? 'Испытаны штатные переходники; аварийная развязка не собрана.' : 'На стенде проверена схема; рабочего комплекта ещё нет.'} Дан прикрепляет протокол к комплекту. Штатное соединение и аварийная развязка теперь отмечены отдельно: одно нельзя принимать за другое.`,
        en: s => `${s.rescueIsolation ? 'The adapters and the independent loop have been tested.' : s.rescuePrep ? 'The normal adapters have been tested; emergency isolation has not been assembled.' : 'The design has been checked on the bench; there is no working kit yet.'} Dan attaches the test record to the kit. The normal connection and emergency isolation are now listed separately: one must not be mistaken for the other.`
      }
    },
    {
      id: 'a2s.dust', scene: 'vault', kind: 'instrument', year: s => Y(s, 0.5), when: supplyS,
      title: { ru: 'Журнал вахты · пылевые удары', en: 'Watch log · dust impacts' },
      text: {
        ru: s => `Счётчики записали серию пылевых ударов; наружная панель охлаждения теряет давление.

Дан Осгер изолирует панель, но показания ещё не установились.

Ирсон предлагает подключить ${coolerName(s, 'ru')}: тогда груз начнёт работать до прибытия.

— Если треснул коллектор, прямое подключение перенесёт отказ дальше.

Опрессовка занимает двое суток; независимая секция — двадцать, четыре ремонтника.

Общий отказ может погубить людей и оставить корабль только на аварийном охлаждении.`,
        en: s => `The counters recorded a series of dust impacts; an external cooling panel is losing pressure.

Dan Osger isolates the panel, but the readings have not settled.

Irson proposes connecting ${coolerName(s, 'en')}: the cargo will start working before arrival.

"If the manifold is cracked, a direct connection will carry the failure farther."

A pressure test takes two days; an independent section takes twenty and four repair hands.

A common failure could kill people and leave the ship on emergency cooling alone.`
      }
    },
    {
      id: 'd.supplyCooler', scene: 'vault', kind: 'decision', when: supplyS,
      title: { ru: 'Холодильник в дрейфе', en: 'The cooler in the drift' },
      context: { ru: 'Панель изолирована, давление ещё падает. Решение — до следующей смены.', en: 'The panel is isolated; the pressure is still falling. The decision comes before the next shift.' },
      rec: s => s.materials >= SUPPLY.check + SUPPLY.isolate ? { id: 'check', why: { ru: 'давление падает и после изоляции панели', en: 'pressure keeps falling after the panel was isolated' }, assume: { ru: 'отрицательная опрессовка позволяет принять остаточный риск', en: 'a negative pressure test permits accepting the residual risk' } }
        : s.materials >= SUPPLY.isolate ? { id: 'isolate', why: { ru: 'на опрессовку и секцию вместе материалов нет', en: 'not enough materials for both the test and a section' } }
        : { id: 'direct', why: { ru: 'на защиту материалов нет', en: 'there are no materials for protection' }, assume: { ru: 'коллектор цел', en: 'the manifold is intact' } },
      options: s => [{
        id: 'direct', label: { ru: 'Подключить напрямую', en: 'Connect directly' },
        known: { ru: ['Двое суток, без расхода материалов.', 'Состояние коллектора не установлено; общий отказ может погубить людей и сорвать доставку.'],
          en: ['Two days, no materials.', "The manifold's condition is unverified; a common failure could kill people and end the delivery."] },
        effect: st => { st.cargoMethod = 'direct'; st.cargoDays = 2; cargoConnect(st); },
        record: { ru: s => s.cargoFailed ? 'Холодильник подключают напрямую.' : 'Холодильник подключают напрямую. Коллектор держит; через неделю груз возвращают в транспортное состояние и отправляют Ксилоне исправленную ведомость: холодильник испытан в работе.',
          en: s => s.cargoFailed ? 'The cooler is connected directly.' : 'The cooler is connected directly. The manifold holds; a week later the cargo is returned to transport state and Xylona is sent an amended manifest: the cooler has been tested in service.' }
      }, {
        id: 'check', label: { ru: 'Опрессовать; действовать по результату', en: 'Pressure-test; act on the result' },
        known: { ru: [`Материалы −${SUPPLY.check}%, двое суток проверки; находит девять трещин из десяти.`, `Нашли — независимая секция ещё за −${SUPPLY.isolate}% и двадцать суток; нет — прямое подключение.`],
          en: [`Materials −${SUPPLY.check}%, two days of testing; finds nine cracks in ten.`, `If found — an independent section for another −${SUPPLY.isolate}% and twenty days; if not — a direct connection.`] },
        cost: st => { st.materials -= SUPPLY.check; },
        effect: st => { st.materials -= SUPPLY.check; st.cargoMethod = 'check';
          st.cargoFound = collectorCracked(st) && (hidden(st, 'supply.cargo.check') ?? 1) < SUPPLY.cargoSense;
          if (st.cargoFound) { st.materials -= SUPPLY.isolate; st.cargoDays = 22; } else { st.cargoDays = 4; cargoConnect(st); } },
        record: { ru: s => s.cargoFound ? 'Опрессовка находит трещину в коллекторе. Ремонтники двадцать суток собирают независимую секцию; Ксилоне уходит исправленная ведомость.' : s.cargoFailed ? 'Опрессовка трещины не находит. Холодильник подключают.' : 'Опрессовка трещины не находит; коллектор цел. Холодильник испытан в работе; Ксилоне уходит исправленная ведомость.',
          en: s => s.cargoFound ? 'The pressure test finds a crack in the manifold. The repair hands spend twenty days building an independent section; Xylona is sent an amended manifest.' : s.cargoFailed ? 'The pressure test finds no crack. The cooler is connected.' : 'The pressure test finds no crack; the manifold is intact. The cooler is tested in service; Xylona is sent an amended manifest.' }
      }, {
        id: 'isolate', label: { ru: 'Собрать независимую секцию', en: 'Build an independent section' },
        known: { ru: [`Материалы −${SUPPLY.isolate}%, двадцать суток, четыре ремонтника.`, 'Изолирует повреждённый узел при любом его состоянии; запас для будущего монтажа уменьшится.'],
          en: [`Materials −${SUPPLY.isolate}%, twenty days, four repair hands.`, 'Isolates the damaged assembly whatever its state; less stock remains for the installation.'] },
        cost: st => { st.materials -= SUPPLY.isolate; },
        effect: st => { st.materials -= SUPPLY.isolate; st.cargoMethod = 'isolate'; st.cargoDays = 20; },
        record: { ru: 'Ремонтники двадцать суток собирают независимую секцию. Холодильник груза остаётся в транспортном состоянии.', en: 'The repair hands spend twenty days building an independent section. The cargo cooler stays in transport state.' }
      }].filter(o => o.id === 'direct' || (o.id === 'check' ? s.materials >= SUPPLY.check + SUPPLY.isolate : s.materials >= SUPPLY.isolate))
    },
    {
      id: 'a2s.cargoFail', scene: 'vault', overlay: 'sleepers', kind: 'instrument', year: SOS_AT_cargo, when: s => supplyS(s) && s.cargoFailed,
      title: { ru: 'Медицинский журнал · отказ охлаждения', en: 'Medical log · the cooling fails' },
      text: {
        ru: s => `Через двое суток после подключения коллектор расходится по трещине. Отказ уходит в общий контур: жилые отсеки остывают раньше, чем их успевают перекрыть.

Погибли ${ppl(s.supplyCrewDead)}. Держит только изолированное аварийное охлаждение зала анабиоза; обычную вахту оно не прокормит.

Совет решает спать и звать помощь: двенадцать остаются на вахте, сигнал бедствия уходит к колониям и на Землю.`,
        en: s => `Two days after the connection the manifold splits along the crack. The failure spreads into the common loop: the living compartments cool before they can be sealed.

${s.supplyCrewDead} are dead. Only the anabiosis hall's isolated emergency cooling holds; it cannot support a normal watch.

The council decides to sleep and call for help: twelve stay on watch, and the distress signal goes out to the colonies and to Earth.`
      }
    },
    sosEnd('cargo', 'vault'),
    {
      id: 'a2s.spares', scene: 'vault', kind: 'instrument', year: s => Y(s, 0.5), when: s => s.mission === 'supply' && s.kits.includes('request') && !supplyS(s),
      title: { ru: 'Журнал вахты · груз заявки', en: 'Watch log · the request cargo' },
      text: {
        ru: 'Плановая проверка груза заявки. Холодильник капсульного блока для форпоста деградировал при хранении: до прибытия он доживёт, а три года монтажа и работы у форпоста — нет. Капсулы форпоста без него не запустить.',
        en: "A scheduled check of the request cargo. The capsule unit's cooler for the outpost has degraded in storage: it will last to arrival, but not three years of installation and work at the outpost. The outpost's capsules cannot be started without it."
      }
    },
    {
      id: 'd.supplyRepair', scene: 'vault', kind: 'decision', when: s => s.mission === 'supply' && s.kits.includes('request') && !supplyS(s),
      title: { ru: 'Чей ремонтный запас', en: 'Whose repair stock' },
      context: {
        ru: 'Ремонтный запас корабля — это и наш будущий дом у форпоста. Передатчик заявки — это связь форпоста с Кольцом.',
        en: "The ship's repair stock is also our own future home at the outpost. The request transmitter is the outpost's link to the Ring."
      },
      options: s => [{
        id: 'own',
        label: { ru: 'Отдать свой запас', en: 'Give our own stock' },
        known: {
          ru: ['Материалы для высадки −20%: насосы и теплообменник из своего склада.', 'Груз заявки цел: и связь, и капсулы.'],
          en: ['Landing materials −20%: pumps and an exchanger from our own store.', 'The request cargo is whole: the link and the capsules.']
        },
        effect: st => { st.cooler = 'own'; st.materials -= 20; },
        record: { ru: 'Тея Марр отдаёт из склада насосы и теплообменник: «Наш дом подождёт, их капсулы — нет».', en: 'Teya Marr hands over pumps and an exchanger from the store: "Our home can wait, their capsules cannot."' }
      }, {
        id: 'relayParts',
        label: { ru: 'Снять детали с передатчика заявки', en: 'Strip the request transmitter for parts' },
        known: {
          ru: ['Свои материалы целы.', `Передатчика для форпоста не будет: связь — только из своих материалов, −${BUILD.relay}% у цели.`],
          en: ['Our own materials stay whole.', `There will be no transmitter for the outpost: the link only from our materials, −${BUILD.relay}% at the target.`]
        },
        effect: st => { st.cooler = 'relayParts'; },
        record: { ru: 'Ремонтники разбирают передатчик заявки на холодильник. Ирсон вычёркивает строку из накладной.', en: 'The repair hands strip the request transmitter for the cooler. Irson strikes the line off the manifest.' }
      }].concat(['tools', 'printQC'].includes(eqOf(s).prod) ? [{
        id: 'tools',
        label: { ru: 'Изготовить детали на станках', en: 'Make the parts on the machine tools' },
        known: {
          ru: ['Материалы для высадки −10%: заготовки вместо готовых узлов.', 'Груз заявки цел: и связь, и капсулы. Двое ремонтников год работают у станков.'],
          en: ['Landing materials −10%: blanks instead of finished parts.', 'The request cargo is whole: the link and the capsules. Two repair hands work a year at the machine tools.']
        },
        effect: st => { st.cooler = 'tools'; st.materials -= 10; },
        record: { ru: 'Год у станков. Новый холодильник выходит грубее заводского, но держит расчёт.', en: 'A year at the machine tools. The new cooler comes out rougher than the factory one, but holds its rating.' }
      }] : [])
    },

    Object.assign(skipTo(0.6), { id: 's.d5' }),
    {
      id: 'a2.null', scene: 'ring', kind: 'bulletin', year: s => Y(s, 0.6),
      title: bulletinTitle(0.6),
      text: {
        ru: `На Земле провели опыт с нуль-пространством на энергии всей планеты, не дождавшись полного решения Совета. Исследовательская станция разрушена, наблюдатели погибли. Приборы записали аномалию, которую никто не может ни подтвердить, ни опровергнуть.

Руководителя опыта признали честным в мотивах и отстранили от решений. Смена слушает сводку дважды: Земля попыталась обойти свет и заплатила за это.`,
        en: `On Earth a null-space experiment was run on the power of the whole planet, without waiting for the Council's full decision. The research station is destroyed; the observers are dead. The instruments recorded an anomaly no one can confirm or refute.

The experiment's leader was found honest in motive and removed from decision-making. The watch listens to the bulletin twice: Earth tried to get around light, and paid for it.`
      }
    },

    Object.assign(skipTo(0.68), { id: 's.d6', when: s => !ownStory(s) }),
    {
      id: 'a2.heat', illus: 'cooling-loop', scene: 'vault', overlay: 'sleepers', kind: 'transcript', year: s => Y(s, 0.68), when: s => !ownStory(s),
      title: { ru: 'Контур охлаждения', en: 'The cooling loop' },
      text: {
        ru: s => `Основной контур охлаждения повреждён частицами раньше расчётного срока. На складе один запас теплообменников.

— Хватит на одно из двух, — говорит Ирсон. — Либо полный контур с резервом повышенной мощности — на один короткий сильный манёвр, если у цели что-то пойдёт не так. Либо холодильник группы Б: двадцать спящих, их капсулы медленно теряют холод.` +
          (s.materials >= 125 ? `

— Есть третье, — говорит Тея Марр. — Материалы, которые мы взяли сверх ядра. Второй теплообменник можно собрать. Только высаживаться потом будет из чего меньше.` : ''),
        en: s => `The main cooling loop has been damaged by particles ahead of its design life. There is one set of heat exchangers in store.

"Enough for one of two things," says Irson. "Either the full loop with the high-power reserve — for one short, hard manoeuvre if something goes wrong at the target. Or the cooler for group B: twenty sleepers whose capsules are slowly losing cold."` +
          (s.materials >= 125 ? `

"There's a third," says Teya Marr. "The materials we brought beyond the core. A second exchanger can be built. We'll just have less to land with."` : '')
      }
    },
    {
      id: 'd.heat', scene: 'vault', overlay: 'sleepers', kind: 'decision', year: s => Y(s, 0.68), when: s => !ownStory(s),
      title: { ru: 'Теплообменники', en: 'Heat exchangers' },
      rec: s => loopV1(s) ? { id: 'power', why: { ru: 'резерв мощности нужен у цели', en: 'the high-power reserve is needed at the target' }, assume: { ru: 'контур выдержит пробуждённую группу Б', en: 'the loop will carry the woken group B' } } : null,
      context: {
        ru: '«По Дассеру» — сначала люди на борту. «По Далу» — сохранять диапазон возможностей корабля. Будить основателей ради решения совет не стал.',
        en: '"Dasser\'s way" — people aboard first. "Dal\'s way" — keep the ship\'s range of options. The council chose not to wake the founders for this.'
      },
      options: s => [
        {
          id: 'power',
          label: { ru: 'Полный контур', en: 'The full loop' },
          known: {
            ru: s => ['Резерв повышенной мощности сохранён.', 'Группу Б будят аварийно: двадцать человек тратят годы жизни, а жизнеобеспечение рассчитано на малую смену.']
              .concat(loopV1(s) ? [`С группой Б бодрствуют ${s.watch + 20}: временного запаса воды — на два года. Выдержит ли общая магистраль колец такую нагрузку, не проверено; если нет — отказ в обоих кольцах сразу.`]
                : maintDebt(s) ? [`Контур воды после аварии держит сорок человек, а будет ${s.watch + 20}: запаса — на два года.`] : []),
            en: s => ['The high-power reserve is kept.', 'Group B is woken in an emergency: twenty people spend years of life, and life support is sized for a small watch.']
              .concat(loopV1(s) ? [`With group B, ${s.watch + 20} are awake: temporary water reserves for two years. Whether the rings' common main can carry that load has not been checked; if not, it fails in both rings at once.`]
                : maintDebt(s) ? [`After the failure the water loop carries forty people, and there will be ${s.watch + 20}: reserves for two years.`] : [])
          },
          effect: st => { st.highPower = true; st.groupB = 'woken'; },
          record: {
            ru: `Группу Б будят по одному, неделю. Шесть часов до ясного сознания у каждого. Ирсон встречает всех двадцать сам.`,
            en: `Group B is woken one by one over a week. Six hours to clear consciousness for each. Irson meets all twenty himself.`
          }
        },
        {
          id: 'groupB',
          label: { ru: 'Холодильник группы Б', en: 'The group B cooler' },
          known: {
            ru: ['Двадцать спящих спят дальше.', 'Резерв повышенной мощности утрачен — до встречи с кораблём поддержки.'],
            en: ['Twenty sleepers sleep on.', 'The high-power reserve is lost — until the rendezvous with the support ship.']
          },
          effect: st => { st.highPower = false; st.groupB = 'saved'; },
          record: {
            ru: `Совет чинит контур до штатной мощности торможения, остаток запаса отдаёт группе Б. В инженерный архив ложатся решение и расчёт на корабль поддержки.`,
            en: `The council repairs the loop to nominal braking power and gives the rest of the store to group B. The decision goes into the engineering archive, along with the reliance on the support ship.`
          }
        }
      ].concat(s.materials >= 125 ? [{
        id: 'both',
        label: { ru: 'Собрать второй теплообменник', en: 'Build a second exchanger' },
        known: {
          ru: ['И контур, и группа Б.', 'Материалы для высадки: −25% запаса.', 'Высаживаться будет из чего меньше.'],
          en: ['Both the loop and group B.', 'Landing materials: −25% of stock.', 'There will be less to land with.']
        },
        effect: st => { st.materials -= 25; st.highPower = true; st.groupB = 'saved'; },
        record: {
          ru: `Тея Марр отдаёт склад. Второй теплообменник собирают четыре месяца — из того, что везли строить дом.`,
          en: `Teya Marr gives up the store. The second exchanger takes four months to build — out of what they were carrying to build a home.`
        }
      }] : [])
    },

    {
      id: 'a2.loop1', scene: 'ring', kind: 'instrument', year: s => Y(s, 0.68), when: s => loopV1(s) && s.groupB === 'woken',
      title: { ru: 'Инженерный журнал · испытание нагрузкой', en: 'Engineering log · load test' },
      text: {
        ru: s => `Группа Б на ногах: бодрствуют ${ppl(s.watch + 20)}. При испытании нагрузкой давление в общей магистрали колец проседает на семь процентов и возвращается не сразу.
Временного запаса воды — на два года, до года ${Math.round(loopAt(s))}. Это предел, а не гарантия исправности магистрали.
Обычная проверка видит доступные участки; дефект под переменной нагрузкой может остаться незамеченным. Углублённая — вскрытие магистрали, шесть недель.`,
        en: s => `Group B is up: ${s.watch + 20} are awake. Under a load test the pressure in the rings' common main drops by seven percent and does not recover at once.
Temporary water reserves last two years, to year ${Math.round(loopAt(s))}. That is a limit, not a guarantee that the main is sound.
An ordinary check sees the accessible sections; a defect under variable load may go unnoticed. A deep check means opening the main — six weeks.`
      }
    },
    {
      id: 'd.overloadCheck', scene: 'ring', kind: 'decision', year: s => Y(s, 0.68), when: s => loopV1(s) && s.groupB === 'woken',
      title: { ru: 'Проверить общую магистраль?', en: 'Check the common main?' },
      context: { ru: s => `Запас — до года ${Math.round(loopAt(s))}. Проверка тратит его дни.`, en: s => `Reserves last to year ${Math.round(loopAt(s))}. A check spends their days.` },
      rec: s => ({ id: 'ordinary', why: { ru: 'обычная проверка по регламенту', en: 'the ordinary check, by the rules' } }),
      options: s => [
        { id: 'ordinary', label: { ru: 'Обычная проверка', en: 'An ordinary check' },
          known: { ru: [`Материалы −${LOOP.ordinary.cost}%, ${LOOP.ordinary.days} суток.`, 'Видит доступные участки: дефект под нагрузкой находит примерно в половине случаев.'],
            en: [`Materials −${LOOP.ordinary.cost}%, ${LOOP.ordinary.days} days.`, 'Sees the accessible sections: finds a defect under load about half the time.'] },
          cost: st => { st.materials -= LOOP.ordinary.cost; },
          effect: st => { st.materials -= LOOP.ordinary.cost; st.loopCheck = 'ordinary'; st.loopFound = loopCommon(st) && (hidden(st, 'contact.loop.access') ?? 1) < LOOP.ordinary.sense; },
          record: { ru: s => s.loopFound ? 'Неделя проверок. На стыке колец — трещина в общей магистрали: под нагрузкой она раскрывается.' : 'Неделя проверок. На доступных участках дефектов нет.',
            en: s => s.loopFound ? 'A week of checks. At the junction of the rings, a crack in the common main: it opens under load.' : 'A week of checks. No defects in the accessible sections.' } },
        { id: 'deep', label: { ru: 'Вскрыть магистраль', en: 'Open up the main' },
          known: { ru: [`Материалы −${LOOP.deep.cost}%, ${LOOP.deep.days} суток: шесть недель из двух лет запаса.`, 'Находит дефект в девяти случаях из десяти.'],
            en: [`Materials −${LOOP.deep.cost}%, ${LOOP.deep.days} days: six weeks out of the two years of reserves.`, 'Finds a defect nine times in ten.'] },
          cost: st => { st.materials -= LOOP.deep.cost; },
          effect: st => { st.materials -= LOOP.deep.cost; st.loopCheck = 'deep'; st.loopFound = loopCommon(st) && (hidden(st, 'contact.loop.access') ?? 1) < LOOP.deep.sense; },
          record: { ru: s => s.loopFound ? 'Шесть недель. Магистраль вскрыта на стыке колец: трещина, которая раскрывается под нагрузкой.' : 'Шесть недель. Магистраль вскрыта по всей длине; дефектов не найдено.',
            en: s => s.loopFound ? 'Six weeks. The main is opened at the junction of the rings: a crack that opens under load.' : 'Six weeks. The main is opened along its length; no defects found.' } },
        { id: 'skip', label: { ru: 'Не проверять', en: 'No check' },
          known: { ru: ['Ни материалов, ни дней.', 'Исправна ли магистраль — не известно.'], en: ['No materials, no days.', 'Whether the main is sound is unknown.'] },
          effect: st => { st.loopCheck = 'skipped'; },
          record: { ru: 'Совет решает не тратить запас на проверку.', en: 'The council decides not to spend the reserves on a check.' } }
      ].filter(o => !LOOP[o.id] || s.materials >= LOOP[o.id].cost)
    },
    {
      id: 'd.overload1', scene: 'ring', kind: 'decision', year: s => Y(s, 0.68), when: s => loopV1(s) && s.groupB === 'woken',
      title: { ru: 'Жизнеобеспечение на пределе', en: 'Life support at the limit' },
      context: {
        ru: s => `Бодрствуют ${ppl(s.watch + 20)}; запас воды — до года ${Math.round(loopAt(s))}. ${s.loopFound ? 'Общая магистраль повреждена.' : s.loopCheck === 'skipped' ? 'Магистраль не проверяли.' : 'Проверка дефекта не нашла.'} Если магистраль откажет, погибнут те, кто будет в кольцах: группа Б и смена вахты.${s.watch - 11 < WATCH_SOS ? ' Оставшихся не хватит, чтобы обслуживать зал анабиоза.' : ''}`,
        en: s => `${s.watch + 20} are awake; water reserves to year ${Math.round(loopAt(s))}. ${s.loopFound ? 'The common main is damaged.' : s.loopCheck === 'skipped' ? 'The main has not been checked.' : 'The check found no defect.'} If the main fails, those in the rings will die: group B and a shift of the watch.${s.watch - 11 < WATCH_SOS ? ' Those left will be too few to maintain the anabiosis hall.' : ''}`
      },
      rec: s => s.loopFound ? (s.materials >= LOOP.materials ? { id: 'materials', why: { ru: 'магистраль повреждена', en: 'the main is damaged' } } : { id: 'sleep', why: { ru: 'магистраль повреждена, материалов на второй контур нет', en: 'the main is damaged and there are no materials for a second loop' } })
        : { id: 'hold', why: s.loopCheck === 'skipped' ? { ru: 'запаса хватает на два года', en: 'the reserves last two years' } : { ru: 'проверка не нашла дефекта', en: 'the check found no defect' },
          assume: { ru: 'общая магистраль исправна', en: 'the common main is sound' } },
      options: s => [
        { id: 'sleep', label: { ru: 'Вернуть в сон группу Б и ещё десятерых', en: 'Put group B and ten more back to sleep' },
          known: { ru: ['Тридцать человек тратят по циклу сна.', 'Нагрузка снова в пределах контура: опасности для людей нет; ремонт — медленнее.'],
            en: ['Thirty people each spend a sleep cycle.', 'The load is back within the loop: no danger to people; repairs are slower.'] },
          effect: st => { st.overload = 'sleep'; },
          record: { ru: 'Тридцать человек возвращаются в капсулы. Ирсон подписывает каждое усыпление сам.', en: 'Thirty people go back into the capsules. Irson signs each one himself.' } }
      ].concat(s.materials >= LOOP.materials ? [{ id: 'materials', label: { ru: 'Собрать второй контур из материалов', en: 'Build a second loop from the materials' },
          known: { ru: [`Материалы для высадки −${LOOP.materials}%.`, 'Полгода работы — внутри двух лет запаса. Все остаются на вахте.'], en: [`Landing materials −${LOOP.materials}%.`, 'Half a year of work — within the two years of reserves. Everyone stays on watch.'] },
          cost: st => { st.materials -= LOOP.materials; },
          effect: st => { st.overload = 'materials'; st.materials -= LOOP.materials; },
          record: { ru: 'Второй контур воды собирают полгода — из того, что везли строить дом.', en: 'The second water loop takes half a year to build — from what they were carrying to build a home.' } }] : [])
      .concat([{ id: 'hold', label: { ru: 'Тянуть на запасе', en: 'Run on the reserve' },
          known: { ru: s => ['Ни циклов, ни материалов.', s.loopFound ? 'Магистраль повреждена: под нагрузкой она откажет до конца запаса.' : 'Если магистраль исправна, за два года её успеют довести до нормы. Если нет — отказ в обоих кольцах.'],
            en: s => ['No cycles, no materials.', s.loopFound ? 'The main is damaged: under load it will fail before the reserves run out.' : 'If the main is sound, it can be brought up to standard within two years. If not, it fails in both rings.'] },
          effect: st => { st.overload = 'hold'; },
          record: { ru: 'Совет решает тянуть на запасе.', en: 'The council decides to run on the reserve.' } }])
    },
    {
      id: 'a2.loopEnd1', scene: 'ring', kind: 'instrument', year: loopAt, when: s => loopV1(s) && s.overload === 'hold',
      effect: s => { if (!loopCommon(s)) return; s.dead += LOOP.dead; s.loopDead = LOOP.dead; s.watch = Math.max(0, s.watch - 11); if (s.watch < WATCH_SOS) s.dutchman = true;   // меньше двенадцати — зал некому держать
        incident(s, 'loop', LOOP.dead, { check: s.loopCheck, found: s.loopFound, year: loopAt(s) }); },
      title: { ru: s => s.loopDead ? 'Медицинский журнал · отказ контура' : 'Инженерный журнал · контур', en: s => s.loopDead ? 'Medical log · the loop fails' : 'Engineering log · the loop' },
      text: {
        ru: s => !s.loopDead ? 'Два года на запасе. Общую магистраль довели до нормы; давление держится. Группа Б остаётся на вахте.'
          : `Общая магистраль отказала в обоих кольцах сразу. Группа Б и одиннадцать человек вахты погибли, пока остальные перекрывали кольца. На вахте осталось ${ppl(s.watch)}.` + (s.loopFound ? '\nДефект был найден до решения.' : s.loopCheck === 'skipped' ? '\nМагистраль не проверяли.' : '\nПроверка дефекта не нашла.'),
        en: s => !s.loopDead ? 'Two years on the reserve. The common main has been brought up to standard; the pressure holds. Group B stays on watch.'
          : `The common main failed in both rings at once. Group B and eleven of the watch died while the others sealed the rings. ${s.watch} people remain on watch.` + (s.loopFound ? '\nThe defect had been found before the decision.' : s.loopCheck === 'skipped' ? '\nThe main had not been checked.' : '\nThe check had found no defect.')
      }
    },
    dutchmanEnd('x.dutchman1', s => loopV1(s) && s.dutchman, loopAt, null),
    Object.assign(sosDrift('d.sos.drift1', s => loopV1(s) && s.loopDead > 0 && !s.dutchman)),
    Object.assign(sosEnd('drift', 'vault'), { id: 'x.sos.drift1', when: s => loopV1(s) && s.sos === 'drift' }),
    Object.assign(skipTo(0.75), { id: 's.d7' }),
    {
      id: 'a2.blueprint', scene: 'ring', kind: 'bulletin', year: s => Y(s, 0.75),
      title: bulletinTitle(0.75),
      text: {
        ru: s => `Кольцо присылает чертёж капельного радиатора: струя капель вместо панелей, в сотни раз легче. ${ownStory(s) ? 'Наш контур пока справляется; Ирсон кладёт чертёж к схемам охлаждения.' : 'Он решил бы задачу Ирсона сразу.'}

` + (BLUEPRINT[eqOf(s).prod] ? `Станки на борту есть: ${M.eqOpt('prod', eqOf(s).prod).ru.toLowerCase()}. Вопрос — материалы и руки с допуском.` : 'Построить его на борту нечем: нет воспроизводящего производства. Ирсон кладёт чертёж в архив с пометкой «для тех, у кого будут станки».'),
        en: s => `The Ring sends a design for a droplet radiator: a stream of droplets instead of panels, hundreds of times lighter. ${ownStory(s) ? 'Our loop copes for now; Irson files the design with the cooling diagrams.' : "It would have solved Irson's problem at once."}

` + (BLUEPRINT[eqOf(s).prod] ? `There are machine tools aboard: ${M.eqOpt('prod', eqOf(s).prod).en.toLowerCase()}. The question is materials and qualified hands.` : 'There is nothing to build it with aboard: no reproducing industry. Irson files the design with a note: "for those who will have machine tools".')
      }
    },
    {
      id: 'd.blueprint', scene: 'ring', kind: 'decision',
      when: s => !!BLUEPRINT[eqOf(s).prod] && !s.highPower && s.repairQual && s.materials >= BLUEPRINT[eqOf(s).prod],
      title: { ru: 'Строить радиатор?', en: 'Build the radiator?' },
      context: {
        ru: s => `Компромисс Ирсона ${yrs(Y(s, 0.75) - Y(s, 0.68))} назад отдал резерв повышенной мощности группе Б. Радиатор из чертежа вернул бы его — ценой материалов для высадки.`,
        en: s => `Irson's compromise ${yrsEn(Y(s, 0.75) - Y(s, 0.68))} ago gave the high-power reserve to group B. A radiator from the design would bring it back — at the cost of landing materials.`
      },
      options: s => [{
        id: 'build',
        label: { ru: 'Строить', en: 'Build it' },
        known: {
          ru: [`Материалы для высадки −${BLUEPRINT[eqOf(s).prod]}%.`, 'Контур снова держит короткий мощный манёвр — за шесть часов, а не за двенадцать суток.'],
          en: [`Landing materials −${BLUEPRINT[eqOf(s).prod]}%.`, 'The loop can again hold a short powerful manoeuvre — six hours instead of twelve days.']
        },
        effect: st => { st.materials -= BLUEPRINT[eqOf(st).prod]; st.highPower = true; st.blueprint = 'built'; },
        record: {
          ru: 'Ремонтники год собирают радиатор по чертежу Кольца. Струя капель впервые встаёт за кормой — и контур повышенной мощности снова цел.',
          en: 'The repair crews spend a year building the radiator from the Ring\'s design. The droplet stream rises behind the stern for the first time — and the high-power loop is whole again.'
        }
      }, {
        id: 'archive',
        label: { ru: 'Сберечь материалы', en: 'Keep the materials' },
        known: {
          ru: ['Материалы для высадки целы.', 'Без резерва мощности аварийный манёвр — серия слабых коррекций, двенадцать суток.'],
          en: ['The landing materials stay whole.', 'Without the high-power reserve an emergency manoeuvre is a series of weak corrections, twelve days.']
        },
        effect: st => { st.blueprint = 'archived'; },
        record: {
          ru: 'Совет бережёт материалы для дома. Чертёж ложится в архив рядом с пометкой Ирсона.',
          en: 'The council keeps the materials for the home. The design goes into the archive next to Irson\'s note.'
        }
      }]
    },
    {
      id: 'd.overload', scene: 'ring', kind: 'decision', year: s => Y(s, 0.75), when: s => s.groupB === 'woken' && maintDebt(s) && !loopV1(s),
      title: { ru: 'Жизнеобеспечение на пределе', en: 'Life support at the limit' },
      context: {
        ru: s => `На борту бодрствуют ${ppl(s.watch + 20)}. Контур воды после аварии рассчитан на сорок; запас кончается через два года. Ремонтников с допуском нет.`,
        en: s => `${s.watch + 20} people are awake aboard. After the failure the water loop is sized for forty; the reserve runs out in two years. There are no qualified repair hands.`
      },
      options: s => [
        {
          id: 'sleep',
          label: { ru: 'Вернуть в сон группу Б и ещё десятерых', en: 'Put group B and ten more back to sleep' },
          known: {
            ru: ['Тридцать человек тратят по циклу сна.', 'Вахта снова тонкая: ремонт медленнее, но на всех хватает воды.'],
            en: ['Thirty people each spend a sleep cycle.', 'The watch is thin again: repairs are slower, but there is water for all.']
          },
          effect: st => { st.overload = 'sleep'; },
          record: {
            ru: 'Тридцать человек возвращаются в капсулы. Ирсон подписывает каждое усыпление сам.',
            en: 'Thirty people go back into the capsules. Irson signs each one himself.'
          }
        }
      ].concat(s.materials >= 20 ? [{
        id: 'materials',
        label: { ru: 'Собрать второй контур из материалов', en: 'Build a second loop from the materials' },
        known: {
          ru: ['Материалы для высадки −20%.', 'Все остаются на вахте.'],
          en: ['Landing materials −20%.', 'Everyone stays on watch.']
        },
        effect: st => { st.overload = 'materials'; st.materials -= 20; },
        record: {
          ru: 'Второй контур воды собирают полгода — из того, что везли строить дом.',
          en: 'The second water loop takes half a year to build — from what they were carrying to build a home.'
        }
      }] : []).concat([{
        id: 'hold',
        label: { ru: 'Тянуть на запасе', en: 'Run on the reserve' },
        known: {
          ru: ['Ни циклов, ни материалов.', 'Запаса на два года; дальше — как выдержит контур.'],
          en: ['No cycles, no materials.', 'Reserves for two years; after that — as long as the loop holds.']
        },
        effect: st => { st.overload = 'hold'; if (st.watch - 11 < 20) st.dutchman = true; },
        record: {
          ru: 'Совет решает тянуть. Через два года контур воды отказывает в обоих кольцах сразу.',
          en: 'The council decides to hold on. Two years later the water loop fails in both rings at once.'
        }
      }])
    },
    {
      id: 'a2.collapse', scene: 'ring', kind: 'instrument', year: s => Y(s, 0.75) + 2, when: s => s.overload === 'hold' && !s.dutchman && !loopV1(s),
      effect: s => { s.dead += 31; s.loopDead = 31; s.watch = Math.max(0, s.watch - 11); },
      title: { ru: 'Медицинский журнал · отказ контура', en: 'Medical log · the loop fails' },
      text: {
        ru: s => `Контур воды отказал. Группа Б и одиннадцать человек вахты погибли, пока остальные перекрывали кольцо. На вахте осталось ${ppl(s.watch)}.`,
        en: s => `The water loop has failed. Group B and eleven of the watch died while the others sealed the ring. ${s.watch} people remain on watch.`
      }
    },
    sosDrift('d.sos.drift', s => s.overload === 'hold' && !s.dutchman && !loopV1(s)),
    sosEnd('drift', 'vault'),
    dutchmanEnd('x.dutchman', s => s.dutchman && !loopV1(s), s => Y(s, 0.75) + 2, s => { s.dead += 31; s.loopDead = 31; s.watch = Math.max(0, s.watch - 11); }),
    {
      id: 'a2.probe', scene: 'drift', kind: 'instrument',
      year: s => Math.max(s.year, Y(s, 0.75), Math.min(probeTimes(s, s.scout).data, Y(s, 0.87))),
      when: s => s.scout > 0 && probeTimes(s, s.scout).data < brake(s),
      effect: s => { const w = M.worldOf(s.target); s.worldSeen = s.scoutTuned || M.badWorld(s.target) ? w : 'unclear'; },
      title: { ru: 'Спектры зонда', en: 'Probe spectra' },
      text: {
        ru: s => { const w = M.worldOf(s.target), tuned = s.scoutTuned; return `Зонд прошёл систему ${nmG(s)} на ${fb(probeTimes(s, s.scout).vp, 'ru')}. Сигнал шёл до корабля несколько лет.
` + ({
          open: tuned ? 'Ближняя к поясу жизни планета: вода и кислород в атмосфере, давление выше земного. Высадка без куполов возможна.' : 'Ближняя к поясу жизни планета: атмосфера есть. Какие в ней газы, общая программа не различила.',
          dome: tuned ? 'Ближняя к поясу жизни планета приливно захвачена: пар на дневной стороне, лёд на ночной. Жить можно на терминаторе, под куполами.' : 'Ближняя к поясу жизни планета: атмосфера есть, температура по диску резко неравномерна. Что это значит, общая программа не различила.',
          hostile: 'Ближняя к поясу жизни планета: плотная углекислая атмосфера, поверхность горячее четырёхсот градусов. Для высадки непригодна. Остаются орбита и спутники.',
          none: 'На расчётной орбите ближней к поясу жизни планеты ничего нет: в земных данных это был шум активности звезды. Остальные планеты — горячие каменные шары.',
          ruined: 'Ближняя к поясу жизни планета расколота: по разломам светится расплав, вокруг — дуга обломков.'
        })[w]; },
        en: s => { const w = M.worldOf(s.target), tuned = s.scoutTuned; return `The probe crossed the ${nm(s, 'en')} system at ${fb(probeTimes(s, s.scout).vp, 'en')}. The signal took several years to reach the ship.
` + ({
          open: tuned ? 'The planet nearest the habitable zone: water and oxygen in the atmosphere, pressure above Earth\'s. Landing without domes is possible.' : 'The planet nearest the habitable zone: it has an atmosphere. Which gases, the general programme could not tell.',
          dome: tuned ? 'The planet nearest the habitable zone is tidally locked: vapour on the day side, ice on the night side. Life is possible on the terminator, under domes.' : 'The planet nearest the habitable zone: it has an atmosphere, and the temperature across the disc is sharply uneven. What that means, the general programme could not tell.',
          hostile: 'The planet nearest the habitable zone: a dense carbon-dioxide atmosphere, surface hotter than four hundred degrees. Unfit for landing. Orbit and moons remain.',
          none: 'There is nothing at the predicted orbit of the planet nearest the habitable zone: in Earth\'s data it was noise from the star\'s activity. The other planets are hot balls of rock.',
          ruined: 'The planet nearest the habitable zone is shattered: melt glows along the faults, and an arc of debris surrounds it.'
        })[w]; }
      }
    },

    Object.assign(skipTo(0.87), { id: 's.d8', when: s => !ownStory(s) }),
    {
      id: 'a2.silence', scene: 'drift', kind: 'instrument', year: s => Y(s, 0.87), when: s => !ownStory(s),
      title: { ru: 'Журнал связи', en: 'Comms log' },
      text: {
        ru: s => `Очередное сообщение корабля поддержки не пришло. Последнее было обычным: «Все спят. Курс штатный».
Причин никто не знает. Вахта отмечает молчание и продолжает слушать.` + (s.highPower ? '' : '\n\nИрсон перечитывает свою запись в инженерном архиве — ту, где решение опиралось на теплообменники поддержки.'),
        en: s => `The support ship's next message has not come. The last one was routine: "All asleep. Course nominal."
No one knows why. The watch logs the silence and keeps listening.` + (s.highPower ? '' : "\n\nIrson rereads his entry in the engineering archive — the one where the decision relied on the support ship's heat exchangers.")
      }
    },
    {
      id: 'd.support', scene: 'drift', kind: 'decision', year: s => Y(s, 0.87), when: s => !ownStory(s),
      title: { ru: 'Молчание поддержки', en: "The support ship's silence" },
      context: {
        ru: 'Искать — значит отдать на год обсерваторию, двух человек и энергию. Сигнал ещё успевает догнать поддержку до её последнего безопасного срока; через год — нет.',
        en: 'Searching means giving up the observatory, two people and power for a year. A signal can still reach the support ship before its last safe date; a year from now it cannot.'
      },
      options: [
        {
          id: 'search',
          label: { ru: 'Искать: обсерватория, люди, энергия', en: 'Search: observatory, people, power' },
          known: {
            ru: s => [reader(s, 'ru') ? `Слабый тепловой след прочтёт ${reader(s, 'ru')}.` : 'Слабые спектры читать некому: искать будут вслепую.', 'Материалы для высадки −5%: детали приёмника. Исследования цели — на год позже.'],
            en: s => [reader(s, 'en') ? `A faint heat trace can be read by ${reader(s, 'en')}.` : 'No one can read faint spectra: the search will be blind.', 'Landing materials −5%: receiver parts. Target research slips a year.']
          },
          effect: st => { st.materials -= 5; if (!st.preview) st.support = reader(st, 'ru') ? 'found' : 'lost'; },
          record: {
            ru: s => s.support === 'found'
              ? `Через одиннадцать месяцев ${reader(s, 'ru')} находит поддержку по тепловому следу. Корабль цел: отказал привод антенны. По нашему вызову экипаж будят; антенну чинят за неделю. Встреча — как назначено.`
              : 'Год поиска ничего не дал: слабый след теряется в шуме, прочесть его некому. Поддержку продолжают слушать.',
            en: s => s.support === 'found'
              ? `Eleven months later ${reader(s, 'en')} finds the support ship by its heat trace. The ship is intact: the antenna drive failed. At our call its crew is woken; the antenna is fixed in a week. The rendezvous stands.`
              : 'A year of searching gives nothing: the faint trace is lost in the noise, and no one can read it. They keep listening.'
          }
        },
        {
          id: 'listen',
          label: { ru: 'Слушать дальше', en: 'Keep listening' },
          known: {
            ru: ['Ни людей, ни энергии.', 'Если поддержка жива, но не слышит нас, она пройдёт мимо точки встречи.'],
            en: ['No people, no power.', "If the support ship is alive but can't hear us, it will miss the rendezvous."]
          },
          effect: st => { if (!st.preview) st.support = 'lost'; },
          record: {
            ru: 'Совет решает слушать дальше. Эфир молчит.',
            en: 'The council decides to keep listening. The channel stays silent.'
          }
        }
      ]
    },

    { id: 's.d9', kind: 'skip', toYear: s => brake(s),
      label: { ru: s => `Промотать до года ${Math.round(brake(s))} · парус`, en: s => `Skip ahead to year ${Math.round(brake(s))} · the sail` } },
    {
      id: 'a2.sail', scene: 'sail', kind: 'instrument', year: s => brake(s),
      title: { ru: 'Инженерный журнал · торможение', en: 'Engineering log · braking' },
      text: {
        ru: s => `Плазменный магнит включён. Антенны на корме гонят ток по облаку плазмы, и поле раздувается в пузырь шириной в тысячи километров. Межзвёздный газ упирается в него — скорость начинает падать.
До ${nmG(s)} — ${yrs(s.arrive - brake(s))} торможения.
Ступень разгона — в ${Math.round(M.MISS_AU * (brake(s) - M.ACC) / stageYears(s))} а.е. в стороне от курса. Теперь она уходит вперёд: систему цели пройдёт за ${yrs(s.arrive - stagePass(s))} до нас.
Резерв манёвров: ${f1(s.reserve, 'ru')}% паспортного.${s.highPower ? '' : ' Резерв повышенной мощности утрачен.'}
Материалы для высадки: ${Math.round(s.materials)}% запаса.`,
        en: s => `Plasma magnet on. Antennas at the stern drive current through a plasma cloud, and the field inflates into a bubble thousands of kilometres across. Interstellar gas presses against it — speed begins to fall.
${yrsEn(s.arrive - brake(s))} of braking to ${nm(s, 'en')}.
The acceleration stage is ${Math.round(M.MISS_AU * (brake(s) - M.ACC) / stageYears(s))} AU off our course. Now it pulls ahead: it will pass the target system ${yrsEn(s.arrive - stagePass(s))} before us.
Manoeuvre reserve: ${f1(s.reserve, 'en')}% of rated.${s.highPower ? '' : ' High-power reserve lost.'}
Landing materials: ${Math.round(s.materials)}% of stock.`
      }
    },
    // ------------------------------------------------------------ АКТ III · ТОРМОЖЕНИЕ И ПРИБЫТИЕ
    { id: 's.e1', kind: 'skip', toYear: s => Y3(s),
      label: { ru: s => `Промотать до года ${Math.round(Y3(s))} · смена подхода`, en: s => `Skip ahead to year ${Math.round(Y3(s))} · the approach watch` } },
    {
      // первой в акте: ракурс экрана — вылет паруса с Земли (камера идёт за ним)
      id: 'a3.epoch3', scene: 'epoch3', kind: 'bulletin', year: s => Y3(s),
      act: { ru: 'Акт III · Торможение и прибытие', en: 'Act III · Braking and arrival' },
      title: { ru: s => `Сводка Кольца · отправлена с Земли ${yrs(lag(s, Y3(s)))} назад`, en: s => `Ring bulletin · sent from Earth ${yrsEn(lag(s, Y3(s)))} ago` },
      text: {
        ru: s => `По лучу лазерных станций ушла экспедиция эпохи III: парус, разогнанный светом с Земли до 0,2c, и плазменный магнит для торможения — как у нас, только легче. Второй раз её не разогнать: станции остаются дома.
` + (src(s) ? `Она летит к ${nameAt(EPOCH3.far, 'ru')} — дальше нашей цели — и доберётся до неё быстрее, чем мы до своей.` : (contactRun(s) ? 'Она летит к ε Индейца — к источнику сигнала, куда мы не пошли. Там она будет лет через шестьдесят.' : 'Она летит к ε Индейца, к источнику сигнала: это и есть обещанная следующая экспедиция. Там она будет лет через шестьдесят.')),
        en: s => `An epoch III expedition has left along the beam of the laser stations: a sail driven by light from Earth to 0.2c, and a plasma magnet for braking — like ours, only lighter. It cannot be driven a second time: the stations stay at home.
` + (src(s) ? `It is bound for ${nameAt(EPOCH3.far, 'en')}, farther than our target, and will reach it sooner than we reach ours.` : (contactRun(s) ? 'It is bound for ε Indi — the signal source we did not go to. It will be there in some sixty years.' : 'It is bound for ε Indi, the signal source: this is the promised next expedition. It will be there in some sixty years.'))
      }
    },
    {
      id: 'a3.watch', illus: 'approach-watch', scene: 'ring', kind: 'transcript', year: s => Y3(s),
      title: { ru: 'Смена подхода', en: 'The approach watch' },
      text: {
        ru: s => `Смена подхода принимает корабль. Штурман — Селина Вей. Она училась у Орина Дала в одно из его коротких пробуждений: несколько недель рядом с ним и привычка всё перепроверять. Боится она не самой опасности, а удобного ответа модели там, где чутья уже мало. Кора спит.

Инженер смены — Тамир Вент из группы Б. ` + (!s.choices['d.heat'] ? 'Его группа спала весь дрейф: контур охлаждения обошёлся без компромиссов. Он считает каждый процент запаса.' : s.groupB === 'woken'
          ? 'Его разбудили аварийно, когда Ирсон выбрал полный контур. Он знает, во что кораблю обошлись годы его вахты, и не хочет тратить резерв на то, что можно решить дешевле.'
          : s.blueprint === 'built'
            ? 'Его группу сохранил компромисс Ирсона, а резерв мощности вернул капельный радиатор по чертежу Кольца. Он помнит, сколько материалов ушло на радиатор, и считает каждый процент запаса.'
          : s.highPower
            ? 'Его группу спас второй теплообменник, собранный из материалов для высадки. Он знает, из чего его собрали, и считает каждый процент запаса.'
            : 'О выборе Ирсона он узнал из архива при пробуждении: за его сон заплатили резервом повышенной мощности. Он считает себя должником Ирсона и не хочет тратить оставшийся резерв на то, что можно решить дешевле.'),
        en: s => `The approach watch takes over the ship. The navigator is Selina Vei. She learned from Orin Dal during one of his short wakings: a few weeks beside him and a habit of checking everything twice. What she fears is not danger itself but the opposite: accepting the model's convenient answer where instinct no longer reaches. Kora is asleep.

The watch engineer is Tamir Vent, from group B. ` + (!s.choices['d.heat'] ? 'His group slept through the drift: the cooling loop managed without compromises. He counts every percent of stock.' : s.groupB === 'woken'
          ? 'He was woken in the emergency when Irson chose the full loop. He knows what his years on watch cost the ship, and he does not want the reserve spent on anything that can be solved more cheaply.'
          : s.blueprint === 'built'
            ? "His group was kept by Irson's compromise, and the droplet radiator from the Ring's design brought the high-power reserve back. He remembers how much material the radiator took, and he counts every percent of stock."
          : s.highPower
            ? 'His group was saved by the second exchanger, built from the landing materials. He knows what it was made of, and he counts every percent of stock.'
            : "He learned of Irson's choice from the archive on waking: his sleep was paid for with the high-power reserve. He counts himself Irson's debtor and does not want the remaining reserve spent on anything that can be solved more cheaply.")
      }
    },
    {
      id: 'a3.med', scene: 'vault', overlay: 'sleepers', kind: 'instrument', year: s => Y3(s),
      effect: s => { s.lost = lossesOf(s, Y3(s)).total + s.dead; },
      title: { ru: 'Медицинский журнал · итог дрейфа', en: 'Medical log · the drift in sum' },
      text: {
        ru: s => { const L = lossesOf(s, Y3(s)); return `Погибли в пути: ${ppl(L.total + s.dead)}.
Отказы капсул: ${L.capsule}. Смерть при пробуждении: ${L.revival}. Несчастные случаи на вахте: ${L.accident}. Рак от облучения: ${L.cancer}.${s.dead ? ` В происшествиях: ${s.dead}.` : ''}
Имена умерших читают вслух на каждой пересменке; список висит у входа в зал анабиоза.
Облучение продолжает счёт: у спящих раки проявятся годы спустя, уже у цели. По модели — ещё около ${L.later}.`; },
        en: s => { const L = lossesOf(s, Y3(s)); return `Died on the road: ${L.total + s.dead}.
Capsule failures: ${L.capsule}. Deaths on waking: ${L.revival}. Accidents on watch: ${L.accident}. Radiation cancers: ${L.cancer}.${s.dead ? ` In incidents: ${s.dead}.` : ''}
The names of the dead are read aloud at every handover; the list hangs at the entrance to the anabiosis hall.
The radiation keeps counting: in the sleepers, cancers will show years later, at the target. The model expects about ${L.later} more.`; }
      }
    },

    { id: 's.e2', kind: 'skip', toYear: warnAt, when: s => !supplyS(s),
      label: { ru: s => `Промотать до года ${s.arrive - 5} · вход в систему`, en: s => `Skip ahead to year ${s.arrive - 5} · entering the system` } },
    // ---- у источника сигнала: Тёмная звезда
    {
      id: 'a3.dark', scene: 'dark', kind: 'instrument', year: warnAt, when: src,
      title: { ru: 'Навигационный журнал · вход в систему', en: 'Navigation log · entering the system' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, warnAt(s)), 'ru')}. Вход в систему ${nmG(s)}.
Тёмная звезда: пара коричневых карликов классов T1 и T6 в полутора тысячах а.е. от главной звезды. В видимом свете их почти нет, в инфракрасном они ярки; вахта ведёт их ${hasIR(s) ? `с года ${Y(s, 0.87)} — инфракрасной обсерваторией из паспорта` : 'последние три года'}. Источник сигнала — у них.
Неизвестно: поток пыли, который пара собирает из слабого пояса обломков — с Земли его не видно.`,
        en: s => `Velocity ${fb(vAt(s, warnAt(s)), 'en')}. Entering the ${nm(s, 'en')} system.
The Dark Star: a pair of brown dwarfs, classes T1 and T6, fifteen hundred AU from the main star. In visible light they are almost absent; in infrared they are bright. The watch has tracked them ${hasIR(s) ? `since year ${Y(s, 0.87)} — with the infrared observatory from the passport` : 'for the last three years'}. The signal source is beside them.
Unknown: the dust stream the pair gathers from a faint debris belt — too faint to see from Earth.`
      }
    },
    {
      id: 'a3.error', scene: 'dark', kind: 'transcript', year: warnAt, when: src,
      title: { ru: 'Ошибка вахты', en: 'The watch error' },
      text: {
        ru: `На вахте — Дан Осгер и двое инженеров; до конца смены два дня. Счётчики ударов на фронтальном щите медленно растут. Дан давно не интерпретатор: он записывает рост как скачок плотности среды — по инструкции Орина, ниже её порога.

Когда порог пересечён, будят Селину. Шесть часов до ясного сознания. Селина разворачивает инфракрасный телескоп вбок от щита и видит слабое свечение пылевого хвоста: корабль идёт по краю потока к карлику. Несколько дней уже потеряны.

Один из инженеров требует записать ошибку на Дана. Селина открывает инструкцию: порог задал Орин — для межзвёздной среды, а не для потока у тёмного тела.`,
        en: `On watch are Dan Osger and two engineers; two days left of the shift. The impact counters on the forward shield are slowly rising. Dan stopped being an interpreter long ago: he logs the rise as a jump in medium density — under Orin's instruction, below its threshold.

When the threshold is crossed, they wake Selina. Six hours to clear consciousness. Selina turns the infrared telescope aside from the shield and sees the faint glow of a dust tail: the ship is running along the edge of a stream toward the dwarf. Several days are already lost.

One of the engineers demands the error be put down to Dan. Selina opens the instruction: the threshold was set by Orin — for the interstellar medium, not for a stream around a dark body.`
      }
    },
    {
      id: 'a3.check', scene: 'dark', kind: 'transcript', year: warnAt, when: src,
      title: { ru: 'Совет смены · поток', en: 'Watch council · the stream' },
      text: {
        ru: s => (v1(s) ? `Окно для манёвра — ${s.riskVersion >= 5 ? days(win(s), 'ru') : 'тридцать суток'}; прежняя задержка вахты уже учтена. Измерение может и не захватить опасную полосу.\n\n` : '') + `Научная модель оценивает проход по краю потока как безопасный — 91%, при условии, что модель верна и набор гипотез полон. Селина поднимает архивный отчёт другой экспедиции Кольца: там верно определили природу похожего объекта и ошиблись в плотности потока вокруг. Спектр рассеянного света с такого расстояния не различает, мелкая там пыль или крупная.

— Разбудить Кору, — говорит Селина. — Она увидит неоднозначность раньше нас.

Врач называет цену: у Коры один полный цикл. Пробуждение будет последним, три недели до работоспособности.

— Не надо будить, — говорит Тамир. — Нужна не догадка, а измерение. ${probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'Инспекционный зонд ещё в трюме' : 'Второй зонд из комплекта ещё в трюме') : 'Малый зонд с прямыми детекторами частиц соберём из материалов'}.`,
        en: s => (v1(s) ? `The manoeuvre window is ${s.riskVersion >= 5 ? days(win(s), 'en') : 'thirty days'}; the watch's earlier delay is already counted. A measurement may not catch the dangerous band.\n\n` : '') + `The science model rates passage along the stream's edge as safe — 91%, given the model is correct and the hypothesis set complete. Selina pulls an archived report from another Ring expedition: they identified the nature of a similar object correctly and got the density of the stream around it wrong. From this range the spectrum of scattered light cannot tell fine dust from coarse.

"Wake Kora," says Selina. "She'll see the ambiguity sooner than we will."

The physician names the price: Kora has one full cycle left. This waking will be her last, and three weeks to working fitness.

"Don't wake her," says Tamir. "We need a measurement, not a guess. ${probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'The inspection probe is still in the hold' : 'The second probe from the kit is still in the hold') : "We'll build a small probe with direct particle detectors out of the materials"}."`
      }
    },
    {
      id: 'd.stream', scene: 'dark', kind: 'decision', year: warnAt, when: src,
      title: { ru: 'Поток у Тёмной звезды', en: 'The stream at the Dark Star' },
      context: {
        ru: 'Через несколько дней поток будет ближе. Решение не отложить.',
        en: 'In a few days the stream will be closer. The decision cannot wait.'
      },
      rec: s => !v1(s) ? null : probeOK(s) ? { id: 'probe', why: { ru: 'прямое измерение быстрее всего', en: 'a direct measurement is fastest' } }
        : (s.taught || s.koraYear) ? { id: 'student', why: { ru: 'зонда нет; Кору бережём для цели', en: 'no probe; Kora is kept for the target' } }
        : { id: 'kora', why: { ru: 'зонда нет, читать спектр больше некому', en: 'no probe and no one else to read the spectrum' } },
      options: s => v1(s) ? streamOptions1(s) : [
        {
          id: 'probe',
          label: { ru: 'Зонд Тамира', en: "Tamir's probe" },
          known: {
            ru: s => [probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'Инспекционный зонд: прямые детекторы, без трат материалов.' : 'Второй зонд из комплекта: прямые детекторы, без трат материалов.') : 'Зонд из материалов для высадки: −5% запаса.', 'Кора остаётся для цели.', windowLine(s, 'probe', 'ru')],
            en: s => [probesLeft(s) ? (eqOf(s).probes === 'inspect' ? 'The inspection probe: direct detectors, no materials spent.' : 'The second kit probe: direct detectors, no materials spent.') : 'A probe from landing materials: −5% of stock.', 'Kora is kept for the target.', windowLine(s, 'probe', 'en')]
          },
          effect: st => { if (!probesLeft(st)) st.materials -= 5; strike(st, 'probe'); },
          record: {
            ru: 'Зонд идёт в поток на полдня раньше корабля. Детекторы пишут прямо: крупных частиц больше расчётного. Модель ошиблась, как и у той экспедиции из архива.',
            en: 'The probe enters the stream half a day ahead of the ship. The detectors say it plainly: there are more coarse particles than calculated. The model was wrong, as it was for that expedition in the archive.'
          }
        },
        {
          id: 'kora',
          label: { ru: 'Разбудить Кору', en: 'Wake Kora' },
          known: {
            ru: s => ['Её последнее пробуждение: у цели Кору будить будет нельзя.', windowLine(s, 'kora', 'ru'), riskLine(s, 'ru')],
            en: s => ['Her last waking: at the target Kora cannot be woken again.', windowLine(s, 'kora', 'en'), riskLine(s, 'en')]
          },
          effect: st => { st.koraLast = true; st.koraAwake += 1; strike(st, 'kora'); },
          record: {
            ru: 'Через три недели Кора садится к телескопу и находит за потоком фоновую звезду. Звезда гаснет сильнее, чем от мелкой пыли: крупных частиц больше расчётного. Дан Осгер держит для неё журнал, как сорок лет назад.',
            en: 'Three weeks later Kora sits down at the telescope and finds a background star behind the stream. It dims more than fine dust would dim it: there are more coarse particles than calculated. Dan Osger keeps the log for her, as he did forty years ago.'
          }
        }
      ].concat(s.taught || s.koraYear ? [{
        id: 'student',
        label: { ru: s => s.taught ? 'Разбудить учеников Коры' : 'Разбудить Наю Сорн', en: s => s.taught ? "Wake Kora's students" : 'Wake Naya Sorn' },
        known: {
          ru: s => ['Кора остаётся для цели.', s.taught ? 'Двое, кого она учила в дрейфе, прочтут неоднозначный спектр — медленнее её, но прочтут.' : 'Ная читала спектры одна весь год Коры.', windowLine(s, 'student', 'ru'), riskLine(s, 'ru')],
          en: s => ['Kora is kept for the target.', s.taught ? 'The two she trained in the drift can read an ambiguous spectrum — slower than her, but they can.' : "Naya read the spectra alone through Kora's year.", windowLine(s, 'student', 'en'), riskLine(s, 'en')]
        },
        effect: st => { strike(st, 'student'); },
        record: {
          ru: s => `${s.taught ? 'Ученики Коры' : 'Ная Сорн'} ищут за потоком фоновую звезду — так, как Кора проверяла край облака на четвёртом году.${checkDays(s, 'student') < 26 ? ` С расширенной спектрометрией — за ${checkDays(s, 'student')} суток.` : ''} Через месяц ответ: крупных частиц больше расчётного.`,
          en: s => `${s.taught ? "Kora's students" : 'Naya Sorn'} look for a background star behind the stream — the way Kora checked the cloud's edge in year four.${checkDays(s, 'student') < 26 ? ` With extended spectrometry it takes ${checkDays(s, 'student')} days.` : ''} A month later, the answer: more coarse particles than calculated.`
        }
      }] : []).concat([{
        id: 'model',
        label: { ru: 'Довериться модели', en: 'Trust the model' },
        known: {
          ru: s => ['91% за безопасный проход — если модель верна и набор гипотез полон.', 'Ни циклов, ни материалов, ни времени.', riskLine(s, 'ru')],
          en: s => ['91% for a safe passage — if the model is correct and the hypothesis set complete.', 'No cycles, no materials, no time.', riskLine(s, 'en')]
        },
        effect: st => { strike(st, 'model'); },
        record: {
          ru: 'Корабль идёт по краю потока. Модель ошиблась, как и у той экспедиции из архива.',
          en: 'The ship runs along the edge of the stream. The model was wrong, as it was for that expedition in the archive.'
        }
      }])
    },
    {
      id: 'd.streamRoute', scene: 'dark', kind: 'decision', when: s => src(s) && v1(s) && !!s.streamCheck && !s.streamRoute,
      year: s => s.riskVersion >= 5 ? Math.min(streamTimes(s).warn + (s.streamDays || 0) / 365.25, streamTimes(s).core) : s.arrive - 5,   // v5: решение — когда проверка закончена
      title: { ru: 'Уходить из потока?', en: 'Leave the stream?' },
      context: {
        ru: s => `${s.streamFound ? 'Опасная полоса пересекает курс.' : 'Опасной полосы на курсе не видно — метод видит её не всегда.'} ${windowLine1(s, 'ru')}`,
        en: s => `${s.streamFound ? 'The dangerous band crosses our course.' : 'No dangerous band on our course — the method does not always see it.'} ${windowLine1(s, 'en')}`
      },
      rec: s => s.streamFound ? (canEvade(s) && !lateV1(s) ? { id: 'evade', why: { ru: 'полоса на курсе, уйти успеваем', en: 'the band is on our course and we are in time' } }
        : canEvade(s) && s.riskVersion >= 5 && streamTimes(s).warn + ((s.streamDays || 0) + burnDays(s)) / 365.25 < streamTimes(s).exit ? { id: 'evade', why: { ru: 'до ядра не успеваем, но манёвр сократит время в нём', en: 'we cannot clear the core in time, but the manoeuvre shortens the time inside it' } }
        : { id: 'pass', why: { ru: 'уйти уже не успеваем: удар будет тем же, резерв сбережём', en: 'we can no longer leave in time: the strike will be the same, so the reserve is kept' } })
        : { id: 'pass', why: { ru: 'полосы на курсе не видно', en: 'no band seen on our course' }, assume: { ru: 'опасная полоса не пересекает курс', en: 'the dangerous band does not cross our course' } },
      options: s => (canEvade(s) ? [{
        id: 'evade', label: { ru: 'Уходить', en: 'Leave' },
        known: {
          ru: s => [`Резерв манёвров −${f1(streamDv(s), 'ru')}% паспортного.`, windowLine1(s, 'ru')],
          en: s => [`Manoeuvre reserve −${f1(streamDv(s), 'en')}% of rated.`, windowLine1(s, 'en')]
        },
        cost: st => { st.reserve -= streamDv(st); },
        effect: st => { st.reserve -= streamDv(st); st.streamRoute = 'evade'; },
        record: { ru: 'Совет решает уходить с края потока.', en: 'The council decides to leave the edge of the stream.' }
      }] : []).concat([{
        id: 'pass', label: { ru: 'Пройти по краю', en: 'Pass along the edge' },
        known: {
          ru: s => ['Резерв манёвров цел.', s.streamFound ? 'Полоса на курсе: удар неизбежен.' : `Признак полосы не обнаружен; метод видит её ${pctFrom(STREAM.sense[s.streamCheck], 'ru')}.`, riskLine(s, 'ru')],
          en: s => ['The manoeuvre reserve is kept.', s.streamFound ? 'The band is on our course: the strike is certain.' : `No sign of the band detected; the method sees it ${pctFrom(STREAM.sense[s.streamCheck], 'en')}.`, riskLine(s, 'en')]
        },
        effect: st => { st.streamRoute = 'pass'; },
        record: { ru: 'Совет решает пройти по краю, не меняя курса.', en: 'The council decides to pass along the edge without changing course.' }
      }])
    },
    {
      id: 'a3.hit1', scene: 'dark', kind: 'instrument', year: s => s.riskVersion >= 5 ? streamPlan(s).coreEnd : s.arrive - 5,
      when: s => src(s) && v1(s) && (s.riskVersion >= 5 ? streamPlan(s).hit : streamHitNow(s)),
      effect: s => { if (s.riskVersion >= 5) return;                     // v5: удар и последствия считает модель щита
        const lv = hitLevel(s); s.streamHit = lv; s.streamCause = breached(s) ? 'shield' : 'power';   // причина — до пробоя у кромки
        if (lv >= 3) { incident(s, 'stream', 0, { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, lost: true, aboard: aliveOf(s), year: s.arrive - 5 }); s.lostShip = true; return; }
        s.dead += STREAM.dead[lv]; s.materials -= STREAM.mat[lv]; s.streamDead = STREAM.dead[lv]; s.shieldBreach = true; s.shieldFixed = false;
        incident(s, 'stream', STREAM.dead[lv], { check: s.streamCheck, found: s.streamFound, route: s.streamRoute, year: s.arrive - 5 }); },
      title: { ru: 'Журнал вахты · удар потока', en: 'Watch log · the stream hits' },
      text: {
        ru: s => s.riskVersion >= 5 ? streamLogV5(s, 'ru') : (s.streamRoute === 'evade' ? 'Манёвр опоздал: корабль ещё в потоке. ' : 'Корабль идёт по краю потока — и полоса крупных частиц на курсе. ') + (s.lostShip ? '' : s.streamHit === 1
          ? `Щит пробит у кромки: в носовом отсеке гибнут ${ppl(s.streamDead)}. Заплата — из материалов для высадки, −${STREAM.mat[1]}%.`
          : (s.streamCause === 'shield' ? `Сектор щита, пробитый ещё у облака, не держит: удар проходит в зал анабиоза. Погибли ${ppl(s.streamDead)}; −${STREAM.mat[2]}% материалов.` : `Без резерва мощности слабые коррекции тянутся сутками: поток успевает пройти по корпусу. Погибли ${ppl(s.streamDead)}; −${STREAM.mat[2]}% материалов.`)),
        en: s => s.riskVersion >= 5 ? streamLogV5(s, 'en') : (s.streamRoute === 'evade' ? 'The manoeuvre came too late: the ship is still in the stream. ' : 'The ship runs along the edge of the stream — and the band of coarse particles is on its course. ') + (s.lostShip ? '' : s.streamHit === 1
          ? `The shield is breached at the rim: ${s.streamDead} die in the forward compartment. The patch comes from the landing materials, −${STREAM.mat[1]}%.`
          : (s.streamCause === 'shield' ? `The shield sector breached back at the cloud does not hold: the strike reaches the anabiosis hall. ${s.streamDead} are dead; −${STREAM.mat[2]}% materials.` : `Without the high-power reserve the weak corrections drag on for days: the stream has time to sweep the hull. ${s.streamDead} are dead; −${STREAM.mat[2]}% materials.`))
      }
    },
    {
      id: 'x.lost', scene: 'dark', kind: 'end', year: streamAt, when: s => s.lostShip,
      title: { ru: 'Последняя передача', en: 'The last transmission' },
      text: {
        ru: s => `Поток прошёл сквозь сектор щита, пробитый ещё у облака. За ним — магистрали зала анабиоза. Манёвра, который увёл бы корабль за шесть часов, не было: теплообменники отдали группе Б, а слабые коррекции заняли бы дни.

Последняя передача ушла на Землю и к Кольцу: журнал, измеренный поток, медицинский журнал, имена. Она дойдёт через ${yrs(Math.round(M.star(s.target).d))}.

Остов кувыркается и уходит дальше по прежней траектории: на ${f1(M.speedAt(s.year, s.beta, s.arrive, s.tMag) * 299792.458, 'ru')} км/с ни карлик, ни ε Индейца его не удержат — он пройдёт систему насквозь. Обломки щита летят рядом.

Экспедиция окончена. Следующая — к другой цели — получит измеренный поток, журнал и траекторию остова.`,
        en: s => `The stream went through the shield sector breached back at the cloud. Behind it lay the anabiosis hall's mains. There was no manoeuvre to take the ship out in six hours: the heat exchangers had gone to group B, and weak corrections would have taken days.

The last transmission went to Earth and the Ring: the log, the measured stream, the medical log, the names. It will arrive in ${yrsEn(Math.round(M.star(s.target).d))}.

The wreck tumbles on along its former trajectory: at ${f1(M.speedAt(s.year, s.beta, s.arrive, s.tMag) * 299792.458, 'en')} km/s neither the dwarf nor ε Indi can hold it — it will pass straight through the system. Shield fragments fly beside it.

The expedition is over. The next one — to another target — will receive the measured stream, the log and the trajectory of the wreck.`
      }
    },
    {
      id: 'a3.hit', scene: 'dark', kind: 'instrument', year: s => s.arrive - 5, when: s => src(s) && s.streamHit > 0 && !s.lostShip && !v1(s),
      title: { ru: 'Журнал вахты · удар потока', en: 'Watch log · the stream hits' },
      text: {
        ru: s => s.streamHit === 1
          ? 'Корабль в потоке раньше, чем уходит из него. Крупная частица пробивает щит у кромки: в носовом отсеке гибнут двое ремонтников. Заплата — из материалов для высадки, −10%.'
          : (breached(s) ? 'Корабль в потоке раньше, чем уходит из него. Сектор щита, пробитый ещё у облака, не держит: удар проходит в зал анабиоза.' : 'Корабль в потоке раньше, чем уходит из него. Без резерва мощности слабые коррекции тянутся днями: поток успевает пройти по залу анабиоза.') + ' Группа из двадцати пяти капсул потеряна, в носовом отсеке гибнут двое ремонтников. Материалы для высадки −15%.' + (eqOf(s).energy === 'reactor5' ? ' Реактор поселения в грузовом отсеке разбит.' : eqOf(s).energy === 'dual' ? ' Один из двух блоков поселения разбит; второй цел.' : ''),
        en: s => s.streamHit === 1
          ? 'The ship is in the stream before it can leave it. A coarse particle punches through the shield at the rim: two repair hands die in the forward compartment. The patch comes from the landing materials, −10%.'
          : (breached(s) ? 'The ship is in the stream before it can leave it. The shield sector breached back at the cloud does not hold: the strike reaches the anabiosis hall.' : 'The ship is in the stream before it can leave it. Without the high-power reserve the weak corrections drag on for days: the stream has time to sweep the anabiosis hall.') + ' A group of twenty-five capsules is lost; two repair hands die in the forward compartment. Landing materials −15%.' + (eqOf(s).energy === 'reactor5' ? ' The settlement reactor in the cargo bay is smashed.' : eqOf(s).energy === 'dual' ? ' One of the two settlement units is smashed; the other is whole.' : '')
      }
    },
    {
      id: 'a3.burn', scene: 'dark', kind: 'instrument', year: s => s.riskVersion >= 5 && s.streamRoute === 'evade' ? streamPlan(s).done : s.arrive - 5, when: s => src(s) && (!v1(s) || s.streamRoute === 'evade'),
      effect: s => { if (!v1(s)) s.reserve -= dvPct(s, s.highPower ? DV.stream : DV.streamWeak); },
      title: { ru: 'Инженерный журнал · манёвр', en: 'Engineering log · manoeuvre' },
      text: {
        ru: s => v1(s) && !s.highPower ? `Безопасный манёвр — короткий и мощный, но резерв повышенной мощности отдан группе Б ${yrs(heatAgo(s))} назад. Остаётся серия слабых коррекций: двенадцать суток.${s.streamHit ? '' : ' Корабль уходит с края потока.'}
Резерв манёвров: −${f1(dvPct(s, DV.streamWeak), 'ru')}%.
Траектория изменена: корабль пройдёт у самого карлика.` : (s.highPower
          ? `Безопасный манёвр один — короткий и мощный. Контур с резервом повышенной мощности держит его: корабль уходит с края потока за шесть часов.\nРезерв манёвров: −${f1(dvPct(s, DV.stream), 'ru')}%.`
          : `Безопасный манёвр один — короткий и мощный. Именно его исключил компромисс Ирсона ${yrs(heatAgo(s))} назад: резерв повышенной мощности отдан группе Б. Это было известно заранее и лежит в открытом архиве. Остаётся серия слабых коррекций с потерями между ними.\nРезерв манёвров: −${f1(dvPct(s, DV.streamWeak), 'ru')}% — ниже того, что нужно для работы в системе и посадки.`) +
          `\nТраектория изменена: корабль пройдёт у самого карлика.`,
        en: s => v1(s) && !s.highPower ? `The safe manoeuvre is short and powerful, but the high-power reserve went to group B ${yrsEn(heatAgo(s))} ago. What remains is a series of weak corrections: twelve days.${s.streamHit ? '' : ' The ship leaves the edge of the stream.'}
Manoeuvre reserve: −${f1(dvPct(s, DV.streamWeak), 'en')}%.
Trajectory changed: the ship will pass close by the dwarf.` : (s.highPower
          ? `There is one safe manoeuvre — short and powerful. The loop with the high-power reserve holds it: the ship leaves the stream edge in six hours.\nManoeuvre reserve: −${f1(dvPct(s, DV.stream), 'en')}%.`
          : `There is one safe manoeuvre — short and powerful. Exactly the one Irson's compromise ruled out ${yrsEn(heatAgo(s))} ago: the high-power reserve went to group B. This was known in advance and sits in the open archive. What remains is a series of weak corrections, with losses between them.\nManoeuvre reserve: −${f1(dvPct(s, DV.streamWeak), 'en')}% — below what is needed for work in the system and for landing.`) +
          `\nTrajectory changed: the ship will pass close by the dwarf.`
      }
    },
    {
      id: 'd.sos.stream', scene: 'dark', kind: 'decision', when: s => src(s) && s.streamHit === 2 && !s.lostShip,
      title: { ru: 'Звать помощь?', en: 'Call for help?' },
      context: {
        ru: s => `Блок из двадцати пяти капсул потерян. Остальные блоки изолированы; охлаждение зала идёт по обходным магистралям. До орбиты у ${nmG(s)} — пять лет торможения.

Можно идти к цели как есть. Можно уснуть всем, кроме двенадцати, и звать помощь.`,
        en: s => `A block of twenty-five capsules is lost. The other blocks are isolated; the hall is cooled through bypass mains. Five years of braking remain to orbit at ${nm(s, 'en')}.

They can go on to the target as they are. Or everyone but twelve can go to sleep and call for help.`
      },
      options: [{
        id: 'carry',
        label: { ru: 'Идти к цели как есть', en: 'Go on to the target as we are' },
        known: {
          ru: ['Экспедиция продолжается: прибытие через пять лет.', 'Обходные магистрали держат, пока их обслуживают.'],
          en: ['The expedition goes on: arrival in five years.', 'The bypass mains hold as long as they are tended.']
        },
        effect: st => {},
        record: {
          ru: 'Совет решает идти дальше. Вахта учится жить рядом с пустым блоком.',
          en: 'The council decides to go on. The watch learns to live next to the empty block.'
        }
      }, sosOption('stream')]
    },
    sosEnd('stream', 'vault'),
    // ---- у других целей
    {
      id: 'a3.flare', scene: 'drift', kind: 'instrument', year: s => s.arrive - 5, when: s => !src(s) && M.isRedDwarf(s.target) && !ownStory(s),
      effect: s => { if (!hasIR(s)) s.materials -= 5; },
      title: { ru: 'Журнал вахты · вспышка звезды', en: 'Watch log · stellar flare' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 5), 'ru')}. Вспышка ${nmG(s)}: за несколько минут звезда стала ярче в рентгене в тысячи раз. Красные карлики вспыхивают часто; у самой звезды такие потоки сдирают атмосферы планет.
` + (hasIR(s)
          ? 'Инфракрасная обсерватория заметила рост активного пятна за трое суток. Вахта заранее ушла в убежище, корабль развернули щитом к звезде. Потерь нет.'
          : 'Предупреждения не было. Вахта добралась до убежища за сорок минут; доза — как за год дрейфа. Антенны плазменного магнита и радиаторы обожжены; ремонт — из материалов для высадки, −5%.'),
        en: s => `Velocity ${fb(vAt(s, s.arrive - 5), 'en')}. A flare on ${nm(s, 'en')}: within minutes the star grew thousands of times brighter in X-rays. Red dwarfs flare often; close to the star such storms strip the atmospheres off planets.
` + (hasIR(s)
          ? 'The infrared observatory saw the active spot growing three days ahead. The watch went to the shelter in advance and the ship was turned shield-first to the star. No losses.'
          : 'There was no warning. The watch reached the shelter in forty minutes; the dose was a year of drift. The plasma magnet antennas and the radiators are scorched; repairs from landing materials, −5%.')
      }
    },
    {
      id: 'a3.approach', scene: 'drift', kind: 'instrument', year: s => s.arrive - 5, when: s => !src(s) && !M.isRedDwarf(s.target),
      title: { ru: 'Навигационный журнал · вход в систему', en: 'Navigation log · entering the system' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 5), 'ru')}. Вход в систему ${nmG(s)}. Телескоп корабля видит планеты сам — без зондов и снимков Кольца.` + (s.worldSeen ? ' То, что было известно, подтверждается.' : ' Какой там мир, станет ясно у орбиты.'),
        en: s => `Velocity ${fb(vAt(s, s.arrive - 5), 'en')}. Entering the ${nm(s, 'en')} system. The ship's telescope sees the planets itself — no probes, no Ring images.` + (s.worldSeen ? ' What was known is confirmed.' : ' What kind of world it is will become clear at orbit.')
      }
    },

    // ---- спасатель v3: магнит тормозит слабее расчётного
    {
      id: 'a3r.brake', scene: 'sail', kind: 'instrument', year: s => s.arrive - 4.75, when: rescueS,
      title: { ru: 'Навигационный журнал · меньше расчётного', en: 'Navigation log · below the calculation' },
      text: {
        ru: s => `Акселерометры и независимая навигация показывают одно: магнит тормозит слабее расчётного. Ная проверяет плазменный анализатор — среда разрежена. Селина выводит предел поправки: ещё ${dd(RESCUE.delay, 'ru')}, если участок протяжённый.

— Орин оставил нам расчёт. Решать, сколько ему ещё верить, приходится нам.

${s.scout ? 'Передовые измерения зонда лежат в архиве необработанными.' : 'Передовых измерений нет: зонд не выпускали.'}`,
        en: s => `The accelerometers and independent navigation agree: the magnet is braking less than calculated. Naya checks the plasma analyser — the medium is sparse. Selina displays the correction limit: another ${dd(RESCUE.delay, 'en')} if the stretch is extensive.

"Orin left us the calculation. We have to decide how much longer to trust it."

${s.scout ? "The probe's forward measurements sit in the archive, unprocessed." : 'There are no forward measurements: no probe was launched.'}`
      }
    },
    {
      id: 'd.rescueBrake', scene: 'sail', kind: 'decision', when: rescueS,
      title: { ru: 'Сберечь срок или резерв', en: 'Preserve time or reserve' },
      context: {
        ru: `Если разрежение протяжённое, прибытие сдвинется на ${RESCUE.delay} суток. Состояние склада известно только по сводке «штатно»: какой запас времени у Оттепели, станет ясно у склада.`,
        en: `If the sparse stretch is extensive, arrival moves by ${RESCUE.delay} days. The store's state is known only from the summary "nominal": how much time Thaw has will be clear only at the store.`
      },
      rec: s => { const burn = s.reserve >= dvPct(s, RESCUE.burn);
        return burn && s.scout ? { id: 'measure', why: { ru: 'передовые данные ещё можно использовать для ранней коррекции', en: 'forward data can still guide an early correction' }, assume: { ru: 'измеренный участок представляет оставшийся путь торможения', en: 'the measured stretch represents the remaining braking path' } }
          : burn ? { id: 'burn', why: { ru: 'запас склада неизвестен — время дороже резерва', en: "the store's margin is unknown — time is worth more than reserve" }, assume: { ru: 'остатка резерва хватит на работу у склада', en: 'the remaining reserve will cover work at the store' } }
          : { id: 'wait', why: { ru: 'резерва на коррекцию нет', en: 'there is no reserve for a correction' }, assume: { ru: 'магнит завершит торможение в объявленном диапазоне', en: 'the magnet will finish within the stated range' } }; },
      options: s => { const burn = s.reserve >= dvPct(s, RESCUE.burn), out = [];
        const pct = lang => `${f1(dvPct(s, RESCUE.burn), lang)}% (${RESCUE.burn} ${lang === 'ru' ? 'км/с' : 'km/s'})`;
        const record = { ru: s2 => s2.brakeMethod === 'wait' ? 'Корабль тормозит магнитом. Поправку покажет навигационная сверка.' : s2.brakeFound ? `Передовые данные показывают протяжённый участок разрежения. Импульс даётся сразу: резерв −${pct('ru')}.`
            : s2.brakeMethod === 'measure' ? 'В передовых данных протяжённого участка не видно. Корабль тормозит магнитом.' : `Импульс даётся сейчас: резерв −${pct('ru')}. Прибытие — по паспорту.`,
          en: s2 => s2.brakeMethod === 'wait' ? 'The ship brakes on the magnet. The navigation check will show the correction.' : s2.brakeFound ? `The forward data show an extensive sparse stretch. The impulse is given at once: reserve −${pct('en')}.`
            : s2.brakeMethod === 'measure' ? 'The forward data show no extensive stretch. The ship brakes on the magnet.' : `The impulse is given now: reserve −${pct('en')}. Arrival as in the passport.` };
        if (burn && s.scout) out.push({ id: 'measure', label: { ru: 'Проверить передовые измерения', en: 'Check the forward measurements' },
          known: { ru: ['Трое суток на обработку данных зонда; корабль тем временем тормозит, прибытие не сдвигается.', `Найдём протяжённый участок — сразу импульс: резерв манёвров −${pct('ru')}.`, 'Передовые данные видят такой участок в восьми случаях из десяти; отрицательный результат не исключает разрежения.'],
            en: ["Three days to process the probe's data; the ship keeps braking meanwhile, arrival does not move.", `If we find an extensive stretch, an impulse at once: manoeuvre reserve −${pct('en')}.`, 'Forward data show such a stretch eight times in ten; a negative result does not rule out a sparse medium.'] },
          effect: st => brakeApply(st, 'measure'), record });
        if (burn) out.push({ id: 'burn', label: { ru: 'Добавить тормозной импульс', en: 'Add a braking impulse' },
          known: { ru: [`Резерв манёвров −${pct('ru')}.`, 'Поправка на разрежение снята: прибытие — по паспорту, каким бы ни оказался участок. Потерянного времени и людей импульс не вернёт.'],
            en: [`Manoeuvre reserve −${pct('en')}.`, 'The sparse-medium correction is removed: arrival as in the passport, whatever the stretch turns out to be. The impulse cannot recover time or people already lost.'] },
          cost: st => { st.reserve -= dvPct(st, RESCUE.burn); },
          effect: st => brakeApply(st, 'burn'), record });
        out.push({ id: 'wait', label: { ru: 'Ждать магнит', en: 'Wait for the magnet' },
          known: { ru: ['Без расхода.', `Если разрежение протяжённое, прибытие позже на ${RESCUE.delay} суток: каждые сутки опоздания вычитаются из запаса склада, каким бы он ни оказался.`],
            en: ['No expenditure.', `If the sparse stretch is extensive, arrival is ${RESCUE.delay} days later: every day of delay comes out of the store's margin, whatever it turns out to be.`] },
          effect: st => brakeApply(st, 'wait'), record });
        return out; }
    },
    // ---- мимо Тёмной звезды (только у источника): пара в 1460 а.е. от пути — журнал тридцать второй принимают по радио
    { id: 's.e4', kind: 'skip', toYear: darkAt, when: src,
      label: { ru: s => `Промотать до года ${Math.floor(darkAt(s))} · мимо Тёмной звезды`, en: s => `Skip ahead to year ${Math.floor(darkAt(s))} · past the Dark Star` } },
    {
      id: 'a3.disc', scene: 'relic', kind: 'transcript', year: darkAt, when: src,
      effect: s => { s.sourceFound = true; },                          // источник локализован, журнал тридцать второй принят
      title: { ru: 'Мимо Тёмной звезды', en: 'Past the Dark Star' },
      text: { ru: s => discText(s, 'ru'), en: s => discText(s, 'en') }
    },
    {
      id: 'a3.phrase', scene: 'relic', kind: 'document', year: darkAt, when: src,
      title: { ru: 'Журнал тридцать второй · запись без номера', en: "The Thirty-Second's log · unnumbered entry" },
      text: {
        ru: `«Вспоминали сегодня Землю. Она красивее всего, что мы видели за всю дорогу».

Речь шла не о мире у Тёмной звезды — о доме, куда они не вернутся. Обрывок этой фразы дошёл до Земли и стал присказкой, с которой летел корабль.

Архив записывает полный текст рядом с обрывком, без комментария.`,
        en: `"We remembered Earth today. It is more beautiful than anything we have seen on the whole road."

It was not about the world at the Dark Star — it was about the home they would not return to. A fragment of this sentence reached Earth and became the saying the ship flew with.

The archive records the full text beside the fragment, without comment.`
      }
    },
    {
      id: 'a3.kora', illus: 'beacon-memory', scene: 'relic', kind: 'transcript', year: darkAt, when: src,
      effect: s => { if (!s.koraLast) { s.koraLast = true; s.koraAwake += 1; } },
      title: { ru: 'Память маяка', en: "The beacon's memory" },
      text: {
        ru: s => (s.koraLast ? 'Кора уже на вахте — со своего последнего пробуждения.' : 'Для чтения памяти диска и журнала совет будит Кору — её последний цикл.') + ` Ей около сорока. Дан Осгер, её ученик, за десятилетия ремонтных смен стал старше своей учительницы.

Они работают вместе над фрагментами. Навигационные записи маяка читаются частично и указывают на другие точки. Один фрагмент — повторяющийся, почти музыкальный узор без видимого назначения — не может прочесть и Кора. Архив записывает его как есть.

Ни одна станция Кольца не регистрировала сигналов того же типа кода.`,
        en: s => (s.koraLast ? 'Kora is already on watch — since her last waking.' : 'To read the memory of the disc and the log, the council wakes Kora — her last cycle.') + ` She is about forty. Dan Osger, her student, has over decades of repair watches grown older than his teacher.

They work on the fragments together. The beacon's navigation records read in part and point to other places. One fragment — a repeating, almost musical pattern with no visible purpose — not even Kora can read. The archive records it as it is.

No station of the Ring has ever registered signals with that type of code.`
      }
    },

    { id: 's.e3', kind: 'skip', toYear: s => s.arrive - 4,
      label: { ru: s => `Промотать до года ${s.arrive - 4} · разворот`, en: s => `Skip ahead to year ${s.arrive - 4} · the turnaround` } },
    {
      id: 'a3.flip', scene: 'flip', kind: 'instrument', year: s => s.arrive - 4,
      title: { ru: 'Инженерный журнал · последний участок', en: 'Engineering log · the last leg' },
      text: {
        ru: s => `Скорость ${fb(vAt(s, s.arrive - 4), 'ru')}. Плазменный магнит выключен: на малой скорости пузырь разрастается до десятков тысяч километров и тормозит неточно, а для входа в систему нужна тяга.
Корабль развёрнут кормой вперёд. Двигатель ядра гасит остаток скорости за четыре года.
Щит теперь смотрит назад. На такой скорости удар пылинки в ${Math.round((s.beta / vAt(s, s.arrive - 4)) ** 2)} раз слабее, чем в дрейфе.
Ступень разгона прошла систему ${yrs(s.arrive - 4 - stagePass(s))} назад, в тысяче а.е. в стороне. Её никто не видел.`,
        en: s => `Velocity ${fb(vAt(s, s.arrive - 4), 'en')}. The plasma magnet is off: at low speed the bubble swells to tens of thousands of kilometres and brakes imprecisely, and entering the system needs thrust.
The ship is turned stern-first. The core engine takes off the remaining speed over four years.
The shield now faces backward. At this speed a dust grain hits ${Math.round((s.beta / vAt(s, s.arrive - 4)) ** 2)} times softer than in the drift.
The acceleration stage passed the system ${yrsEn(s.arrive - 4 - stagePass(s))} ago, a thousand AU aside. No one saw it.`
      }
    },
    {
      id: 'a3r.brakeResult', scene: 'flip', kind: 'instrument', year: s => s.arrive - 4, when: rescueS,
      effect: s => brakeSettle(s),
      title: { ru: 'Навигационный журнал · исправленная дата', en: 'Navigation log · the corrected date' },
      text: {
        ru: s => `Навигационная сверка завершена. Прибытие — год ${f2(arriveX(s), 'ru')}; ${s.brakeDelay ? `позже паспорта на ${dd(s.brakeDelay, 'ru')}: участок разрежения оказался протяжённым` : 'по паспорту'}.${s.brakeMethod === 'burn' || s.brakeFound ? (s.brakeLong ? ' Импульс пригодился: без него опоздание было бы ' + dd(RESCUE.delay, 'ru') + '.' : ' Участок оказался коротким: импульс не понадобился.') : ''}

Селина отправляет исправленную лоцию и сохраняет прежнюю рядом. В строке Оттепели отдельно стоят прогноз живых к завершению помощи и ближайший порог потери.`,
        en: s => `The navigation check is complete. Arrival: year ${f2(arriveX(s), 'en')}; ${s.brakeDelay ? `${dd(s.brakeDelay, 'en')} later than the passport: the sparse stretch was extensive` : 'as in the passport'}.${s.brakeMethod === 'burn' || s.brakeFound ? (s.brakeLong ? ` The impulse paid off: without it we would be ${dd(RESCUE.delay, 'en')} late.` : ' The stretch was short: the impulse was not needed.') : ''}

Selina sends the corrected sailing directions and keeps the original beside them. Thaw's entry lists the forecast living count at the end of assistance and the next loss threshold separately.`
      }
    },

    // ---- прибытие
    { id: 's.e5', kind: 'skip', toYear: s => rescueS(s) ? arriveX(s) : s.arrive,
      label: { ru: s => rescueS(s) ? 'Промотать до прибытия к складу' : `Промотать до года ${s.arrive} · прибытие`, en: s => rescueS(s) ? 'Skip ahead to the arrival at the store' : `Skip ahead to year ${s.arrive} · arrival` } },
    {
      id: 'a3.orbit', scene: 'arrival', kind: 'instrument', year: s => rescueS(s) ? arriveX(s) : s.arrive,
      effect: s => { s.worldSeen = M.worldOf(s.target); },
      title: { ru: 'Навигационный журнал · прибытие', en: 'Navigation log · arrival' },
      text: {
        ru: s => { const w = M.worldOf(s.target); return (w === 'none' ? `Корабль на орбите ${nmG(s)}, в поясе жизни. ` : `Корабль на орбите планеты у ${nmG(s)}. `) + ({
          open: 'Ближняя к поясу жизни планета: вода, облака, суша. Воздух по спектрам пригоден для дыхания — после проверки на месте.',
          dome: 'Планета приливно захвачена: пар на дневной стороне, лёд на ночной. Жить можно на терминаторе, под куполами.',
          hostile: 'Под сплошной облачной крышей — парник, поверхность горячее четырёхсот градусов. Высадки не будет.',
          ruined: 'Кора планеты расколота; по разломам светится расплав, вокруг — дуга обломков. Высадки не будет.',
          none: 'Пригодного мира нет: в поясе жизни пусто, известные планеты слишком горячи или без твёрдой поверхности.'
        })[w] + `
Резерв манёвров: ${f1(s.reserve, 'ru')}% паспортного. Материалы для высадки: ${Math.round(s.materials)}% запаса.
` + (ownStory(s) ? '' : s.support === 'found' ? 'Корабль поддержки в пути: у точки встречи будет через год.' : 'Точка встречи с кораблём поддержки пуста. Маяки сброшены.'); },
        en: s => { const w = M.worldOf(s.target); return (w === 'none' ? `The ship is in orbit around ${nm(s, 'en')}, in the habitable zone. ` : `The ship is in orbit around a planet of ${nm(s, 'en')}. `) + ({
          open: 'The planet nearest the habitable zone: water, clouds, land. By the spectra the air is breathable — once checked on site.',
          dome: 'The planet is tidally locked: vapour on the day side, ice on the night side. Life is possible on the terminator, under domes.',
          hostile: 'Beneath an unbroken cloud deck, a greenhouse: the surface is hotter than four hundred degrees. There will be no landing.',
          ruined: "The planet's crust is split; melt glows along the faults, and an arc of debris surrounds it. There will be no landing.",
          none: 'There is no habitable world: the habitable zone is empty, and the known planets are too hot or have no solid surface.'
        })[w] + `
Manoeuvre reserve: ${f1(s.reserve, 'en')}% of rated. Landing materials: ${Math.round(s.materials)}% of stock.
` + (ownStory(s) ? '' : s.support === 'found' ? 'The support ship is on its way: it will reach the rendezvous in a year.' : 'The rendezvous point with the support ship is empty. Beacons dropped.'); }
      }
    },
    {
      id: 'a3c.greeting', illus: 'colony-greeting', scene: 'arrival', kind: 'transcript', year: s => s.arrive,
      when: s => s.mission === 'contact' && !!M.colonyAt(s.target) && M.colonyAt(s.target).awake > 0 && ['viable', 'establishing', 'declining'].includes(M.colonyAt(s.target).status),
      effect: s => { s.colonyLink = true; },                           // двусторонняя связь с поселением состоялась
      title: { ru: s => `«${M.colonyAt(s.target).ru}» · связь`, en: s => `${M.colonyAt(s.target).en} · contact` },
      text: {
        ru: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `— Сорок первая, говорит дежурная поселения «${c.ru}». Ваш вызов принят. Добро пожаловать в систему.

Первые пакеты ещё разделены минутами светового хода; Селина Вей передаёт ответы целиком, не перебивая запись.

— Идём по программе контакта. Нас ${ppl(aliveOf(s))}, включая спящих. Присылаем медицинский журнал и перечень запасов.

${L > 0 ? `— В пути умерли ${ppl(L)}. В списке они отмечены отдельно; прошу сохранить их имена.` : '— Потерь в пути нет. Сверьте, пожалуйста, наш список.'}

${c.status === 'declining' ? '— Мы сами держимся на пределе. Встречающую группу примем; размещение остальных придётся рассчитывать вместе.' : c.status === 'establishing' ? '— Поселение ещё строится. Встречающую группу примем; для остальных сначала посчитаем жильё, воду и рабочие руки.' : '— Встречающую группу примем. Приём всей экспедиции обсудим с вами после проверки жилья, питания и медицинских смен.'}

Позднее в орбитальном узле их встречают дежурная и техник; на столе лежат две ведомости, корабельная и местная.

${(GREET_LAST[c.id] || GREET_LAST.default).ru}`; },
        en: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `"Forty-First, this is the duty officer of ${c.en}. Your call is received. Welcome to the system."

The first packets are still separated by minutes of light travel; Selina Vei sends complete replies without interrupting the recording.

"We are here under the contact programme. There are ${aliveOf(s)} of us, including sleepers. We're sending our medical log and stores inventory."

${L > 0 ? `"${L} died on the way. They are listed separately; please preserve their names."` : '"There were no losses on the way. Please check our roster."'}

${c.status === 'declining' ? '"We are at our own limits. We can receive your visiting party; accommodating everyone else will take a joint assessment."' : c.status === 'establishing' ? '"The settlement is still being built. We can receive your visiting party; first we must work out housing, water and labour for the others."' : '"We can receive your visiting party. We\'ll discuss taking everyone in after checking housing, food and medical staffing."'}

Later, at the orbital facility, the duty officer and a technician meet them; two inventories lie on the table, the ship's and the settlement's.

${(GREET_LAST[c.id] || GREET_LAST.default).en}`; }
      }
    },
    {
      id: 'a3c.silence', scene: 'arrival', kind: 'transcript', year: s => s.arrive,
      when: s => s.mission === 'contact' && !!M.colonyAt(s.target) && M.colonyAt(s.target).status === 'dead',
      title: { ru: s => `«${M.colonyAt(s.target).ru}» · вызов`, en: s => `${M.colonyAt(s.target).en} · the call` },
      text: {
        ru: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `— ${c.ru}, говорит сорок первая. Мы прибыли по программе контакта.

Селина Вей ждёт полный световой оборот до склада и ещё время на ответ человека.

Приходит пакет маяка. Он начинается с той же даты, что запись о гибели базы в земном архиве.

— Это автомат, — говорит Селина. — Запросим состояние каждой капсулы.

На изображении склада различима сорванная створка наружного кожуха.

${L > 0 ? `В журнале отправленного вызова она оставляет и наши потери: ${ppl(L)}. Ответить на эту часть пока некому.` : 'Она сохраняет вызов в журнале: его ещё можно будет дать прослушать тем, кого удастся разбудить.'}`; },
        en: s => { const c = M.colonyAt(s.target), L = roadDead(s); return `"${c.en}, this is the Forty-First. We have arrived under the contact programme."

Selina Vei waits a full light round trip to the store, then allows time for a person to answer.

A beacon packet arrives. It begins with the same date as the record of the base's loss in Earth's archive.

"It's automatic," Selina says. "Request the condition of every capsule."

The image of the store resolves a torn panel on its outer casing.

${L > 0 ? `She includes our losses in the transmitted log: ${L}. There is no one awake to answer that part yet.` : 'She saves the call in the log: anyone they manage to wake can still hear it later.'}`; }
      }
    },
    {
      id: 'a3s.outpost2', scene: 'arrival', kind: 'transcript', year: s => s.arrive, when: supplyS,
      title: { ru: 'Ксилона Ир', en: 'Xylona Ir' },
      text: {
        ru: s => `— Сорок первая, Ксилона Ир. Передаём список последнего пробуждения…

Голос обрывается. Ная Сорн отмечает вспышку на ультрафиолетовом мониторе.

Селина Вей оставляет канал открытым; свет уже пришёл, вернуть предупреждение назад нельзя.

Через паузу местная смена отвечает: питание передатчика отдали насосам.

— Люди остались. Последнюю группу подняли недавно; теперь нас двести пятьдесят.

Селина передаёт оглавление привезённого архива и просит журнал последних ремонтов.${roadDead(s) > 0 ? ` В журнал она вписывает и наших: в пути умерли ${ppl(roadDead(s))}.` : ''}

Позднее у шлюза их встречает старший форпоста; на его рукаве — ключ ручного привода.

— Расскажите, что было в Кольце, пока мы не слышали.`,
        en: s => `"Forty-First, Xylona Ir. Sending the list from the latest waking…"

The voice breaks off. Naya Sorn marks a flare on the ultraviolet monitor.

Selina Vei keeps the channel open; the light has arrived, and no warning can precede it now.

After a pause, the local shift answers: transmitter power was diverted to the pumps.

"The people are still here. We woke the last group recently; there are two hundred and fifty of us."

Selina sends the contents of the archive they brought and asks for the latest repair log.${roadDead(s) > 0 ? ` She enters ours in the log too: ${roadDead(s)} died on the way.` : ''}

Later, the outpost's senior meets them at the airlock, a hand-crank key on his sleeve.

"Tell us what happened in the Ring while we couldn't hear."`
      }
    },
    {
      id: 'a3s.activity2', scene: 'arrival', kind: 'instrument', year: s => s.arrive, when: supplyS,
      title: { ru: 'Журнал вахты · звезда Барнарда', en: "Watch log · Barnard's Star" },
      text: {
        ru: `Ная разносит на экране две записи: свет вспышки и счётчик частиц.

— Свет ослаб. Это ещё не конец бури.

Ирсон накладывает схему монтажа на местную: новое оборудование пока подчиняется старому управлению.

У временного контура сорок пять суток; ждать неизвестного конца активности нельзя.

Без отдельного управления отказ роботов может остановить охлаждение занятой секции.

Местная смена предлагает укрытый пост и независимую линию к насосам.`,
        en: `Naya separates two records on the display: the flare's light and the particle counter.

"The light has faded. That does not mean the storm is over."

Irson overlays the installation plan on the local one: new equipment still answers to old controls.

The temporary loop has forty-five days; they cannot wait for an unknown end to the activity.

Without separate controls, a robot failure could stop cooling in an occupied section.

The local shift proposes a sheltered station and an independent line to the pumps.`
      }
    },
    {
      id: 'd.supplyApproach2', scene: 'arrival', kind: 'decision', year: s => s.arrive, when: supplyS,
      title: { ru: 'Монтаж под вспышками', en: 'Installation under the flares' },
      context: { ru: 'Поток частиц после вспышки не ограничен. У временного контура — сорок пять суток.', en: 'The particle flux after the flare is not bounded. The temporary loop has forty-five days.' },
      rec: s => s.materials >= STORM.protect ? { id: 'protect', why: { ru: 'после вспышки поток частиц ещё не ограничен', en: 'the particle flux after the flare is not yet bounded' }, assume: { ru: 'отдельный пост защитит монтаж; старую схему проверим отдельно', en: 'separate controls protect the installation; the old system needs its own check' } }
        : s.gridBlocks >= 2 && s.materials >= STORM.block ? { id: 'block', why: { ru: 'на укрытый пост материалов нет', en: 'there are no materials for a sheltered station' } }
        : { id: 'fast', why: { ru: 'на защиту материалов нет', en: 'there are no materials for protection' }, assume: { ru: 'роботов достаточно', en: 'robots are enough' } },
      options: s => [{
        id: 'fast', label: { ru: 'Короткая схема, только роботы', en: 'Short procedure, robots only' },
        known: { ru: ['Трое суток, без расхода материалов.', 'Управление общее; отказ монтажа способен остановить охлаждение занятой секции.'], en: ['Three days, no materials.', 'Controls are shared; an installation failure could stop cooling in an occupied section.'] },
        effect: st => { st.supplyDays += 3; if (stormU(st) < STORM.strong) { st.outpostDead += STORM.fastDead; st.deadHere += STORM.fastDead; incident(st, 'supplyExposure', STORM.fastDead, { year: opYear(st) }, 'outpost'); } },
        record: { ru: s => s.incidents && s.incidents.some(i => i.kind === 'supplyExposure') ? `Роботы монтируют по короткой схеме. Через сутки поток частиц останавливает автоматику; занятая секция остывает раньше, чем её успевают перекрыть. Погибли ${ppl(STORM.fastDead)} форпоста.` : 'Роботы монтируют по короткой схеме. Поток частиц держится в умеренных пределах; монтаж закончен за трое суток.',
          en: s => s.incidents && s.incidents.some(i => i.kind === 'supplyExposure') ? `The robots install by the short procedure. A day later the particle flux stops the automation; an occupied section cools before it can be sealed. ${STORM.fastDead} of the outpost are dead.` : 'The robots install by the short procedure. The particle flux stays moderate; the installation is done in three days.' }
      }, {
        id: 'protect', label: { ru: 'Укрытый пост и отдельное управление', en: 'Sheltered station and separate controls' },
        known: { ru: [`Материалы −${STORM.protect}%, десять суток.`, 'Защищает новый монтаж в расчётном диапазоне; состояние старой общей платы остаётся неизвестным.'], en: [`Materials −${STORM.protect}%, ten days.`, 'Protects the new installation within its design range; the old common board remains unverified.'] },
        cost: st => { st.materials -= STORM.protect; },
        effect: st => { st.materials -= STORM.protect; st.supplyDays += 10; st.supplyProtected = true; },
        record: { ru: 'Десять суток собирают укрытый пост. Монтаж идёт под отдельным управлением.', en: 'A sheltered station takes ten days to build. The installation runs under separate controls.' }
      }, {
        id: 'block', label: { ru: 'Выделить вторую сеть насосам', en: 'Dedicate the second grid to the pumps' },
        known: { ru: [`Материалы −${STORM.block}%, трое суток.`, 'Насосы получают независимое питание; вторая сеть корабля занята до разделения систем — переселение пока недоступно.'], en: [`Materials −${STORM.block}%, three days.`, "The pumps get independent power; the ship's second grid is busy until the systems are separated — shelter is unavailable meanwhile."] },
        cost: st => { st.materials -= STORM.block; },
        effect: st => { st.materials -= STORM.block; st.supplyDays += 3; st.supplyIndependent = true; },
        record: { ru: 'Вторую сеть корабля отдают насосам форпоста.', en: "The ship's second grid is given to the outpost's pumps." }
      }].filter(o => o.id === 'fast' || (o.id === 'protect' ? s.materials >= STORM.protect : s.gridBlocks >= 2 && s.materials >= STORM.block))
    },
    {
      id: 'a3s.afterLight', scene: 'arrival', kind: 'transcript', year: opYear, when: supplyS,
      title: { ru: 'После света', en: 'After the light' },
      text: {
        ru: `При пробном подключении новый холодильник повторяет ошибку снятого.

Ная Сорн совмещает журналы: адрес остановки один и тот же.

— Мы заменили прибор, — говорит Ирсон. — Управляет им прежний узел.

Местные показывают, какие линии свели вместе, когда разбирали мастерскую.

Это может быть восстановимый сбой или повреждение общей платы; повторное включение опасно для людей.`,
        en: `During the trial connection, the new cooler repeats the removed unit's error.

Naya Sorn aligns the logs: both stops have the same address.

"We replaced the device," Irson says. "The old node still controls it."

The locals show which lines they combined while dismantling the workshop.

This may be a recoverable fault or damage to the common board; restarting could endanger lives.`
      }
    },
    {
      id: 'd.supplyBus', scene: 'arrival', kind: 'decision', year: opYear, when: supplyS,
      title: { ru: 'Общая плата', en: 'The common board' },
      context: { ru: 'Старый и новый приборы отказывают по одному адресу.', en: 'The old and the new devices fail at the same address.' },
      rec: s => s.materials >= STORM.check + busSplit(s) ? { id: 'check', why: { ru: 'совпадает адрес отказа старого и нового прибора', en: 'the old and the new devices fail at the same address' }, assume: { ru: 'обычная проверка достаточна; отрицательный результат не исключает дефект', en: 'the ordinary check meets the accepted risk; a negative result does not exclude damage' } }
        : s.materials >= busSplit(s) ? { id: 'split', why: { ru: 'на проверку и разделение вместе материалов нет', en: 'not enough materials for both a check and the separation' } }
        : { id: 'replace', why: { ru: 'на разделение материалов нет', en: 'there are no materials for the separation' }, assume: { ru: 'плата исправна', en: 'the board is sound' } },
      options: s => [{
        id: 'replace', label: { ru: 'Заменить контроллер', en: 'Replace the controller' },
        known: { ru: s => [`Материалы −${Math.min(STORM.replace, s.materials)}%, двое суток.`, 'Если общая плата повреждена, повторное включение может погубить людей и капсульную секцию.'], en: s => [`Materials −${Math.min(STORM.replace, s.materials)}%, two days.`, 'If the common board is damaged, restarting could kill people and destroy the capsule section.'] },
        cost: st => { st.materials -= Math.min(STORM.replace, st.materials); },
        effect: st => { st.materials -= Math.min(STORM.replace, st.materials); st.supplyDays += 2; st.busMethod = 'replace'; busRestart(st); },
        record: busRecord
      }, {
        id: 'check', label: { ru: 'Обычная проверка и ремонт', en: 'Standard check and repair' },
        known: { ru: s => [`Проверка: −${STORM.check}% и двое суток, видит половину повреждений.`, `Затем: замена −${STORM.replace}% за двое суток, а если повреждение найдено — разделение −${busSplit(s)}% за двенадцать (итого −${STORM.check + busSplit(s)}%).`], en: s => [`Check: −${STORM.check}% and two days; finds half the damage.`, `Then: replacement −${STORM.replace}% in two days, or, if damage is found, separation −${busSplit(s)}% in twelve (−${STORM.check + busSplit(s)}% in all).`] },
        cost: st => { st.materials -= STORM.check + STORM.replace; },      // найдено — ещё разделение (сказано в «Что известно»)
        effect: st => { st.materials -= STORM.check; st.supplyDays += 2; st.busMethod = 'ordinary'; busCheck(st, 0.5); },
        record: busRecord
      }, {
        id: 'deep', label: { ru: 'Проверка под нагрузкой и ремонт', en: 'Load test and repair' },
        known: { ru: s => [`Проверка: −${STORM.deep}% и шесть суток, видит девять повреждений из десяти.`, `Затем замена (итого −${STORM.deep + STORM.replace}%) или, если найдено, разделение (итого −${STORM.deep + busSplit(s)}%); запас для дома уменьшится.`], en: s => [`Check: −${STORM.deep}% and six days; finds nine in ten.`, `Then replacement (−${STORM.deep + STORM.replace}% in all) or, if found, separation (−${STORM.deep + busSplit(s)}% in all); less stock remains for the home.`] },
        cost: st => { st.materials -= STORM.deep + STORM.replace; },
        effect: st => { st.materials -= STORM.deep; st.supplyDays += 6; st.busMethod = 'deep'; busCheck(st, 0.9); },
        record: busRecord
      }, {
        id: 'split', label: { ru: 'Разделить питание и управление', en: 'Separate power and controls' },
        known: { ru: s => [`Материалы −${busSplit(s)}%, двенадцать суток.${busSplit(s) < STORM.split ? ` Детали изготовлены на корабле (без производства −${STORM.split}%).` : ''}`, 'Независимые линии капсул и связи; выделенная сеть корабля освобождается.'], en: s => [`Materials −${busSplit(s)}%, twelve days.${busSplit(s) < STORM.split ? ` Parts are made aboard the ship (−${STORM.split}% without production).` : ''}`, "Independent capsule and relay lines; the dedicated ship grid is released."] },
        cost: st => { st.materials -= busSplit(st); },
        effect: st => { st.materials -= busSplit(st); st.supplyDays += 12; st.busMethod = 'split'; st.busResolved = true; st.supplyIndependent = false; },
        record: busRecord
      }].filter(o => o.id === 'replace' || ({ check: STORM.check + busSplit(s), deep: STORM.deep + busSplit(s), split: busSplit(s) })[o.id] <= s.materials)
    },
    {
      id: 'a3s.future', scene: 'arrival', kind: 'document', year: opYear, when: supplyS,
      title: { ru: 'Совместный план', en: 'The joint plan' },
      text: {
        ru: s => `Ива Лорн просит считать отдельно работающие системы, спасённых людей и обещания.

Местный совет кладёт рядом свою очередь ремонтов.

Связь нужна не только для просьб: у форпоста остались наблюдения и неотправленные письма. Капсулы нужны не только для сна: они возвращают смене возможность отдыхать.

Ирсон показывает цену каждой доступной работы и зависимость от корабельной сети.${s.capsLost ? ' Капсульная секция потеряна: до сорок пятого дня людям нужны места.' : ''}

Решение принимают вместе; подпись под поставкой не заменит местную приёмку.`,
        en: s => `Iva Lorn asks for working systems, people saved and promises to be counted separately.

The local council lays its repair queue beside hers.

The link is for more than requests: the outpost still has observations and unsent letters. Capsules are for more than sleep: they give the shift a chance to rest.

Irson shows the cost of every available job and its dependence on the ship's grid.${s.capsLost ? ' The capsule section is lost: people need berths before day forty-five.' : ''}

They decide together; a delivery signature cannot replace local acceptance.`
      }
    },
    {
      id: 'a3s.outpost', illus: 'xylona-lock', scene: 'arrival', kind: 'transcript', year: s => s.arrive, when: s => s.mission === 'supply' && !supplyS(s),
      title: { ru: 'Ксилона Ир', en: 'Xylona Ir' },
      text: {
        ru: s => { const L = roadDead(s); return `— Сорок первая, Ксилона Ир слышит вас. Подождите, мы доводим антенну вручную.

Свет идёт две секунды в одну сторону. Селина Вей отвечает и оставляет каналу время вернуться.

— Привезли архив Кольца. Сначала передадим оглавление.

Форпост не слышал Кольцо ${yrs(s.arrive - xyl().relayYears)}. Капсульный запас иссяк ${yrs(Math.max(1, s.arrive - xyl().capsuleYears))} назад; сеть на сто шестьдесят держит двести пятьдесят.

Позднее у шлюза их встречает старший форпоста; на его рукаве закреплён ключ ручного привода.

${L > 0 ? `— До нас дошли не все, — говорит Селина. — В пути умерли ${ppl(L)}. Имена передадим вместе с журналом.` : '— Все наши дошли, — говорит Селина.'}

Старший пропускает их внутрь:

— Расскажите, что было в Кольце, пока мы не слышали.`; },
        en: s => { const L = roadDead(s); return `"Forty-First, Xylona Ir hears you. Give us a moment; we are aiming the antenna by hand."

Light takes two seconds each way. Selina Vei answers, then leaves time for the reply.

"We brought the Ring archive. We'll send the contents first."

The outpost has not heard the Ring for ${yrsEn(s.arrive - xyl().relayYears)}. Capsule spares ran out ${yrsEn(Math.max(1, s.arrive - xyl().capsuleYears))} ago; a system built for a hundred and sixty supports two hundred and fifty.

Later, the outpost's senior meets them at the airlock, a hand-crank key clipped to his sleeve.

${L > 0 ? `"Not all of us made it," Selina says. "${L} died on the way. We'll send their names with the log."` : '"All of us made it," Selina says.'}

He lets them through.

"Tell us what happened in the Ring while we couldn't hear."`; }
      }
    },
    {
      id: 'a3s.activity', scene: 'arrival', kind: 'instrument', year: s => s.arrive, when: s => s.mission === 'supply' && !supplyS(s),
      title: { ru: 'Журнал вахты · звезда Барнарда', en: "Watch log · Barnard's Star" },
      text: {
        ru: s => `Звезда в активной фазе: вспышки — раз в несколько суток. Антенна передатчика и холодильники капсул ставятся снаружи; электроника монтажа под вспышкой выгорает.${hasIR(s) ? ' ИК-обсерватория видела эту фазу ещё на подлёте: защиту заготовили заранее.' : ''} Временный контур форпоста перегружен — двести пятьдесят человек на сто шестьдесят мест — и держит ещё около сорока пяти суток; дальше форпост живёт на воде корабля, в тесноте, пока не поставят свои системы.`,
        en: s => `The star is in an active phase: flares every few days. The transmitter antenna and the capsule coolers go up outside; installation electronics burn out under a flare.${hasIR(s) ? ' The IR observatory saw this phase on approach: the shielding was prepared in advance.' : ''} The outpost's temporary loop is overloaded — two hundred and fifty people on a hundred and sixty places — and holds about forty-five more days; after that the outpost lives crowded on the ship's water until its own systems are in.`
      }
    },
    {
      id: 'd.supplyApproach', scene: 'arrival', kind: 'decision', when: s => s.mission === 'supply' && !supplyS(s),
      title: { ru: 'Монтаж под вспышками', en: 'Installation under the flares' },
      context: {
        ru: 'Ждать сколько угодно нельзя: временный контур форпоста кончается через сорок пять суток.',
        en: "Waiting indefinitely is not an option: the outpost's temporary loop runs out in forty-five days."
      },
      options: s => [{
        id: 'protect',
        label: { ru: 'Защитить монтаж', en: 'Shield the installation' },
        known: {
          ru: [`Материалы для высадки −${hasIR(s) ? 5 : 10}%: экраны для наружных работ.`, 'Четырнадцать суток — и работа идёт под любой вспышкой.'],
          en: [`Landing materials −${hasIR(s) ? 5 : 10}%: screens for the outside work.`, 'Fourteen days — and the work goes on under any flare.']
        },
        effect: st => { st.approach = 'protect'; st.materials -= hasIR(st) ? 5 : 10; },
        record: { ru: 'Экраны из материалов для высадки встают над площадкой. Монтаж идёт и под вспышками.', en: 'Screens made from the landing materials go up over the site. The work goes on under the flares too.' }
      }, {
        id: 'wait',
        label: { ru: 'Переждать активность', en: 'Wait out the activity' },
        known: {
          ru: ['Не меньше тридцати суток ожидания; после — пятнадцать суток запаса у форпоста.', 'В перегруженном форпосте за это время погибнут трое самых слабых.'],
          en: ['At least thirty days of waiting; afterwards, fifteen days of margin at the outpost.', 'In the overloaded outpost the three weakest will die meanwhile.']
        },
        effect: st => { st.approach = 'wait'; st.deadHere += 3; st.outpostDead += 3; },
        record: { ru: 'Совет решает ждать. Через тридцать два дня звезда успокаивается. На склоне у антенны — три новые могилы.', en: 'The council decides to wait. Thirty-two days later the star quiets. Three new graves on the slope by the antenna.' }
      }, {
        id: 'block',
        label: { ru: 'Отдать резервный блок корабельной сети', en: "Give the ship's reserve power block" },
        known: {
          ru: ['Трое суток: резервный блок питает защитное поле над площадкой и выгорает.', 'У корабля остаётся одна сеть из двух: второй бригады и колец для переселенцев питать будет нечем.'],
          en: ['Three days: the reserve block powers a protective field over the site and burns out.', "The ship is left with one grid of two: there will be nothing to power a second crew or rings for settlers."]
        },
        effect: st => { st.approach = 'block'; st.gridBlocks = 1; },
        record: { ru: 'Резервный блок отдаёт поле за трое суток и гаснет. Монтаж закончен до первой большой вспышки.', en: 'The reserve block gives its field for three days and dies. The installation is done before the first big flare.' }
      }]
    },
    {
      id: 'd.deliver2', scene: 'arrival', kind: 'decision', year: opYear, when: supplyS,
      title: { ru: 'План работ', en: 'The work plan' },
      context: {
        ru: s => `${supplySrc(s, 'ru')} ${s.capsLost ? `Капсульная секция потеряна: до сорок пятого дня людям нужны места — прошло ${s.supplyDays} суток.` : 'Систему примут только после испытаний; до приёмки охлаждение держит корабль.'}`,
        en: s => `${supplySrc(s, 'en')} ${s.capsLost ? `The capsule section is lost: people need berths before day forty-five — ${s.supplyDays} days have passed.` : 'A system is accepted only after testing; until then the ship carries the cooling.'}`
      },
      rec: s => { const ids = deliverOptions(s).map(o => o.id), pick = (id, ru, en) => ({ id, why: { ru, en } });
        if (s.capsLost) return ids.includes('shelter') ? pick('shelter', 'капсульная секция потеряна — сначала места', 'the capsule section is lost — berths first') : pick('abort', 'ни один план не держит людей', 'no plan keeps people alive');
        return ids.includes('capsules') ? Object.assign(pick('capsules', 'сначала устойчивое жизнеобеспечение', 'stable life support first'), { assume: { ru: 'испытанная схема сохранит работоспособность до приёмки', en: 'the tested system will remain functional until acceptance' } })
          : ids.includes('shelter') ? pick('shelter', 'на капсулы материалов нет — сначала места', 'no materials for capsules — berths first') : pick(ids[0], 'других работ нет', 'no other work is possible'); },
      options: s => deliverOptions(s)
    },
    {
      id: 'd.deliver', scene: 'arrival', kind: 'decision', year: s => s.arrive, when: s => s.mission === 'supply' && !supplyS(s),
      title: { ru: 'Что ставить первым', en: 'What to install first' },
      context: {
        ru: s => `Монтажная бригада одна. Энергии форпоста хватает на одну большую работу за раз. ${supplySrc(s, 'ru')}`,
        en: s => `There is one installation crew. The outpost's power covers one big job at a time. ${supplySrc(s, 'en')}`
      },
      options: s => supplyOptions(s, [
        {
          id: 'relay',
          label: { ru: 'Сначала связь', en: 'The link first' },
          known: {
            ru: s => { const f = supplyForecast(s, 'relay'); return ['Специалист и передатчик: форпост снова слышит Кольцо через полгода.', f.capsOK ? 'Капсулы и вода — через три года: пока форпост живёт в тесноте на воде корабля, шестеро самых слабых не доживут.' : 'Капсульный блок собрать уже не из чего: капсулы не будут восстановлены, шестеро самых слабых не доживут, остальные — на пределе.']; },
            en: s => { const f = supplyForecast(s, 'relay'); return ['The specialist and the transmitter: the outpost hears the Ring again in half a year.', f.capsOK ? "Capsules and water in three years: while the outpost lives crowded on the ship's water, six of the weakest will not survive." : 'There will be nothing left to build the capsule unit from: the capsules will not be restored, six of the weakest will not survive, the rest at the limit.']; }
          },
          effect: st => { st.deliver = 'relay'; st.deadHere += 6; st.outpostDead += 6; supplyBuild(st, 'relay'); },
          record: {
            ru: s => 'Через полгода форпост слышит Кольцо. Сводки за семьдесят лет читают вслух в столовой, неделю подряд.' + (s.capsOK ? '' : ' Капсульного блока не будет: собрать его не из чего.'),
            en: s => 'Half a year later the outpost hears the Ring. Seventy years of bulletins are read aloud in the mess hall, a week on end.' + (s.capsOK ? '' : ' There will be no capsule unit: there is nothing to build it from.')
          }
        },
        {
          id: 'capsules',
          label: { ru: 'Сначала капсулы и вода', en: 'Capsules and water first' },
          known: {
            ru: s => { const f = supplyForecast(s, 'caps'); return ['Всем хватает воды и капсул; лишних будят реже.', f.relayOK ? 'Связь — через три года: ещё три года форпост не слышит Кольцо.' : 'Передатчик собрать уже не из чего: форпост так и не услышит Кольцо.']; },
            en: s => { const f = supplyForecast(s, 'caps'); return ['Water and capsules for everyone; fewer need to stay awake.', f.relayOK ? 'The link in three years: three more years without the Ring.' : 'There will be nothing left to build the transmitter from: the outpost will never hear the Ring.']; }
          },
          effect: st => { st.deliver = 'capsules'; supplyBuild(st, 'caps'); },
          record: {
            ru: s => 'Бригада начинает с контура воды и капсул.' + (s.relayOK ? ' Передатчик ждёт своей очереди три года.' : ' Передатчика не будет: материалы кончились на капсулах.'),
            en: s => 'The crew starts with the water loop and the capsules.' + (s.relayOK ? ' The transmitter waits its turn for three years.' : ' There will be no transmitter: the materials ran out on the capsules.')
          }
        }
      ].concat(supplyBothCost(s) != null ? [{
        id: 'both',
        label: { ru: 'И то и другое сразу', en: 'Both at once' },
        known: {
          ru: [`Материалы для высадки −${supplyBothCost(s)}%: второй монтажный комплект${['tools', 'printQC'].includes(eqOf(s).prod) ? ' — со станков' : ''}.`, 'Связь через полгода, капсулы — сразу.'],
          en: [`Landing materials −${supplyBothCost(s)}%: a second installation kit${['tools', 'printQC'].includes(eqOf(s).prod) ? ' — from the machine tools' : ''}.`, 'The link in half a year, capsules at once.']
        },
        effect: st => { st.deliver = 'both'; st.materials -= supplyBothCost(st); supplyBuild(st, 'relay'); },
        record: {
          ru: 'Второй комплект собирают из того, что везли для себя. Через полгода форпост и слышит Кольцо, и спит спокойно.',
          en: 'The second kit is built from what they carried for themselves. Half a year later the outpost both hears the Ring and sleeps safely.'
        }
      }] : []).concat([{
        id: 'shelter',
        label: { ru: 'Переселить девяносто на корабль', en: 'Move ninety aboard the ship' },
        known: {
          ru: s => { const f = supplyForecast(s, 'relay', SHELTER); return [`Материалы для высадки −${SHELTER}%: койки и регенерация воздуха для девяноста; их кольца питает вторая сеть корабля.`, 'Давка кончается сразу, без смертей. Форпост будет зависеть от корабля: его кольца станут частью форпоста навсегда.', f.relayOK && f.capsOK ? 'Монтаж — по очереди, без спешки: обе системы.' : `Монтаж — по очереди: ${f.relayOK ? 'только связь' : f.capsOK ? 'только капсулы' : 'систем собрать не из чего'}.`]; },
          en: s => { const f = supplyForecast(s, 'relay', SHELTER); return [`Landing materials −${SHELTER}%: berths and air regeneration for ninety; the ship's second grid powers their rings.`, 'The crush ends at once, with no deaths. The outpost will depend on the ship: its rings become part of the outpost for good.', f.relayOK && f.capsOK ? 'The installation goes in turn, without haste: both systems.' : `The installation goes in turn: ${f.relayOK ? 'the link only' : f.capsOK ? 'the capsules only' : 'nothing to build the systems from'}.`]; }
        },
        effect: st => { st.deliver = 'shelter'; st.shelter = true; st.materials -= SHELTER; supplyBuild(st, 'relay'); },
        record: {
          ru: 'Девяносто человек переходят в кольца сорок первой. Форпост впервые за годы спит не по очереди.',
          en: "Ninety people move into the Forty-First's rings. For the first time in years the outpost sleeps without taking turns."
        }
      }]))
    },
    {
      id: 'a3r.store', scene: 'arrival', kind: 'instrument', year: s => rescueS(s) ? arriveX(s) : s.arrive, when: s => s.mission === 'rescue',
      effect: s => { if (!rescueS(s)) { s.rescued = thawN(arriveX(s)); s.thawDead = THAW0 - s.rescued; return; }   // при полном опоздании — все 34
        // версия 3: тепловой запас секции — от паспортного прибытия; реестр — по именам
        s.sectionEnd = (s.arrivePlan == null ? arriveX(s) : s.arrivePlan) + RESCUE.section / YD; s.sectionLeft = daysTo(s, s.sectionEnd);
        thawAdvance(s, arriveX(s)); s.thawConfirmed = thawAlive(s, arriveX(s)).length; s.thawDead = s.thawDeadIds.length; },
      title: { ru: 'Журнал вахты · склад Оттепели', en: "Watch log · Thaw's store" },
      text: {
        ru: s => rescueS(s) ? storeR(s, 'ru') : `Орбитальный склад Оттепели отвечает маяком. Капсул — сорок, рассчитаны до года ${thawDeadline()}; сейчас год ${f2(arriveX(s), 'ru')}.
` + storeLine(s, 'ru') + `\n\n` + (thawN(arriveX(s)) === 34 ? 'Тридцать четыре капсулы держат; шесть отказали за эти годы по одной.' : thawN(arriveX(s)) ? `Капсулы отказывают с года ${THAW_LOSS}: держат ${thawN(arriveX(s))}.` : 'Живых капсул нет. Последняя отказала за несколько лет до нас.'),
        en: s => rescueS(s) ? storeR(s, 'en') : `Thaw's orbital store answers with its beacon. Forty capsules, rated to year ${thawDeadline()}; it is year ${f2(arriveX(s), 'en')}.
` + storeLine(s, 'en') + `\n\n` + (thawN(arriveX(s)) === 34 ? 'Thirty-four capsules hold; six failed over the years, one by one.' : thawN(arriveX(s)) ? `The capsules have been failing since year ${THAW_LOSS}: ${thawN(arriveX(s))} hold.` : 'No capsule is alive. The last one failed a few years before us.')
      }
    },
    {
      id: 'd.rescueDock', scene: 'arrival', kind: 'decision', when: s => rescueS(s) && thawAlive(s, storeNow(s)).length > 0,
      title: { ru: 'Как закрепиться', en: 'How to secure the ship' },
      context: {
        ru: s => `Склад вращается; струя теплоносителя нагружает его крепления. Чтобы работать, корабль должен встать к складу жёстко. ${sectionLine(s, 'ru')}`,
        en: s => `The store is rotating; the coolant jet loads its mounts. To work, the ship must be fixed rigidly to the store. ${sectionLine(s, 'en')}`
      },
      rec: s => s.materials >= RESCUE.inspectCost ? { id: 'inspect', why: { ru: 'струя и вращение нагружают старое крепление', en: 'the jet and the rotation load the old mount' }, assume: { ru: 'осмотр найдёт опасный надлом до захвата', en: 'the inspection will find a dangerous fracture before grappling' } }
        : { id: 'grab', why: { ru: 'на осмотр не хватает материалов', en: 'materials do not cover an inspection' }, assume: { ru: 'крепление выдержит захват', en: 'the mount will withstand grappling' } },
      options: s => {
        const record = {
          ru: s2 => s2.dockFound ? 'Надлом найден; корабль встаёт к другому узлу. Утечки не усилились.' : s2.pipeTorn ? `Крепление разрушилось и сорвало трубопровод секции. ${sectionLine(s2, 'ru')} Прямое подключение теперь угрожает охлаждению корабля.` : 'Захват завершён; утечки не усилились.',
          en: s2 => s2.dockFound ? 'A fracture is found; the ship moves to another mount. The leakage has not increased.' : s2.pipeTorn ? `The mount failed and tore the section's pipe away. ${sectionLine(s2, 'en')} A direct connection now threatens the ship's cooling.` : 'Grappling is complete; the leakage has not increased.'
        };
        return [{
          id: 'inspect', label: { ru: 'Осмотреть и погасить вращение', en: 'Inspect and stop the rotation' },
          known: { ru: [`${dd(RESCUE.inspect, 'ru')}, материалы −${RESCUE.inspectCost}%; найдём надлом — встанем к другому узлу.`, 'Осмотр видит не все внутренние трещины: девять из десяти.'],
            en: [`${dd(RESCUE.inspect, 'en')}, materials −${RESCUE.inspectCost}%; if we find a fracture, we use another mount.`, 'The inspection does not see every internal crack: nine in ten.'] },
          cost: st => { st.materials -= RESCUE.inspectCost; st.rescueDays += RESCUE.inspect; },
          effect: st => dockApply(st, 'inspect'), record
        }, {
          id: 'grab', label: { ru: 'Захватить сразу', en: 'Grapple now' },
          known: { ru: ['Одни сутки, без расхода материалов.', `Прочность крепления не проверена: если оно разрушится, секции останется не больше ${dd(RESCUE.torn, 'ru')}.`],
            en: ['One day, no materials.', `The mount's strength is untested: if it fails, the section has no more than ${dd(RESCUE.torn, 'en')}.`] },
          cost: st => { st.rescueDays += RESCUE.grab; },
          effect: st => dockApply(st, 'grab'), record
        }].filter(o => o.id !== 'inspect' || s.materials >= RESCUE.inspectCost);
      }
    },
    {
      id: 'd.rescueConnect', scene: 'arrival', kind: 'decision', when: connectNeed,
      title: { ru: 'Не перенести аварию', en: 'Keep the failure from spreading' },
      context: {
        ru: s => `${s.pipeTorn ? 'Трубопровод секции сорван.' : `Штатная операция — ${months(opNormal(s), 'ru')} — не успевает к сроку секции.`} ${sectionLine(s, 'ru')}`,
        en: s => `${s.pipeTorn ? "The section's pipe is torn away." : `The normal operation — ${months(opNormal(s), 'en')} — will not make the section deadline.`} ${sectionLine(s, 'en')}`
      },
      rec: s => { const intime = s.materials >= RESCUE.isolate && sectionHolds(s, storeNow(s) + isoDays(s) / YD), other = s.pipeTorn ? 'cut' : 'proceed';
        return intime ? { id: 'isolate', why: { ru: 'отделить корабельное охлаждение и сохранить всех, кого ещё успеваем', en: "separate the ship's cooling and preserve everyone still reachable in time" }, assume: { ru: 'независимый контур выдержит измеренную нагрузку', en: 'the independent loop will carry the measured load' } }
          : { id: other, why: { ru: 'секцию уже не успеваем; сохраняем остальных', en: 'we cannot save the section in time; we preserve the others' }, assume: { ru: 'остальные капсулы дождутся операции', en: 'the other capsules will last until the operation' } }; },
      options: s => connectOptions(s)
    },
    sosEnd('rescueDock', 'arrival'),
    {
      id: 'd.rescueShelter', scene: 'arrival', kind: 'decision', year: s => s.arrive, when: s => s.mission === 'rescue' && (rescueS(s) ? !s.sos && thawAlive(s, storeNow(s)).length > 0 : s.rescued > 0) && crewOf(s) >= M.CREW,
      rec: s => rescueS(s) ? { id: 'direct', why: { ru: 'сначала остановить потери, жильё строить после стабилизации', en: 'stop the losses first; build housing after stabilisation' }, assume: { ru: 'временное размещение позволит дождаться стройки', en: 'temporary accommodation will last until construction' } } : null,
      title: { ru: 'Куда принимать', en: 'Where to take them in' },
      context: {
        ru: s => `Спасательного сектора нет: места погибших в пути — резерв экспедиции. Без жилья спасённых можно лишь удержать во сне или в лазарете. ${storeLine(s, 'ru')}`,
        en: s => `There is no rescue sector: the places of those who died on the road are the expedition's reserve. Without housing the rescued can only be kept asleep or in the infirmary. ${storeLine(s, 'en')}`
      },
      options: s => [{
        id: 'module',
        label: { ru: 'Сначала жилой модуль', en: 'The living module first' },
        known: {
          ru: rescueS(s) ? [`Материалы для высадки −${SHELTER_R}%: койки, вода и воздух для сорока.`, `Три месяца работы до помощи капсулам: к концу стройки по прогнозу живы ${thawAlive(s, storeNow(s) + 0.25).length}.`, 'Тепловой срок секции на это время не останавливается.']
            : [`Материалы для высадки −${SHELTER_R}%: койки, вода и воздух для сорока.`, `Три месяца работы; склад тем временем стареет: к концу стройки по прогнозу живы ${thawN(arriveX(s) + 0.25)}.`],
          en: rescueS(s) ? [`Landing materials −${SHELTER_R}%: berths, water and air for forty.`, `Three months of work before helping the capsules: by the end, ${thawAlive(s, storeNow(s) + 0.25).length} alive by the forecast.`, "The section's thermal deadline does not stop meanwhile."]
            : [`Landing materials −${SHELTER_R}%: berths, water and air for forty.`, `Three months of work; the store ages meanwhile: by the end, ${thawN(arriveX(s) + 0.25)} alive by the forecast.`]
        },
        cost: st => { st.materials -= SHELTER_R; st.rescueShelter = true; },
        effect: st => { st.materials -= SHELTER_R; st.rescueShelter = true; if (rescueS(st)) { st.rescueDays += 0.25 * YD; thawAdvance(st, storeNow(st)); } },
        record: {
          ru: 'Сначала — жильё. Модуль на сорок мест собирают три месяца; склад всё это время на связи.',
          en: 'Housing first. The forty-berth module takes three months to build; the store stays in contact the whole time.'
        }
      }, {
        id: 'direct',
        label: { ru: 'Сразу к складу', en: 'Straight to the store' },
        known: {
          ru: ['Ни дня на стройку: операция начинается сейчас.', 'Постоянных мест для спасённых не будет.'],
          en: ['Not a day for building: the operation starts now.', 'There will be no permanent places for the rescued.']
        },
        effect: st => { st.rescueShelter = false; },
        record: {
          ru: 'Совет решает не ждать. Где жить спасённым — решат потом.',
          en: 'The council decides not to wait. Where the rescued will live will be decided later.'
        }
      }].filter(o => o.id !== 'module' || s.materials >= SHELTER_R)
    },
    {
      id: 'd.rescue', scene: 'arrival', overlay: 'sleepers', kind: 'decision', year: s => s.arrive, when: s => s.mission === 'rescue' && (rescueS(s) ? !s.sos && thawAlive(s, storeNow(s)).length > 0 : s.rescued > 0),
      rec: s => { if (!rescueS(s)) return null; const ids = rescueOptions(s).map(o => o.id), id = ['move', 'restore', 'wake'].find(x => ids.includes(x));
        return { id, why: { ru: 'стабилизировать без массового экстренного пробуждения', en: 'stabilise without mass emergency waking' }, assume: { ru: 'операция завершится в показанные сроки', en: 'the operation will finish within the displayed time' } }; },
      title: { ru: 'Как сохранить жизнь', en: 'How to keep them alive' },
      context: {
        ru: s => `${storeLine(s, 'ru', opStart(s))} Места: ${housedOf(s) ? (crewOf(s) < M.CREW ? 'спасательный сектор — сорок' : 'жилой модуль — сорок') : 'постоянных нет'}.`,
        en: s => `${storeLine(s, 'en', opStart(s))} Places: ${housedOf(s) ? (crewOf(s) < M.CREW ? 'the rescue sector — forty' : 'the living module — forty') : 'no permanent ones'}.`
      },
      options: s => rescueOptions(s),
      option: (s, id) => rescueOptions(s).find(o => o.id === id) || (rescueS(s) ? null : rescueLegacy(s, id))
    },
    {
      id: 'a3r.operationResult', scene: 'arrival', overlay: 'sleepers', kind: 'instrument', year: s => Math.max(s.year, s.rescueEnd || 0), when: s => rescueS(s) && !s.sos,
      effect: s => { if (!s.rescueOp) { s.thawDead = s.thawDeadIds.length; s.rescued = 0; } },
      title: { ru: 'Журнал вахты · имена в двух ведомостях', en: 'Watch log · names in two manifests' },
      text: {
        ru: s => `Ива сверяет каждую запись Оттепели с нашим журналом. Стабилизированы ${s.rescued}; дополнительно погибли ${s.thawDead}. ${({ move: 'Спящие — в нашем секторе.', restore: 'Спящие — на стабилизированном складе.', wake: 'Выжившие — в лазарете.' })[s.rescueOp] || 'Стабилизировать было некого.'}

У каждого человека остаётся прежнее имя и прежний номер капсулы.${s.thawDead ? ` В ведомость погибших вписаны: ${thawNames(s.thawDeadIds, 'ru')}.` : ''} Протокол отделяет потери от опоздания, аварии и пробуждения.`,
        en: s => `Iva checks every Thaw entry against our log. Stabilised: ${s.rescued}; additional deaths: ${s.thawDead}. ${({ move: 'The sleepers are in our sector.', restore: 'The sleepers are in the stabilised store.', wake: 'The survivors are in the infirmary.' })[s.rescueOp] || 'There was no one left to stabilise.'}

Everyone keeps their name and original capsule number.${s.thawDead ? ` Entered in the record of the dead: ${thawNames(s.thawDeadIds, 'en')}.` : ''} The record separates losses from late arrival, accidents and waking.`
      }
    },
    {
      id: 'a3r.greeting', illus: 'infirmary-first-words', scene: 'arrival', kind: 'transcript', year: s => Math.max(s.year, s.rescueEnd + (rescueS(s) && s.rescueOp !== 'wake' ? 30 / YD : 0)),
      when: s => s.mission === 'rescue' && s.rescued > 0 && !s.sos && (rescueS(s) || s.rescueOp === 'wake'),
      title: { ru: 'Лазарет · первые слова', en: 'Infirmary · first words' },
      text: {
        ru: s => { const L = roadDead(s); if (rescueS(s)) return greetR(s, L, 'ru'); return `Первая из тех, кто уже может говорить, долго смотрит на незнакомый потолок лазарета.

— Вы со склада? — спрашивает она.

— С сорок первой. Я Селина Вей. Мы пришли к Оттепели.

Селина показывает ей дату и ждёт; женщина придерживает большим пальцем край одеяла.

— А остальные?

${s.thawDead > 0 ? `— Живы ${s.rescued}. Из ${THAW0} мы потеряли ${s.thawDead}. Я останусь, пока вы будете читать список.` : `— Все ${THAW0} живы. Сейчас сверим, где каждый.`}

${L > 0 ? `— Вы тоже потеряли людей?\n\n— Да. В пути умерли ${ppl(L)}.` : '— Долго вы летели?\n\nСелина придвигает экран с календарём рейса.'}

Здесь отвечают сразу: между ними больше нет передатчика и лет ожидания.`; },
        en: s => { const L = roadDead(s); if (rescueS(s)) return greetR(s, L, 'en'); return `The first woman well enough to speak studies the unfamiliar infirmary ceiling.

"Are you from the store?" she asks.

"From the Forty-First. I'm Selina Vei. We came to Thaw."

Selina shows her the date and waits; the woman holds the blanket's edge beneath her thumb.

"And the others?"

${s.thawDead > 0 ? `"${s.rescued} are alive. Of the ${THAW0}, we lost ${s.thawDead}. I'll stay while you read the list."` : `"All ${THAW0} are alive. We'll check where each of them is."`}

${L > 0 ? `"Did you lose people too?"\n\n"Yes. ${L} died on the way."` : '"How long were you travelling?"\n\nSelina brings the voyage calendar closer.'}

Here an answer comes at once: there is no transmitter between them, no years of waiting.`; }
      }
    },
    {
      // отчёт по заданию исследовательской заявки: первый месяц у цели — работа сделана или нет, отчёт уходит Кольцу
      // (DOC «Ревью Codex — заявки из мира», шаг 3). Выполнение задания и судьба дома — разные итоги
      id: 'a3.taskReport', scene: 'arrival', kind: 'archive', year: s => Math.max(s.year, s.arrive + 1 / 12),
      when: s => s.mission === 'contact' && !!s.task && !s.sos && !s.lostShip,
      place: { ru: 'Отчёт Кольцу · задание заявки', en: 'Report to the Ring · the request task' },
      effect: s => { const r = taskResult(s); s.task.done = r.done; s.task.found = r.found; s.task.reportAt = Math.max(s.year, s.arrive + 1 / 12); },   // дата сцены (без модели эффект — до установки года)
      text: { ru: s => taskReportText(s, 'ru'), en: s => taskReportText(s, 'en') }
    },
    { id: 's.e6', kind: 'skip', toYear: s => s.arrive + 1,
      label: { ru: 'Промотать год ожидания', en: 'Skip the year of waiting' } },
    {
      id: 'a3.wait1', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: supplyS,
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead; },
      title: { ru: 'Совет у цели', en: 'Council at the target' },
      text: {
        ru: `Будят Дассера и Орина. На столе — первоначальная заявка и совместный журнал работ.

Дассер читает журнал до конца, включая имена погибших, если они есть.

— Я обещал вернуть две системы. Вы решали, как сохранить людей между ними.

Ирсон показывает изменения, внесённые местной сменой.

— Теперь это и их инструкция. Они смогут исправить нас.

Дассер подписывает отчёт после местного совета, не вместо него.`,
        en: `Dasser and Orin are woken. The original request and the joint work log lie on the table.

Dasser reads the whole log, including the names of the dead, if there are any.

"I promised to restore two systems. You had to keep people alive between them."

Irson shows the changes made by the local shift.

"It is their procedure too now. They can correct us."

Dasser signs the report after the local council, not in its place.`
      }
    },
    {
      id: 'a3.wait3', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: rescueS,
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead; },
      title: { ru: 'Подписанный прогноз', en: 'The signed forecast' },
      text: {
        ru: s => `Будят Дассера и Орина. На столе лежат паспорт, исправленная лоция и именной итог операции. Орин сравнивает две даты${s.brakeDelay ? '' : ' — они совпали'}.

— Я подписал расчёт среды, которую мы ещё не измерили.

Селина показывает, когда пришлось решать. Дассер читает список до конца: ${s.rescued ? 'теперь обещание сорока мест имеет имена' : 'обещание сорока мест осталось списком имён'}.

Медицинский журнал: погибли в пути — ${ppl(lossesOf(s, s.arrive).total + s.dead)}.`,
        en: s => `Dasser and Orin are woken. The passport, the corrected sailing directions and the named operation record lie on the table. Orin compares the two dates${s.brakeDelay ? '' : ' — they match'}.

"I signed a calculation for a medium we had not yet measured."

Selina shows when the decision had to be made. Dasser reads the entire list: ${s.rescued ? 'the promise of forty places now has names' : 'the promise of forty places has remained a list of names'}.

Medical log: died on the road — ${lossesOf(s, s.arrive).total + s.dead}.`
      }
    },
    {
      id: 'a4r.volcano', scene: 'home', kind: 'instrument', year: s => s.arrive + 1, when: rescueS,
      act: { ru: 'Акт IV · Оттепель повторяется', en: 'Act IV · Thaw happens again' },
      title: { ru: 'Журнал разведки · шлейф над старой площадкой', en: 'Survey log · a plume over the old site' },
      text: {
        ru: s => `Над старой площадкой растёт вулканический шлейф. Архив Оттепели показывает прежнюю последовательность: вода проходила штатную очистку, затем отказывали теплообменники энергетики.

Тея закрывает пробоотборник.

— Мы можем повторить их анализ и получить ту же ошибку.${s.rescued ? ' Люди уже обеспечены охлаждением; испытание воды не должно оплачиваться их жизнями.' : ''}`,
        en: s => `A volcanic plume grows above the old site. Thaw's archive shows the earlier sequence: water passed normal treatment, then the power system's heat exchangers failed.

Teya closes the sampler.

"We can repeat their analysis and get the same error."${s.rescued ? ' "Cooling is already secured; testing the water must not be paid for with their lives."' : ''}`
      }
    },
    {
      id: 'a3.wait', illus: s => s.support === 'found' ? null : 'council-at-target', scene: 'home', kind: 'transcript', year: s => s.arrive + 1, when: s => !ownStory(s),
      effect: s => { s.lost = lossesOf(s, s.arrive).total + s.dead;
        if (s.support === 'found') { s.materials += 30; s.reserve += dvPct(s, 900); s.highPower = true; } },
      title: { ru: 'Совет у цели', en: 'Council at the target' },
      text: {
        ru: s => (s.support === 'found'
          ? `Будят Дассера и Орина. Через год к точке встречи выходит корабль поддержки: семеро будят себя сами, как договорились по связи. В трюмах — ³He, теплообменники и материалы для высадки. Контур повышенной мощности снова цел; резерв манёвров и запас материалов пополнены.
`
          : `Будят Дассера и Орина. Совет решает, сколько ждать корабль поддержки: каждый месяц — годы бодрствующих, воздух, пища из запасов${!s.highPower && src(s) ? ', которые и так потрачены сильнее расчёта' : ''}. Ждут год.

Корабль поддержки признают погибшим. Обряд имён — по семи именам. Вместе с ним пропадают ³He, теплообменники и материалы, на которые когда-то рассчитывал совет Ирсона.
`) + `
Медицинский журнал: погибли в пути — ${ppl(lossesOf(s, s.arrive).total + s.dead)}${s.dead ? `, из них ${deadCauses(s, 'ru')}` : ''}.` +
          (src(s) ? '\n\nОрин читает разбор ошибки у Тёмной звезды и записывает вину на себя: он оставил простую инструкцию там, где нужен был разбор района.' : ''),
        en: s => (s.support === 'found'
          ? `Dasser and Orin are woken. A year later the support ship comes out at the rendezvous: the seven wake themselves, as agreed over the link. Its holds carry ³He, heat exchangers and landing materials. The high-power loop is whole again; the manoeuvre reserve and the materials are replenished.
`
          : `Dasser and Orin are woken. The council decides how long to wait for the support ship: every month costs waking years, air, food from stores${!s.highPower && src(s) ? ' already spent beyond plan' : ''}. They wait a year.

The support ship is declared lost. The rite of names — seven names. With it go the ³He, the heat exchangers and the materials that Irson's council once relied on.
`) + `
Medical log: died on the road — ${lossesOf(s, s.arrive).total + s.dead}${s.dead ? `, of them ${deadCauses(s, 'en')}` : ''}.` +
          (src(s) ? '\n\nOrin reads the review of the error at the Dark Star and takes the blame himself: he left a simple instruction where a survey of the region was needed.' : '')
      }
    },
    {
      id: 'd.home', scene: 'home', kind: 'decision', year: s => s.arrive + 1, when: s => s.mission !== 'supply' && !s.sos,
      title: { ru: 'Где будет дом', en: 'Where home will be' },
      rec: s => { if (!rescueS(s)) return null; const ids = homeOptionsR(s).map(o => o.id), id = ['check', 'closed', 'orbit', 'stay'].find(x => ids.includes(x));
        return id === 'check' ? { id, why: { ru: 'старая площадка сохраняет инфраструктуру; перед заселением нужна проверка', en: 'the old site keeps its infrastructure; it needs testing before occupation' }, assume: { ru: 'короткое испытание представляет будущий режим очистки', en: 'the short test represents future treatment conditions' } }
          : id === 'stay' ? { id, why: { ru: 'сохранить доступное размещение', en: 'preserve the available accommodation' }, assume: { ru: 'непокрытые обязательства остаются открытыми', en: 'uncovered commitments remain open' } }
          : { id, why: { ru: 'независимое обеспечение исключает местную воду', en: 'independent supply excludes local water' }, assume: { ru: 'материалов хватит на постоянное обеспечение', en: 'the materials will cover permanent supply' } }; },
      context: {
        ru: s => rescueS(s) ? (s.rescued ? 'Площадку выбирают вместе с пробуждёнными жителями Оттепели.' : 'Оттепели помочь не успели: площадку выбирает экипаж.') + ' Чем проверять воду и сколько платить за уверенность — решение совета.' : bad(M.worldOf(s.target)) ? 'Высадиться нельзя. Корабль строили и как основу поселения — это последний довод конструкторов.' : 'Мир пригоден. Вопрос — когда спускаться и сколько знать до спуска.',
        en: s => rescueS(s) ? (s.rescued ? "The site is chosen together with Thaw's awakened residents." : 'Thaw could not be helped in time: the crew chooses the site.') + " How to test the water and how much to pay for certainty is the council's decision." : bad(M.worldOf(s.target)) ? 'No landing is possible. The ship was built as the core of a settlement too — the designers\' last argument.' : 'The world is habitable. The question is when to go down and how much to know first.'
      },
      options: s => { if (rescueS(s)) return homeOptionsR(s); const w = M.worldOf(s.target), L = s.kits.includes('landing'), low = s.reserve < 40;
        const orbit = {
          id: 'orbit',
          label: { ru: bad(w) ? 'Поселение на орбите' : 'Сначала орбита', en: bad(w) ? 'A settlement in orbit' : 'Orbit first' },
          known: {
            ru: bad(w) ? ['Корабль и есть дом: кольца, агрозалы, зал анабиоза.', 'Материалы — на расширение колец; люди просыпаются по очереди, по мере места.']
              : ['Год разведки с орбиты: участки, погода, жизнь на поверхности.', 'Высадка откладывается; люди ждут в капсулах и кольцах.'],
            en: bad(w) ? ['The ship is the home: rings, agro halls, the anabiosis hall.', 'Materials go to extending the rings; people wake in turn, as room allows.']
              : ['A year of survey from orbit: sites, weather, life on the surface.', 'Landing is postponed; people wait in capsules and rings.']
          },
          effect: st => { st.home = 'orbit'; },
          record: {
            ru: bad(w) ? 'Совет решает строить дом на орбите. Первым делом Тея Марр расширяет агрозалы: теперь это не рейс, а жизнь.' : 'Совет решает год смотреть сверху. Разведчики составляют карту участков; Кассель когда-то сказала бы, что это и есть осторожность Совета.',
            en: bad(w) ? 'The council decides to build the home in orbit. Teya Marr extends the agro halls first: this is no longer a voyage but a life.' : 'The council decides to watch from above for a year. The scouts map the sites; Kassel would once have called this the Council\'s caution.'
          }
        };
        if (w === 'open') return [{
          id: 'land',
          label: { ru: 'Высадка', en: 'Land' },
          known: {
            ru: [L ? 'Расширенная посадка: первая волна — сто человек, база за два года.' : 'Без расширенной посадки: первая волна — сорок человек, база за пять лет.', low ? 'Резерв манёвров мал: челноки — к одному участку, без запасного.' : 'Челноки выбирают из нескольких участков.'],
            en: [L ? 'Extended landing kit: a first wave of a hundred, a base in two years.' : 'No extended landing kit: a first wave of forty, a base in five years.', low ? 'The manoeuvre reserve is small: shuttles to one site, no fallback.' : 'The shuttles can choose among several sites.']
          },
          effect: st => { st.home = 'land'; },
          record: {
            ru: 'Совет решает спускаться. Первая волна уходит к участку, который выбрала разведка с орбиты за первые недели. Остальные спят, пока внизу не построят жильё.',
            en: 'The council decides to go down. The first wave leaves for the site the orbital survey chose in the first weeks. The rest sleep until housing is built below.'
          }
        }, orbit];
        if (w === 'dome') return [{
          id: 'domes',
          label: { ru: 'Купола на терминаторе', en: 'Domes on the terminator' },
          known: {
            ru: [s.materials >= 60 ? 'Материалы для высадки: −30% на купола.' : 'Материалов мало: купол на сорок человек, остальные ждут на орбите.', L ? 'Расширенная посадка: купола собирают за три года.' : 'Без расширенной посадки: купола — за шесть лет.'],
            en: [s.materials >= 60 ? 'Landing materials: −30% for the domes.' : 'Materials are short: a dome for forty, the rest wait in orbit.', L ? 'Extended landing kit: the domes go up in three years.' : 'No extended landing kit: the domes take six years.']
          },
          effect: st => { st.home = 'domes'; st.materials -= Math.min(30, st.materials); },
          record: {
            ru: 'Совет решает строить купола на полосе между вечным днём и вечной ночью. Ветер там не стихает никогда.',
            en: 'The council decides to build domes on the strip between endless day and endless night. The wind there never stops.'
          }
        }, orbit];
        const sleep = {
          id: 'sleep',
          label: { ru: 'Спать и ждать помощи', en: 'Sleep and wait for help' },
          known: { ru: s2 => sosKnown(s2, 'home', 'ru'), en: s2 => sosKnown(s2, 'home', 'en') },
          effect: st => { st.home = 'sleep'; st.sos = 'home'; },
          record: {
            ru: 'Совет решает спать и ждать. Сигнал бедствия уходит к колониям и на Землю; вахта из двенадцати человек остаётся у капсул.',
            en: 'The council decides to sleep and wait. The distress signal goes out to the colonies and to Earth; a watch of twelve stays with the capsules.'
          }
        };
        const opts = s.materials >= 30 ? [orbit] : [];
        if (s.materials >= 50) opts.push({
          id: 'moons',
          label: { ru: w === 'ruined' ? 'База на обломках' : w === 'none' ? 'База на астероидах' : 'База на спутнике', en: w === 'ruined' ? 'A base on the debris' : w === 'none' ? 'A base on the asteroids' : 'A base on a moon' },
          known: {
            ru: ['Твёрдая опора, лёд и металл под рукой; материалы для высадки −30%.', L ? 'Расширенная посадка: база за три года.' : 'Без расширенной посадки: база — за семь лет.'],
            en: ['Solid ground, ice and metal at hand; landing materials −30%.', L ? 'Extended landing kit: a base in three years.' : 'No extended landing kit: a base in seven years.']
          },
          effect: st => { st.home = 'moons'; st.materials -= 30; },
          record: {
            ru: 'Совет решает садиться туда, где есть твёрдое. Дом будет маленьким и тяжёлым, зато из местного камня.',
            en: 'The council decides to land wherever there is solid ground. The home will be small and heavy, but built of local stone.'
          }
        });
        opts.push({
          id: 'beacon',
          label: { ru: 'Маяк для следующих', en: 'A beacon for those who follow' },
          known: {
            ru: ['Экипаж остаётся на орбите и передаёт Кольцу всё, что узнал.', 'Дом строит следующая экспедиция — уже с нашими данными.'],
            en: ['The crew stays in orbit and sends the Ring everything it has learned.', 'The next expedition builds the home — with our data.']
          },
          effect: st => { st.home = 'beacon'; },
          record: {
            ru: 'Совет решает стать маяком. Передатчик корабля работает на Землю без перерыва; ответ придёт через поколения.',
            en: 'The council decides to become a beacon. The ship\'s transmitter works toward Earth without pause; the answer will come in generations.'
          }
        });
        if (M.hasGiant(s.target) && s.materials >= 100) opts.push({
          id: 'return',
          label: { ru: 'Вернуться домой', en: 'Go home' },
          known: {
            ru: ['Десятилетия добычи дейтерия и ³He из атмосферы гиганта; ступень обратного пути — из материалов.', 'Сто тридцать — двести лет пути: Земля к возвращению уйдёт на несколько эпох вперёд.'],
            en: ['Decades of mining deuterium and ³He from the giant\'s atmosphere; a return stage built from the materials.', 'A hundred and thirty to two hundred years of travel: by the return, Earth will be several epochs ahead.']
          },
          effect: st => { st.home = 'return'; },
          record: {
            ru: 'Совет решает возвращаться. Первые черпалки уходят к гиганту через месяц. Сводки Кольца уже сказали, какой будет Земля.',
            en: 'The council decides to go back. The first scoops leave for the giant within a month. The Ring\'s bulletins have already told them what Earth will be like.'
          }
        });
        if (s.materials < 30) opts.push(sleep);
        return opts;
      }
    },
    sosEnd('home', 'home'),
    {
      id: 'a4r.siteResult', scene: 'home', kind: 'instrument', year: s => s.arrive + 1 + ((s.siteDays || 0) + (s.site === 'evacuated' ? 30 : 0)) / YD, when: s => rescueS(s) && !s.sos,
      title: { ru: 'Журнал поселения · принятая площадка', en: 'Settlement log · the accepted site' },
      text: { ru: s => siteRecord(s, 'ru'), en: s => siteRecord(s, 'en') }
    },
    // ------------------------------------------------------------ АКТ IV · ВЫСАДКА И РАЗВЯЗКА
    { id: 's.f1', kind: 'skip', toYear: s => s.arrive + 2, when: s => !rescueS(s),
      label: { ru: s => `Промотать до года ${s.arrive + 2} · первый год у цели`, en: s => `Skip ahead to year ${s.arrive + 2} · the first year at the target` } },
    {
      id: 'a4.energy', scene: 'home', kind: 'instrument', year: s => s.arrive + 2, when: s => livable(s) && !rescueS(s),
      act: { ru: 'Акт IV · Высадка и развязка', en: 'Act IV · Landing and resolution' },
      title: { ru: 'Энергетический журнал', en: 'Energy log' },
      text: {
        ru: s => s.support !== 'found' && powerOK(s) ? (eqOf(s).energy === 'grid' ? 'Кабель от сети колонии подключён в первый месяц: энергии для высадки хватает.' : `${M.eqOpt('energy', eqOf(s).energy).ru} из оснащения работает с первого месяца: энергии для высадки хватает.`) + '\n' + 'Совет склоняется к богатому участку: там больше своей энергии и воды, хотя разведка ещё не закончена.'
          : s.support === 'found' ? 'С ³He поддержки реакторы базы работают с первого дня: энергии для высадки хватает. ' + '\n' + 'Совет склоняется к богатому участку: там больше своей энергии и воды, хотя разведка ещё не закончена.' : `Без груза корабля поддержки энергии для высадки не хватает: реакторы корабля держат кольца и зал анабиоза, базе внизу остаётся треть нужного.
` + 'Других источников нет.\n' +
          'Совет склоняется к богатому участку: там больше своей энергии и воды, хотя разведка ещё не закончена.',
        en: s => s.support !== 'found' && powerOK(s) ? (eqOf(s).energy === 'grid' ? 'The cable from the colony grid is connected in the first month: there is enough energy for the landing.' : `The ${M.eqOpt('energy', eqOf(s).energy).en.toLowerCase()} from the equipment runs from the first month: there is enough energy for the landing.`) + '\n' + 'The council leans toward the rich site: more energy and water of its own, though the survey is not finished.'
          : s.support === 'found' ? "With the support ship's ³He the base reactors run from day one: there is enough energy for the landing. " + '\n' + 'The council leans toward the rich site: more energy and water of its own, though the survey is not finished.' : `Without the support ship's cargo there isn't enough energy for the landing: the ship's reactors carry the rings and the anabiosis hall, and the base below gets a third of what it needs.
` + 'There are no other sources.\n' +
          'The council leans toward the rich site: more energy and water of its own, though the survey is not finished.'
      }
    },
    {
      id: 'a4.fauna', illus: 'rich-site', scene: 'home', kind: 'transcript', year: s => s.arrive + 2, when: s => M.worldOf(s.target) === 'open',
      title: { ru: 'Разведка · богатый участок', en: 'Survey · the rich site' },
      text: {
        ru: `Разведгруппа из двух человек и дрона садится на самый богатый участок: вода, выходы металла, тепло из недр.

У кромки укрытия на дрон нападает засадный хищник. Он территориален и активен в темноте; яркий свет отгоняет его, но не сразу. Дрон уничтожен, разведчик ранен при отходе.

Вывод разведки: богатый участок требует защиты, которую поселение на первом этапе не может себе позволить. Другие участки беднее, но угрозы там не видели.`,
        en: `A survey team of two and a drone lands on the richest site: water, metal outcrops, heat from below.

At the edge of the shelter the drone is attacked by an ambush predator. It is territorial and active in the dark; bright light drives it off, but not at once. The drone is destroyed, and one scout is wounded in the retreat.

The survey's conclusion: the rich site needs a defence the settlement cannot afford in its first years. Other sites are poorer, but no threat has been seen there.`
      }
    },
    {
      id: 'a4.storm', illus: 'terminator-storm', scene: 'home', kind: 'instrument', year: s => s.arrive + 2, when: s => M.worldOf(s.target) === 'dome' && !rescueS(s),
      title: { ru: 'Журнал разведки · терминатор', en: 'Survey log · the terminator' },
      text: {
        ru: 'На полосе между днём и ночью ветер не стихает: горячий воздух идёт с дневной стороны на ночную. Пробный купол сорван за четверо суток. Держать купола на месте можно только каркасом из несущих конструкций посадочного модуля.',
        en: 'On the strip between day and night the wind never stops: hot air flows from the day side to the night side. The test dome is torn away in four days. Domes can only be held in place with a frame made from the lander\'s load-bearing structure.'
      }
    },
    {
      id: 'd.site', scene: 'home', kind: 'decision', year: s => s.arrive + 2, when: s => M.worldOf(s.target) === 'open',
      title: { ru: 'Какой участок', en: 'Which site' },
      context: {
        ru: 'Богатый участок сделает поселение сильным — если его удержать. Бедный — выживет, если хватит энергии.',
        en: 'The rich site would make the settlement strong — if it can be held. The poor one will survive, if there is enough energy.'
      },
      options: s => [
        {
          id: 'poor',
          label: { ru: 'Бедный, но безопасный', en: 'Poor but safe' },
          known: {
            ru: ['Меньше воды и металла; угрозы не видели.', 'Энергии мало: первые годы агроблоки на половине мощности, рацион урезан.'],
            en: ['Less water and metal; no threat seen.', 'Energy is short: for the first years the agro blocks run at half power and rations are cut.']
          },
          effect: st => { st.site = 'poor'; },
          record: {
            ru: 'Совет выбирает бедный участок. Опасность богатого известна, а нехватку энергии бедного переживут: первые годы будут скудными.',
            en: 'The council chooses the poor site. The danger of the rich one is known, and the poor one\'s energy shortfall can be lived through: the first years will be lean.'
          }
        },
        {
          id: 'rich',
          label: { ru: 'Богатый, с обороной', en: 'Rich, with a defence' },
          known: {
            ru: ['Больше воды, металла и своей энергии.', 'Периметр, свет и дозоры: людей на это нет — их снимут с агроблоков. Материалы −10%.'],
            en: ['More water, metal and energy of its own.', 'A perimeter, lights and patrols: there are no people for it — they will come off the agro blocks. Materials −10%.']
          },
          effect: st => { st.site = 'rich'; st.materials -= 10; st.deadHere += 2; },
          record: {
            ru: 'Совет выбирает богатый участок. Прожекторы по периметру горят всю ночь. В первую зиму хищник проходит периметр дважды; двое дозорных не возвращаются.',
            en: 'The council chooses the rich site. The perimeter lights burn all night. In the first winter the predator gets through the perimeter twice; two of the watch do not come back.'
          }
        }
      ]
    },

    { id: 's.f2', kind: 'skip', toYear: s => Y4(s), when: s => livable(s) && !s.sos,
      label: { ru: s => `Промотать до года ${Y4(s)} · ${rescueS(s) ? 'совместный отчёт' : 'последний совет'}`, en: s => `Skip ahead to year ${Y4(s)} · ${rescueS(s) ? 'the joint report' : 'the last council'}` } },
    {
      id: 'a4r.archive', scene: 'home', kind: 'archive', year: s => Y4(s), when: rescueS,
      place: { ru: 'Архив Оттепели · техническая переписка', en: "Thaw's archive · technical correspondence" },
      text: {
        ru: `В архиве Оттепели находится замечание тридцать второй: «Сводный флаг исправности не заменяет исходные медицинские каналы. Сохраняйте оба потока».

Ни координат после исчезновения, ни способа спасти склад в письме нет. Ная прикладывает его к истории отчётности: когда-то эти люди помогали Оттепели читать собственные приборы.`,
        en: `Thaw's archive contains a note from the Thirty-Second: "The overall health flag does not replace the raw medical channels. Preserve both streams."

The message holds neither coordinates after the disappearance nor a way to save the store. Naya attaches it to the reporting history: once, these people helped Thaw read its own instruments.`
      }
    },
    {
      id: 'a4.council', illus: 'last-council', scene: 'ring', kind: 'transcript', year: s => Y4(s), when: s => livable(s) && !rescueS(s),
      title: { ru: 'Последний совет', en: 'The last council' },
      text: {
        ru: s => `Здесь впервые прямо звучит то, что раньше было фоном. Цель выбрал Совет, ${Y4(s) >= 100 ? 'чьи члены умерли больше века назад' : `из которого за ${yrs(Y4(s))} почти никого не осталось в живых`}, по данным, которые на Земле давно устарели: ${Y4(s) >= 100 ? 'дома прошли две эпохи' : 'дома прошла целая эпоха'}.

Дассер ещё руководитель экспедиции, но и его спрашивают как старшего, и он отказывается решать за экипаж правом основателя. Дан Осгер, ставший архивариусом, говорит ему прямо:

— Вы выбрали путь. Дом выбираем мы.

` + (src(s) ? 'Полная фраза тридцать второй лежит в архиве рядом с обрывком. Готовых прекрасных миров никто не нашёл — ни предшественники, ни мы.' : 'Готовых прекрасных миров никто не нашёл.') + ' Миры не находят, а делают, шаг за шагом.',
        en: s => `Here, for the first time, what used to be background is said aloud. The target was chosen by a Council ${Y4(s) >= 100 ? 'whose members died more than a century ago' : `of which hardly anyone is still alive after ${Y4(s)} years`}, on data long out of date on Earth: ${Y4(s) >= 100 ? 'two epochs have passed at home' : 'a whole epoch has passed at home'}.

Dasser is still the expedition leader, but he too is asked as the eldest, and he refuses to decide for the crew by a founder's right. Dan Osger, now the archivist, tells him plainly:

"You chose the road. We choose the home."

` + (src(s) ? "The Thirty-Second's full sentence lies in the archive beside the fragment. No one found ready-made beautiful worlds — not the predecessors, not us." : 'No one found ready-made beautiful worlds.') + ' Worlds are not found; they are made, step by step.'
      }
    },
    {
      id: 'd.settle', scene: 'home', kind: 'decision', year: s => Y4(s), when: s => livable(s) && !rescueS(s),
      title: { ru: 'Дом', en: 'Home' },
      context: {
        ru: 'Усиленное укрытие — от фауны и от радиационного фона — можно собрать только из несущих конструкций посадочного модуля: другого материала нужной прочности на корабле нет.',
        en: "A reinforced shelter — against the fauna and the radiation background — can only be built from the lander's load-bearing structure: there is no other material of that strength aboard."
      },
      options: s => [{
        id: 'surface',
        label: { ru: 'Поверхность: разобрать модуль на каркас', en: 'The surface: take the lander apart for the frame' },
        known: {
          ru: ['Надёжное укрытие сейчас.', 'Модуль больше не поднимется. Ни он, ни что-либо подобного размера.'],
          en: ['A reliable shelter now.', 'The lander will never lift again. Neither will anything of its size.']
        },
        effect: st => { st.settle = 'surface'; },
        record: {
          ru: 'Совет выбирает поверхность. Модуль разбирают за месяц: его рёбра становятся каркасом укрытия. Путь наверх закрыт — это и есть решение.',
          en: 'The council chooses the surface. The lander is taken apart in a month: its ribs become the shelter\'s frame. The way up is closed — that is the decision.'
        }
      }].concat(s.home === 'orbit' ? [{
        id: 'orbit',
        label: { ru: 'Орбитальное поселение', en: 'An orbital settlement' },
        known: {
          ru: ['Корабль цел, архив и инфраструктура в сохранности, риск минимален.', 'Жизнь в искусственной среде без права на ошибку — навсегда.'],
          en: ['The ship is intact, the archive and infrastructure safe, the risk minimal.', 'Life in an artificial environment with no right to a mistake — for good.']
        },
        effect: st => { st.settle = 'orbit'; },
        record: {
          ru: 'Совет выбирает орбиту. Корабль больше никуда не летит: он становится городом. Внизу — полигон, разведка и первые поля под куполами.',
          en: 'The council chooses orbit. The ship will fly nowhere again: it becomes a town. Below — a test ground, the survey and the first fields under domes.'
        }
      }] : [{
        id: 'keep',
        label: { ru: 'Поверхность, модуль сохранить', en: 'The surface, keep the lander' },
        known: {
          ru: ['Модуль сможет подняться: путь на орбиту открыт.', 'Укрытие слабее — местный камень и то, что есть на складе.'],
          en: ['The lander can lift again: the way to orbit stays open.', 'The shelter is weaker — local stone and what is in the store.']
        },
        effect: st => { st.settle = 'keep'; st.deadHere += 1; },
        record: {
          ru: 'Совет оставляет модуль целым. Укрытие складывают из камня. Путь наверх открыт, и поэтому о нём спорят каждую зиму. В первую зиму одна из стен не выдерживает.',
          en: 'The council keeps the lander whole. The shelter is built of stone. The way up stays open, and so it is argued about every winter. In the first winter one of the walls gives way.'
        }
      }])
    },
    {
      id: 'a4.winter', scene: 'home', kind: 'instrument', year: s => Y4(s), when: s => livable(s) && !rescueS(s) && s.settle !== 'orbit' && !energyOK(s),
      effect: s => { s.winterDead = s.settle === 'keep' ? 5 : s.site === 'rich' ? 8 : 15; s.deadHere += s.winterDead; },
      title: { ru: 'Медицинский журнал · первая зима', en: 'Medical log · the first winter' },
      text: {
        ru: s => `Первая зима на трети нужной энергии: других источников, кроме реакторов корабля, нет. Агроблоки стоят, укрытие не прогревается. Погибли ${ppl(s.winterDead)}.` + (s.settle === 'keep' ? ' Модуль цел: часть людей отводят на орбиту до весны.' : ''),
        en: s => `The first winter on a third of the energy needed: there is no source but the ship's reactors. The agro blocks stand idle; the shelter does not warm. ${s.winterDead} people died.` + (s.settle === 'keep' ? ' The lander is intact: some are taken back to orbit until spring.' : '')
      }
    },
    {
      id: 'a4.morning', illus: s => s.settle !== 'orbit' && M.worldOf(s.target) === 'open' ? 'first-morning' : null, scene: 'home', kind: 'note', year: s => Y4(s), when: s => livable(s) && !rescueS(s),
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => (s.settle === 'orbit'
          ? 'Первое утро без курса. Вахта расписывает обязанности не на смены полёта, а на годы. Тея Марр закладывает в агрозалах первую почву, поднятую снизу. '
          : 'Первое утро на поверхности. Распределение обязанностей; проба местной почвы для агроблоков; '
            + (s.site === 'rich' ? 'прожекторы по периметру гаснут только к рассвету. ' : 'разметка периметра у богатого опасного участка — не сейчас, но не забыто. '))
          + 'Архив продолжает вестись.',
        en: s => (s.settle === 'orbit'
          ? 'The first morning with no course. The watch draws up duties not for flight shifts but for years. Teya Marr lays the first soil brought up from below in the agro halls. '
          : 'The first morning on the surface. Duties assigned; the local soil sampled for the agro blocks; '
            + (s.site === 'rich' ? 'the perimeter lights go out only at dawn. ' : 'the perimeter marked out near the rich, dangerous site — not now, but not forgotten. '))
          + 'The archive goes on.'
      }
    },
    {
      id: 'a4.supply1', scene: 'home', kind: 'note', year: s => Y4(s), when: supplyS,
      act: { ru: 'Акт IV · Форпост', en: 'Act IV · The outpost' },
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: `В разобранной аппаратной находят архив сообщений, которые некому было отправить.

Среди них — письма, исправленные несколько раз, пока адресаты старели на расстоянии.

Ива Лорн возвращает личные записи владельцам; отправлять их решают сами жители.

Ная отделяет наблюдения сектора сигнала от догадок об их смысле.

Совместный отчёт перечисляет работающие системы, оставшуюся зависимость и всех погибших по именам.

Корабль передаёт выбранные письма и отчёт; у каждого пакета остаётся дата отправки.`,
        en: `In the dismantled equipment room they find an archive of messages that could not be sent.

Some letters were revised several times while their recipients aged far away.

Iva Lorn returns private records to their owners; the residents decide what to send.

Naya separates observations of the signal sector from guesses about their meaning.

The joint report lists working systems, remaining dependencies and everyone who died, by name.

The ship transmits the selected letters and the report; every packet keeps its sending date.`
      }
    },
    {
      id: 'a4.supply', scene: 'home', kind: 'note', year: s => Y4(s), when: s => s.mission === 'supply' && !supplyS(s),
      act: { ru: 'Акт IV · Форпост', en: 'Act IV · The outpost' },
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => `Корабль остаётся у форпоста: его кольца — второй жилой модуль, его реакторы — вторая сеть. Экипаж сорок первой и люди Ксилоны Ир служат одной вахтой.` + (s.deliver === 'relay' ? ' Шестерых, не дождавшихся капсул, похоронили на склоне у антенны.' : s.deliver === 'capsules' ? ' Три года без связи форпост пережил спокойнее, чем семьдесят до этого: теперь было ради чего ждать.' : s.shelter ? ' Девяносто человек форпоста живут в кольцах корабля: уйти ему теперь некуда.' : '')
          + (!s.relayOK ? ' Передатчика нет: форпост по-прежнему не слышит Кольцо, и Земля узнает о нас только по нашему передатчику.' : '') + (!s.capsOK ? ' Капсульного блока нет: спящих не уложить, жизнеобеспечение работает на пределе.' : '')
          + (s.gridBlocks < 2 ? ' У корабля одна сеть из двух: резервный блок сгорел под вспышками.' : ''),
        en: s => `The ship stays at the outpost: its rings a second habitat, its reactors a second grid. The Forty-First's crew and the people of Xylona Ir stand one watch.` + (s.deliver === 'relay' ? ' The six who did not live to the capsules were buried on the slope by the antenna.' : s.deliver === 'capsules' ? ' The outpost bore three years without the link more calmly than the seventy before: now there was something to wait for.' : s.shelter ? " Ninety of the outpost's people live in the ship's rings: it has nowhere to go now." : '')
          + (!s.relayOK ? ' There is no transmitter: the outpost still cannot hear the Ring, and Earth will learn of us only through our own transmitter.' : '') + (!s.capsOK ? ' There is no capsule unit: the sleepers cannot be laid down, and life support runs at its limit.' : '')
          + (s.gridBlocks < 2 ? ' The ship has one grid of two: the reserve block burned out under the flares.' : '')
      }
    },
    // ---- мир, где высадиться нельзя
    {
      id: 'a4.bad', scene: 'home', kind: 'note', year: s => Y4(s), when: s => !livable(s) && s.mission !== 'supply',
      act: { ru: 'Акт IV · Дом', en: 'Act IV · Home' },
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => ({
          orbit: 'Корабль становится домом. Кольца расширяют из материалов для высадки; люди просыпаются по очереди, по мере места. Внизу — ничего, кроме наблюдений.',
          moons: 'База на твёрдом: маленькая, тяжёлая, из местного камня. Лёд и металл под рукой. Корабль над ней — склад, больница и архив.',
          beacon: 'Корабль — маяк. Передатчик работает на Землю без перерыва: всё, что мы видели, всё, что поняли, и всё, в чём ошиблись. Дом построит следующая экспедиция.',
          return: 'Черпалки уходят к гиганту за дейтерием и гелием-3. Ступень обратного пути собирают из материалов. Лететь домой — через десятилетия, и дом будет уже другим.'
        })[s.home] || 'Архив продолжает вестись.',
        en: s => ({
          orbit: 'The ship becomes the home. The rings are extended from the landing materials; people wake in turn, as room allows. Below — nothing but observation.',
          moons: 'A base on solid ground: small, heavy, of local stone. Ice and metal at hand. The ship above it is store, hospital and archive.',
          beacon: 'The ship is a beacon. The transmitter works toward Earth without pause: everything we saw, everything we understood, and everything we got wrong. The next expedition will build the home.',
          return: "The scoops leave for the giant for deuterium and helium-3. The return stage is built from the materials. Going home is decades away, and home will be different by then."
        })[s.home] || 'The archive goes on.'
      }
    },

    {
      id: 'a4.plan', scene: 'ring', kind: 'document', year: s => Y4(s),
      title: { ru: s => planWho(s, 'ru') + ' · следующие три года', en: s => planWho(s, 'en') + ' · the next three years' },
      text: { ru: s => planText(s, 'ru'), en: s => planText(s, 'en') }
    },

    // ------------------------------------------------------------ ЭПИЛОГ
    { id: 's.f3', kind: 'skip', toYear: Yepi,
      label: { ru: s => `Эпилог · год ${Yepi(s)}`, en: s => `Epilogue · year ${Yepi(s)}` } },
    {
      id: 'e.answer1', scene: 'home', kind: 'bulletin', year: Yepi, when: supplyS,
      act: { ru: 'Эпилог · Ответ', en: 'Epilogue · The answer' },
      title: { ru: s => `Сводка Кольца · ответ на наш отчёт, ${yrs(answerLag(s))} спустя`, en: s => `Ring bulletin · the answer to our report, ${yrsEn(answerLag(s))} later` },
      text: {
        ru: `Пришло подтверждение: совместный отчёт включён в архив Кольца.

В ответе сохранены обе подписи и замечания местной смены к корабельной инструкции.

Наблюдения Ксилоны добавили к сектору сигнала ещё одну дату и независимую калибровку. Они не объяснили источник и не сообщили судьбу тридцать второй.

Ответы на личные письма раздают закрытыми; несколько пакетов вернулись с отметкой об отсутствии адресата.

В общем журнале Ная записывает только: «Получено. Передано владельцам».`,
        en: `Confirmation arrives: the joint report has entered the Ring archive.

The reply retains both signatures and the local shift's corrections to the ship's procedure.

Xylona's observations add another date and an independent calibration to the signal sector. They do not explain the source or reveal the Thirty-Second's fate.

Replies to private letters are delivered sealed; several packets return marked recipient unavailable.

In the shared log Naya writes only: "Received. Delivered to the owners."`
      }
    },
    {
      id: 'e.life1', scene: 'home', kind: 'note', year: Yepi, when: supplyS,
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => s.supplyFailed ? `Снабжение сорвано. Корабль на орбите у форпоста; постоянного обеспечения у Ксилоны нет. Что стало с её людьми, этот архив не знает — отчёт о срыве ушёл в Кольцо. Погибли в пути: ${lossesOf(s, s.arrive).total + s.dead}. На форпосте за время работ: ${s.outpostDead || 0}.` : [`Смены форпоста и корабля работают вместе; инструкции правят обе стороны.`,
          s.relayOK ? 'Связь с Кольцом держится.' : 'Своей связи у форпоста так и нет: пакеты передаёт корабль.',
          s.capsOK ? 'Капсулы работают: смена снова отдыхает.' : 'Капсульной секции нет: отдых по очереди, как прежде.',
          s.shelter ? `${cap(ppl(s.shelterPeople || 90))} живут в кольцах корабля — корабль стал частью форпоста навсегда.` : '',
          `Погибли в пути: ${lossesOf(s, s.arrive).total + s.dead}. На форпосте за время работ: ${s.outpostDead || 0}.`].filter(Boolean).join(' '),
        en: s => s.supplyFailed ? `The supply mission failed. The ship is in orbit by the outpost; Xylona has no permanent support. What became of its people this archive does not know — the report of the failure has gone to the Ring. Died on the road: ${lossesOf(s, s.arrive).total + s.dead}. At the outpost during the work: ${s.outpostDead || 0}.` : [`The outpost's and the ship's shifts work together; both sides correct the procedures.`,
          s.relayOK ? 'The link with the Ring holds.' : 'The outpost still has no link of its own: the ship carries the packets.',
          s.capsOK ? 'The capsules work: the shift can rest again.' : 'There is no capsule section: rest goes by turns, as before.',
          s.shelter ? `${s.shelterPeople || 90} live in the ship's rings — the ship has become part of the outpost for good.` : '',
          `Died on the road: ${lossesOf(s, s.arrive).total + s.dead}. At the outpost during the work: ${s.outpostDead || 0}.`].filter(Boolean).join(' ')
      }
    },
    {
      id: 'e.answer3', scene: 'home', kind: 'bulletin', year: Yepi, when: rescueS,
      act: { ru: 'Эпилог · Ответ', en: 'Epilogue · The answer' },
      title: { ru: s => `Сводка Кольца · ответ на наш отчёт, ${yrs(answerLag(s))} спустя`, en: s => `Ring bulletin · the answer to our report, ${yrsEn(answerLag(s))} later` },
      text: {
        ru: 'Земля подтверждает получение именного реестра и исправленной лоции. В ответе повторены ограничения очистки и обязательства по жилью; приложен список тех, кому удалось передать личные сообщения.\n\nНовых кораблей этот пакет не привёз. О судьбе тридцать второй в нём нет подтверждённых сведений.',
        en: "Earth acknowledges the named register and the corrected sailing directions. The reply repeats the treatment limits and the housing commitments, and lists those to whom personal messages could be delivered.\n\nThis packet has brought no new ships. It holds no confirmed news of the Thirty-Second's fate."
      }
    },
    {
      id: 'e.life3', scene: 'home', kind: 'note', year: Yepi, when: rescueS,
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => { const alive = thawAlive(s, Infinity), placed = s.housed ? alive : [], wait = s.housed ? [] : alive;
          return `${[placed.length ? `В реестре дома стоят имена жителей Оттепели: ${namesShort(placed, 'ru')}.` : 'В реестре дома — экипаж сорок первой.', wait.length ? `Отдельно сохранены ожидающие жилья: ${namesShort(wait, 'ru')}.` : ''].filter(Boolean).join(' ')} Погибшие остаются в своей ведомости, с датой и причиной: шестеро до нашего рейса${s.thawDead ? `, ${s.thawDead} — пока шла помощь и после` : ''}.

${!s.rescued ? 'Сорок мест так и остались обещанием: в ведомости — сорок имён и даты.' : s.housed ? 'Сорок мест были обещанием до встречи; после встречи каждое стало чьим-то местом.' : `Сорок мест остаются обещанием: ${ppl(s.rescued)} ждут жилья.`}

Погибли в пути: ${lossesOf(s, s.arrive).total + s.dead}. У цели из экипажа: ${s.deadHere}.`; },
        en: s => { const alive = thawAlive(s, Infinity), placed = s.housed ? alive : [], wait = s.housed ? [] : alive;
          return `${[placed.length ? `The home's register carries the names of Thaw's residents: ${namesShort(placed, 'en')}.` : "The home's register carries the Forty-First's crew.", wait.length ? `Those awaiting housing are listed separately: ${namesShort(wait, 'en')}.` : ''].filter(Boolean).join(' ')} The dead remain in their own record, with dates and causes: six before our voyage${s.thawDead ? `, ${s.thawDead} while help was coming and after` : ''}.

${!s.rescued ? 'The forty places remained a promise: the record holds forty names and dates.' : s.housed ? 'Before the meeting, forty places were a promise; afterwards, each place belonged to someone.' : `The forty places remain a promise: ${s.rescued} are waiting for housing.`}

Died on the road: ${lossesOf(s, s.arrive).total + s.dead}. Of the crew at the target: ${s.deadHere}.`; }
      }
    },
    {
      id: 'e.answer', scene: 'home', kind: 'bulletin', year: Yepi, when: s => !ownStory(s),
      act: { ru: 'Эпилог · Ответ', en: 'Epilogue · The answer' },
      title: { ru: s => `Сводка Кольца · ответ на наш отчёт, ${yrs(answerLag(s))} спустя`, en: s => `Ring bulletin · the answer to our report, ${yrsEn(answerLag(s))} later` },
      text: {
        ru: s => laserLate(s)
          ? `Кольцо приняло наш отчёт ${reportOn(s, 'ru')}: карты и спектры легли в атлас, следующие экспедиции пойдут с ними. Лазерная экспедиция к ε Индейца ещё в пути.\n\nОдна из дальних станций Кольца приняла издалека сигнал того же типа кода, что и сигнал, за которым уходила тридцать вторая. Источник не единственный. Что это значит, дома пока не знают.`
          : (src(s)
          ? 'Снаряжена новая, отдельно пронумерованная экспедиция эпохи III — к диску, чтобы изучать его с подготовкой, которой не было ни у кого из нас, и дальше по следу навигационных фрагментов маяка. На её пути будут искать и корабль поддержки. Дома ради неё год сокращали потребление.'
          : 'Лазерная экспедиция дошла до Тёмной звезды у ε Индейца. Диск на орбите, рядом корабль тридцать второй; в его журнале фраза целиком: «Вспоминали сегодня Землю. Она красивее всего, что мы видели за всю дорогу». Она была о доме. К диску снаряжают новую экспедицию.')
          + '\n\nОдна из дальних станций Кольца приняла издалека сигнал того же типа кода: диск не единственный.' + (src(s) ? ' Узор, который не прочла Кора, в том сигнале тоже есть.' : '') + ' Контекст появился, объяснения — нет.\n\nДома спорят. Возраст диска и расстояние до дальнего источника плохо сходятся с движением медленнее света. Одни видят в спиральных выступах двигатель — то, что Земля не смогла сделать в своём опыте. Другие отвечают, что дисков просто много и они старше, чем кажется.',
        en: s => laserLate(s)
          ? `The Ring has received our report ${reportOn(s, 'en')}: the maps and spectra are in the atlas, and the next expeditions will go with them. The laser expedition to ε Indi is still on its way.\n\nOne of the Ring's distant stations has picked up, from far away, a signal with the same type of code as the one the Thirty-Second went after. The source is not the only one. What that means, no one at home knows yet.`
          : (src(s)
          ? 'A new, separately numbered epoch III expedition has been fitted out — to the disc, to study it with a preparation none of us had, and on along the trail of the beacon\'s navigation fragments. On its way it will also search for the support ship. At home, consumption was cut for a year to pay for it.'
          : 'The laser expedition reached the Dark Star at ε Indi. The disc is in orbit, and beside it the ship of the Thirty-Second; its log holds the whole sentence: "We remembered Earth today. It is more beautiful than anything we have seen on the whole road." It was about home. A new expedition to the disc is being fitted out.')
          + "\n\nOne of the Ring's distant stations has picked up, from far away, a signal with the same type of code: the disc is not the only one." + (src(s) ? ' The pattern Kora could not read is in that signal too.' : '') + " There is context now, but no explanation.\n\nAt home they argue. The disc's age and the distance to the far source fit poorly with travel slower than light. Some see an engine in the spiral ridges — the thing Earth failed to make in its own experiment. Others answer that there are simply many discs, and they are older than they seem."
      }
    },
    {
      id: 'e.life', scene: 'home', kind: 'note', year: Yepi, when: s => !ownStory(s),
      author: { ru: 'Бортовой архив', en: "Ship's archive" },
      text: {
        ru: s => [
          livable(s) ? (s.settle === 'orbit' ? 'Поселение на орбите — собственная идущая жизнь; внизу — поля под куполами.' : 'Поселение — собственная идущая жизнь.') : 'Дом — собственная идущая жизнь.',
          s.support === 'found' ? 'Корабль поддержки стоит на орбите складом и мастерской; его семеро живут внизу.' : '',
          s.site === 'poor' ? 'У периметра богатого участка стоит застава.' : s.site === 'rich' ? 'Богатый участок держат: периметр и свет по ночам.' : '',
          ['beacon', 'return'].includes(s.home) ? (s.home === 'return' ? 'Ступень обратного пути растёт у гиганта; дети, родившиеся здесь, увидят Землю взрослыми.' : 'Маяк работает без перерыва; вахта сменяется, не выходя из колец.') : 'Первые дети, родившиеся здесь, пошли в школу.',
          s.koraLast ? 'Кора, чей сон закончился, учит детей: школа, которую не передали в полёте, передаётся на земле.' : 'Кору разбудили в последний раз — учить. Школа, которую не передали в полёте, передаётся здесь.',
          `Погибли в пути: ${lossesOf(s, s.arrive).total + s.dead}. У цели: ${s.deadHere}${s.winterDead ? `, из них ${s.winterDead} — в первую зиму` : ''}.`,
          'Известие о новой экспедиции приходит в архив рядовой записью среди прочих: приняли к сведению и вернулись к своим делам.',
          laserLate(s) ? `\n\nЗапись, дописанная в году ${laserYear(s)}: лазерная экспедиция дошла до Тёмной звезды у ε Индейца и нашла корабль тридцать второй. В его журнале фраза целиком: «Вспоминали сегодня Землю. Она красивее всего, что мы видели за всю дорогу». Она была о доме.` : ''
        ].filter(Boolean).join(' '),
        en: s => [
          livable(s) ? (s.settle === 'orbit' ? 'The orbital settlement is a life going on of its own; below, fields under domes.' : 'The settlement is a life going on of its own.') : 'Home is a life going on of its own.',
          s.support === 'found' ? "The support ship stays in orbit as store and workshop; its seven live below." : '',
          s.site === 'poor' ? 'An outpost stands at the perimeter of the rich site.' : s.site === 'rich' ? 'The rich site is held: a perimeter and lights at night.' : '',
          ['beacon', 'return'].includes(s.home) ? (s.home === 'return' ? 'The return stage grows at the giant; the children born here will see Earth as adults.' : 'The beacon works without pause; the watch changes without leaving the rings.') : 'The first children born here have started school.',
          s.koraLast ? 'Kora, whose sleep is over, teaches the children: the school that was not passed on in flight is passed on here.' : 'Kora was woken one last time — to teach. The school that was not passed on in flight is passed on here.',
          `Died on the road: ${lossesOf(s, s.arrive).total + s.dead}. At the target: ${s.deadHere}${s.winterDead ? `, ${s.winterDead} of them in the first winter` : ''}.`,
          'News of the new expedition reaches the archive as a routine entry among others: noted, and back to their own work.',
          laserLate(s) ? `\n\nAn entry added in year ${laserYear(s)}: the laser expedition reached the Dark Star at ε Indi and found the ship of the Thirty-Second. Its log holds the whole sentence: "We remembered Earth today. It is more beautiful than anything we have seen on the whole road." It was about home.` : ''
        ].filter(Boolean).join(' ')
      }
    },
    {
      id: 'e.end', scene: 'home', kind: 'end', year: Yepi,
      effect: s => { s.outcome = outcomeOf(s); },
      title: { ru: s => OUTCOME[outcomeOf(s)].ru, en: s => OUTCOME[outcomeOf(s)].en },
      text: {
        ru: s => rescueS(s) ? endR(s, 'ru') : `Исход: ${OUTCOME[outcomeOf(s)].ru.toLowerCase()}${s.mission === 'rescue' && s.rescued ? `; спасены ${ppl(s.rescued)} из Оттепели` : ''}${s.support === 'found' ? ', с кораблём поддержки' : ''}. Позади ${yrs(Yepi(s))}: путь, прибытие, дом, ответ. Всё, что решали, — в итоге ниже.`,
        en: s => rescueS(s) ? endR(s, 'en') : `Outcome: ${OUTCOME[outcomeOf(s)].en.toLowerCase()}${s.mission === 'rescue' && s.rescued ? `; ${s.rescued} saved from Thaw` : ''}${s.support === 'found' ? ', with the support ship' : ''}. ${yrsEn(Yepi(s))} are behind: the road, the arrival, the home, the answer. Everything decided is in the summary below.`
      }
    }
  ];

  const ui = {
    ru: {
      title: 'М31 · Срез: от пролога до эпилога',
      archive: 'Бортовой архив', year: 'Год', note: 'Личная запись', transcript: 'Стенограмма',
      bulletin: 'Кольцо', instrument: 'Приборная запись', document: 'Документ', decision: 'Решение',
      known: 'Что известно заранее', vote: 'Решить', skip: 'Промотать',
      restart: 'Новый мир', back: 'Вернуться', newWorld: 'Новый мир', nextRun: 'Новая экспедиция', reliefSummary: 'Итог спасения',
      filters: { all: 'Все', transcript: 'Стенограммы', note: 'Личные записи', watch: 'Вахта', instrument: 'Приборы', bulletin: 'Сводки Кольца' }, ved: 'Ведомость',
      summary: 'Итог пути', decided: 'Решено', prologue: 'Пролог', phaseDrift: 'Дрейф', phaseAccel: 'Разгон',
      lang: 'EN', langLabel: 'Switch to English'
    },
    en: {
      title: 'M31 · Slice: from prologue to epilogue',
      archive: "Ship's archive", year: 'Year', note: 'Personal log', transcript: 'Transcript',
      bulletin: 'Ring', instrument: 'Instrument record', document: 'Document', decision: 'Decision',
      known: 'Known in advance', vote: 'Decide', skip: 'Skip ahead',
      restart: 'New world', back: 'Back', newWorld: 'New world', nextRun: 'A new expedition', reliefSummary: 'The rescue',
      filters: { all: 'All', transcript: 'Transcripts', note: 'Personal logs', watch: 'Watch', instrument: 'Instruments', bulletin: 'Ring bulletins' }, ved: 'Full sheet',
      summary: 'The road so far', decided: 'Decided', prologue: 'Prologue', phaseDrift: 'Drift', phaseAccel: 'Acceleration',
      lang: 'RU', langLabel: 'Переключить на русский'
    }
  };

  // Сцены. Слева всегда 3D-вид: view — ракурс камеры. Картинка места (img) идёт иллюстрацией в текст.
  // fallback — кадр Blender, если 3D недоступно.
  const scenes = {
    space: { view: 'open', fallback: 'assets/drift.jpg', label: { ru: 'Галактика', en: 'The Galaxy' } },
    station: { view: 'dock', img: 'assets/station.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · станция связи Кольца', en: 'Earth · Ring contact station' }, side: 'right' },
    council: { view: 'dock', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания', en: 'Earth · Council of Star Navigation' } },
    depart: { view: 'depart', fallback: 'assets/depart.jpg', label: { ru: 'Сорок первая · разгон', en: 'Forty-First · acceleration' } },
    ring: { view: 'rings', img: 'assets/ring.jpg', fallback: 'assets/drift.jpg', label: { ru: 'Жилое кольцо · R 150 м · 1 g', en: 'Habitat ring · R 150 m · 1 g' } },
    vault: { view: 'rings', img: 'assets/vault.jpg', fallback: 'assets/drift.jpg', label: { ru: 'Зал анабиоза · невесомость', en: 'Anabiosis hall · zero g' }, side: 'right' },
    cloud: { view: 'cloud', fallback: 'assets/cloud.jpg', label: { ru: 'Курс · облако класса D2', en: 'Course · class D2 cloud' }, side: 'right' },
    // регистрация экспедиции после паспорта: «в один конец» — весь путь от Солнца до цели, не корабль
    register: { view: 'route', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания · курс', en: 'Earth · Council of Star Navigation · course' } },
    fitting: { view: 'cargo', fallback: 'assets/depart.jpg', label: { ru: 'Орбита Земли · комплектация', en: 'Earth orbit · fitting out' } },
    chart: { view: 'sector', fallback: 'assets/depart.jpg', label: { ru: 'Штурманская · звёздная карта', en: 'Navigation room · star chart' } },
    agenda: { view: 'agenda', fallback: 'assets/depart.jpg', label: { ru: 'Совет Звездоплавания · карта заявок', en: 'Council of Star Navigation · request chart' } },
    // цель задана заявкой (снабженец, спасатель) и лежит вне сектора сигнала — в кадре Солнце и цель, ракурс «Маршрут»
    chartTarget: { view: 'targetRoute', fallback: 'assets/depart.jpg', label: { ru: 'Штурманская · звёздная карта', en: 'Navigation room · star chart' } },
    scout: { view: 'ship', fallback: 'assets/depart.jpg', label: { ru: 'Корма · запуск зонда', en: 'Stern · probe launch' } },
    stage: { view: 'stage', fallback: 'assets/stage.jpg', label: { ru: 'Отделение ступени разгона', en: 'Acceleration stage separation' } },
    drift: { view: 'drift', fallback: 'assets/drift.jpg', label: { ru: 'Дрейф', en: 'Drift' }, side: 'right' },
    sail: { view: 'sail', fallback: 'assets/drift.jpg', label: { ru: 'Торможение · плазменный магнит', en: 'Braking · plasma magnet' }, side: 'right' },
    dark: { view: 'dark', fallback: 'assets/drift.jpg', label: { ru: 'Тёмная звезда', en: 'The Dark Star' }, side: 'right' },
    shield: { view: 'shield', fallback: 'assets/drift.jpg', label: { ru: 'Фронтальный щит · осмотр', en: 'Forward shield · inspection' }, side: 'right' },
    flip: { view: 'flip', fallback: 'assets/drift.jpg', label: { ru: 'Торможение', en: 'Braking' }, side: 'right' },
    relic: { view: 'relic', fallback: 'assets/drift.jpg', label: { ru: 'Тёмная звезда · дальний проход', en: 'The Dark Star · the distant pass' }, side: 'right' },
    arrival: { view: 'arrival', fallback: 'assets/drift.jpg', label: { ru: 'Прибытие', en: 'Arrival' }, side: 'right' },
    home: { view: 'home', fallback: 'assets/drift.jpg', label: { ru: 'Орбита · где будет дом', en: 'Orbit · where home will be' }, side: 'right' },
    // партия спасателей: карта сигнала бедствия и совет базы, услышавшей первой
    distress: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Карта сигнала бедствия', en: 'Distress signal map' }, side: 'right' },
    // сводка о парусе эпохи III: камера — от Солнца за парусом по лучу лазерных станций
    epoch3: { view: 'epoch3', fallback: 'assets/drift.jpg', label: { ru: 'Луч лазерных станций · парус эпохи III', en: 'The laser stations\' beam · the epoch III sail' } },
    sosPass: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Лакайль 9352 · совет Перевала', en: 'Lacaille 9352 · council of the Pass' }, side: 'right' },
    sosEarth: { view: 'distress', img: 'assets/council.jpg', fallback: 'assets/depart.jpg', label: { ru: 'Земля · Совет Звездоплавания', en: 'Earth · Council of Star Navigation' }, side: 'right' },
    sosLocal: { view: 'distress', fallback: 'assets/drift.jpg', label: { ru: 'Колония у звезды цели · совет', en: 'The colony at the target star · council' }, side: 'right' },
    rescue: { view: 'home', fallback: 'assets/drift.jpg', label: { ru: 'У цели · корабль сорок первой', en: 'At the target · the Forty-First' }, side: 'right' }
  };
  Object.assign(ui.ru, {
    archiveBtn: 'Архив', encBtn: 'Энциклопедия', close: 'Закрыть', skipIntro: 'Пропустить', nextShot: 'Дальше', speed: 'скорость', lag: 'задержка связи с Землёй', months: 'мес.',
    earth: 'Земля', sleepers: 'Зал анабиоза', asleep: 'спят', onWatch: 'на вахте', lost: 'погибли в пути',
    model: 'модель: проход безопасен · 94%', manual: 'ручная проверка Орина: край плотнее на 6%',
    pathStraight: 'без коррекции', pathAround: 'манёвр', edgeTrust: 'удары пыли ×1,4 прогноза · щит −1,5 года',
    edgeMan: 'край плотнее модели', measured: 'затмение: пыль крупная, ×1,4', lives: 'Годы бодрствования',
    probeTitle: 'Две записи · один сектор неба', probeA: 'последняя передача 32-й', probeB: 'новый сигнал · каждые 40 мин',
    probeMatch: 'совпадают в пределах погрешности · код неизвестен',
    lensTitle: 'Снимок Кольца · гравитационная линза', lensSub: 'реконструкция 48 × 48 точек',
    lensClass: { ruined: 'кора расколота · расплав · обломки', hostile: 'облачная крыша · парник > 400 °C', none: 'на расчётной орбите пусто', dome: 'приливный захват · пар и лёд', open: 'вода · облака · суша' },
    // карта и паспорт экспедиции
    mapHint: 'Карту можно вращать и приближать. Строка заявки или щелчок по звезде — камера подлетает к системе. Курс задаёт заявка, за которую проголосует Совет.',
    agendaChips: 'Звёзды заявок', requestHere: 'Заявка у этой звезды', noRequest: 'Заявки у этой звезды нет — только справка.',
    planetsKnown: 'Подтверждённые планеты', noPlanets: 'Подтверждённых планет нет.', mEarth: 'массы Земли',
    pSpeed: 'Скорость', pReserve: 'Резерв манёвров', pCargo: 'Груз сверх ядра', kt: 'тыс. т', free: 'свободно', over: 'перегруз',
    pTarget: 'Цель', pPath: 'Путь', pArrive: 'прибытие около года', pAwake: 'каждый проживёт в пути', pAwakeTail: 'при вахте 48',
    pChecks: 'Проверки Совета', cFit: 'Груз помещается в выделенное топливо', cAwake: 'Не больше 25 лет бодрствования на человека',
    cThin: 'Больше 20 лет бодрствования: понадобится тонкая вахта', approve: 'Утвердить паспорт',
    gaugesTitle: 'Запасы', after: 'После', noChange: 'Запасы не меняются.', worldTitle: 'Мир после экспедиции', incidentsTitle: 'Протокол происшествий', recTitle: 'Совет рекомендует', recAssume: 'допущение', tlArrive: 'прибытие', tlShip: 'Корабль', tlPhase: { acc: 'разгон', drift: 'дрейф', mag: 'торможение магнитом', eng: 'торможение двигателем, кормой вперёд', home: 'у цели' }, tlPhases: { acc: 'разгон', drift: 'дрейф', mag: 'магнит', eng: 'двигатель', home: 'у цели' }, settings: 'Настройки', setLang: 'Язык', setSound: 'Звук', soundNone: 'В срезе пока нет звука.',
    setProgress: 'Прогресс', newWorldHint: 'Начать сначала в новом мире. Текущая партия уходит в резервную копию.',
    wipe: 'Сбросить весь прогресс', wipeHint: 'Стереть сохранение, память мира и резервную копию. Язык останется.',
    wipeAsk: 'Сбросить весь прогресс? Сохранение, память мира и резервная копия будут стёрты без возврата.', thawBerths: 'мест для Оттепели', ownPeople: 'своих', thawIn: 'спят из Оттепели', newWorldAsk: 'Начать новый мир? Ходы этой партии и память мира будут стёрты.', ppTitle: 'Расчёт паспорта · что изменит выбор',
    colonies: n => `Колонии и следы · ${n}`, archiveNote: 'Архив Кольца на день старта: последние отчёты, дошедшие до Земли.', legacyNote: 'Наследие прошлых экспедиций; общий календарь мира пока не ведётся.',
    road: (a, b) => `Ещё ${a} ${plural(a, ['экспедиция', 'экспедиции', 'экспедиций'])} в пути, ${b} ${plural(b, ['закончила', 'закончили', 'закончили'])} программы.`,
    pEquip: 'Оснащение', swaps: (n, m) => `замены ${n} из ${m}`, eraII: 'эпоха II', fixedEq: 'пока без выбора',
    eqStd: 'Штатно: плазменный магнит; радиационная защита — тороиды 20 Т·м.', eqLimit: 'Совет подготовил комплект. Можно изменить две позиции. Варианты внутри позиции можно пересматривать сколько угодно; возврат к рекомендации освобождает место.',
    eqFull: list => `Уже изменены две позиции: ${list}. Чтобы изменить третью, верните одну из них к рекомендации Совета.`, eqKeep: 'Сохранено из паспорта; отдельного применения в этой миссии нет.',
    eqBenefit: 'Польза', eqCondition: 'Условие', eqBasis: 'Основание', eqBack: 'Вернуть рекомендацию', eqSumTitle: 'Оснащение в пути', eqHelped: 'Помогло', eqIdle: 'Не понадобилось', eqMissing: 'Не хватило', eqNone: 'Нет зарегистрированных случаев.', eqRec: 'рекомендация Совета', eqDossier: 'Досье', eqCouncilT: 'Совет',
    cSwaps: 'Не больше двух замен против рекомендации Совета', pBrake: t => `магнит тормозит ${Math.round(t)} ${plural(Math.round(t), ['год', 'года', 'лет'])}`, pBrakeMass: 'масса к торможению',
    eqFx: {
      magnet: 'Тормозит почти постоянной силой: чем тяжелее корабль, тем дольше торможение.',
      rad20: 'Расчётный щит эпохи I; вдвое сильнее — только в эпохе II.',
      capsStd: 'Отказ капсулы 2·10⁻⁴ в год; при пробуждении гибнет 0,4%.',
      capsSafe: 'Отказы и гибель при пробуждении — вдвое реже; сон в ожидании теряет меньше.',
      shipOnly: 'Энергия у цели — только от корабля: первая зима тяжела без поддержки.',
      grid: 'Кабель к сети колонии — работает только у живой колонии.',
      reactor5: '5 МВт на купола и первую зиму; сильный удар потока разобьёт единственный блок.',
      dual: 'Два блока: второй переживёт любой удар.',
      spectra: 'Слабые спектры читает только специалист.',
      ir: 'Читает слабые спектры, видит холодные карлики и вспышки заранее.',
      spectraPlus: 'Ученики проверяют поток за 18 суток вместо 26; Коре всё равно три недели на пробуждение.',
      none: 'Зонд строят из материалов для высадки.',
      scout2: 'Ранний разведчик к цели и второй — для проверки потока; материалы целы.',
      inspect: 'Один зонд для проверки потока за 10 суток; до звезды не долетит.',
      dust20: 'Износ у облака пробивает сектор.',
      dust40: 'Держит полтора года износа у облака без пробоя.',
      sectors: 'Пробитый сектор меняют ремонтники с допуском.',
      repair: 'Чертежи Кольца — только в архив.',
      tools: 'Можно построить капельный радиатор по чертежу: −20% материалов.',
      printQC: 'Капельный радиатор дешевле: −10% материалов.'
    },
    say: {
      speed: ['Ива Лорн', 'Каждый год пути — это год жизни каждого из нас.'],
      reserve: ['Орин Дал', 'Резерв — это право ошибиться в пути и у цели. Чего мы не видим отсюда, увидим на подлёте.'],
      cargo: ['Феб Ирсон', 'Каждая тысяча тонн груза на 0,1c — тридцать пять тысяч тонн топлива.'],
      cargo2: ['Тея Марр', 'Материалы — это дом, а не запчасти.']
    }
  });
  Object.assign(ui.en, {
    archiveBtn: 'Archive', encBtn: 'Encyclopedia', close: 'Close', skipIntro: 'Skip', nextShot: 'Next', speed: 'velocity', lag: 'signal delay to Earth', months: 'mo',
    earth: 'Earth', sleepers: 'Anabiosis hall', asleep: 'asleep', onWatch: 'on watch', lost: 'died on the road',
    model: 'model: passage safe · 94%', manual: "Orin's manual check: edge 6% denser",
    pathStraight: 'no correction', pathAround: 'manoeuvre', edgeTrust: 'dust impacts ×1.4 forecast · shield −1.5 yr',
    edgeMan: 'edge denser than model', measured: 'occultation: coarse dust, ×1.4', lives: 'Years awake',
    probeTitle: 'Two recordings · one sector of sky', probeA: "32nd's last transmission", probeB: 'new signal · every 40 min',
    probeMatch: 'match within the error · code unknown',
    lensTitle: 'Ring image · gravitational lens', lensSub: 'reconstruction 48 × 48 points',
    lensClass: { ruined: 'crust split · melt · debris', hostile: 'cloud deck · greenhouse > 400 °C', none: 'predicted orbit empty', dome: 'tidally locked · vapour and ice', open: 'water · clouds · land' },
    mapHint: 'The chart can be turned and zoomed. A request row or a click on a star brings the camera to the system. The course is set by the request the Council votes for.',
    agendaChips: 'Request stars', requestHere: 'Request at this star', noRequest: 'No request at this star — reference only.',
    planetsKnown: 'Confirmed planets', noPlanets: 'No confirmed planets.', mEarth: 'Earth masses',
    pSpeed: 'Velocity', pReserve: 'Manoeuvre reserve', pCargo: 'Cargo beyond the core', kt: 'kt', free: 'free', over: 'overload',
    pTarget: 'Target', pPath: 'Road', pArrive: 'arrival around year', pAwake: 'each person lives awake on the road', pAwakeTail: 'with a watch of 48',
    pChecks: 'Council checks', cFit: 'Cargo fits the allotted fuel', cAwake: 'No more than 25 waking years per person',
    cThin: 'Over 20 waking years: a thin watch will be needed', approve: 'Approve the passport',
    gaugesTitle: 'Stores', after: 'After', noChange: 'Stores do not change.', worldTitle: 'The world after the expedition', incidentsTitle: 'Incident minutes', recTitle: 'The council recommends', recAssume: 'assumption', tlArrive: 'arrival', tlShip: 'The ship', tlPhase: { acc: 'acceleration', drift: 'drift', mag: 'braking on the magnet', eng: 'braking on the engine, stern first', home: 'at the target' }, tlPhases: { acc: 'acceleration', drift: 'drift', mag: 'magnet', eng: 'engine', home: 'at the target' }, settings: 'Settings', setLang: 'Language', setSound: 'Sound', soundNone: 'The slice has no sound yet.',
    setProgress: 'Progress', newWorldHint: 'Start over in a new world. The current run goes to the backup copy.',
    wipe: 'Reset all progress', wipeHint: 'Erase the save, the memory of the world and the backup copy. The language stays.',
    wipeAsk: 'Reset all progress? The save, the memory of the world and the backup copy will be erased for good.', thawBerths: 'berths for Thaw', ownPeople: 'of our own', thawIn: 'from Thaw asleep', newWorldAsk: 'Start a new world? The moves of this run and the memory of the world will be erased.', ppTitle: 'Passport calculation · what the choice changes',
    colonies: n => `Colonies and traces · ${n}`, archiveNote: 'The Ring archive on the day of departure: the latest reports that reached Earth.', legacyNote: 'Legacy of past expeditions; there is no common world calendar yet.',
    road: (a, b) => `${a} more expeditions are on the road, ${b} have finished their programmes.`,
    pEquip: 'Equipment', swaps: (n, m) => `swaps ${n} of ${m}`, eraII: 'epoch II', fixedEq: 'no choice yet',
    eqStd: 'Standard equipment: plasma magnet; radiation shielding — 20 T·m toroids.', eqLimit: 'The Council has prepared a loadout. You may change two positions. You can revise the option within a position as often as you like; returning to the recommendation frees a slot.',
    eqFull: list => `Two positions already differ: ${list}. To change a third, restore the Council's recommendation for one of them.`, eqKeep: 'Retained from the passport; no separate application in this mission.',
    eqBenefit: 'Benefit', eqCondition: 'Condition', eqBasis: 'Basis', eqBack: 'Restore recommendation', eqSumTitle: 'Equipment on the road', eqHelped: 'Helped', eqIdle: 'Not needed', eqMissing: 'Missing', eqNone: 'No recorded cases.', eqRec: "the Council's recommendation", eqDossier: 'Dossier', eqCouncilT: 'Council',
    cSwaps: 'No more than two swaps against the Council\'s recommendation', pBrake: t => `the magnet brakes for ${Math.round(t)} years`, pBrakeMass: 'mass at braking',
    eqFx: {
      magnet: 'Brakes with a nearly constant force: the heavier the ship, the longer the braking.',
      rad20: 'The epoch I rated shield; twice as strong only in epoch II.',
      capsStd: 'Capsule failure 2·10⁻⁴ a year; 0.4% die on waking.',
      capsSafe: 'Failures and waking deaths halved; sleeping while waiting loses fewer.',
      shipOnly: 'Power at the target comes only from the ship: the first winter is hard without support.',
      grid: 'A cable to the colony grid — works only at a living colony.',
      reactor5: '5 MW for the domes and the first winter; a strong stream strike smashes the single unit.',
      dual: 'Two units: the second survives any strike.',
      spectra: 'Only a specialist reads the weak spectra.',
      ir: 'Reads the weak spectra, sees cold dwarfs and flares in advance.',
      spectraPlus: 'The students check the stream in 18 days instead of 26; Kora still needs three weeks to wake.',
      none: 'A probe is built from the landing materials.',
      scout2: 'An early scout to the target and a second one for the stream check; the materials stay whole.',
      inspect: 'One probe for a 10-day stream check; it will not reach the star.',
      dust20: 'Wear at the cloud breaches a sector.',
      dust40: 'Holds a year and a half of cloud wear without a breach.',
      sectors: 'A breached sector is swapped by qualified repair hands.',
      repair: 'The Ring\'s designs go only into the archive.',
      tools: 'The droplet radiator can be built from the design: −20% materials.',
      printQC: 'The droplet radiator comes cheaper: −10% materials.'
    },
    say: {
      speed: ['Iva Lorn', 'Every year on the road is a year of life for each of us.'],
      reserve: ['Orin Dal', "Reserve is the right to make a mistake on the road and at the target. What we can't see from here we'll see on approach."],
      cargo: ['Feb Irson', 'Every thousand tonnes of cargo at 0.1c costs thirty-five thousand tonnes of fuel.'],
      cargo2: ['Teya Marr', 'Materials are a home, not spare parts.']
    }
  });

  // Персонажи: имена во всех встречающихся формах, портрет (или инициалы) и цвет одежды из канона.
  // Портрет в тексте — при первом упоминании в записи; готовые портреты перечислены в assets/portraits/index.js.
  const people = {
    dasser: { color: '#1f5a5c', ini: { ru: 'НД', en: 'ND' },
      ru: ['Нил Дассер', 'Дассер', 'Дассера', 'Дассеру', 'Дассером', 'Дассере'], en: ['Nil Dasser', 'Dasser'] },
    orin: { color: '#b7862f', ini: { ru: 'ОД', en: 'OD' },
      ru: ['Орин Дал', 'Орин', 'Орина', 'Орину', 'Орином', 'Дал'], en: ['Orin Dal', 'Orin', 'Dal'] },
    kassel: { color: '#6e2434', ini: { ru: 'ИК', en: 'IK' },
      ru: ['Ирина Кассель', 'Кассель'], en: ['Irina Kassel', 'Kassel'] },
    kora: { color: '#1e6d6a', ini: { ru: 'КЛ', en: 'KL' },
      ru: ['Кора Ландис', 'Кора', 'Коры', 'Коре', 'Кору', 'Корой', 'Ландис'], en: ['Kora Landis', 'Kora', 'Landis'] },
    dan: { color: '#6a6f76', ini: { ru: 'ДО', en: 'DO' },
      ru: ['Дан Осгер', 'Дан', 'Дана', 'Дану', 'Даном', 'Осгер'], en: ['Dan Osger', 'Dan', 'Osger'] },
    irson: { color: '#7d7a73', ini: { ru: 'ФИ', en: 'FI' },
      ru: ['Феб Ирсон', 'Ирсон', 'Ирсона', 'Ирсону', 'Ирсоном'], en: ['Feb Irson', 'Irson'] },
    lorn: { color: '#3d4f7a', ini: { ru: 'ИЛ', en: 'IL' },
      ru: ['Ива Лорн', 'Лорн'], en: ['Iva Lorn', 'Lorn'] },
    marr: { color: '#5b6b2e', ini: { ru: 'ТМ', en: 'TM' },
      ru: ['Тея Марр', 'Тея', 'Теи', 'Тее', 'Тею', 'Марр'], en: ['Teya Marr', 'Teya'] },
    naya: { color: '#5d4a78', ini: { ru: 'НС', en: 'NS' },
      ru: ['Ная Сорн', 'Ная', 'Наю', 'Наи', 'Наей'], en: ['Naya Sorn', 'Naya'] },
    selina: { color: '#2d5f8a', ini: { ru: 'СВ', en: 'SV' },
      ru: ['Селина Вей', 'Селина', 'Селину', 'Селины', 'Селине', 'Селиной'], en: ['Selina Vei', 'Selina'] },
    tamir: { color: '#8a4b2d', ini: { ru: 'ТВ', en: 'TV' },
      ru: ['Тамир Вент', 'Тамир', 'Тамира', 'Тамиру', 'Тамиром'], en: ['Tamir Vent', 'Tamir'] }
  };


  // ================================================================ ПАРТИЯ СПАСАТЕЛЕЙ
  // Авария кончила экспедицию, люди живы. Следующая партия — совет базы, которая услышала сигнал первой.
  // Годы — по календарю сорок первой (от её отлёта). inc — снимок аварии, world — снимок мира на старте партии:
  // повторный проход партии даёт тот же результат, даже если мир после неё изменился.
  const CAUSE = {
    cargo: { ru: 'в середине дрейфа отказало охлаждение — трещина в коллекторе, погибли двенадцать человек', en: 'in mid-drift the cooling failed — a crack in the manifold; twelve died' },
    drift: { ru: 'в последней четверти дрейфа отказал контур воды, погиб тридцать один человек', en: 'in the last quarter of the drift the water loop failed and thirty-one died' },
    stream: { ru: 'у Тёмной звезды удар потока пробил зал анабиоза', en: 'at the Dark Star a stream strike breached the anabiosis hall' },
    home: { ru: 'мир у цели непригоден, а строить нечем', en: 'the world at the target is unfit, and there is nothing to build with' },
    rescueDock: { ru: 'у склада Оттепели повреждённую линию подключили без изоляции; отказало охлаждение корабля, погибли шестеро', en: "at Thaw's store the damaged line was connected without isolation; the ship's cooling failed and six died" }
  };
  const plan = s => M.rescuers(s.inc, s.world);
  const rsc = (s, id) => plan(s).list.find(r => r.id === id) || null;
  const shipWhere = (s, y, lang) => y < s.inc.arrive
    ? (lang === 'ru' ? `Корабль идёт к ${nmD(s)} по программе и встанет на орбиту около года ${s.inc.arrive}.` : `The ship flies on to ${nm(s, 'en')} by programme and will enter orbit around year ${s.inc.arrive}.`)
    : (lang === 'ru' ? `Корабль на орбите у ${nmG(s)}.` : `The ship is in orbit at ${nm(s, 'en')}.`);
  const passEarthLy = () => M.lightYears('pass', 'earth');
  // пилотируемый вылет Земли отменяется, только если подтверждение, что аппарат Перевала вышел, пришло до её старта
  const earthStands = s => { const p = rsc(s, 'pass'), e = rsc(s, 'earth'); return !p || p.launch + passEarthLy() > e.launch; };
  const CREWED = { tug: 'pass', sail: 'earth', earth: 'earth', take: 'local', repair: 'local' };
  const voyage = r => r && r.id !== 'local' ? { id: r.id, launch: r.launch, arrive: yr(r.complete) - M.WORK } : null;
  // исход — по живым: спящих не осталось — «опоздали»; помощь позже срока — «спасены не все»
  const grade = (sv, c, until, by) => !sv.sleepers ? 'tooLate' : c > until ? 'partial' : by === 'earth' ? 'savedEarth' : 'savedColony';
  function reliefResult(s) {
    const inc = s.inc, e = rsc(s, 'earth'), p = rsc(s, 'pass');
    if (s.send === 'none') return { by: null, voyages: [], saved: M.survivors(inc, Infinity), outcome: 'remain' };
    if (s.send === 'auto') {
      // аппарат без людей ставит сменный холодильный блок, насосы и электронику: капсулы, дожившие до него,
      // держат до max(срок, его работа + 60). Разбудить всех нельзя — жизнеобеспечение рассчитано на вахту; людей шлёт Земля.
      const vs = [voyage(p), voyage(e)];
      if (e.complete <= p.complete) { const sv = M.survivors(inc, e.complete); return { by: 'earth', earthFirst: true, voyages: vs, arrive: yr(e.complete) - M.WORK, complete: e.complete, saved: sv, outcome: grade(sv, e.complete, inc.deadline, 'earth') }; }
      const kept = M.survivors(inc, p.complete).sleepers, until = Math.max(inc.deadline, p.complete + 60);
      const sv = kept ? M.survivors({ sleepers: kept, watch: inc.watch, sent: p.complete, hold: until - p.complete, capRate: inc.capRate }, e.complete) : M.survivors(inc, e.complete);
      const o = grade(sv, e.complete, until, 'earth');
      return { by: 'earth', auto: p.complete, kept, until, voyages: vs, arrive: yr(e.complete) - M.WORK, complete: e.complete, saved: sv, outcome: o === 'savedEarth' ? 'savedLater' : o };
    }
    let by = CREWED[s.send], r = rsc(s, by);
    const vs = [voyage(r)];
    if (s.send === 'tug' && earthStands(s)) { vs.push(voyage(e)); if (e.complete < r.complete) { by = 'earth'; r = e; } }   // Земля не узнала вовремя: летят оба, спасает первый
    const sv = M.survivors(inc, r.complete);
    return { by, voyages: vs.filter(Boolean), arrive: yr(r.complete) - M.WORK, complete: r.complete, saved: sv, outcome: grade(sv, r.complete, inc.deadline, by) };
  }
  // спящие на дату записи — по той же модели, с учётом работы автомата
  const sleepersAt = (s, y) => { const r = s.res, inc = s.inc;
    if (r.auto && r.kept && y >= r.auto) return M.survivors({ sleepers: r.kept, watch: inc.watch, sent: r.auto, hold: r.until - r.auto, capRate: inc.capRate }, y).sleepers;
    return M.survivors(inc, y).sleepers; };
  // События мира от партии спасателей; каждое применяется один раз по своему id, к текущему миру (game.js).
  // Аппарат Перевала списан, когда он вылетел; поселение — когда помощь закончена.
  function reliefEvents(s) {
    const out = [], r = s.res, p = rsc(s, 'pass');
    if (!r) return out;
    if ((s.send === 'tug' || s.send === 'auto') && p && s.year >= p.launch - 1e-9) out.push({ id: s.inc.id + '|tug', passTug: false });
    if (s.outcome && s.outcome !== 'remain' && r.saved.total > 0) out.push({ id: s.inc.id + '|settle', settle: { star: s.inc.target, year: yr(r.complete), people: r.saved.total, joined: s.send === 'take' ? s.colony : null } });
    return out;
  }
  function applyEvents(world, events) {
    const w = JSON.parse(JSON.stringify(world || {}));
    w.applied = w.applied || [];
    const markDone = x => { if (x && x.request && x.task && x.task.done && !(w.requestsDone || []).includes(x.request)) (w.requestsDone = w.requestsDone || []).push(x.request); };
    for (const ev of events) {
      if (w.applied.includes(ev.id)) {                                 // уже записанный итог старой партии: дописать заявку и задание
        const x = ev.expedition, old = x && (w.expeditions || []).find(e => e.id === x.id);
        if (old && old.request === undefined) { old.request = x.request; old.task = x.task; markDone(x); }
        continue;
      }
      if (ev.passTug === false) w.passTug = false;
      if (ev.settle) (w.settled = w.settled || []).push(ev.settle);
      if (ev.expedition) (w.expeditions = w.expeditions || []).push(ev.expedition);
      markDone(ev.expedition);
      w.applied.push(ev.id);
    }
    return w;
  }
  // снимок аварии из сохранения: цель, причина и числа должны быть целы
  const validIncident = inc => !!(inc && typeof inc === 'object' && typeof inc.id === 'string' && typeof inc.target === 'string' && M.star(inc.target)
    && Object.prototype.hasOwnProperty.call(CAUSE, inc.cause)
    && ['beta', 'arrive', 'sent', 'alive', 'watch', 'sleepers', 'hold', 'deadline'].every(k => Number.isFinite(inc[k]))
    && inc.beta > 0 && inc.beta < 0.3 && inc.arrive > 0 && inc.sent >= 0 && inc.hold > 0 && inc.watch >= 0 && inc.sleepers >= 0
    && inc.alive === inc.sleepers + inc.watch && inc.deadline === inc.sent + inc.hold);
  // решения, добавленные в сюжет позже: старые сохранения проходят их вариантом по умолчанию (engine.migrate)
  // (id варианта не 'go': иначе старая перемотка молча съедалась бы решением и ответы сдвигались)
  const INSERTED = { 'd.sos.drift': 'carry', 'd.sos.stream': 'carry', 'd.supplyApproach': 'protect', 'd.rescuePrep': 'defer', 'd.rescueShelter': 'direct', 'd.newInfo': 'stay' };
  const marginLine = (c, dl, lang) => lang === 'ru'
    ? `Капсулы держат до года ${dl}: ` + (c <= dl ? `запас — ${yrs(dl - c)}.` : c < dl + 5 ? `опоздание ${yrs(Math.max(1, c - dl))} — часть блоков откажет.` : 'не успеть.')
    : `The capsules hold until year ${dl}: ` + (c <= dl ? `margin ${yrsEn(dl - c)}.` : c < dl + 5 ? `${yrsEn(Math.max(1, c - dl))} late — some blocks will fail.` : 'too late.');
  const capLine = (r, lang) => {
    const ru = lang === 'ru', c = yr(r.complete);
    if (r.id === 'local') return ru ? `помощь внутри системы — к году ${c}` : `help within the system by year ${c}`;
    if (r.id === 'pass') return ru ? `ремонтный аппарат на 0,08c — к году ${c}` : `the repair vessel at 0.08c — by year ${c}`;
    return ru ? `парус эпохи III на 0,2c, постройка десять лет — к году ${c}` : `an epoch III sail at 0.2c, ten years to build — by year ${c}`;
  };
  const OUTCOME_R = {
    savedColony: { ru: 'Спасены колонией', en: 'Rescued by a colony' },
    savedEarth: { ru: 'Спасены Землёй', en: 'Rescued by Earth' },
    savedLater: { ru: 'Разбудили следующие', en: 'Woken by those who came next' },
    partial: { ru: 'Спасены не все', en: 'Not all were saved' },
    tooLate: { ru: 'Опоздали', en: 'Too late' },
    remain: { ru: 'Остались спящие', en: 'Those who stayed asleep' }
  };
  const aliveLine = (s, lang) => { const inc = s.inc, r = s.res, ru = lang === 'ru', sv = r.saved, late = r.complete - (r.until || inc.deadline);
    if (!sv.total) return ru ? 'Живых нет: последняя смена пережила зал, но не дождалась.' : 'No one is alive: the last shift outlived the hall, but not the wait.';
    if (!sv.sleepers) return ru ? 'Живых капсул нет. Двенадцать последней смены живы.' : 'No capsule is alive. The twelve of the last shift are alive.';
    const tail = ru ? `живы ${sv.sleepers} из ${inc.sleepers} спящих и двенадцать вахты` : `${sv.sleepers} of the ${inc.sleepers} sleepers are alive, and the twelve of the watch`;
    if (late > 0) return ru ? `Капсулы отказывают уже ${yrs(Math.max(1, late))}: ${tail}.` : `The capsules have been failing for ${yrsEn(Math.max(1, late))}: ${tail}.`;
    if (r.until) return `${cap(tail)}.`;
    return ru ? `${cap(tail)}: капсулы отказывали по одной, как и считали.` : `${cap(tail)}: the capsules failed one at a time, as calculated.`;
  };
  const signalText = (s, lang, head, tail) => { const inc = s.inc, c = plan(s).council, ru = lang === 'ru', dt = c.hear - inc.sent;
    return ru
      ? `${head} Сигнал бедствия шёл сюда ${dt < 0.1 ? 'считаные недели' : `${f1(dt, 'ru')} ${Math.round(dt * 10) % 10 ? 'года' : plural(Math.round(dt), ['год', 'года', 'лет'])}`}.

Сорок первая, экспедиция к ${nmD(s)}: ${CAUSE[inc.cause].ru}. Живы ${ppl(inc.alive)}: двенадцать на вахте, остальные спят в законсервированном зале. Капсулы рассчитаны до года ${inc.deadline}. ${shipWhere(s, c.hear, 'ru')}

${tail}`
      : `${head} The distress signal took ${dt < 0.1 ? 'a few weeks' : `${f1(dt, 'en')} years`} to get here.

The Forty-First, the expedition to ${nm(s, 'en')}: ${CAUSE[inc.cause].en}. ${inc.alive} are alive: twelve on watch, the rest asleep in the conserved hall. The capsules are rated to year ${inc.deadline}. ${shipWhere(s, c.hear, 'en')}

${tail}`; };

  const RBEATS = [
    {
      id: 'r.signal.pass', scene: 'sosPass', kind: 'transcript', when: s => s.council === 'pass',
      title: { ru: 'Совет Перевала', en: 'Council of the Pass' },
      text: {
        ru: s => signalText(s, 'ru', 'Лакайль 9352, станция Перевала.', `Координатор открывает совет: «Земля ещё ничего не знает. Она услышит этот сигнал в год ${yr(rsc(s, 'earth').hear)}. Решаем мы — а у нас один межзвёздный аппарат».`),
        en: s => signalText(s, 'en', 'Lacaille 9352, the Pass station.', `The coordinator opens the council: "Earth knows nothing yet. It will hear this signal in year ${yr(rsc(s, 'earth').hear)}. We decide — and we have one interstellar vessel."`)
      }
    },
    {
      id: 'r.signal.earth', scene: 'sosEarth', kind: 'transcript', when: s => s.council === 'earth',
      title: { ru: 'Совет Звездоплавания — снова', en: 'The Council of Star Navigation — again' },
      text: {
        ru: s => { const p = rsc(s, 'pass'); return signalText(s, 'ru', 'Земля, Совет Звездоплавания: тот же зал, где когда-то утверждали паспорт сорок первой.',
          'Ближе к ним нет никого, кто мог бы вылететь раньше' + (p ? `: Перевал услышит в год ${yr(p.hear)}, его аппарат дошёл бы к году ${yr(p.complete)}` : s.world.passTug === false ? ': у Перевала больше нет межзвёздного аппарата' : '') + '. Решает Земля.'); },
        en: s => { const p = rsc(s, 'pass'); return signalText(s, 'en', 'Earth, the Council of Star Navigation: the same hall where the Forty-First\'s passport was once approved.',
          'There is no one closer who could launch sooner' + (p ? `: the Pass will hear in year ${yr(p.hear)}, and its vessel would get there by year ${yr(p.complete)}` : s.world.passTug === false ? ': the Pass no longer has an interstellar vessel' : '') + '. Earth decides.'); }
      }
    },
    {
      id: 'r.signal.local', scene: 'sosLocal', kind: 'transcript', when: s => s.council === 'local',
      title: { ru: s => `Совет ${place(plan(s).council, 'ru', 1)}`, en: s => `Council of ${place(plan(s).council, 'en')}` },
      text: {
        ru: s => { const c = plan(s).council, col = M.colony(c.colony); return signalText(s, 'ru', `${cap(place(c, 'ru'))} — у той же звезды.`,
          `Помощь отсюда — вопрос месяцев, а не десятилетий. Вопрос в другом: у нас ${ppl(col.awake)} бодрствующих, а их — ${inc0(s)}.`); },
        en: s => { const c = plan(s).council, col = M.colony(c.colony); return signalText(s, 'en', `${cap(place(c, 'en'))} is at the same star.`,
          `Help from here is a matter of months, not decades. The question is another: we have ${col.awake} awake, and they are ${s.inc.alive}.`); }
      }
    },
    {
      id: 'r.sphere', scene: 'distress', kind: 'instrument',
      title: { ru: 'Карта сигнала', en: 'Signal map' },
      text: {
        ru: s => { const R = plan(s), c = R.council, L = passEarthLy();
          return R.list.map(r => `${cap(place(r, 'ru'))}: сигнал — год ${yr(r.hear)}; ${capLine(r, 'ru')}.`).join('\n') + `\nКапсулы держат до года ${s.inc.deadline}.`
            + (c.id === 'pass' ? `\n\nРешение Перевала дойдёт до Земли в год ${yr(c.hear + L)}; её ответ вернётся сюда в год ${yr(c.hear + 2 * L)}. Первым услышать — не значит первым успеть.` : ''); },
        en: s => { const R = plan(s), c = R.council, L = passEarthLy();
          return R.list.map(r => `${cap(place(r, 'en'))}: signal in year ${yr(r.hear)}; ${capLine(r, 'en')}.`).join('\n') + `\nThe capsules hold until year ${s.inc.deadline}.`
            + (c.id === 'pass' ? `\n\nThe Pass's decision will reach Earth in year ${yr(c.hear + L)}; Earth's answer will come back here in year ${yr(c.hear + 2 * L)}. Hearing first does not mean arriving first.` : ''); }
      }
    },
    {
      id: 'd.r.launch', scene: 'distress', kind: 'decision',
      title: { ru: 'Кого посылать', en: 'Whom to send' },
      context: {
        ru: s => `Живы ${ppl(s.inc.alive)}; капсулы держат до года ${s.inc.deadline}. Каждый вариант — чей-то аппарат, чьё-то топливо и чьи-то люди.`,
        en: s => `${s.inc.alive} are alive; the capsules hold until year ${s.inc.deadline}. Every option is someone's vessel, someone's fuel and someone's people.`
      },
      options: s => {
        const e = rsc(s, 'earth'), p = rsc(s, 'pass'), c = plan(s).council, dl = s.inc.deadline;
        const pick = (id, label, known, record) => ({ id, label, known, record,
          effect: st => { st.send = id; st.res = reliefResult(st); } });
        if (s.council === 'pass') return [
          pick('tug', { ru: 'Отправить аппарат с шестью ремонтниками', en: 'Send the vessel with six repair hands' }, {
            ru: [`Вылет — год ${yr(p.launch)}, перелёт ${yrs(p.fly)} на 0,08c; ремонт закончат к году ${yr(p.complete)}.`, marginLine(p.complete, dl, 'ru'), 'Цена: около шестнадцати тысяч тонн топлива из двадцати, шесть человек и единственный межзвёздный аппарат Перевала — обратно ему лететь не на чем.'],
            en: [`Launch in year ${yr(p.launch)}, ${yrsEn(p.fly)} of flight at 0.08c; the repair done by year ${yr(p.complete)}.`, marginLine(p.complete, dl, 'en'), 'The cost: about sixteen thousand of the twenty thousand tonnes of fuel, six people and the Pass\'s only interstellar vessel — it will have nothing to fly back on.']
          }, { ru: 'Совет Перевала отправляет аппарат. Шестеро добровольцев подписывают рейс без обратного билета.', en: 'The council of the Pass sends the vessel. Six volunteers sign on for a flight with no ticket back.' }),
          pick('auto', { ru: 'Отправить аппарат без людей', en: 'Send the vessel uncrewed' }, {
            ru: [`Автомат ставит только заложенное — сменный холодильный блок, насосы, электронику: капсулы, дожившие до года ${yr(p.complete)}, продержатся ещё шестьдесят лет.`, `Разбудить всех нельзя: жизнеобеспечение корабля рассчитано на вахту. Людей пришлёт Земля — парус к году ${yr(e.complete)}.`, 'Цена: топливо и аппарат; ремонтники остаются дома.'],
            en: [`The automaton installs only what was planned — a spare cooling block, pumps, electronics: the capsules alive in year ${yr(p.complete)} will hold sixty years more.`, `Everyone cannot be woken: the ship's life support is sized for the watch. Earth will send the people — its sail by year ${yr(e.complete)}.`, 'The cost: the fuel and the vessel; the repair hands stay home.']
          }, { ru: 'Совет Перевала отправляет аппарат без людей. Программу ремонта пишут всей станцией.', en: 'The council of the Pass sends the vessel uncrewed. The whole station writes the repair programme.' }),
          pick('earth', { ru: 'Не посылать: ждать Землю', en: 'Send nothing: wait for Earth' }, {
            ru: [`Земля услышит в год ${yr(e.hear)}; её парус закончит ремонт к году ${yr(e.complete)}.`, marginLine(e.complete, dl, 'ru'), 'Перевал сохраняет аппарат, топливо и людей.'],
            en: [`Earth will hear in year ${yr(e.hear)}; its sail will finish the repair by year ${yr(e.complete)}.`, marginLine(e.complete, dl, 'en'), 'The Pass keeps its vessel, its fuel and its people.']
          }, { ru: 'Совет Перевала решает ждать Землю и шлёт ей свой расчёт.', en: 'The council of the Pass decides to wait for Earth and sends it its calculation.' })
        ];
        if (s.council === 'earth') return [
          pick('sail', { ru: 'Строить спасательный парус', en: 'Build a rescue sail' }, {
            ru: [`Постройка — десять лет${e.launch - 10 > e.hear + 0.01 ? ', и начать её можно только с приходом эпохи III' : ''}; вылет — год ${yr(e.launch)}, двенадцать спасателей на 0,2c. Ремонт — к году ${yr(e.complete)}.`, marginLine(e.complete, dl, 'ru'), 'Цена: лазерные станции десять лет работают на спасение — следующая экспедиция эпохи III уйдёт позже.'],
            en: [`Ten years to build${e.launch - 10 > e.hear + 0.01 ? ', and building can start only when epoch III comes' : ''}; launch in year ${yr(e.launch)}, twelve rescuers at 0.2c. The repair by year ${yr(e.complete)}.`, marginLine(e.complete, dl, 'en'), 'The cost: the laser stations work on the rescue for ten years — the next epoch III expedition leaves later.']
          }, { ru: 'Совет решает строить парус. Сорок первую снова снаряжают из этого зала — теперь за ней самой.', en: 'The Council decides to build the sail. The Forty-First is fitted out from this hall again — this time for its own sake.' }),
          pick('none', { ru: 'Не посылать', en: 'Send nothing' }, {
            ru: [e.complete >= dl + M.CASCADE ? `Парус не успеет: ремонт к году ${yr(e.complete)}, капсулы держат до года ${dl}.` : `Парус успел бы: ремонт к году ${yr(e.complete)}, капсулы держат до года ${dl}.`, 'Сорок первой уйдёт ответ: имена, расчёт, решение.'],
            en: [e.complete >= dl + M.CASCADE ? `A sail would not make it: the repair by year ${yr(e.complete)}, the capsules hold until year ${dl}.` : `A sail would make it: the repair by year ${yr(e.complete)}, the capsules hold until year ${dl}.`, 'The Forty-First will receive an answer: the names, the calculation, the decision.']
          }, { ru: 'Совет решает не посылать. Ответ сорок первой пишут вслух, при всех.', en: 'The Council decides to send nothing. The answer to the Forty-First is written aloud, before everyone.' })
        ];
        const col = M.colony(c.colony), pctUp = Math.round(s.inc.alive / col.awake * 100), yrsWake = Math.ceil(s.inc.sleepers / 50);
        return [
          pick('take', { ru: 'Принять всех к себе', en: 'Take them all in' }, {
            ru: [`Помощь — к году ${yr(c.complete)}: перелёт внутри системы.`, `${cap(place(c, 'ru'))} — ${ppl(col.awake)} бодрствующих; принять ${ppl(s.inc.alive)} — это +${pctUp}% людей: жильё, пища, вода, врачи. Будить по пятьдесят в год — ${yrs(yrsWake)}.`, 'Сорок первая становится частью колонии.'],
            en: [`Help by year ${yr(c.complete)}: a flight within the system.`, `${cap(place(c, 'en'))} has ${col.awake} awake; taking in ${s.inc.alive} is +${pctUp}% people: housing, food, water, physicians. Waking fifty a year — ${yrsEn(yrsWake)}.`, 'The Forty-First becomes part of the colony.']
          }, { ru: 'Совет решает принять всех. Жилые модули уплотняют ещё до прихода корабля.', en: 'The council decides to take them all in. The habitat modules are packed tighter before the ship even arrives.' }),
          pick('repair', { ru: 'Чинить их корабль', en: 'Repair their ship' }, {
            ru: [`Помощь — к году ${yr(c.complete)}: мастерские колонии чинят контур и зал.`, 'Корабль сорок первой остаётся вторым поселением у той же звезды; люди живут у себя.', 'Цена: запчасти и год работы наших ремонтников.'],
            en: [`Help by year ${yr(c.complete)}: the colony's workshops repair the loop and the hall.`, 'The Forty-First\'s ship stays as a second settlement at the same star; its people live aboard.', 'The cost: spare parts and a year of our repair crews\' work.']
          }, { ru: 'Совет решает чинить их корабль. У звезды будет два поселения.', en: 'The council decides to repair their ship. There will be two settlements at the star.' })
        ];
      }
    },
    // середина ожидания — от года, когда совет услышал, до прихода спасателя (не от текущего года: подпись та же до и после промотки)
    { id: 's.r1', kind: 'skip', when: s => s.send !== 'none' && s.council !== 'local', toYear: s => midRelief(s),
      label: { ru: s => `Промотать до года ${midRelief(s)} · рейс`, en: s => `Skip ahead to year ${midRelief(s)} · the flight` } },
    {
      id: 'r.news', scene: 'distress', kind: 'instrument', when: s => s.send !== 'none' && s.council !== 'local',
      title: { ru: 'Журнал связи', en: 'Comms log' },
      text: {
        ru: s => { const e = rsc(s, 'earth'), p = rsc(s, 'pass'), L = passEarthLy();
          const head = {
            tug: () => `Аппарат ушёл в год ${yr(p.launch)}. ` + (earthStands(s)
              ? `Подтверждение вылета дошло до Земли в год ${yr(p.launch + L)} — после старта её паруса. Спасателей будет двое.`
              : `Земля получила сигнал сорок первой в год ${yr(e.hear)}, а подтверждение нашего вылета — в год ${yr(p.launch + L)}, раньше собственного старта. Ответ Земли: второго спасателя не будет; следом уйдёт грузовой парус с материалами для поселения.`),
            auto: () => `Аппарат без людей ушёл в год ${yr(p.launch)}. Земля узнала о нём в год ${yr(p.launch + L)} и строит парус с двенадцатью: вылет — год ${yr(e.launch)}.`,
            earth: () => `Земля получила сигнал в год ${yr(e.hear)}. Парус спасателей строят; вылет — год ${yr(e.launch)}.`,
            sail: () => `Парус спасателей ушёл в год ${yr(e.launch)}. Ответ Совета дошёл до сорок первой: там знают, что помощь идёт.`
          }[s.send]();
          const alive = sleepersAt(s, s.year), lost = s.inc.sleepers - alive;
          return head + '\n\n' + (!alive ? 'Зал мёртв: живых капсул нет.' : s.year > (s.res.until && s.year >= s.res.auto ? s.res.until : s.inc.deadline)
            ? `Блоки зала отказывают: живы ${alive} из ${s.inc.sleepers} спящих.`
            : `По расчёту, за ${yrs(s.year - s.inc.sent)} отказали ${lost} ${plural(lost, ['капсула', 'капсулы', 'капсул'])}; вахта сменяется по графику.`); },
        en: s => { const e = rsc(s, 'earth'), p = rsc(s, 'pass'), L = passEarthLy();
          const head = {
            tug: () => `The vessel left in year ${yr(p.launch)}. ` + (earthStands(s)
              ? `Confirmation of the launch reached Earth in year ${yr(p.launch + L)} — after its sail had left. There will be two rescuers.`
              : `Earth received the Forty-First's signal in year ${yr(e.hear)}, and confirmation of our launch in year ${yr(p.launch + L)}, before its own launch. Earth's answer: there will be no second rescuer; a cargo sail with materials for the settlement will follow.`),
            auto: () => `The uncrewed vessel left in year ${yr(p.launch)}. Earth learned of it in year ${yr(p.launch + L)} and is building a sail with twelve: launch in year ${yr(e.launch)}.`,
            earth: () => `Earth received the signal in year ${yr(e.hear)}. The rescue sail is being built; launch in year ${yr(e.launch)}.`,
            sail: () => `The rescue sail left in year ${yr(e.launch)}. The Council's answer has reached the Forty-First: they know help is coming.`
          }[s.send]();
          const alive = sleepersAt(s, s.year), lost = s.inc.sleepers - alive;
          return head + '\n\n' + (!alive ? 'The hall is dead: no capsule is alive.' : s.year > (s.res.until && s.year >= s.res.auto ? s.res.until : s.inc.deadline)
            ? `The hall's blocks are failing: ${alive} of the ${s.inc.sleepers} sleepers are alive.`
            : `By calculation, in ${yrsEn(s.year - s.inc.sent)} ${lost} capsule${lost === 1 ? '' : 's'} failed; the watch is relieved on schedule.`); }
      }
    },
    { id: 's.r2', kind: 'skip', when: s => s.send !== 'none', toYear: s => s.res.arrive,
      label: { ru: s => `Промотать до года ${yr(s.res.arrive)} · прибытие`, en: s => `Skip ahead to year ${yr(s.res.arrive)} · arrival` } },
    {
      id: 'r.arrive', scene: 'rescue', kind: 'instrument', when: s => s.send !== 'none',
      title: { ru: 'Журнал спасателей · у сорок первой', en: 'Rescuers\' log · at the Forty-First' },
      text: {
        ru: s => { const r = s.res;
          const head = r.auto ? (r.kept ? `В год ${yr(r.auto - M.WORK)} к сорок первой подошёл аппарат Перевала без людей и по программе поставил сменный холодильный блок, насосы и электронику. Капсулы, дожившие до него, держат до года ${yr(r.until)}. Теперь дотормаживает парус Земли.` : `В год ${yr(r.auto - M.WORK)} к сорок первой подошёл аппарат Перевала без людей: живых капсул к его приходу не осталось. Теперь дотормаживает парус Земли.`)
            : r.by === 'pass' ? 'Аппарат Перевала выходит к сорок первой.' : r.by === 'earth' ? `Парус Земли дотормаживает у ${nmG(s)}.` : `Корабли ${place(plan(s).council, 'ru', 1)} подходят к сорок первой.`;
          return `${head} Маяк отвечает; ${r.saved.watch ? 'шлюз открывает вахта' : 'шлюз открывают снаружи'}.\n\n${aliveLine(s, 'ru')}`; },
        en: s => { const r = s.res;
          const head = r.auto ? (r.kept ? `In year ${yr(r.auto - M.WORK)} the Pass's uncrewed vessel reached the Forty-First and, by programme, installed a spare cooling block, pumps and electronics. The capsules alive then hold until year ${yr(r.until)}. Now Earth's sail is braking in.` : `In year ${yr(r.auto - M.WORK)} the Pass's uncrewed vessel reached the Forty-First: no capsule was still alive when it came. Now Earth's sail is braking in.`)
            : r.by === 'pass' ? 'The Pass\'s vessel comes alongside the Forty-First.' : r.by === 'earth' ? `Earth's sail finishes braking at ${nm(s, 'en')}.` : `Ships from ${place(plan(s).council, 'en')} come alongside the Forty-First.`;
          return `${head} The beacon answers; ${r.saved.watch ? 'the watch opens the airlock' : 'the airlock is opened from outside'}.\n\n${aliveLine(s, 'en')}`; }
      }
    },
    {
      id: 'r.greeting', scene: 'rescue', kind: 'transcript', when: s => s.send !== 'none' && !!s.res && s.res.saved.watch > 0 && s.send !== 'auto',
      title: { ru: 'Журнал спасателей · встреча', en: "Rescuers' log · the meeting" },
      text: {
        ru: s => `— Сорок первая, мы приняли ваш местный маяк. Назовите, кто сейчас на вахте.

Пока спасатели сближаются, ответы приходят с паузой светового хода; у шлюза пауза уже незаметна.

— Нас двенадцать. ${s.res.saved.sleepers > 0 ? 'Сменяемся из спящих.' : 'Мы последняя смена: сменять нас больше некому.'} Сейчас передадим журнал за всё время после сигнала бедствия.

Дежурный встречает их один: остальные у оборудования. На поручне закреплена потёртая схема обходных магистралей.

— Медицинские записи Ивы Лорн у вас есть? Поздние дополнения лежат рядом, по датам.

— Есть. Покажите и список умерших — до сигнала и после. Мы сверим его с вашим.

Спасатель закрепляет сумку у поручня:

— С какого поста снять первого человека на отдых?`,
        en: s => `"Forty-First, we have your local beacon. Tell us who is on watch now."

During the approach, replies arrive after a light-travel pause; by the airlock, it is imperceptible.

"Twelve of us. ${s.res.saved.sleepers > 0 ? 'We rotate from the sleepers.' : 'We are the last shift: there is no one left to relieve us.'} We'll send the full log since the distress call."

One duty officer meets them; the others remain at their equipment. A worn diagram of the bypass lines is fastened to the handrail.

"Do you have Iva Lorn's medical records? The later additions are beside them, in date order."

"Yes. Show us the list of those who died, before the signal and after. We'll check it against yours."

The rescuer secures a bag to the handrail.

"Which station should we relieve first?"`
      }
    },
    {
      id: 'x.r.end', scene: 'rescue', kind: 'end', year: s => s.res.arrive + M.WORK, when: s => s.send !== 'none',   // даты в журнале — целыми годами; исход — по точному сроку
      effect: s => { s.outcome = s.res.outcome; },
      title: { ru: s => OUTCOME_R[s.res.outcome].ru, en: s => OUTCOME_R[s.res.outcome].en },
      text: {
        ru: s => { const r = s.res, sv = r.saved, c = plan(s).council, o = r.outcome;
          const work = o !== 'tooLate' ? `Контур и зал починены за год. Спящих будят по графику: сначала врачей и инженеров, потом остальных. Спасены ${ppl(sv.total)}.`
            : sv.total ? 'Зал мёртв. Двенадцать последней смены — всё, что осталось от сорок первой.' : 'Зал мёртв, последней смены тоже нет. Спасатели находят журнал и имена.';
          const by = {
            tug: r.by === 'pass' ? (sv.total ? 'Шестеро с Перевала остаются с ними' : 'Шестеро с Перевала остаются у пустого корабля') + ': аппарату не на чем вернуться. У Перевала больше нет межзвёздного аппарата — если беда случится у него самого, помощь придёт только с Земли.' : 'Парус Земли пришёл раньше аппарата Перевала: подтверждение его вылета не успело до её старта. Шестеро с Перевала приходят к уже спасённым — и остаются с ними.',
            auto: (r.earthFirst ? (sv.sleepers ? 'Парус Земли пришёл раньше аппарата Перевала; автомат ставит свой блок уже в спасённом зале.' : 'Парус Земли пришёл раньше аппарата Перевала — и тоже слишком поздно.') : !r.kept ? 'Аппарат Перевала пришёл к мёртвому залу.' : 'Аппарат Перевала сохранил зал; разбудили его люди с Земли.') + ' У Перевала больше нет межзвёздного аппарата.',
            earth: 'Перевал сохранил аппарат, топливо и людей. Спасла Земля.',
            sail: 'Лазерные станции десять лет работали на спасение: следующая экспедиция эпохи III ушла позже.',
            take: `Сорок первую принимает ${place(c, 'ru')}: ${ppl(sv.total)} к ${(M.colony(c.colony) || {}).awake} своим. Будят по пятьдесят в год — годы тесноты, двойных смен в агрозалах и очередей к врачам.`,
            repair: `Мастерские ${place(c, 'ru', 1)} чинят корабль за год. У ${nmG(s)} теперь два поселения.`
          }[s.send];
          return `${work} ${by}\n\nЭкспедиция к ${nmD(s)} кончилась не так, как её снаряжали. Но её люди — в мире, и мир это запомнит.`; },
        en: s => { const r = s.res, sv = r.saved, c = plan(s).council, o = r.outcome;
          const work = o !== 'tooLate' ? `The loop and the hall are repaired within a year. The sleepers are woken on schedule: physicians and engineers first, then the rest. ${sv.total} are saved.`
            : sv.total ? 'The hall is dead. The twelve of the last shift are all that remains of the Forty-First.' : 'The hall is dead, and so is the last shift. The rescuers find the log and the names.';
          const by = {
            tug: r.by === 'pass' ? (sv.total ? 'The six from the Pass stay with them' : 'The six from the Pass stay by the empty ship') + ': the vessel has nothing to fly back on. The Pass no longer has an interstellar vessel — if trouble comes to it, help can come only from Earth.' : 'Earth\'s sail arrived before the Pass\'s vessel: confirmation of its launch did not reach Earth before the sail left. The six from the Pass arrive to people already saved — and stay with them.',
            auto: (r.earthFirst ? (sv.sleepers ? 'Earth\'s sail arrived before the Pass\'s vessel; the automaton installs its block in a hall already saved.' : 'Earth\'s sail arrived before the Pass\'s vessel — and it, too, was too late.') : !r.kept ? 'The Pass\'s vessel arrived at a dead hall.' : 'The Pass\'s vessel kept the hall alive; people from Earth woke it.') + ' The Pass no longer has an interstellar vessel.',
            earth: 'The Pass kept its vessel, its fuel and its people. Earth did the rescuing.',
            sail: 'The laser stations worked on the rescue for ten years: the next epoch III expedition left later.',
            take: `${cap(place(c, 'en'))} takes in the Forty-First: ${sv.total} people to its own ${(M.colony(c.colony) || {}).awake}. Fifty are woken a year — years of crowding, double shifts in the agro halls and queues at the physicians.`,
            repair: `The workshops of ${place(c, 'en')} repair the ship within a year. There are two settlements at ${nm(s, 'en')} now.`
          }[s.send];
          return `${work} ${by}\n\nThe expedition to ${nm(s, 'en')} did not end the way it was fitted out for. But its people are in the world, and the world will remember it.`; }
      }
    },
    {
      id: 'x.r.none', scene: 'distress', kind: 'end', when: s => s.send === 'none',
      effect: s => { s.outcome = 'remain'; },
      title: { ru: OUTCOME_R.remain.ru, en: OUTCOME_R.remain.en },
      text: {
        ru: s => `Совет не посылает спасателей. Сорок первой уходит ответ: имена, расчёт, решение. Спящие остаются в законсервированном зале до года ${s.inc.deadline}; маяк передаёт эту дату всем, кто услышит.`,
        en: s => `The Council sends no rescuers. An answer goes to the Forty-First: the names, the calculation, the decision. The sleepers stay in the conserved hall until year ${s.inc.deadline}; the beacon transmits that date to anyone who hears.`
      }
    }
  ];
  const inc0 = s => s.inc.alive;
  const midRelief = s => yr((plan(s).council.hear + s.res.arrive) / 2);
  function reliefState(inc, world) {
    const R = M.rescuers(inc, world);
    return { relief: true, inc, world, target: inc.target, beta: inc.beta, arrive: inc.arrive, mission: inc.mission,
      year: R.council.hear, council: R.council.id, colony: R.council.colony || null,
      send: null, res: null, outcome: null, choices: {} };
  }
  // сюжет партии спасателей: тот же движок, свои беты
  const relief = (inc, world) => ({ beats: RBEATS, initialState: () => reliefState(inc, world) });
  // кнопка на экране конца: «Совет Перевала: принять сигнал»
  function reliefButton(inc, world, lang) {
    const c = M.rescuers(inc, world).council;
    if (lang !== 'ru') return c.id === 'earth' ? 'The Council of Star Navigation: receive the signal' : `Council of ${place(c, 'en')}: receive the signal`;
    return c.id === 'earth' ? 'Совет Звездоплавания: принять сигнал' : `Совет ${place(c, 'ru', 1)}: принять сигнал`;
  }

  const arriveView = s => rescueS(s) && s.arriveExact != null ? s.arriveExact : s.arrive;
  const content = { beats, initialState, ui, scenes, awakeOf, aliveOf, wearObserve: s => s.wear ? W.observe(s.wear) : null, events: EV, navDeparture, epoch3, lossFuture: () => LOSS_FUTURE, lossesOf, requests: R, reqOf, missionComplete, earlyTurnQuote, newsPlan, people, mission: M, missionCheck, sim, shield: SH, shieldInspect, endHeadline, incidentHeadline, edgeOut, streamTimes, streamPlan, thawN, arriveView, eq: eqApi, rescueV3: { thawAlive, thawAt, thawName, RESCUE }, missionMarks, RISK, hidden, hashU32, publicOf, incidentLines, crewName, CAST, relief, reliefButton, setWorld, getWorld: () => WORLD, OUTCOME_R,
    reliefEvents, applyEvents, validIncident, INSERTED, gauges, gaugeDiff, passportMetrics, expeditionEvent, worldLines, archiveShort, archiveLines, legacyLines, STATUS };
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
  else root.M31Content = content;
})(typeof globalThis !== 'undefined' ? globalThis : this);
