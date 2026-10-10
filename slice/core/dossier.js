// М31 · срез — досье оснащения; авария с живыми и спасатели; снабженец. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const dossier = __core => {
    let BLUEPRINT, CLOUD, DV, M, RQ, SHIELD_WORK, SOS_AT_cargo, STORM, THAW_LOSS, arrivalAt, arrivalYear, capsSafe, crewOf, eqOf, f1, hasIR, hasScouts,
    loopAt, lossesOf, nm, nmD, nmG, passportNumbers, powerOK, ppl, probesLeft, reqOf, rescueS, sosAtStream, storeNow, supplyS, yrs, yrsEn;
    const __link = () => { ({ BLUEPRINT, CLOUD, DV, M, RQ, SHIELD_WORK, SOS_AT_cargo, STORM, THAW_LOSS, arrivalAt, arrivalYear, capsSafe, crewOf, eqOf, f1, hasIR, hasScouts, loopAt, lossesOf, nm, nmD, nmG, passportNumbers, powerOK, ppl, probesLeft, reqOf, rescueS, sosAtStream, storeNow, supplyS, yrs, yrsEn } = __core); };
    __link();

  // ---------------------------------------------------------------- оснащение: досье, вопросы, карточки, цена (DOC: оснащение v4)
  // Анкета показывает только публичное: цель, каталог, архив на день старта, расчёт паспорта. Скрытое (сид) не используется.
  // скрытые в анкете варианты: без применения в этой миссии (паспорт со старым id остаётся валидным)
  function eqHidden(s, pos, opt) {
    if (supplyS(s)) return pos === 'energy' || pos === 'sensors' || (pos === 'shield' && opt !== 'dust20') || opt === 'inspect';
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
  // польза / условие / основание — по миссии
  function eqCard(s, opt, lang) {
    const ru = lang === 'ru', R = routeSigns(s), L = (r, e) => ru ? r : e;
    const red = R.red && !R.source, sup = supplyS(s), res = rescueS(s);
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
      tools: sup ? [L(`Второй монтажный комплект — 10% материалов вместо 30; разделение платы — ${busSplitFor(s, 'tools')}% вместо 12.`, `The second installation kit costs 10% of materials instead of 30; board separation ${busSplitFor(s, 'tools')}% instead of 12.`),
          L('Производство не обнаруживает дефект и не ускоряет работы; монтаж требует свободных сетей.', 'Manufacturing neither detects damage nor speeds up work; installation requires free grids.'),
          L('Изготовление на борту сохраняет запас форпоста.', "Onboard manufacturing preserves the outpost's stock.")]
        : [L('Позволяют изготовить радиатор за 20% материалов и вернуть резерв мощности.', 'Allow a radiator to be built for 20% of materials, restoring the high-power reserve.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Require lost high power, the blueprint and repair qualification.'), L('Восстановление контура требует изготовления деталей.', 'Restoring the loop requires manufactured parts.')],
      printQC: sup ? [L(`Второй монтажный комплект — 10% материалов; разделение платы — ${busSplitFor(s, 'printQC')}% вместо 12.`, `The second installation kit costs 10% of materials; board separation ${busSplitFor(s, 'printQC')}% instead of 12.`),
          L('Производство не обнаруживает дефект и не ускоряет работы; на 2 тыс. т тяжелее станков.', 'Manufacturing neither detects damage nor speeds up work; 2 kt heavier than machine tools.'),
          L('Изготовленные детали сокращают расход общего запаса.', 'Manufactured parts reduce use of the shared stock.')]
        : [L('Позволяет изготовить радиатор за 10% материалов вместо 20 на станках.', 'Allows a radiator to be built for 10% of materials instead of 20 with machine tools.'), L('Нужны потеря повышенной мощности, чертёж и допуск ремонтников.', 'Requires lost high power, the blueprint and repair qualification.'), L('Печать экономит материалы ценой большей массы оборудования.', 'Printing saves materials at the cost of greater equipment mass.')]
    };
    return C[opt] || [];
  }
  // аварийная польза — отдельной условной строкой, без частот генератора
  function eqIf(s, opt, lang, d) {
    const ru = lang === 'ru', R = routeSigns(s, d);
    if (opt === 'dust40' && s.mission === 'contact' && R.cloud) return ru ? 'Если пройдём полосу крупной пыли у облака: удвоенный щит предотвращает пробой; расчётная разница аварийных потерь — 8 человек.' : "If we cross the cloud's coarse-dust band: the doubled shield prevents a breach; the estimated difference in incident losses is 8 people.";
    if (['grid', 'reactor5', 'dual'].includes(opt) && s.mission === 'contact') return ru ? 'Если поселению не хватит энергии и другого источника не будет: энергетический груз предотвращает зимний дефицит; потери без него зависят от выбранного поселения.' : 'If the settlement lacks power and no other source is available: power cargo prevents the winter shortage; losses without it depend on the settlement chosen.';
    return null;
  }
  // цена замены: от рекомендации в этой позиции, прочие ответы те же
  const sgn = (x, lang, dg) => { const v = Math.abs(x) < 0.5 * Math.pow(10, -dg) ? 0 : x, t = (lang === 'ru' ? f1 : f1)(Math.abs(v), lang);
    return v === 0 ? (x === 0 ? '0' : (x > 0 ? '+<0' : '−<0') + (lang === 'ru' ? ',1' : '.1')) : `${v > 0 ? '+' : '−'}${dg === 2 ? (lang === 'ru' ? Math.abs(v).toFixed(2).replace('.', ',') : Math.abs(v).toFixed(2)) : t}`; };
  function eqCost(s, d, pos, lang) {
    const ru = lang === 'ru', rec = M.eqDefault(s.mission)[pos];
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
  // разделение общей платы снабженца: станки и печать удешевляют
  const busSplitFor = (s, prod) => supplyS(s) ? ({ repair: 12, tools: 10, printQC: 8 })[prod] : STORM.split;
  const busSplit = s => busSplitFor(s, eqOf(s).prod);
  // итог оснащения после пути: что помогло, что не понадобилось, чего не хватило — по установленным событиям партии.
  // ids — сцены, которые прошли. Контрфакт — только для события, которое случилось; оценки капсул помечены как расчёт.
  function eqSummary(s, lang, ids) {
    const ru = lang === 'ru', eq = eqOf(s), help = [], miss = [], used = new Set(), had = id => ids.has(id), L = (r, e) => ru ? r : e;
    const rq = s.repairQual ? '' : L(` и ${DV.probe} км/с резерва манёвров`, ` and ${DV.probe} km/s of manoeuvre reserve`);
    if (s.cloudHit) {                                    // исход полосы — из модели щита
      const h = s.cloudHit;
      if (!h.breached) { help.push(L(`Удвоенный щит выдержал удар крупного зерна у облака: на панели ${h.panel} выбоина, сквозного пробоя нет, ремонт не понадобился.`, `The doubled shield withstood the coarse grain at the cloud: a scar on panel ${h.panel}, no through-breach, no repair needed.`)); used.add('shield'); }
      else {
        miss.push(L(`Щит пробит крупным зерном у облака (панель ${h.panel}). Удвоенный слой выдержал бы этот удар; расчётная разница потерь — ${CLOUD.dead} человек.`, `The shield was breached by a coarse grain at the cloud (panel ${h.panel}). A doubled layer would have held this impact; the estimated loss difference is ${CLOUD.dead} people.`));
        if (h.repair === 'replace') { help.push(L(`Запасная панель установлена ремонтниками с допуском: щит снова держит полный расчёт; крепёж — ${SHIELD_WORK.replace}% материалов.`, `Qualified repair hands fitted a spare panel: the shield holds its full rating again; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
        else if (eq.shield === 'sectors' && !s.repairQual) miss.push(L('Запасную панель не поставили: нет допуска к работе под тягой.', 'No spare panel was fitted: no qualification for work under thrust.'));
      }
    }
    const hs = s.streamImpact;                           // замена панели после удара потока — решение у пробоя
    if (hs && hs.repair === 'replace') { help.push(L(`После удара потока запасная панель ${hs.panel} установлена ремонтниками с допуском; крепёж — ${SHIELD_WORK.replace}% материалов.`, `After the stream strike qualified repair hands fitted a spare panel ${hs.panel}; fasteners took ${SHIELD_WORK.replace}% of materials.`)); used.add('shield'); }
    else if (hs && hs.level != null && !s.lostShip && eq.shield === 'sectors' && !s.repairQual) miss.push(L('После удара потока запасную панель не поставили: нет допуска к работе под тягой.', 'After the stream strike no spare panel was fitted: no qualification for work under thrust.'));
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
    if (supplyS(s) && prodName && (s.busMethod === 'split' || s.busFound)) { help.push(L(`${prodName} ${pv('сократили', 'сократила')} расход на разделение платы: ${busSplit(s)}% вместо ${STORM.split}.`, `${prodName} cut the board-separation cost: ${busSplit(s)}% instead of ${STORM.split}.`)); used.add('prod'); }
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
        rec = passportNumbers(sp, Object.assign({}, d0, { eq: M.eqDefault(s.mission) })), mo = x => `${sgn(x * 12, lang, 1)} ${ru ? 'мес.' : 'months'}`;
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
  const getWorld = () => WORLD;
  // cargo: год сигнала — целый (сутки работ — в журнале)
  // год сигнала — целый (у склада — после консервации зала: прибытие округляется вверх)
  const SOS_AT = { cargo: SOS_AT_cargo, drift: loopAt, stream: sosAtStream, home: s => arrivalYear(s) + 1, rescueDock: s => Math.max(s.arrive, Math.ceil(storeNow(s))) };
  function incidentOf(s, cause) {
    const sent = SOS_AT[cause](s), alive = crewOf(s) - (lossesOf(s, Math.min(sent, arrivalAt(s))).total + s.dead + (s.rescueCrewDead || 0));
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
      ru ? `Капсулы с вахтой из двенадцати продержатся до года ${Math.round(inc.deadline)}.` + (m >= 0 ? ` Запас — ${yrs(m)}.` : ' Никто не успевает.')
        : `Capsules with a watch of twelve will hold until year ${Math.round(inc.deadline)}.` + (m >= 0 ? ` Margin: ${yrsEn(m)}.` : ' No one makes it in time.'),
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
    cargo: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${arrivalYear(s)}${s.kits.includes('request') ? '; груз заявки — в трюме' : ''}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${arrivalYear(s)}${s.kits.includes('request') ? '; the request cargo is in the hold' : ''}.` },
    drift: { ru: s => `Корабль идёт к ${nmD(s)} сам и встанет там на орбиту около года ${arrivalYear(s)}.`, en: s => `The ship flies on to ${nm(s, 'en')} by itself and will enter orbit there around year ${arrivalYear(s)}.` },
    stream: { ru: s => `Корабль дотормаживает к ${nmD(s)}: орбита — около года ${arrivalYear(s)}.`, en: s => `The ship finishes braking toward ${nm(s, 'en')}: orbit around year ${arrivalYear(s)}.` },
    home: { ru: s => `Корабль на орбите у ${nmG(s)}.`, en: s => `The ship is in orbit at ${nm(s, 'en')}.` },
    rescueDock: { ru: s => `Корабль на орбите у ${nmG(s)}, рядом со складом Оттепели; живые Оттепели остаются в капсулах склада, их последняя диагностика — в сигнале.`, en: s => `The ship is in orbit at ${nm(s, 'en')}, beside Thaw's store; Thaw's living remain in the store's capsules, their last diagnostics in the signal.` }
  };
  // «Звать помощь?» после отказа контура (a2.loopEnd1)
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
  // «Летучий голландец»: некому обслуживать зал (отказ списан в a2.loopEnd1)
  const dutchmanEnd = (id, when, year) => ({
    id, scene: 'drift', kind: 'end', year, when,
    title: { ru: '«Летучий голландец»', en: 'The Flying Dutchman' },
    text: {
      ru: s => `Контур воды отказал в обоих кольцах. Группа Б и одиннадцать человек вахты погибли; оставшихся ${ppl(s.watch)} не хватило, чтобы обслуживать зал анабиоза. Капсулы отказывают по одной.

Автоматика ведёт корабль дальше. Плазменный магнит включится по программе, корабль встанет на орбиту у ${nmG(s)} около года ${arrivalYear(s)} — и так и будет кружить с экипажем на борту, без живых. Маяк будет передавать, пока хватит питания.

Экспедиция окончена. Для следующей — к другой цели — это будет находка: журнал, имена, последняя запись вахты.`,
      en: s => `The water loop failed in both rings. Group B and eleven of the watch died; the remaining ${s.watch} were too few to maintain the anabiosis hall. The capsules fail one by one.

The automation flies the ship on. The plasma magnet will switch on by programme, and the ship will enter orbit at ${nm(s, 'en')} around year ${arrivalYear(s)} — and will keep circling there with its crew aboard, none of them alive. The beacon will transmit as long as there is power.

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

Сигнал бедствия ушёл в год ${Math.round(inc.sent)}: журнал, координаты, число живых, неисправности и дата последнего гарантированного пробуждения — год ${Math.round(inc.deadline)}. Помочь могут: ${R.list.map(r => `${place(r, 'ru')} — сигнал дойдёт в год ${yr(r.hear)}`).join('; ')}.

Экспедиция прекращена. Что будет со спящими, решит тот, кто услышит первым: ${place(R.council, 'ru')}.`; },
      en: s => { const inc = s.incident, R = M.rescuers(inc, WORLD);
        return `Twelve are awake; the watch is relieved from among the sleepers on a schedule. ${inc.sleepers} are in the capsules. ${SOS_WHERE[cause].en(s)}

The distress signal went out in year ${Math.round(inc.sent)}: the log, the coordinates, the number of living, the faults and the date of the last guaranteed waking — year ${Math.round(inc.deadline)}. Those who can help: ${R.list.map(r => `${place(r, 'en')} — the signal arrives in year ${yr(r.hear)}`).join('; ')}.

The expedition is over. What happens to the sleepers will be decided by whoever hears first: ${place(R.council, 'en')}.`; }
    }
  });

  // ---- снабженец: откуда берутся системы для форпоста. Из груза заявки — бесплатно; иначе из своих материалов:
  // передатчик −35%, капсульный блок −40% (без груза заявки обе системы — три четверти запаса).
  const BUILD = { relay: 35, caps: 40 };                                 // из своих материалов: передатчик, капсульный блок
  const relayKit = s => s.kits.includes('request');
  const capsKit = s => s.kits.includes('request') && !s.capsUnitLost;   // 4г: партия C2 потеряна — блок строят из материалов
  const supplyNeed = s => (relayKit(s) ? 0 : BUILD.relay) + (capsKit(s) ? 0 : BUILD.caps);   // материалов на обе системы
  // второй монтажный комплект: 30% материалов, со станками — 10%; нужен запас и на сами системы
  // вторую бригаду питает вторая сеть корабля: отданный под вспышками блок закрывает «всё сразу»
  const supplyBothCost = s => { const c = ['tools', 'printQC'].includes(eqOf(s).prod) ? 10 : 30; return s.gridBlocks >= 2 && s.materials >= supplyNeed(s) + c ? c : null; };
  // переселение: койки и регенерация воздуха для девяноста (−15%), отдельная сеть для их колец
  const SHELTER = 15;
  // прогноз: что будет поставлено при выбранном порядке (для «Что известно» — те же правила, что у эффекта)
  const supplyForecast = (s, first, extra = 0) => { const t = { kits: s.kits, capsUnitLost: s.capsUnitLost, materials: s.materials - extra, relayOK: false, capsOK: false }; supplyBuild(t, first); return t; };   // потеря C2 — в прогнозе тоже
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

    return {
      names: {
        eqHidden, eqPosHidden, EQ_Q, eqQuestion, routeSigns, eqCard, eqIf, sgn, eqCost, eqCouncil, missionDossier, busSplitFor, busSplit, eqSummary,
        eqApi, WATCH_SOS, sosHold, WORLD, setWorld, getWorld, SOS_AT, incidentOf, PLACE, baseKey, place, cap, yr, sosKnown, sosOption, SOS_WHERE,
        sosDrift, dutchmanEnd, sosEnd, BUILD, relayKit, capsKit, supplyNeed, supplyBothCost, SHELTER, supplyForecast, supplyBuild, supplySrc
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = dossier;
  else (root.M31Core = root.M31Core || {}).dossier = dossier;
})(typeof globalThis !== 'undefined' ? globalThis : this);
