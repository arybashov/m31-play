// М31 · срез — сюжет: эпилог. Сцены по порядку (движок идёт по массиву content.beats); собираются в content.js:
// фабрика получает общие имена content.js (помощники, константы, модели) и возвращает сцены акта.
(function (root) {
  'use strict';
  const epilogue = K => {
    const { arrivalAt, costLine,
      OUTCOME, Yepi, answerLag, cap, endR, laserLate, laserYear, livable, lossesOf, namesShort, outcomeOf, ownStory, ppl, reportOn, rescueS, src,
      supplyS, thawAlive, yrs, yrsEn
    } = K;
    return [
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
        ru: s => s.supplyFailed ? `Снабжение сорвано. Корабль на орбите у форпоста; постоянного обеспечения у Ксилоны нет. Что стало с её людьми, этот архив не знает — отчёт о срыве ушёл в Кольцо. Погибли в пути: ${lossesOf(s, arrivalAt(s)).total + s.dead}. На форпосте за время работ: ${s.outpostDead || 0}.` : [`Смены форпоста и корабля работают вместе; инструкции правят обе стороны.`,
          s.relayOK ? 'Связь с Кольцом держится.' : 'Своей связи у форпоста так и нет: пакеты передаёт корабль.',
          s.capsOK ? 'Капсулы работают: смена снова отдыхает.' : 'Капсульной секции нет: отдых по очереди, как прежде.',
          s.shelter ? `${cap(ppl(s.shelterPeople || 90))} живут в кольцах корабля — корабль стал частью форпоста навсегда.` : '',
          `Погибли в пути: ${lossesOf(s, arrivalAt(s)).total + s.dead}. На форпосте за время работ: ${s.outpostDead || 0}.`, costLine(s, 'ru')].filter(Boolean).join(' '),
        en: s => s.supplyFailed ? `The supply mission failed. The ship is in orbit by the outpost; Xylona has no permanent support. What became of its people this archive does not know — the report of the failure has gone to the Ring. Died on the road: ${lossesOf(s, arrivalAt(s)).total + s.dead}. At the outpost during the work: ${s.outpostDead || 0}.` : [`The outpost's and the ship's shifts work together; both sides correct the procedures.`,
          s.relayOK ? 'The link with the Ring holds.' : 'The outpost still has no link of its own: the ship carries the packets.',
          s.capsOK ? 'The capsules work: the shift can rest again.' : 'There is no capsule section: rest goes by turns, as before.',
          s.shelter ? `${s.shelterPeople || 90} live in the ship's rings — the ship has become part of the outpost for good.` : '',
          `Died on the road: ${lossesOf(s, arrivalAt(s)).total + s.dead}. At the outpost during the work: ${s.outpostDead || 0}.`, costLine(s, 'en')].filter(Boolean).join(' ')
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

Погибли в пути: ${lossesOf(s, arrivalAt(s)).total + s.dead}. У цели из экипажа: ${s.deadHere}.${costLine(s, 'ru') ? ' ' + costLine(s, 'ru') : ''}`; },
        en: s => { const alive = thawAlive(s, Infinity), placed = s.housed ? alive : [], wait = s.housed ? [] : alive;
          return `${[placed.length ? `The home's register carries the names of Thaw's residents: ${namesShort(placed, 'en')}.` : "The home's register carries the Forty-First's crew.", wait.length ? `Those awaiting housing are listed separately: ${namesShort(wait, 'en')}.` : ''].filter(Boolean).join(' ')} The dead remain in their own record, with dates and causes: six before our voyage${s.thawDead ? `, ${s.thawDead} while help was coming and after` : ''}.

${!s.rescued ? 'The forty places remained a promise: the record holds forty names and dates.' : s.housed ? 'Before the meeting, forty places were a promise; afterwards, each place belonged to someone.' : `The forty places remain a promise: ${s.rescued} are waiting for housing.`}

Died on the road: ${lossesOf(s, arrivalAt(s)).total + s.dead}. Of the crew at the target: ${s.deadHere}.${costLine(s, 'en') ? ' ' + costLine(s, 'en') : ''}`; }
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
          `Погибли в пути: ${lossesOf(s, arrivalAt(s)).total + s.dead}. У цели: ${s.deadHere}${s.winterDead ? `, из них ${s.winterDead} — в первую зиму` : ''}.`,
          costLine(s, 'ru'),
          'Известие о новой экспедиции приходит в архив рядовой записью среди прочих: приняли к сведению и вернулись к своим делам.',
          laserLate(s) ? `\n\nЗапись, дописанная в году ${laserYear(s)}: лазерная экспедиция дошла до Тёмной звезды у ε Индейца и нашла корабль тридцать второй. В его журнале фраза целиком: «Вспоминали сегодня Землю. Она красивее всего, что мы видели за всю дорогу». Она была о доме.` : ''
        ].filter(Boolean).join(' '),
        en: s => [
          livable(s) ? (s.settle === 'orbit' ? 'The orbital settlement is a life going on of its own; below, fields under domes.' : 'The settlement is a life going on of its own.') : 'Home is a life going on of its own.',
          s.support === 'found' ? "The support ship stays in orbit as store and workshop; its seven live below." : '',
          s.site === 'poor' ? 'An outpost stands at the perimeter of the rich site.' : s.site === 'rich' ? 'The rich site is held: a perimeter and lights at night.' : '',
          ['beacon', 'return'].includes(s.home) ? (s.home === 'return' ? 'The return stage grows at the giant; the children born here will see Earth as adults.' : 'The beacon works without pause; the watch changes without leaving the rings.') : 'The first children born here have started school.',
          s.koraLast ? 'Kora, whose sleep is over, teaches the children: the school that was not passed on in flight is passed on here.' : 'Kora was woken one last time — to teach. The school that was not passed on in flight is passed on here.',
          `Died on the road: ${lossesOf(s, arrivalAt(s)).total + s.dead}. At the target: ${s.deadHere}${s.winterDead ? `, ${s.winterDead} of them in the first winter` : ''}.`,
          costLine(s, 'en'),
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
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = epilogue;
  else (root.M31Story = root.M31Story || {}).epilogue = epilogue;
})(typeof globalThis !== 'undefined' ? globalThis : this);
