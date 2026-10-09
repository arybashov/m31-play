// М31 · срез — протокол совета, память мира, цена ошибки, задание заявки. Часть content.js: объявленное здесь — в общем реестре частей; имена других частей
// приходят через __link (позднее связывание: после создания всех частей; при загрузке нужны только части выше).
(function (root) {
  'use strict';
  const world = __core => {
    let BUILD, CAST, EV, INCIDENT_NAME, M, OUTCOME, R, THAW0, W, Y4, Yepi, aliveOf, energyOK, incYear, lag, livable, namesShort, nmD, nmG, outcomeOf,
    people, ppl, rescueS, startBooks, storeNow, thawAlive, yr, yrs, yrsEn;
    const __link = () => { ({ BUILD, CAST, EV, INCIDENT_NAME, M, OUTCOME, R, THAW0, W, Y4, Yepi, aliveOf, energyOK, incYear, lag, livable, namesShort, nmD, nmG, outcomeOf, people, ppl, rescueS, startBooks, storeNow, thawAlive, yr, yrs, yrsEn } = __core); };
    __link();

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
    const reportAt = end === 'lost' ? Math.round(s.year + d) : ['dutchman', 'sos'].includes(end) ? null : Y4(s) + d;
    const ok = !['lost', 'dutchman', 'sos'].includes(end);
    // задание заявки: выполнено ли и когда отчёт о нём дойдёт до Земли (DOC «Ревью Codex — заявки из мира», шаг 5)
    // выполнение — одно правило с эпилогом (у снабжения и спасения — по их итогу, отчёт — с отчётом экспедиции)
    const task = s.task ? Object.assign({}, s.task, { done: ok && missionComplete(s),
      reportEarthAt: s.task.reportAt != null ? Math.round(s.task.reportAt + d) : ok && missionComplete(s) ? reportAt : null }) : null;
    return { id: `${exp}|done`, expedition: { id: exp, number: 41, mission: s.mission, target: s.target, outcome: end, arrive: s.arrive, endedAt: s.year, reportAt,
      lostBy: end === 'lost' ? (s.terminalReason === 'heat' ? 'heat' : 'stream') : null,   // гибель: отказ охлаждения или поток Тёмной звезды
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
      // записи прежних сборок: год отчёта без округления, гибель без причины (износ — по протоколу происшествий)
      const lostBy = x.lostBy || ((x.incidents || []).some(z => z.kind === 'wearLost') ? 'heat' : 'stream');
      const reportAt = x.reportAt == null ? null : Math.round(x.reportAt);
      const res = {
        lost: lostBy === 'heat' ? (ru ? 'корабль погиб: все контуры охлаждения отказали, ядро осталось без отвода тепла; следующим останутся журнал отказов и координаты остова' : 'the ship was lost: every cooling loop failed and the core was left without heat rejection; the failure log and the wreck coordinates remain for those who follow')
          : ru ? 'корабль погиб в потоке Тёмной звезды; следующим останутся измеренный поток, журнал и координаты остова' : "the ship was lost in the Dark Star's stream; the measured stream, the log and the wreck's coordinates remain for those who follow",
        dutchman: ru ? `вахты не хватило на зал анабиоза; автоматика ведёт пустой корабль к ${nmD({ target: x.target })}, орбита — около года ${x.arrive}. Для следующих это будет находка` : `the watch was too few for the anabiosis hall; the automation flies the empty ship to ${where}, orbit around year ${x.arrive}. For those who follow it will be a find`,
        sos: ru ? 'авария, люди в анабиозе, сигнал бедствия ушёл' : 'an accident; the people are in anabiosis, the distress signal has gone out'
      }[x.outcome] || (OUTCOME[x.outcome] || { ru: x.outcome, en: x.outcome })[lang];
      const mis = MISSION_NAME[x.mission] ? MISSION_NAME[x.mission][lang] : '';
      out.push((ru ? `Экспедиция №${x.number} — ${mis} · ${where}: ${res}.` : `Expedition No. ${x.number} — ${mis} · ${where}: ${res}.`)
        + (reportAt == null ? '' : reportAt <= x.endedAt ? (ru ? ` Отчёт получен на Земле около года ${reportAt}.` : ` The report was received on Earth around year ${reportAt}.`)
          : x.outcome === 'lost' ? (ru ? ` Последняя передача дойдёт до Земли около года ${reportAt}.` : ` The last transmission will reach Earth around year ${reportAt}.`)
          : (ru ? ` Отчёт дойдёт до Земли около года ${reportAt}.` : ` The report will reach Earth around year ${reportAt}.`)));
      if (x.task && TASK_NAME[x.task.work]) { const n = taskName(x.task, lang), at = x.task.reportEarthAt == null ? null : Math.round(x.task.reportEarthAt);
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
      if (x.hull === 'wreck') out.push(lostBy === 'heat'   // отказ охлаждения: остов там, где корабль был, — в пути или у цели
        ? (x.endedAt >= x.arrive ? (ru ? `Остов остаётся на орбите у ${at}; журнал отказов передан.` : `The wreck stays in orbit at ${where}; the failure log has been transmitted.`)
          : (ru ? `Остов идёт по прежнему курсу к ${nmD({ target: x.target })}; его траектория передана — следующие смогут его найти.` : `The wreck coasts on along its course to ${where}; its trajectory has been transmitted — those who follow can find it.`))
        : (ru ? 'Остов уходит от ε Индейца по прежней траектории, кувыркаясь; его траектория передана — следующие смогут его найти.' : 'The wreck tumbles away from ε Indi along its former trajectory; its trajectory has been transmitted — those who follow can find it.'));
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
  // заранее и не перебрасываются. Без сида скрытого нет: hidden → null.
  // hidden(s, key) ∈ [0, 1): FNV-1a по UTF-8 с финализацией; ключ постоянный (без токенов, вариантов, языка, preview).
  const UTF8 = new TextEncoder();
  function hashU32(str) {
    let h = 2166136261;
    if (/^[\x00-\x7f]*$/.test(str)) for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }   // ASCII: байты UTF-8 = коды
    else for (const b of UTF8.encode(str)) { h ^= b; h = Math.imul(h, 16777619); }
    h ^= h >>> 16; h = Math.imul(h, 0x85ebca6b); h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35); h ^= h >>> 16;
    return h >>> 0;
  }
  const RISK = 5;                                                       // версия правил новых экспедиций: 1 — цена ошибки контакта, 2 — сюжет снабженца, 3 — сюжет спасателя, 4 — оснащение (Совет снабженцу без сети колонии; станки и печать удешевляют разделение платы); 5 — симулятор: время, щит, облако и поток на модели
  // публичное состояние — то, что знает экипаж: без сида скрытое недоступно (hidden → null). По нему строятся
  // тексты карточки, «Что известно», рекомендация Совета и «После»; исход — только эффектом на полном состоянии.
  const publicOf = s => { const p = JSON.parse(JSON.stringify(s)); p.riskSeed = null; if (p.wear) p.wear = W.publicOf(p.wear); return EV.strip(p); };
  const hidden = (s, key) => s.riskSeed ? hashU32(JSON.stringify([s.riskVersion, s.riskSeed, key])) / 4294967296 : null;

  function initialState(ctx) {
    const st = {
      riskVersion: RISK,                                                // правила одни (старые версии удалены; номер — в ключе скрытых бросков)
      riskSeed: ctx && ctx.riskSeed ? String(ctx.riskSeed) : null,
      evOff: !!(ctx && ctx.events === false),
      worldSeed: ctx && typeof ctx.worldSeed === 'string' && ctx.worldSeed ? ctx.worldSeed : null,   // сид мира: события Кольца
      agenda: ctx && Array.isArray(ctx.agenda) ? ctx.agenda.slice() : null,   // повестка Совета на старт экспедиции (requests.js)   // события v1 выключены (проверки и калибровка: те же сиды без событий)
      year: 0,
      reserve: 100,        // резерв манёвров, % паспортного
      agroDelay: 0,        // задержка резервного агромодуля, лет
      koraYear: false,     // Кора осталась на вахте ещё на год
      repairQual: false,   // ремонтники допущены к монтажу под тягой
      measured: false,     // плотность края облака измерена: проверка нашла полосу крупной пыли
      cloudCheck: null,    // measured | skipped — проверка края затмением
      cloudFound: false,   // проверка нашла полосу крупной пыли
      cloudDead: 0,        // погибли у края облака
      shieldBreach: false, // сектор щита пробит (установлено)
      loopCheck: null,     // ordinary | deep | skipped — проверка общей магистрали
      loopFound: false,    // проверка нашла дефект общей магистрали
      loopDead: 0,         // погибли при отказе контура воды
      streamCheck: null,   // probe | kora | student — чем проверяли поток
      streamFound: false,  // проверка увидела опасную полосу на курсе
      streamDays: 0,       // дни окна, ушедшие на проверку
      streamRoute: null,   // evade | pass
      streamDead: 0,       // погибли в потоке
      streamCause: null,   // shield | power — почему удар тяжёлый
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
      terminalAt: null,    // рейс окончен состоянием корабля (износ, шаг 3d): дата
      terminalReason: null,   // и причина: heat — ядро без отвода тепла
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
    startBooks(st);                                                     // журнал запасов и людей, ревизии маршрута
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

    return {
      names: {
        homeKind, PLAN_WHO, planWho, planText, endR, MISSION_NAME, expeditionEvent, thawFacts, THAW_PLACE, thawWorld, HOME_KIND, worldLines, UTF8,
        hashU32, RISK, publicOf, hidden, initialState, taskResult, TASK_NAME, taskName, SURVEY_WORLD, taskReportText, missionComplete
      },
      link: __link
    };
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = world;
  else (root.M31Core = root.M31Core || {}).world = world;
})(typeof globalThis !== 'undefined' ? globalThis : this);
