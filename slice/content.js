/* М31 · срез: заявочный план, пролог и Акт I (годы 0–8).
   v2 по ревью Codex (DOC/Ревью Codex — драматургия и срез.md): пролог — сцена без ложного выбора,
   первое действие — сопоставить записи; Кору и Дана игрок видит до распоряжения их временем;
   очередь даёт отдачу у облака; цены — в единицах бюджета; передача полномочий — действием.
   v3: выбор цели в секторе и три ветки Акта I между общими узлами (концепт §7.8).
   Текст сразу на двух языках. Числа ресурсов — значения прототипа, не паспорт корабля. */
(function (root) {
  // Части content.js (core/*.js, по системам): каждая — фабрика; создаются по порядку (при загрузке нужны только части
  // выше), затем связываются — имена друг друга получают через __link. Здесь — сборка сцен из story/*.js и экспорт.
  const PARTS = ['base', 'outfit', 'wear', 'wearCards', 'notes', 'ledger', 'rescue', 'dossier', 'world', 'council', 'relief'];
  const node = typeof module !== 'undefined' && module.exports;
  const __core = {}, made = PARTS.map(k => { const r = (node ? require('./core/' + k + '.js') : root.M31Core[k])(__core); Object.assign(__core, r.names); return r; });
  made.forEach(r => r.link());
  const {
    BLUEPRINT, CAST, CLOUD, DV, EPOCH3, EV, GREET_LAST, INSERTED, LOOP, M, NEWS, OUTCOME, OUTCOME_R, PREP, R, RESCUE, RISK, SH, SHELTER_R,
    SOS_AT_cargo, STATUS, STORM, STREAM, SUPPLY, THAW0, THAW_LOSS, W, WATCH_SOS, Y, Y3, Y4, YD, Yepi, agendaOf, agroLost, aliveOf, answerLag,
    applyEvents, archiveLines, archiveShort, arriveView, arriveX, awakeOf, bad, bandBreach, bandHit, beats, brake, brakeApply, brakeSettle,
    bulletinTitle, burnDays, busCheck, busRecord, busRestart, busSplit, calPick, canEvade, cap, cargoConnect, cloudBand, collectorCracked, colonyTie,
    connectNeed, connectOptions, contactRun, coolerName, councilText, crewName, crewOf, crewWord, darkAt, days, daysTo, dd, deadCauses, deliverOptions,
    discText, dockApply, dutchmanEnd, dvPct, earlyTurnQuote, edgeLogV5, edgeMonths, edgeOut, endHeadline, endR, energyOK, epoch3, eqApi, eqOf,
    expeditionEvent, f1, f2, fb, gaugeDiff, gauges, getWorld, goalOf, greetR, hasIR, hasScouts, hashU32, heatAgo, hidden, homeOptionsR, housedOf,
    incident, incidentHeadline, incidentLines, initialState, isoDays, jobsLine, kms, lag, laserLate, laserYear, lastCall, legacyLines, livable, loopAt,
    loopCommon, lossFuture, lossesOf, matReserve, missionCheck, missionComplete, missionMarks, months, nameAt, namesShort, navDeparture,
    newsCandidates, newsPlan, newsText, nm, nmD, nmG, opNormal, opStart, opYear, outcomeOf, ownStory, passportMetrics, passportOptions, passportParse,
    pct, pctFrom, people, planText, planWho, plural, powerOK, ppl, probeOK, probeTimes, probesLeft, publicOf, reader, regHands, relief, reliefButton,
    reliefEvents, reportOn, reqOf, requestOption, rescueLegacy, rescueOptions, rescueS, riskLine, roadDead, scenes, sectionHolds, sectionLine,
    setWorld, shieldGaugeV5, shieldInspect, shipHealth, sim, siteRecord, skipTo, sleepersAt2, sosDrift, sosEnd, sosKnown, sosOption, src, stageOff,
    stagePass, stageYears, stayOption, storeLine, storeNow, storeR, stormU, streamAt, streamDv, streamLate, streamLogV5, streamOptions, streamPlan,
    streamTimes, supplyS, supplySrc, supportPlan, supportWorld, taskLabel, taskReportText, taskResult, thawAdvance, thawAlive, thawAt, thawDeadline,
    thawLag, thawN, thawName, thawNames, thinWatch, turnOption, ui, urgentOf, vAt, validIncident, warnAt, wearDecision, wearRespond, win, windowLine,
    worldLines, yrs, yrsEn, yrsG
  } = __core;

  // ---- сцены по актам (story/*.js): фабрика акта получает общие имена этого файла — собираются здесь, когда объявлено всё
  // (сцены вызывают помощников при сборке: skipTo, sosEnd …); порядок актов — порядок сюжета
  const STORY = ['plan', 'prologue', 'act1', 'act2', 'act3', 'act4', 'epilogue'];
  const Story = typeof module !== 'undefined' && module.exports ? Object.fromEntries(STORY.map(k => [k, require('./story/' + k + '.js')])) : root.M31Story;
  const K = {
    BLUEPRINT, CLOUD, DV, EPOCH3, GREET_LAST, LOOP, M, NEWS, OUTCOME, PREP, R, RESCUE, SHELTER_R, SOS_AT_cargo, STORM, STREAM, SUPPLY, THAW0,
    THAW_LOSS, W, WATCH_SOS, Y, Y3, Y4, YD, Yepi, agendaOf, agroLost, aliveOf, answerLag, arriveX, bad, bandBreach, bandHit, brake, brakeApply,
    brakeSettle, bulletinTitle, burnDays, busCheck, busRecord, busRestart, busSplit, canEvade, cap, cargoConnect, cloudBand, collectorCracked,
    colonyTie, connectNeed, connectOptions, contactRun, coolerName, councilText, crewOf, crewWord, darkAt, days, daysTo, dd, deadCauses,
    deliverOptions, discText, dockApply, dutchmanEnd, dvPct, edgeLogV5, edgeMonths, edgeOut, endR, energyOK, eqOf, f1, f2, fb, goalOf, greetR, hasIR,
    hasScouts, heatAgo, hidden, homeOptionsR, housedOf, incident, isoDays, kms, lag, laserLate, laserYear, lastCall, livable, loopAt, loopCommon,
    lossesOf, matReserve, months, nameAt, namesShort, newsCandidates, newsPlan, newsText, nm, nmD, nmG, opNormal, opStart, opYear, outcomeOf, ownStory,
    passportOptions, passportParse, pct, pctFrom, planText, planWho, plural, powerOK, ppl, probeOK, probeTimes, probesLeft, reader, regHands, reportOn,
    reqOf, requestOption, rescueLegacy, rescueOptions, rescueS, riskLine, roadDead, sectionHolds, sectionLine, shieldGaugeV5, siteRecord, skipTo,
    sleepersAt2, sosDrift, sosEnd, sosKnown, sosOption, src, stageOff, stagePass, stageYears, stayOption, storeLine, storeNow, storeR, stormU,
    streamAt, streamDv, streamLate, streamLogV5, streamOptions, streamPlan, streamTimes, supplyS, supplySrc, taskLabel, taskReportText, taskResult,
    thawAdvance, thawAlive, thawDeadline, thawLag, thawN, thawNames, thinWatch, turnOption, urgentOf, vAt, warnAt, win, windowLine, yrs, yrsEn, yrsG
  };
  for (const k of STORY) beats.push(...Story[k](K));
  const content = { beats, initialState, ui, scenes, supportPlan, supportWorld, awakeOf, aliveOf, wearObserve: s => s.wear ? W.observe(s.wear) : null, shipHealth, calPick, wearHooks: { respond: (s, rec) => wearRespond(s, rec), decision: (s, ev) => wearDecision(s, ev), jobsLine: (s, l) => jobsLine(s, l) }, events: EV, navDeparture, epoch3, lossFuture, lossesOf, requests: R, reqOf, missionComplete, earlyTurnQuote, newsPlan, people, mission: M, missionCheck, sim, shield: SH, shieldInspect, endHeadline, incidentHeadline, edgeOut, streamTimes, streamPlan, thawN, arriveView, eq: eqApi, rescueV3: { thawAlive, thawAt, thawName, RESCUE }, missionMarks, RISK, hidden, hashU32, publicOf, incidentLines, crewName, CAST, relief, reliefButton, setWorld, getWorld, OUTCOME_R,
    reliefEvents, applyEvents, validIncident, INSERTED, gauges, gaugeDiff, passportMetrics, expeditionEvent, worldLines, archiveShort, archiveLines, legacyLines, STATUS };
  if (typeof module !== 'undefined' && module.exports) module.exports = content;
  else root.M31Content = content;
})(typeof globalThis !== 'undefined' ? globalThis : this);
