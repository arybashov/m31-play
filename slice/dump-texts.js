// Выгрузка текстов партии для вычитки (еженедельная задача «Вычитка текстов»): несколько партий по маршрутам и стратегиям
// калибровки — всё, что видит игрок, уже с подставленными числами, RU и EN рядом:
// - записи журнала: заголовки, места, тексты, ведомости, запись выбранного варианта (снимок после ответа);
// - карточки решений — как в игре, по публичному снимку остановки до ответа: заголовок, контекст, варианты, «известно»,
//   рекомендация Совета с допущением, строка «После»;
// - подписи сцен, заголовки происшествий, итог партии (сводка происшествий, оснащение в пути, мир после, заголовок финала).
// Одинаковые тексты одного места — один раз (с числом повторов); у мест с числами — не больше VARIANTS вариантов.
// node dump-texts.js <файл.md> [сидов на маршрут]
'use strict';
const fs = require('fs');
const E = require('./engine.js'), C = require('./content.js'), { strategy } = require('./calibrate.js');

const ROUTES = [['contact', 'Epsilon Indi'], ['contact', 'Gl 338'], ['supply', "Barnard's Star"], ['rescue', 'Ross 128']];
const KINDS = ['council', 'careful', 'risky'];
const LANGS = ['ru', 'en'];
const out = process.argv[2], N = +process.argv[3] || 2;
if (!out) { console.error('node dump-texts.js <файл.md> [сидов]'); process.exit(1); }

const T = (v, lang, st) => { try { return E.text(v, lang, st); } catch (e) { return `[ошибка текста: ${e.message}]`; } };
const safe = f => { try { return f(); } catch (e) { return `[ошибка текста: ${e.message}]`; } };
const list = xs => (xs || []).map(x => '• ' + x).join('\n');

// ключ: место + текст RU → запись. Семейство — место без чисел (отчёты вахты, события, карта целей): не больше
// VARIANTS разных текстов на семейство; лишние запоминаются (повтор не считается новым вариантом), но не выводятся
const seen = new Map(), fam = new Map(), VARIANTS = 4;
function add(where, kind, ru, en) {
  if (!ru && !en) return;
  const k = `${where}\u0000${ru}`;
  if (seen.has(k)) { seen.get(k).n++; return; }
  const fk = where.replace(/\d+/g, '#'), f = fam.get(fk) || { n: 0, first: null };
  fam.set(fk, f); f.n++;
  const e = { kind, where, ru, en, n: 1, hide: f.n > VARIANTS };
  if (e.hide) f.first.more = f.n - VARIANTS; else if (!f.first) f.first = e;
  seen.set(k, e);
}
const both = (where, kind, v, st) => add(where, kind, T(v, 'ru', st), T(v, 'en', st));
const both2 = (where, kind, f) => add(where, kind, safe(() => f('ru')), safe(() => f('en')));

for (const [id, sc] of Object.entries(C.scenes || {})) if (sc && sc.label) both(`scene.${id}`, 'scene', sc.label);

// карточка решения в момент остановки (как stopHtml в game.js)
function card(b, options, pub) {
  const w = b.id;
  both(`${w}.title`, 'decision', b.title, pub);
  both(`${w}.context`, 'decision', b.context, pub);
  const rec = safe(() => b.rec ? b.rec(pub) : null);
  if (rec && typeof rec === 'object') { both(`${w}/${rec.id}.rec.why`, 'rec', rec.why, pub); if (rec.assume) both(`${w}/${rec.id}.rec.assume`, 'rec', rec.assume, pub); }
  for (const o of options || []) {
    both(`${w}/${o.id}.label`, 'option', o.label, pub);
    both2(`${w}/${o.id}.known`, 'option', lang => list(typeof o.known[lang] === 'function' ? o.known[lang](pub) : o.known[lang]));
    if (pub.eq && C.gaugeDiff) both2(`${w}/${o.id}.after`, 'after', lang => {      // «После»: цена варианта на публичной копии
      const next = E.clone(pub); next.preview = true; next.choices[b.id] = o.id;
      if (o.cost) o.cost(next); else if (o.effect) o.effect(next);
      const d = C.gaugeDiff(pub, next, lang);
      return d.length ? `${C.ui[lang].after}: ${d.join(' · ')}` : C.ui[lang].noChange;
    });
  }
}

let games = 0;
for (const [mission, target] of ROUTES) for (const kind of KINDS) for (let i = 0; i < N; i++) {
  const ctx = { riskVersion: 5, riskSeed: `texts:${mission}:${target}:${i}` }, strat = strategy(kind, mission, target);
  let tokens;
  try {
    tokens = E.play(C, ctx, (b, options, pub) => { card(b, options, pub); return strat(b, options, pub); }).tokens;
  } catch (e) { add(`error.${mission}.${kind}.${i}`, 'error', String(e.message), ''); continue; }
  const r = E.run(C, tokens, ctx); games++;
  for (const it of r.log) {
    const b = it.beat, st = it.state;
    for (const f of ['title', 'place', 'author', 'label', 'act', 'text', 'details']) if (b[f] && !(b.kind === 'decision' && f === 'title')) both(`${b.id}.${f}`, b.kind, b[f], st);
    if (b.kind === 'decision' && it.option) both(`${b.id}/${it.option.id}.record`, 'record', it.option.record, st);
  }
  for (const inc of r.state.incidents || []) both2(`headline.${inc.kind}`, 'headline', lang => Object.values(C.incidentHeadline(inc, lang)).filter(x => typeof x === 'string').join('\n'));
  const s = r.stop;
  if (s && s.ending) both(`${s.beat.id}/ending`, 'ending', s.ending.record, s.state);
  if (s && s.end) {
    const st = s.state;
    both2(`end.${s.beat.id}.headline`, 'end', lang => Object.values(C.endHeadline(st, s.beat.id, lang)).filter(x => typeof x === 'string').join('\n'));
    both2('end.incidents', 'end', lang => list(C.incidentLines(st, lang)));
    if (st.eq) both2('end.equipment', 'end', lang => { const q = C.eq.eqSummary(st, lang, new Set(r.log.map(x => x.beat.id)));
      return [list(q.help), list(q.idle), list(q.miss), q.cost || ''].filter(Boolean).join('\n\n'); });
    if (st.target) both2('end.world', 'end', lang => list(C.worldLines(C.applyEvents({ passTug: true }, [C.expeditionEvent(st, 'texts')]), lang)));
  }
}

const shown = [...seen.values()].filter(e => !e.hide);
const lines = [`# Тексты партий для вычитки`, '', `Партий: ${games} (маршруты: ${ROUTES.map(r => r.join(' → ')).join('; ')}; стратегии: ${KINDS.join(', ')}; сидов: ${N}). Текстов в выгрузке: ${shown.length} (всего разных: ${seen.size}).`, ''];
for (const e of shown) lines.push(`## ${e.where} · ${e.kind}${e.n > 1 ? ` · ×${e.n}` : ''}${e.more ? ` · ещё вариантов этого места: ${e.more}` : ''}`, '', '**RU**', '', e.ru || '—', '', '**EN**', '', e.en || '—', '');
fs.writeFileSync(out, lines.join('\n'), 'utf8');
console.log(`партий ${games}, текстов ${shown.length} (разных ${seen.size}) → ${out}`);
