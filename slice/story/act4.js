// М31 · срез — сюжет: акт IV · высадка и развязка. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const act4 = K => {
    const {
      M, Y4, energyOK, eqOf, livable, planText, planWho, powerOK, ppl, rescueS, src, supplyS, yrs
    } = K;
    return [
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
        effect: st => { st.settle = 'surface'; if (st.home === 'orbit') st.homeReadyAt = st.year + (st.kits.includes('landing') ? 2 : 5); },   // с орбиты — стройка с этого решения
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

    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = act4;
  else (root.M31Story = root.M31Story || {}).act4 = act4;
})(typeof globalThis !== 'undefined' ? globalThis : this);
