// М31 · срез — сюжет: акт I. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const act1 = K => {
    const {
      CLOUD, DV, M, NEWS, W, bandBreach, bandHit, brake, cloudBand, crewOf, crewWord, dvPct, edgeLogV5, edgeMonths, edgeOut, eqOf, f1, fb, hasScouts,
      hidden, kms, nameAt, newsCandidates, newsPlan, newsText, nm, nmD, pct, plural, ppl, probeTimes, regHands, reqOf, rescueS, shieldGaugeV5,
      sleepersAt2, spendPct, stageOff, stageYears, stayOption, taskLabel, thinWatch, turnOption, yrs, yrsEn, yrsG
    } = K;
    return [
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
        ru: s => `Скорость ${fb(s.beta / 2, 'ru')}. На курсе — газово-пылевое облако класса D2, край пересекается через ${edgeMonths(s, 'ru')}.
Обнаружено на подлёте: линии поглощения в спектрах звёзд за ним, счётчики щита выше фона. С Земли не наблюдалось — слишком мало и темно.
Проход без коррекции: безопасен. Уверенность 94% — при условии, что модель верна и набор гипотез полон.
Модель проверена для облаков D1–D3 плотностью до 40 частиц/см³.
Ресурс фронтального щита: ~150 лет дрейфа.
Не установлено: наибольший размер частиц у края. За фронтальным щитом в этом секторе — жилые отсеки кольца: крупная частица, пробив щит, убьёт людей.`,
        en: s => `Velocity ${fb(s.beta / 2, 'en')}. A class D2 gas-and-dust cloud on course; edge crossing in ${edgeMonths(s, 'en')}.
Detected on approach: absorption lines in the spectra of stars behind it, shield counters above background. Not observed from Earth — too small and too dark.
Passage without correction: safe. Confidence 94% — given the model is correct and the hypothesis set complete.
Model validated for D1–D3 clouds up to 40 particles/cm³.
Forward shield service life: ~150 years of drift.
Not established: the largest particle size at the edge. Behind the forward shield in this sector are the ring's living quarters: a coarse particle that breaks through will kill people.`
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
      id: 'a1.test.v1', scene: 'cloud', overlay: 'trajectory', kind: 'transcript', year: 4,
      when: s => M.episode(s) === 'cloud',
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
      when: s => M.episode(s) === 'cloud',
      title: { ru: 'Проверить край облака?', en: "Check the cloud's edge?" },
      context: { ru: s => `До края — ${edgeMonths(s, 'ru')}: время на проверку есть.`,
        en: s => `${edgeMonths(s, 'en')} to the edge: there is time for a check.` },
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
      rec: s => s.cloudFound ? { id: 'manoeuvre', why: { ru: 'проверка нашла полосу крупной пыли', en: 'the check found a band of coarse dust' } }
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
          effect: s => { spendPct(s, 3.2 * 0.01 / s.reserveDv); s.agroAtRisk = true; s.agroDelay = s.repairQual || s.kits.includes('agro') ? 0 : 2; },
          record: {
            ru: 'Совет голосует за манёвр.',
            en: 'The council votes for the manoeuvre.'
          }
        },
        {
          id: 'trust',
          label: { ru: 'Идти без коррекции', en: 'Go straight through' },
          known: {
            ru: s => ['Резерв манёвров сохраняется полностью.',
              s.cloudFound ? 'В крае — полоса крупной пыли: обычный щит её не держит; за сектором — жилые отсеки.'
                : s.cloudCheck === 'measured' ? 'Признак крупной пыли не обнаружен; метод пропускает примерно одну полосу из десяти.'
                : 'Крупна ли пыль у края — не измерено. Если там полоса крупных частиц, обычный щит пробьёт; за сектором — жилые отсеки.',
              eqOf(s).shield === 'dust40' ? 'Щит удвоенный: на такую полосу рассчитан — сквозного пробоя не ожидается, наружный слой пострадает.'
                : eqOf(s).shield === 'sectors' ? 'Сектора сменные: пробитый заменят, если есть ремонтники с допуском; погибших это не вернёт.'
                : 'Окна без тяги остаются на месте: монтаж агромодуля — по графику.'],
            en: s => ['The manoeuvre reserve stays whole.',
              s.cloudFound ? 'There is a band of coarse dust in the edge: an ordinary shield will not hold it; the living quarters are behind the sector.'
                : s.cloudCheck === 'measured' ? 'No sign of coarse dust detected; the method misses about one band in ten.'
                : 'Whether the dust at the edge is coarse has not been measured. If there is a band of coarse particles, an ordinary shield will be breached; the living quarters are behind the sector.',
              eqOf(s).shield === 'dust40' ? 'The shield is doubled: it is rated for such a band — no breach through is expected, the outer layer will suffer.'
                : eqOf(s).shield === 'sectors' ? 'The sectors are replaceable: a breached one will be swapped if there are qualified repair hands; that will not bring back the dead.'
                : 'The no-thrust windows stay put: the agro module keeps its schedule.']
          },
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
          effect: s => { const kit = hasScouts(s); if (!kit) s.materials -= 10; s.scout = s.repairQual ? 6 : 8; if (!s.repairQual && !kit) spendPct(s, dvPct(s, DV.probe)); s.scoutTuned = s.koraYear; },
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
      // рекомендация — по регламенту (шаг «хрупкость»): специалистов вахты (вахта/6, по 250 полезных суток в год) хватает ли на спрос
      rec: s => { const sp = Math.floor(thinWatch(s.arrive) / 6) * W.REG.perYear, D = W.REG.D0 * (1 + Math.min(W.REG.ageMax, W.REG.age * s.arrive));
        return sp >= D ? { id: 'thin', why: { ru: 'рук хватает и на регламент, а прожитые в пути годы сберегаются', en: 'there are hands enough for maintenance too, and years of life on the road are saved' } }
          : { id: 'full', why: { ru: `тонкой вахте регламент не по силам: недодача около ${Math.round(D - sp)} чел.-сут в год — отставание копится, корабль стареет быстрее`, en: `a thin watch cannot keep up with maintenance: about ${Math.round(D - sp)} person-days a year short — the backlog grows and the ship ages faster` } }; },
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
              `Меньше рук: специалистов — ${Math.floor(thinWatch(s.arrive) / 6)}, а регламенту к концу пути нужно ${regHands(s)}; ремонт медленнее, ошибки дороже.`,
              s.repairQual ? 'Допуск к монтажу под тягой есть: агромодуль монтируют в срок.' : 'Без допуска к монтажу под тягой агромодуль ждёт окна: два года задержки.',
              s.koraYear ? 'Интерпретатор спектров на вахте есть — Ная Сорн.' : 'Интерпретатор спектров — только Кора, и каждое её пробуждение идёт из её лимита.'],
            en: s => [`Each of us lives about ${yrsEn(M.awake(s.arrive, thinWatch(s.arrive), crewOf(s)))} on the road — as on the short route.`,
              `Fewer hands: ${Math.floor(thinWatch(s.arrive) / 6)} specialists, while maintenance needs ${regHands(s)} by the end of the road; repairs slower, mistakes costlier.`,
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
    { id: 's.edge', kind: 'skip', when: s => M.episode(s) === 'cloud', toYear: edgeOut, label: { ru: 'Промотать до края облака', en: "Skip ahead to the cloud's edge" } },
    {
      id: 'a1.edge.m', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: edgeOut,
      when: s => s.choices['d.cloud'] === 'manoeuvre',
      title: { ru: 'Навигационный журнал', en: 'Navigation log' },
      text: {
        ru: s => `Коррекция выполнена. Край облака пройден в стороне.
Резерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.` + (s.measured ? '' : `
Был ли в крае опасный слой — так и не узнаем.`),
        en: s => `Correction complete. The cloud's edge passed at a distance.
Manoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.` + (s.measured ? '' : `
Whether there was a dangerous layer in the edge we will never know.`)
      }
    },
    {
      id: 'a1.edge.t1', scene: 'cloud', overlay: 'trajectory', kind: 'instrument', year: edgeOut,   // проход и удар считает модель щита
      when: s => s.choices['d.cloud'] === 'trust',
      title: { ru: 'Журнал фронтального щита', en: 'Forward shield log' },
      text: {
        ru: s => edgeLogV5(s, 'ru'),
        en: s => edgeLogV5(s, 'en')
      }
    },
    {
      id: 'a1.orin.t1', scene: 'cloud', overlay: 'trajectory', kind: 'note', year: edgeOut,
      when: s => s.choices['d.cloud'] === 'trust',
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
      effect: s => { spendPct(s, stageOff(s).reservePct); },
      title: { ru: 'Инженерный журнал', en: 'Engineering log' },
      text: {
        ru: s => `Тяга ступени разгона снята. Скорость ${fb(s.beta, 'ru')}.
Ступень разгона отделена. Последние ${stageOff(s).days} ${plural(stageOff(s).days, ['сутки', 'суток', 'суток'])} тяга шла под углом 10°: ступень уходит вбок, ${kms(stageOff(s).dv)} км/с. Ядро погасило свою боковую скорость — резерв манёвров −${pct(stageOff(s).reservePct, 'ru')}%.
Ступень пройдёт ${nm(s, 'ru')} в тысяче а.е. в стороне около года ${Math.round(M.ACC + stageYears(s))}, за ${yrs(s.arrive - M.ACC - stageYears(s))} до нас, и уйдёт дальше. По прямой она догнала бы ядро в первые сутки торможения и вошла бы в систему цели на ${fb(s.beta, 'ru')}: ${String(M.STAGE_DRY).replace('.', ',')} тыс. т — ${f1(M.stageMt(s.beta), 'ru')} млн мегатонн.
Плазменный магнит: включение на году ${Math.round(brake(s))}.
Резерв манёвров: ${pct(s.reserve, 'ru')}% паспортного.
Цель: ${nm(s, 'ru')} · прибытие около года ${s.arrive}.` +
          (s.materials !== 100 ? `\nМатериалы для высадки: ${Math.round(s.materials)}% запаса.` : '') +
          (s.earlyCouncil && s.earlyCouncil.choice === 'turn' ? `\nКурс изменён на году ${s.earlyCouncil.at}: к ${nameAt(s.target, 'ru')}.` : '') +
          (s.shield ? `\nФронтальный щит: ${shieldGaugeV5(s, 'ru')}.` : ''),
        en: s => `Acceleration-stage thrust cut. Velocity ${fb(s.beta, 'en')}.
Acceleration stage separated. For the last ${stageOff(s).days} days thrust was angled 10°: the stage drifts off sideways at ${kms(stageOff(s).dv)} km/s. The core cancelled its own sideways velocity — manoeuvre reserve −${pct(stageOff(s).reservePct, 'en')}%.
The stage will pass ${nm(s, 'en')} a thousand AU aside around year ${Math.round(M.ACC + stageYears(s))}, ${yrsEn(s.arrive - M.ACC - stageYears(s))} ahead of us, and fly on. On a straight line it would have caught the core on the first day of braking and entered the target system at ${fb(s.beta, 'en')}: ${M.STAGE_DRY} kt — ${f1(M.stageMt(s.beta), 'en')} million megatons.
Plasma magnet: switch-on in year ${Math.round(brake(s))}.
Manoeuvre reserve: ${pct(s.reserve, 'en')}% of rated.
Target: ${nm(s, 'en')} · arrival around year ${s.arrive}.` +
          (s.materials !== 100 ? `\nLanding materials: ${Math.round(s.materials)}% of stock.` : '') +
          (s.earlyCouncil && s.earlyCouncil.choice === 'turn' ? `\nCourse changed in year ${s.earlyCouncil.at}: for ${M.nameOf(s.target, 'en')}.` : '') +
          (s.shield ? `\nForward shield: ${shieldGaugeV5(s, 'en')}.` : '')
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
    ];
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = act1;
  else (root.M31Story = root.M31Story || {}).act1 = act1;
})(typeof globalThis !== 'undefined' ? globalThis : this);
