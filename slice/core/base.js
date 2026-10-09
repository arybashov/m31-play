// М31 · срез — основа: зависимости, числа и слова, архив колоний и следов, паспорт. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const base = __core => {
    let arriveView, ownStory, stageYears;
    const __link = () => { ({ arriveView, ownStory, stageYears } = __core); };
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
    const D = M.star(s.target).d, tN = Y(s, 0.12), A = arriveView(s), tL = tN - M.distLy(tN, s.beta, s.arrive, s.tMag, D);
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
        pct, pctM, M, SH, EVM, W, JB, R, RQ, nm, nmG, nmD, f1, fb, plural, yrs, yrsG, yrsEn, ppl, dvPct, DV, pctDv, eachAwake, STATUS, yrsAgo, yr1,
        archiveShort, archiveLines, legacyLines, colonyTie, subsets, cargoOf, passportParse, passportOptions, kitList, eqList, passportOption,
        probeTimes, brake, stageOff, kms, Y, lag, supportPlan, supportWorld, src, vAt, heatAgo
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = base;
  else (root.M31Core = root.M31Core || {}).base = base;
})(typeof globalThis !== 'undefined' ? globalThis : this);
