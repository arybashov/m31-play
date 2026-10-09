// М31 · срез — сюжет: акт II · дрейф. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const act2 = K => {
    const {
      BLUEPRINT, LOOP, M, PREP, RESCUE, SOS_AT_cargo, SUPPLY, THAW0, WATCH_SOS, Y, YD, brake, bulletinTitle, cargoConnect, collectorCracked,
      contactRun, coolerName, dutchmanEnd, eqOf, f1, fb, hidden, incident, lastCall, loopAt, loopCommon, matReserve, nm, nmG, ownStory, ppl,
      probeTimes, reader, rescueS, skipTo, sosDrift, sosEnd, stagePass, stageYears, supplyS, thawLag, yrs, yrsEn
    } = K;
    return [
    // ------------------------------------------------------------ АКТ II · ДРЕЙФ
    Object.assign(skipTo(0.12, 'дрейф', 'drift'), { id: 's.d1' }),
    {
      id: 'a2.support', scene: 'support', kind: 'bulletin', year: s => Y(s, 0.12), when: s => !ownStory(s),
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
      rec: s => ({ id: 'power', why: { ru: 'резерв мощности нужен у цели', en: 'the high-power reserve is needed at the target' }, assume: { ru: 'контур выдержит пробуждённую группу Б', en: 'the loop will carry the woken group B' } }),
      context: {
        ru: '«По Дассеру» — сначала люди на борту. «По Далу» — сохранять диапазон возможностей корабля. Будить основателей ради решения совет не стал.',
        en: '"Dasser\'s way" — people aboard first. "Dal\'s way" — keep the ship\'s range of options. The council chose not to wake the founders for this.'
      },
      options: s => [
        {
          id: 'power',
          label: { ru: 'Полный контур', en: 'The full loop' },
          known: {
            ru: s => ['Резерв повышенной мощности сохранён.', 'Группу Б будят аварийно: двадцать человек тратят годы жизни, а жизнеобеспечение рассчитано на малую смену.',
              `С группой Б бодрствуют ${s.watch + 20}: временного запаса воды — на два года. Выдержит ли общая магистраль колец такую нагрузку, не проверено; если нет — отказ в обоих кольцах сразу.`],
            en: s => ['The high-power reserve is kept.', 'Group B is woken in an emergency: twenty people spend years of life, and life support is sized for a small watch.',
              `With group B, ${s.watch + 20} are awake: temporary water reserves for two years. Whether the rings' common main can carry that load has not been checked; if not, it fails in both rings at once.`]
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
      id: 'a2.loop1', scene: 'ring', kind: 'instrument', year: s => Y(s, 0.68), when: s => contactRun(s) && s.groupB === 'woken',
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
      id: 'd.overloadCheck', scene: 'ring', kind: 'decision', year: s => Y(s, 0.68), when: s => contactRun(s) && s.groupB === 'woken',
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
      id: 'd.overload1', scene: 'ring', kind: 'decision', year: s => Y(s, 0.68), when: s => contactRun(s) && s.groupB === 'woken',
      title: { ru: 'Жизнеобеспечение на пределе', en: 'Life support at the limit' },
      context: {
        ru: s => `Бодрствуют ${ppl(s.watch + 20)}; запас воды — до года ${Math.round(loopAt(s))}. ${s.loopFound ? 'Общая магистраль повреждена.' : s.loopCheck === 'skipped' ? 'Магистраль не проверяли.' : 'Проверка дефекта не нашла.'} Если магистраль откажет, погибнут те, кто будет в кольцах: группа Б и смена вахты.${s.watch - 11 < WATCH_SOS ? ' Оставшихся не хватит, чтобы обслуживать зал анабиоза.' : ''}`,
        en: s => `${s.watch + 20} are awake; water reserves to year ${Math.round(loopAt(s))}. ${s.loopFound ? 'The common main is damaged.' : s.loopCheck === 'skipped' ? 'The main has not been checked.' : 'The check found no defect.'} If the main fails, those in the rings will die: group B and a shift of the watch.${s.watch - 11 < WATCH_SOS ? ' Those left will be too few to maintain the anabiosis hall.' : ''}`
      },
      rec: s => s.loopFound ? (s.materials >= LOOP.materials && s.materials - LOOP.materials >= matReserve(s) ? { id: 'materials', why: { ru: 'магистраль повреждена', en: 'the main is damaged' } }
          : { id: 'sleep', why: s.materials >= LOOP.materials ? { ru: `магистраль повреждена, но около ${Math.round(matReserve(s))}% материалов нужны регламенту до прибытия и первых лет у цели и на ремонты`, en: `the main is damaged, but about ${Math.round(matReserve(s))}% of the materials are needed for maintenance until arrival and the first years at the target, and for repairs` }
            : { ru: 'магистраль повреждена, материалов на второй контур нет', en: 'the main is damaged and there are no materials for a second loop' } })
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
      id: 'a2.loopEnd1', scene: 'ring', kind: 'instrument', year: loopAt, when: s => contactRun(s) && s.overload === 'hold',
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
    dutchmanEnd('x.dutchman1', s => contactRun(s) && s.dutchman, loopAt),
    sosDrift('d.sos.drift1', s => contactRun(s) && s.loopDead > 0 && !s.dutchman),
    Object.assign(sosEnd('drift', 'vault'), { id: 'x.sos.drift1', when: s => contactRun(s) && s.sos === 'drift' }),
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
    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = act2;
  else (root.M31Story = root.M31Story || {}).act2 = act2;
})(typeof globalThis !== 'undefined' ? globalThis : this);
