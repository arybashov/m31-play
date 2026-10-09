/* М31 · срез: миссия — цель, паспорт экспедиции, поворот курса.
   Чистые расчёты без DOM, для браузера и Node. Физика эпохи I — эскиз A
   (ART/starship/v3-sketches): импульсный термояд D–³He, истечение 0,04c, доля
   конструкции ступени 4%, торможение плазменным магнитом до 0,01c, затем термояд.
   Проект: DOC/Архив/Старт партии — карта и конструктор v1.md (прежняя версия; старт — Совет по заявкам). */
(function (root) {
  'use strict';

  let stars = root.M31_STARS;
  if (!stars && typeof require === 'function') { require('../ship-builder/data/stars.js'); stars = globalThis.M31_STARS; }
  stars = stars || [];

  const VE = 0.04, K = 0.04;          // истечение и доля конструкции ступени
  const CORE = 34.86;                 // ядро, щит и парус, тыс. т
  const FUEL = 1237;                  // выделенный запас D+³He, тыс. т
  const ACC = 8, DEC = 20;            // лет разгона и торможения
  const STOP = 0.01;                  // остаточная скорость после паруса, c
  const CREW = 500;

  const SPEEDS = [0.08, 0.09, 0.1];
  const RESERVES = [0.005, 0.01, 0.02];
  const KITS = {                      // грузовые комплекты, тыс. т (зонды и ИК-обсерватория — теперь оснащение)
    materials: { t: 10, ru: 'Материалы и запчасти', en: 'Materials and spares' },
    landing: { t: 15, ru: 'Расширенная посадка', en: 'Extended landing kit' },
    agro: { t: 5, ru: 'Второй агромодуль', en: 'Second agro module' },
    // груз заявки форпоста: передатчик дальней связи и капсульный блок с холодильником (только у снабженца)
    request: { t: 10, ru: 'Груз заявки: передатчик и капсульный блок', en: 'Request cargo: transmitter and capsule unit', mission: 'supply' },
    // спасательный сектор: сорок своих капсул и доля жизнеобеспечения — для Оттепели; сорок участников остаются на Земле (только у спасателя)
    berths: { t: 0, crew: -40, ru: 'Спасательный сектор: 40 мест', en: 'Rescue sector: 40 berths', mission: 'rescue' }
  };
  const KIT_IDS = Object.keys(KITS);
  const kitsFor = mission => KIT_IDS.filter(k => !KITS[k].mission || KITS[k].mission === mission);
  const crewOf = kits => CREW + kits.reduce((a, k) => a + ((KITS[k] && KITS[k].crew) || 0), 0);   // своих в экспедиции
  // старые паспорта (b|r|kits) несли зонды и ИК как комплекты; та же масса, что у оснащения scout2 и ir
  const LEGACY_KITS = { materials: 10, landing: 15, probes: 3, ir: 2, agro: 5 };

  // ---------------------------------------------------------------- топливо и груз
  function stage(m, dbeta) {
    const R = Math.exp(dbeta / VE), den = 1 - K * (R - 1);
    return den <= 0 ? Infinity : m * (R - 1) / den;
  }
  function fuel(beta, cargo, reserve) {
    const pl = CORE + cargo, fp = stage(pl, STOP + reserve);
    return stage(pl + fp * (1 + K), beta) + fp;
  }
  // сколько груза сверх ядра помещается в выделенное топливо
  function capacity(beta, reserve) {
    if (fuel(beta, 0, reserve) > FUEL) return -1;
    let lo = 0, hi = 400;
    for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (fuel(beta, m, reserve) <= FUEL) lo = m; else hi = m; }
    return lo;
  }
  const kitMass = kits => kits.reduce((a, k) => a + KITS[k].t, 0);
  // Масса к началу торможения: ядро, груз и топливо резерва с баками (конструкция K). Плазменный магнит
  // тормозит почти постоянной силой 3,15 МН (площадь растёт при падении скорости), поэтому время работы
  // магнита t = M·Δv/F растёт линейно с массой: 59 тыс. т на 0,1c — 16 лет. Дальше 4 года — двигатель ядра.
  const MAG_F = 3.15e6, C_MS = 299792458, YEAR_S = 3.15576e7, ENGINE = 4;
  const brakeMass = (beta, reserve, cargo) => CORE + cargo + (1 + K) * stage(CORE + cargo, STOP + reserve);
  const magYears = (massKt, beta) => massKt * 1e6 * (beta - STOP) * C_MS / MAG_F / YEAR_S;
  const stdMag = beta => magYears(brakeMass(beta, 0.01, 0), beta);   // пустой корабль с резервом 1% — для карты

  // ---------------------------------------------------------------- время и люди
  // Профиль полёта: разгон 8 лет, дрейф, магнит tMag лет (β → 0,01c, равнозамедленно), двигатель ядра 4 года (0,01c → 0).
  // tMag == null — прежний профиль старых сохранений: торможение 20 лет равнозамедленно до нуля.
  function trip(d, beta, tMag) {
    if (tMag == null) return d / beta + (ACC + DEC) / 2;
    return ACC + (d - beta * ACC / 2 - (beta + STOP) / 2 * tMag - STOP * ENGINE / 2) / beta + tMag + ENGINE;
  }
  const brakeStart = (arrive, tMag) => tMag == null ? arrive - DEC : arrive - ENGINE - tMag;   // раскрытие магнита
  const awake = (T, watch = 48, crew = CREW) => watch * T / crew;
  // тормозной путь: магнит (β → 0,01c) и двигатель (0,01c → 0); у старого профиля — 20 лет равнозамедленно
  const brakeDist = (beta, tMag) => tMag == null ? beta * DEC / 2 : (beta + STOP) / 2 * tMag + STOP * ENGINE / 2;
  // Акт III: за 12 лет до прибытия, но не раньше раскрытия магнита (после поворота торможение короче)
  const actIII = (arrive, tMag) => Math.max(arrive - 12, brakeStart(arrive, tMag));
  // Путь от Солнца, св. лет, на год y. d — расстояние до цели: дрейф растягивается так, чтобы корабль встал точно
  // у цели (год прибытия округлён, после поворота курса путь другой) — как в 3D-виде.
  function distLy(y, beta, arrive, tMag, d) {
    if (y <= ACC) return beta / ACC / 2 * y * y;
    const t0 = arrive ? brakeStart(arrive, tMag) : Infinity, dA = beta * ACC / 2;
    const fix = d != null && arrive && t0 > ACC ? (d - brakeDist(beta, tMag) - dA - beta * (t0 - ACC)) / (t0 - ACC) : 0;
    if (y <= t0) return dA + (beta + fix) * (y - ACC);
    const x0 = dA + (beta + fix) * (t0 - ACC);
    if (tMag == null) { const tau = Math.min(y, arrive) - t0; return x0 + beta * tau - beta / (2 * DEC) * tau * tau; }
    const tE = arrive - ENGINE, tau = Math.min(y, tE) - t0;
    const x = x0 + beta * tau - (beta - STOP) / (2 * tMag) * tau * tau;
    if (y <= tE) return x;
    const tau2 = Math.min(y, arrive) - tE;
    return x + STOP * tau2 - STOP / (2 * ENGINE) * tau2 * tau2;
  }
  function speedAt(y, beta, arrive, tMag) {
    if (y <= ACC) return beta * y / ACC;
    if (!arrive || y <= brakeStart(arrive, tMag)) return beta;
    if (tMag == null) return beta * Math.max(0, arrive - y) / DEC;
    if (y <= arrive - ENGINE) return beta - (beta - STOP) * (y - brakeStart(arrive, tMag)) / tMag;
    return STOP * Math.max(0, arrive - y) / ENGINE;
  }

  // ---------------------------------------------------------------- единый профиль полёта (правила v5, симулятор)
  // Спецификация «Симулятор v1 — время и щит», шаг 2: точное время прибытия (без округления года), положение — интеграл
  // той же скорости, что идёт в модель износа. Скорость кусочно-линейна: разгон 0 → β за ACC, дрейф β, магнит β → STOP
  // за tMag (tMag == null — прежнее торможение до нуля за DEC), двигатель ядра STOP → 0 за ENGINE. Время — годы от старта
  // (в модели — целые секунды: toSec/toYears); путь — св. годы.
  function flightProfile(d, beta, tMag) {
    // путь короче разгона и торможения — дрейф был бы отрицательным (ревью Codex): такой профиль не строится
    if (d < beta * ACC / 2 + brakeDist(beta, tMag)) throw new RangeError(`путь ${d} св. лет короче разгона и торможения на ${beta}c`);
    const arrive = trip(d, beta, tMag), brake = tMag == null ? [[DEC, beta, 0]] : [[tMag, beta, STOP], [ENGINE, STOP, 0]];
    const legs = [{ t0: 0, t1: ACC, b0: 0, b1: beta, kind: 'accel' }];
    let t = ACC; const t0 = arrive - brake.reduce((a, l) => a + l[0], 0);
    legs.push({ t0: t, t1: t0, b0: beta, b1: beta, kind: 'drift' }); t = t0;
    brake.forEach(([len, b0, b1], i) => { legs.push({ t0: t, t1: t + len, b0, b1, kind: tMag == null ? 'brake' : i ? 'engine' : 'magnet' }); t += len; });
    let x = 0;
    for (const l of legs) { l.x0 = x; x += (l.b0 + l.b1) / 2 * (l.t1 - l.t0); l.x1 = x; }
    legs[legs.length - 1].x1 = d;                       // конец пути — ровно цель: у нулевой скорости ошибка суммы 1e-15 св. лет — это десятки секунд
    return { d, beta, tMag, arrive, legs };
  }
  // положение, скорость и участок на год t (за пределами профиля — края)
  function sampleFlight(pf, t) {
    const l = pf.legs.find(g => t <= g.t1) || pf.legs[pf.legs.length - 1], tau = Math.min(Math.max(t, l.t0), l.t1) - l.t0;
    const a = (l.b1 - l.b0) / (l.t1 - l.t0 || 1);
    return { x: l.x0 + l.b0 * tau + a * tau * tau / 2, beta: l.b0 + a * tau, kind: l.kind };
  }
  // год, когда корабль будет на расстоянии x св. лет от Солнца (обратная к sampleFlight; на краях — точные края).
  // Численно устойчиво (ревью Codex): разгон — от начала участка, τ = 2·dx / (b0 + √(b0² + 2a·dx)); торможение — от
  // конца, по оставшемуся пути r: σ = 2r / (b1 + √(b1² − 2a·r)) — без вычитания близких чисел у нулевой скорости.
  function timeAtDistance(pf, x) {
    const last = pf.legs[pf.legs.length - 1];
    if (x <= 0) return 0;
    if (x >= last.x1) return pf.arrive;
    const l = pf.legs.find(g => x <= g.x1);
    if (x === l.x1) return l.t1;
    const a = (l.b1 - l.b0) / (l.t1 - l.t0);
    if (a === 0) return l.t0 + (x - l.x0) / l.b0;
    if (a > 0) { const dx = x - l.x0; return l.t0 + 2 * dx / (l.b0 + Math.sqrt(l.b0 * l.b0 + 2 * a * dx)); }
    const r = l.x1 - x; return l.t1 - 2 * r / (l.b1 + Math.sqrt(l.b1 * l.b1 - 2 * a * r));
  }
  const toSec = years => Math.round(years * YEAR_S), toYears = sec => sec / YEAR_S;

  // ---------------------------------------------------------------- ступень разгона после отделения
  // Сухая ступень (48,6 тыс. т) летит дальше с крейсерской скоростью. По прямой она догнала бы ядро
  // в первые сутки торможения и вошла бы в систему цели на 0,1c. Поэтому её уводят вбок:
  // последние дни разгона тяга под углом, после отделения ядро гасит свою боковую скорость
  // (ART/starship/v3-sketches/calc_life.py, §8). years — от отделения до прохода цели.
  const STAGE_DRY = 48.6, MISS_AU = 1000;
  function divert(years, reserveDv) {
    const dv = MISS_AU * 1.495978707e8 / (years * 3.15576e7);   // км/с
    // тяга под углом 10° в конце разгона: связка ~107 тыс. т, ускорение ~0,54 м/с²
    const days = Math.max(2, Math.round(dv * 1000 / (0.54 * Math.sin(Math.PI / 18)) / 86400));
    return { dv, days, reservePct: dv / (reserveDv * 299792.458) * 100 };
  }
  // кинетическая энергия сухой ступени, млн мегатонн
  const stageMt = beta => (1 / Math.sqrt(1 - beta * beta) - 1) * STAGE_DRY * 1e6 * 8.98755e16 / 4.184e15 / 1e6;

  // ---------------------------------------------------------------- звёзды
  const byName = {};
  stars.forEach(s => { byName[s.name] = s; });
  const star = name => byName[name];
  const unit = s => [s.x / s.d, s.y / s.d, s.z / s.d];
  function angle(a, b) {
    const u = unit(a), v = unit(b);
    return Math.acos(Math.max(-1, Math.min(1, u[0] * v[0] + u[1] * v[1] + u[2] * v[2]))) * 180 / Math.PI;
  }
  const NAMES = {
    'Epsilon Indi': ['ε Индейца', 'ε Indi'], 'Lacaille 9352 (GJ 887)': ['Лакайль 9352', 'Lacaille 9352'],
    'Gl 780': ['δ Павлина', 'δ Pavonis'], 'Lacaille 8760 (AX Microscopii)': ['Лакайль 8760', 'Lacaille 8760'],
    'SCR J1845-6357': ['SCR 1845−6357', 'SCR 1845−6357'], 'GJ 832': ['Глизе 832', 'Gliese 832'],
    'Gl 784': ['Глизе 784', 'Gliese 784'], 'Gl 19': ['β Южной Гидры', 'β Hydri'], 'GJ 4285': ['GJ 4285', 'GJ 4285'],
    'Tau Ceti': ['τ Кита', 'τ Ceti'], 'Sirius': ['Сириус', 'Sirius'], 'Alpha Centauri AB': ['α Центавра', 'α Centauri'],
    'Proxima Centauri': ['Проксима Центавра', 'Proxima Centauri'], "Barnard's Star": ['звезда Барнарда', "Barnard's Star"],
    'Epsilon Eridani': ['ε Эридана', 'ε Eridani'], 'Procyon': ['Процион', 'Procyon'], '61 Cygni': ['61 Лебедя', '61 Cygni'],
    'Altair': ['Альтаир', 'Altair'], 'Wolf 359': ['Вольф 359', 'Wolf 359'], 'Ross 128': ['Росс 128', 'Ross 128'],
    'Luyten 726-8 (BL Ceti / UV Ceti; GJ 65)': ['Лейтен 726-8', 'Luyten 726-8'], 'Gl 1': ['Глизе 1', 'Gliese 1'],
    "Kapteyn's Star": ['звезда Каптейна', "Kapteyn's Star"], 'Lalande 21185': ['Лаланд 21185', 'Lalande 21185']
  };
  function nameOf(n, lang) {
    const m = NAMES[n];
    if (m) return m[lang === 'ru' ? 0 : 1];
    return n.replace(/\s*\(.*\)\s*/, '').trim() || n;
  }

  // Сектор сигнала: ошибка направления ~25° вокруг ε Индейца. Истинный источник
  // решает сид мира (концепт §7.5); в срезе — ε Индейца, заявленная цель тридцать второй.
  const SOURCE = 'Epsilon Indi', SECTOR = 26, DECLARED = 'Epsilon Indi';
  const offAngle = name => angle(star(name), star(SOURCE));
  const inSector = name => offAngle(name) <= SECTOR;
  const REACH = 260;                  // Совет: не больше 25 лет бодрствования на человека при вахте 48
  const reachable = () => stars.filter(s => Math.min(trip(s.d, 0.1), trip(s.d, 0.1, magYears(brakeMass(0.1, 0.005, 0), 0.1))) <= REACH && s.d > 0.5);
  const sectorList = () => stars.filter(s => s.d <= 25 && inSector(s.name)).sort((a, b) => a.d - b.d).map(s => s.name);

  function planets(name) {
    const ps = (star(name).planets || []).filter(p => p.status === 'confirmed');
    return { all: ps.length, rocky: ps.filter(p => p.massEarth != null && p.massEarth < 10).length, giant: ps.filter(p => p.massEarth != null && p.massEarth >= 50).length };
  }

  // ---------------------------------------------------------------- поворот курса во время разгона
  // В год t корабль набрал beta·t/8 по старому курсу. Поперечную часть гасит остаток
  // разгона; не хватает — добирает резерв манёвров. Остальное идёт вдоль нового курса.
  function turn(beta, t, deg, reserveDv) {
    const v = beta * t / ACC, rem = Math.max(0, beta - v), a = deg * Math.PI / 180;
    const tr = v * Math.sin(a), along = v * Math.cos(a);
    let out;
    if (tr <= rem) out = { beta: along + Math.sqrt(rem * rem - tr * tr), reserveUsed: 0 };
    else if (tr - rem <= reserveDv) out = { beta: along, reserveUsed: tr - rem };
    else return null;
    return out.beta >= 0.02 ? out : null;   // медленнее 0,02c до цели не дожить
  }

  // ---------------------------------------------------------------- эпизод года 4
  // Пул по условиям, по приоритету: долгий путь, каменные планеты у цели, иначе облако.
  function episode(s) {
    if (s.mission && s.mission !== 'contact') return s.arrive >= 170 ? 'long' : planets(s.target).rocky > 0 ? 'probe' : 'cloud';
    if (s.arrive >= 170) return 'long';
    if (planets(s.target).rocky > 0) return 'probe';
    return 'cloud';
  }

  // ---------------------------------------------------------------- мир цели (ось «можно ли жить», концепт §7.5)
  // Сид фиксирует класс мира при отлёте; в срезе сид один на все партии.
  const SEED = 41;
  function hash(str) { let h = 2166136261 ^ SEED; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  // ---------------------------------------------------------------- мир до первой партии: колонии прошлых экспедиций
  // DOC/Мир, миссии и оснащение v1.md. Возраст — на год старта сорок первой. Класс мира колонии задан её историей.
  const COLONIES = [
    { id: 'shore', star: 'Alpha Centauri AB', ru: 'Ближний берег', en: 'Near Shore', age: 232, awake: 2200, asleep: 80, world: 'open', status: 'viable' },
    { id: 'xylona', star: "Barnard's Star", ru: 'Ксилона Ир', en: 'Xylona Ir', age: 191, awake: 160, asleep: 90, world: 'hostile', status: 'declining',
      needs: { ru: 'специалист дальней связи, детали передатчика, запас для капсул', en: 'a deep-relay specialist, transmitter parts, capsule spares' },
      relayYears: 10, capsuleYears: 30 },
    { id: 'yard', star: 'Epsilon Eridani', ru: 'Верфь Эридана', en: 'Eridani Yard', age: 120, awake: 1300, asleep: 120, world: 'none', status: 'viable' },
    { id: 'garden', star: 'Tau Ceti', ru: 'Сад', en: 'The Garden', age: 82, awake: 680, asleep: 60, world: 'none', status: 'viable' },
    { id: 'pass', star: 'Lacaille 9352 (GJ 887)', ru: 'Перевал', en: 'The Pass', age: 57, awake: 620, asleep: 100, world: 'dome', status: 'establishing' },
    { id: 'thaw', star: 'Ross 128', ru: 'Оттепель', en: 'Thaw', age: 78, awake: 0, asleep: 40, world: 'dome', status: 'dead',
      diedAgo: 25, capsuleYears: 150 }
  ];
  const colonyAt = name => COLONIES.find(c => c.star === name) || null;
  const colony = id => COLONIES.find(c => c.id === id) || null;

  // ---------------------------------------------------------------- архив Кольца на день старта (год 0)
  // Земля знает о колониях с задержкой света: у каждой — интервал отчётов и последний отчёт. Принятая фаза:
  // последний регулярный отчёт получен за один интервал до старта → наблюдение = −d − интервал, получение = −интервал.
  // Ксилона ещё передаёт (передатчик на износе: по прогнозу откажет около +10); Оттепель погибла 25 лет назад по её
  // часам, Земля узнала через d лет. Следы экспедиций — даты последних передач. Годы — от отлёта сорок первой.
  const REPORTS = {
    shore: { every: 1, cap: { ru: 'орбитальные поселения, добыча на малых телах, 5 ГВт', en: 'orbital settlements, small-body mining, 5 GW' }, trouble: { ru: 'зависит от земных прецизионных деталей', en: 'depends on precision parts from Earth' } },
    xylona: { every: 1, cap: { ru: 'обсерватория, промышленный форпост', en: 'observatory, industrial outpost' }, trouble: { ru: 'передатчик на износе (по прогнозу откажет около года 10), запас для капсул — до года 30', en: 'the transmitter is wearing out (forecast to fail around year 10); capsule spares last until year 30' } },
    yard: { every: 0.5, cap: { ru: 'единственный производитель D–³He: 10 тыс. т в год; верфь', en: 'the only D–³He producer: 10 kt a year; a shipyard' }, trouble: { ru: 'износ сепараторов, очередь верфи', en: 'separator wear, a shipyard queue' } },
    garden: { every: 2, cap: { ru: 'агротехника, биологический архив', en: 'agrotechnics, a biological archive' }, trouble: { ru: 'мало врачей и микроэлементов', en: 'short of physicians and trace elements' } },
    pass: { every: 0.25, cap: { ru: 'навигационная станция, ремонт; единственный межзвёздный ремонтный аппарат', en: 'a navigation station, repairs; the only interstellar repair vessel' }, trouble: { ru: '³He не добывает', en: 'mines no ³He' } },
    thaw: { every: 1, cap: { ru: 'аварийный маяк, склад капсул на орбите', en: 'an emergency beacon, a capsule store in orbit' }, trouble: { ru: 'ошибки водоочистки → отказ энергетики', en: 'water-treatment errors → power failure' } }
  };
  function report(c) {
    const d = star(c.star).d, r = REPORTS[c.id];
    if (c.status === 'dead') return { observedAt: -c.diedAgo, receivedAt: -c.diedAgo + d, status: 'dead', awake: 0, asleep: c.asleep, every: r.every, cap: r.cap, trouble: r.trouble };
    return { observedAt: -d - r.every, receivedAt: -r.every, status: c.status, awake: c.awake, asleep: c.asleep, every: r.every, cap: r.cap, trouble: r.trouble };
  }
  // следы: №24 — пустой корабль у 61 Лебедя (автоматика сообщила); №32 — заявленная цель, судьба неизвестна
  const TRACES = [
    { id: 'e24', star: '61 Cygni', ru: 'Экспедиция №24', en: 'Expedition No. 24', observedAt: -33,
      note: { ru: '«Летучий голландец»: автоматика довела пустой корабль и сообщила об этом', en: 'The "Flying Dutchman": the automation brought the empty ship in and reported it' } },
    { id: 'e32', star: 'Epsilon Indi', ru: 'Экспедиция №32', en: 'Expedition No. 32', observedAt: -18,
      note: { ru: 'заявленная цель; последняя передача оборвана, судьба неизвестна', en: 'the declared target; the last transmission broke off, fate unknown' } }
  ].map(t => Object.assign(t, { receivedAt: t.observedAt + star(t.star).d }));
  const ROAD = { flying: 22, done: 10 };                                // ещё в пути и закончили программы (без координат)
  // всё, что Земля знает на старт: колонии и следы
  const knownAtStart = () => COLONIES.map(c => Object.assign({ kind: 'colony', id: c.id, star: c.star, ru: c.ru, en: c.en }, report(c)))
    .concat(TRACES.map(t => Object.assign({ kind: 'trace', status: 'trace' }, t)));
  const objectsAtStar = name => knownAtStart().filter(o => o.star === name);
  // миссии среза: контакт (сигнал тридцать второй), снабженец (Ксилона Ир), спасатель (Оттепель)
  const MISSIONS = { contact: { target: null }, supply: { target: "Barnard's Star", colony: 'xylona' }, rescue: { target: 'Ross 128', colony: 'thaw' } };

  function worldOf(name) {
    const col = colonyAt(name); if (col) return col.world;
    const sp = (star(name).sp || 'M')[0], r = hash(name);
    // ruined — мир разрушен: столкновение или сверхвспышка; снимок присылает Кольцо
    const w = 'GFK'.includes(sp) ? [['open', 0.35], ['dome', 0.2], ['hostile', 0.15], ['ruined', 0.15], ['none', 0.15]]
      : [['open', 0.1], ['dome', 0.35], ['hostile', 0.2], ['ruined', 0.2], ['none', 0.15]];
    let acc = 0;
    for (const [k, p] of w) { acc += p; if (r < acc) return k; }
    return w[w.length - 1][0];
  }
  const hasGiant = name => planets(name).giant > 0;
  const isRedDwarf = name => /^m/i.test(((star(name) || {}).sp || '').trim());

  // ---------------------------------------------------------------- потери в пути (calc_life.py §5, §10)
  // Ожидаемые числа модели первого порядка, округлённые. years — лет пути, watch — людей на вахте.
  // Рак: вахта ~0,11 Зв на год бодрствования, спящие ~0,021 Зв/год (базовый прогноз защиты), 2% на Зв;
  // у вахты половина проявляется в пути, у спящих — после пробуждения у цели.
  // safe — надёжные тяжёлые капсулы: отказ 1·10⁻⁴ на капсуло-год вместо 2·10⁻⁴, смерть при пробуждении 0,2% вместо 0,4%
  function losses(years, watch, safe, crew = CREW) {
    const sleepers = crew - watch, r = Math.round, k = safe ? 0.5 : 1;
    const capsule = r(k * 2e-4 * sleepers * years), revival = r(k * 0.004 * crew * 4 * years / 133), accident = r(2e-4 * watch * years);
    const cancer = r(0.5 * 0.02 * 0.112 * watch * years);
    const later = r(0.02 * (0.021 * sleepers + 0.5 * 0.112 * watch) * years);
    return { capsule, revival, accident, cancer, later, total: capsule + revival + accident + cancer };
  }
  const badWorld = name => ['ruined', 'hostile', 'none'].includes(worldOf(name));

  // ---------------------------------------------------------------- оснащение (DOC/Мир, миссии и оснащение v1.md)
  // Корабль не конструируют — оснащают: восемь позиций с готовыми вариантами. У каждой миссии — рекомендация
  // Совета; в паспорте до двух замен (позиций, отличных от рекомендации). Масса — прибавка к грузу, тыс. т.
  // era 2 — технология эпохи II, в эпоху I недоступна. fixed — позиция пока не выбирается (нет рассчитанной альтернативы).
  const EQUIP = [
    { id: 'brake', fixed: true, ru: 'Торможение', en: 'Braking', opts: [
      { id: 'magnet', t: 0, ru: 'Плазменный магнит', en: 'Plasma magnet' },
      { id: 'wire', t: 49.5, era: 2, ru: 'Проволочная петля', en: 'Wire loop' }] },
    { id: 'rad', fixed: true, ru: 'Радиационная защита', en: 'Radiation shielding', opts: [
      { id: 'rad20', t: 0, ru: 'Тороиды 20 Т·м', en: 'Toroids, 20 T·m' },
      { id: 'rad40', t: 0.37, era: 2, ru: 'Тороиды 40 Т·м', en: 'Toroids, 40 T·m' }] },
    { id: 'caps', ru: 'Капсулы', en: 'Capsules', opts: [
      { id: 'capsStd', t: 0, ru: 'Лёгкие штатные', en: 'Light standard' },
      { id: 'capsSafe', t: 2, ru: 'Надёжные тяжёлые', en: 'Heavy reliable' }] },
    { id: 'energy', ru: 'Энергетика у цели', en: 'Power at the target', opts: [
      { id: 'shipOnly', t: 0, ru: 'Только корабль', en: 'The ship only' },
      { id: 'grid', t: 0.5, ru: 'Подключение к колонии', en: 'Colony grid link' },
      { id: 'reactor5', t: 2, ru: 'Реактор 5 МВт', en: '5 MW reactor' },
      { id: 'dual', t: 3, ru: 'Два независимых блока', en: 'Two independent units' }] },
    { id: 'sensors', ru: 'Сенсоры', en: 'Sensors', opts: [
      { id: 'spectra', t: 0, ru: 'Штатные спектрографы', en: 'Standard spectrographs' },
      { id: 'ir', t: 2, ru: 'ИК-обсерватория', en: 'IR observatory' },
      { id: 'spectraPlus', t: 1, ru: 'Расширенная спектрометрия', en: 'Extended spectrometry' }] },
    { id: 'probes', ru: 'Зонды', en: 'Probes', opts: [
      { id: 'none', t: 0, ru: 'Без комплекта', en: 'No probe kit' },
      { id: 'scout2', t: 3, ru: 'Два разведчика', en: 'Two scouts' },
      { id: 'inspect', t: 2, ru: 'Инспекционный зонд', en: 'Inspection probe' }] },
    { id: 'shield', ru: 'Пылевой щит', en: 'Dust shield', opts: [
      { id: 'dust20', t: 0, ru: 'Штатный, 20 кг/м²', en: 'Standard, 20 kg/m²' },
      { id: 'dust40', t: 1.86, ru: 'Удвоенный, 40 кг/м²', en: 'Doubled, 40 kg/m²' },
      { id: 'sectors', t: 1, ru: 'Сменные сектора', en: 'Replaceable sectors' }] },
    { id: 'prod', ru: 'Производство', en: 'Production', opts: [
      { id: 'repair', t: 0, ru: 'Ремонтный набор', en: 'Repair kit' },
      { id: 'tools', t: 1, ru: 'Станки', en: 'Machine tools' },
      { id: 'printQC', t: 3, ru: 'Металлопечать с контролем', en: 'Metal printing with QC' }] }
  ];
  const SWAPS = 2;
  const EQ_BASE = { brake: 'magnet', rad: 'rad20', caps: 'capsStd', energy: 'shipOnly', sensors: 'spectra', probes: 'none', shield: 'dust20', prod: 'repair' };
  // рекомендации Совета: контакт — читать слабые спектры; снабженец — подключиться к форпосту и чинить; спасатель — надёжные капсулы
  const EQ_MISSION = { contact: { sensors: 'ir' }, supply: { energy: 'grid', prod: 'tools' }, rescue: { caps: 'capsSafe' } };
  // версия 4: снабженцу — без подключения к колонии (в сюжете v2 оно монтажу не помогает); старые паспорта — по своей версии
  const eqDefault = mission => Object.assign({}, EQ_BASE, EQ_MISSION[mission] || {}, mission === 'supply' ? { energy: 'shipOnly' } : {});
  const eqOpt = (pos, id) => { const p = EQUIP.find(x => x.id === pos); return p && p.opts.find(o => o.id === id) || null; };
  const eqMass = eq => EQUIP.reduce((a, p) => a + eqOpt(p.id, eq[p.id]).t, 0);
  const eqSwaps = (eq, mission) => { const d = eqDefault(mission); return EQUIP.filter(p => eq[p.id] !== d[p.id]).length; };
  const eqCode = eq => EQUIP.map(p => eq[p.id]).join('.');
  // код из паспорта: восемь вариантов по порядку позиций; эпоха II и сдвинутые зафиксированные позиции не принимаются
  function eqParse(code) {
    const parts = String(code).split('.');
    if (parts.length !== EQUIP.length) return null;
    const eq = {};
    for (let i = 0; i < EQUIP.length; i++) {
      const p = EQUIP[i], o = p.opts.find(x => x.id === parts[i]);
      if (!o || o.era || (p.fixed && o.id !== EQ_BASE[p.id])) return null;
      eq[p.id] = o.id;
    }
    return eq;
  }
  const eqLegacy = kits => Object.assign({}, EQ_BASE, kits.includes('probes') ? { probes: 'scout2' } : {}, kits.includes('ir') ? { sensors: 'ir' } : {});

  // ---------------------------------------------------------------- спасение после аварии
  // Сигнал бедствия идёт со скоростью света из точки, где был корабль. Первым решает совет, который услышал
  // первым и может действовать; Земля узнаёт о его решении ещё позже. Годы — от отлёта экспедиции.
  // inc: { target, beta, arrive, sent } — корабль в дрейфе доходит до цели сам и тормозит по программе.
  const RESCUERS = {
    local: { prep: 1, crew: 20 },                                          // колония у самой звезды цели: перелёт внутри системы
    pass: { prep: 5, beta: 0.08, acc: 8, dec: 20, crew: 6 },               // ремонтный аппарат Перевала, 100 т груза
    earth: { prep: 10, beta: 0.2, acc: 2, dec: 8, crew: 12 }               // спасательный парус эпохи III, строится после сигнала
  };
  const WORK = 1;                                                          // год работы на месте
  const vec = s => [s.x, s.y, s.z];
  const dist3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  const baseStar = id => id === 'earth' ? [0, 0, 0] : vec(star(colony(id).star));
  // корабль в момент сигнала: на прямой Солнце → цель
  function incidentPos(inc) {
    const t = star(inc.target), x = Math.min(t.d, distLy(inc.sent, inc.beta, inc.arrive, inc.tMag, t.d));
    return [t.x * x / t.d, t.y * x / t.d, t.z * x / t.d];
  }
  // живая колония у звезды цели, способная принять и чинить (не угасающая и не погибшая)
  const localColony = name => { const c = colonyAt(name); return c && c.awake >= 400 ? c : null; };
  // world: { passTug } — память мира между партиями
  function rescuers(inc, world) {
    const P = incidentPos(inc), T = vec(star(inc.target)), out = [];
    // эпоха III на Земле: сводка о первом парусе приходит на корабль за 12 лет до прибытия
    const a3 = actIII(inc.arrive, inc.tMag), e3 = a3 - Math.max(1, Math.round(distLy(a3, inc.beta, inc.arrive, inc.tMag, star(inc.target).d)));
    const loc = localColony(inc.target);
    if (loc) { const hear = inc.sent + dist3(P, T); out.push({ id: 'local', colony: loc.id, hear, launch: hear + RESCUERS.local.prep, fly: 1, complete: Math.max(inc.arrive + WORK, hear + RESCUERS.local.prep + 1 + WORK) }); }
    // notBefore — технология: парус эпохи III начинают строить не раньше, чем она появилась
    const add = (id, notBefore) => {
      const R = RESCUERS[id], B = baseStar(id), hear = inc.sent + dist3(P, B);
      const launch = Math.max(hear, notBefore === undefined ? -Infinity : notBefore) + R.prep, fly = dist3(B, T) / R.beta + (R.acc + R.dec) / 2;
      out.push({ id, hear, launch, fly, complete: Math.max(inc.arrive + WORK, launch + fly + WORK) });
    };
    if (!loc || loc.id !== 'pass') { if (!world || world.passTug !== false) add('pass'); }
    add('earth', e3);
    out.sort((a, b) => a.hear - b.hear);
    return { P, e3, list: out, council: out[0] };
  }
  // Сколько спящих переживут ожидание: фоновые отказы капсул (2·10⁻⁴ в год); после срока блоки отказывают
  // по очереди за пять лет. Вахта живёт в кольцах на своём контуре и сменяется из спящих; когда сменять некем,
  // последняя смена держится ещё WATCH_TAIL лет.
  // inc: { sleepers, watch, sent, hold } — спящие на дату сигнала (или последней помощи).
  const CASCADE = 5, WATCH_TAIL = 20;
  function survivors(inc, complete) {
    const deadline = inc.sent + inc.hold, t = Math.max(inc.sent, Math.min(complete, deadline));
    const bg = inc.sleepers - Math.round((inc.capRate || 2e-4) * inc.sleepers * (t - inc.sent));
    const sleepers = Math.max(0, Math.round(bg * Math.max(0, Math.min(1, 1 - (complete - deadline) / CASCADE))));
    const watch = complete <= deadline + CASCADE + WATCH_TAIL ? inc.watch : 0;
    return { sleepers, watch, total: sleepers + watch };
  }
  const lightYears = (a, b) => dist3(baseStar(a), baseStar(b));
  // копия данных состояния — простые объекты и массивы, строки, числа, логические, null — по правилам JSON (то же, что
  // JSON.parse(JSON.stringify(x)), в 3 раза быстрее): undefined, функции и символы — в объекте пропуск, в массиве null;
  // NaN и ±Infinity — null; −0 — 0. Не для объектов с прототипом, геттерами, __proto__ и toJSON в массивах
  const hasOwn = Object.prototype.hasOwnProperty;
  function copy(v) {
    if (v === null) return null;
    const t = typeof v;
    if (t === 'number') return v === v && v !== Infinity && v !== -Infinity ? (v === 0 ? 0 : v) : null;
    if (t !== 'object') return v;
    if (Array.isArray(v)) { const n = v.length, a = new Array(n); for (let i = 0; i < n; i++) { const e = v[i]; a[i] = e === undefined || typeof e === 'function' || typeof e === 'symbol' ? null : copy(e); } return a; }
    if (typeof v.toJSON === 'function') return JSON.parse(JSON.stringify(v));
    const o = {};
    for (const k in v) { if (!hasOwn.call(v, k)) continue; const e = v[k]; if (e === undefined || typeof e === 'function' || typeof e === 'symbol') continue; o[k] = copy(e); }
    return o;
  }

  const api = { VE, K, CORE, FUEL, ACC, DEC, CREW, SPEEDS, RESERVES, KITS, KIT_IDS, SOURCE, DECLARED, SECTOR, REACH,
    stage, fuel, capacity, kitMass, trip, awake, distLy, speedAt, STAGE_DRY, MISS_AU, divert, stageMt, star, angle, nameOf, offAngle, inSector, reachable, sectorList,
    planets, turn, episode, worldOf, hasGiant, badWorld, isRedDwarf, losses, COLONIES, colonyAt, colony, MISSIONS, TRACES, ROAD, knownAtStart, objectsAtStar,
    RESCUERS, WORK, CASCADE, WATCH_TAIL, incidentPos, localColony, rescuers, survivors, lightYears,
    kitsFor, crewOf, LEGACY_KITS, ENGINE, MAG_F, brakeMass, magYears, stdMag, brakeStart, brakeDist, actIII,
    EQUIP, SWAPS, EQ_BASE, EQ_MISSION, eqDefault, eqOpt, eqMass, eqSwaps, eqCode, eqParse, eqLegacy,
    YEAR_S, C_MS, flightProfile, sampleFlight, timeAtDistance, toSec, toYears, copy, STOP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Mission = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
