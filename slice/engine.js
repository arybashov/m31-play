/* М31 · срез. Чистый движок: без DOM, работает в браузере и в Node.
   Партия — детерминированный проход по сцене с записанными ответами игрока.
   Мир фиксирован контентом (§2.6 концепта); меняются только зависимые состояния. */
(function (root) {
  'use strict';

  function clone(x) { return JSON.parse(JSON.stringify(x)); }

  // tokens: массив ответов игрока по порядку — id варианта для решения,
  // 'go' для перемотки. Возвращает журнал и точку остановки.
  // ctx — правила партии: { riskVersion, riskSeed } (без ctx — версия 0, прежние правила; скрытое задано сидом заранее)
  function run(content, tokens, ctx) {
    const state = content.initialState(ctx);
    const log = [];
    let t = 0;
    let stop = null;
    for (const beat of content.beats) {
      if (beat.when && !beat.when(state)) continue;
      if (beat.kind === 'decision') {
        // варианты могут зависеть от состояния: карта целей, паспорт экспедиции. Строятся по публичному состоянию
        // (без скрытого, content.publicOf): доступность и тексты вариантов не раскрывают сид; исход — эффект на полном
        const view = () => content.publicOf ? content.publicOf(state) : state;
        const list = () => typeof beat.options === 'function' ? beat.options(view()) : beat.options;
        const answer = tokens[t];
        if (answer === undefined) { stop = { beat, options: list(), state: clone(state) }; break; }
        // параметрическое решение (паспорт): вариант собирается из id ответа, без перечисления всех сочетаний
        const option = beat.option ? beat.option(view(), answer) : list().find(o => o.id === answer);
        if (!option) throw Object.assign(new Error(`Нет варианта ${answer} в решении ${beat.id}`), { beat: beat.id, at: t });
        t++;
        state.choices[beat.id] = option.id;
        if (beat.rec) { const rc = beat.rec(view()); if (rc) (state.recs = state.recs || {})[beat.id] = rc.id; }
        if (option.effect) option.effect(state);
        log.push({ beat, option, state: clone(state) });
        if (option.ending) { stop = { ending: option, beat, state: clone(state) }; break; }
        continue;
      }
      if (beat.kind === 'skip' || beat.kind === 'cinematic') {
        if (tokens[t] === undefined) { stop = { beat, state: clone(state) }; break; }
        if (tokens[t] !== 'go') throw Object.assign(new Error(`Ожидалась перемотка в ${beat.id}`), { beat: beat.id, at: t });
        t++;
        if (beat.toYear !== undefined) state.year = typeof beat.toYear === 'function' ? beat.toYear(state) : beat.toYear;
        log.push({ beat, state: clone(state) });
        continue;
      }
      if (beat.effect) beat.effect(state);
      if (beat.year !== undefined) state.year = typeof beat.year === 'function' ? beat.year(state) : beat.year;   // годы дрейфа зависят от пути
      log.push({ beat, state: clone(state) });
      if (beat.kind === 'end') { stop = { end: true, beat, state: clone(state) }; break; }
    }
    if (t < tokens.length) throw Object.assign(new Error('Лишние ответы после остановки'), { extra: true, at: t });
    return { log, stop, state };
  }

  // Партия по стратегии — тот же проход, без повторного проигрывания: choose(beat, options, publicState) → id варианта.
  // Для калибровки цены ошибки (тысячи сидов). Возвращает состояние, точку остановки и ходы (их можно проиграть run).
  function play(content, ctx, choose) {
    const state = content.initialState(ctx), tokens = [];
    const view = () => content.publicOf ? content.publicOf(state) : state;
    for (const beat of content.beats) {
      if (beat.when && !beat.when(state)) continue;
      if (beat.kind === 'decision') {
        const options = typeof beat.options === 'function' ? beat.options(view()) : beat.options;
        const id = choose(beat, options, view());
        const option = beat.option ? beat.option(view(), id) : options.find(o => o.id === id);
        if (!option) throw Object.assign(new Error(`Стратегия: нет варианта ${id} в решении ${beat.id}`), { beat: beat.id });
        tokens.push(option.id); state.choices[beat.id] = option.id;
        if (beat.rec) { const rc = beat.rec(view()); if (rc) (state.recs = state.recs || {})[beat.id] = rc.id; }
        if (option.effect) option.effect(state);
        if (option.ending) return { state, tokens, stop: { ending: option, beat } };
        continue;
      }
      if (beat.kind === 'skip' || beat.kind === 'cinematic') {
        tokens.push('go');
        if (beat.toYear !== undefined) state.year = typeof beat.toYear === 'function' ? beat.toYear(state) : beat.toYear;
        continue;
      }
      if (beat.effect) beat.effect(state);
      if (beat.year !== undefined) state.year = typeof beat.year === 'function' ? beat.year(state) : beat.year;
      if (beat.kind === 'end') return { state, tokens, stop: { end: true, beat } };
    }
    return { state, tokens, stop: null };
  }

  // Текст сцены: строка или функция от снимка состояния.
  function text(value, lang, snapshot) {
    const v = value && value[lang];
    return typeof v === 'function' ? v(snapshot) : (v || '');
  }

  // Старое сохранение после того, как в сюжет добавили решения или раньше кончили ветку:
  // новые решения проходим вариантом по умолчанию (inserted: { id решения: вариант }), лишние ответы после конца отбрасываем.
  // Возвращает исправленные ответы или null, если сохранение не восстановить.
  function migrate(content, tokens, inserted, ctx) {
    let out = tokens.slice();
    for (let k = 0; k < 20; k++) {
      try { run(content, out, ctx); return out; } catch (e) {
        if (e.extra) out = out.slice(0, e.at);
        else if (e.beat !== undefined && inserted[e.beat] !== undefined && out[e.at] !== inserted[e.beat]) out.splice(e.at, 0, inserted[e.beat]);
        else return null;
      }
    }
    return null;
  }

  const api = { run, play, text, clone, migrate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.M31Engine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
