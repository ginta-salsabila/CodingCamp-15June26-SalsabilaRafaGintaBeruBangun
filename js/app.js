/**
 * app.js — To-Do Life Dashboard
 *
 * Single JavaScript file for all application logic (Requirement 12.1).
 * Vanilla JS only — no frameworks, libraries, or build tools (Requirement 12.2).
 * Works when opened via file:// protocol (Requirement 12.5).
 *
 * Structure:
 *   1. Storage Module
 *   2. Clock Module
 *   3. Greeting Module
 *   4. Timer Module
 *   5. Task Module
 *   6. Link Module
 *   7. Init (DOMContentLoaded)
 */

(function () {
  'use strict';

  /* ================================================================
     1. STORAGE MODULE
     Centralised localStorage helpers with error handling.
     - Storage.get(key)        → parsed JSON or null
     - Storage.set(key, value) → true on success, false on QuotaExceededError
     - Storage.KEYS            → { TASKS, LINKS }
     ================================================================ */
  const Storage = {
    KEYS: {
      TASKS:          'dashboard_tasks',
      LINKS:          'dashboard_links',
      THEME:          'dashboard_theme',
      USER_NAME:      'dashboard_username',
      TIMER_MINUTES:  'dashboard_timer_minutes',
      TASK_SORT:      'dashboard_task_sort',
    },

    get(key) {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return null;
        return JSON.parse(raw);
      } catch (_e) {
        return null;
      }
    },

    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (_e) {
        UI.showError('Storage full — your last change could not be saved.');
        return false;
      }
    },
  };


  /* ================================================================
     2. CLOCK MODULE
     Displays current time (HH:MM:SS) and date, drives Greeting updates.
     - Clock.start()        → begins setInterval(tick, 1000)
     - Clock.tick()         → reads Date(), updates DOM, calls Greeting.update()
     - Clock.formatTime(d)  → Date → "HH:MM:SS"
     - Clock.formatDate(d)  → Date → "Monday, 16 June 2025"
     ================================================================ */
  const Clock = {
    /** Starts the 1-second tick. Fires immediately then every second. */
    start() {
      Clock.tick();                    // show time instantly on load (Req 1.3)
      setInterval(Clock.tick, 1000);
    },

    /** Called every second — updates time, date, and greeting. */
    tick() {
      const now = new Date();
      document.getElementById('clock-time').textContent = Clock.formatTime(now);
      document.getElementById('clock-date').textContent = Clock.formatDate(now);
      Greeting.update(now.getHours());
    },

    /**
     * formatTime(d) — Req 1.1
     * Returns "HH:MM:SS" in 24-hour local time.
     */
    formatTime(d) {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return hh + ':' + mm + ':' + ss;
    },

    /**
     * formatDate(d) — Req 1.2
     * Returns e.g. "Monday, 16 June 2025".
     */
    formatDate(d) {
      const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
      const months = ['January','February','March','April','May','June',
                      'July','August','September','October','November','December'];
      return days[d.getDay()] + ', ' + d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    },
  };


  /* ================================================================
     3. GREETING MODULE
     Maps current hour to a greeting string; updates DOM only on change.
     - Greeting.update(hour)      → writes #greeting if string changed
     - Greeting.getGreeting(hour) → pure function: number (0–23) → string
     Boundary table:
       05–11 → "Good Morning"
       12–17 → "Good Afternoon"
       18–20 → "Good Evening"
       21–04 → "Good Night"
     ================================================================ */
  let _lastGreeting = '';
  let _userName = '';   // custom name, e.g. "Alex"

  const Greeting = {
    getGreeting(hour) {
      if (hour >= 5  && hour <= 11) return 'Good Morning';
      if (hour >= 12 && hour <= 17) return 'Good Afternoon';
      if (hour >= 18 && hour <= 20) return 'Good Evening';
      return 'Good Night';
    },

    /** Full text including name if set, e.g. "Good Morning, Alex" */
    getFullText(hour) {
      const base = Greeting.getGreeting(hour);
      return _userName ? base + ', ' + _userName : base;
    },

    update(hour) {
      const text = Greeting.getFullText(hour);
      if (text === _lastGreeting) return;
      _lastGreeting = text;
      document.getElementById('greeting').textContent = text;
    },

    /** Force a re-render even if hour hasn't changed (e.g. after name update). */
    forceUpdate() {
      _lastGreeting = '';
      Greeting.update(new Date().getHours());
    },

    /** Load saved name from storage. */
    loadName() {
      const saved = Storage.get(Storage.KEYS.USER_NAME);
      _userName = (typeof saved === 'string') ? saved : '';
    },

    /** Prompt the user to enter/change their name inline. */
    editName() {
      const el = document.getElementById('greeting');
      if (!el) return;
      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'greeting-name-input';
      input.value = _userName;
      input.maxLength = 40;
      input.placeholder = 'Enter your name…';
      input.setAttribute('aria-label', 'Your name for the greeting');

      function commit() {
        const val = input.value.trim();
        _userName = val;
        Storage.set(Storage.KEYS.USER_NAME, val);
        el.textContent = '';   // restore <p>
        el.appendChild(document.createTextNode(''));
        Greeting.forceUpdate();
        el.style.cursor = 'pointer';
      }

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { e.preventDefault(); commit(); }
        if (e.key === 'Escape') { e.preventDefault(); Greeting.forceUpdate(); }
      });
      input.addEventListener('blur', commit);

      el.textContent = '';
      el.appendChild(input);
      el.style.cursor = 'default';
      input.focus();
      input.select();
    },
  };


  /* ================================================================
     4. TIMER MODULE
     Manages Focus Timer state machine (idle → running → paused → done).
     - Timer.init()          → reset to 1500 s, state = idle
     - Timer.start()         → state = running, create setInterval
     - Timer.stop()          → state = paused, clearInterval
     - Timer.reset()         → clearInterval, state = idle, call init()
     - Timer.tick()          → decrement remaining; if 0 → done()
     - Timer.done()          → state = done, clearInterval, show indicator, playBeep()
     - Timer.updateDisplay() → remaining → "MM:SS" → #timer-display
     - Timer.updateButtons() → enable/disable Start & Stop per state table
     - Timer.playBeep()      → Web Audio API, silently skips if unavailable
     ================================================================ */
  let _timerMinutes = 25;  // configurable duration (default 25)
  let _remaining  = _timerMinutes * 60;
  let _timerState = 'idle';
  let _intervalId = null;

  const Timer = {
    /** Load saved duration from storage. */
    loadDuration() {
      const saved = Storage.get(Storage.KEYS.TIMER_MINUTES);
      if (typeof saved === 'number' && saved >= 1 && saved <= 120) {
        _timerMinutes = saved;
      }
      const input = document.getElementById('timer-minutes');
      if (input) input.value = _timerMinutes;
    },

    /** Set a new duration (in minutes), persist, and reset the timer. */
    setDuration(minutes) {
      const m = parseInt(minutes, 10);
      if (isNaN(m) || m < 1 || m > 120) return;
      _timerMinutes = m;
      Storage.set(Storage.KEYS.TIMER_MINUTES, m);
      Timer.reset();
    },

    init() {
      _remaining  = _timerMinutes * 60;
      _timerState = 'idle';
      this.updateDisplay();
      this.updateButtons();
    },

    updateDisplay() {
      const minutes = Math.floor(_remaining / 60);
      const seconds = _remaining % 60;
      const mm = String(minutes).padStart(2, '0');
      const ss = String(seconds).padStart(2, '0');
      document.getElementById('timer-display').textContent = mm + ':' + ss;
    },

    updateButtons() {
      const startBtn = document.getElementById('timer-start');
      const stopBtn  = document.getElementById('timer-stop');
      startBtn.disabled = !(_timerState === 'idle' || _timerState === 'paused');
      stopBtn.disabled  = !(_timerState === 'running');
    },

    start() {
      if (_timerState !== 'idle' && _timerState !== 'paused') return;
      _timerState = 'running';
      _intervalId = setInterval(Timer.tick, 1000);
      this.updateButtons();
    },

    stop() {
      if (_timerState !== 'running') return;
      _timerState = 'paused';
      clearInterval(_intervalId);
      _intervalId = null;
      this.updateButtons();
    },

    reset() {
      clearInterval(_intervalId);
      _intervalId = null;
      const indicator = document.getElementById('timer-done-indicator');
      if (indicator) indicator.hidden = true;
      const panel = document.querySelector('.panel--timer');
      if (panel) panel.classList.remove('timer--done');
      this.init();
    },

    tick() {
      _remaining -= 1;
      if (_remaining <= 0) {
        _remaining = 0;
        Timer.done();
      } else {
        Timer.updateDisplay();
      }
    },

    done() {
      _timerState = 'done';
      clearInterval(_intervalId);
      _intervalId = null;
      this.updateDisplay();
      this.updateButtons();
      const indicator = document.getElementById('timer-done-indicator');
      if (indicator) indicator.hidden = false;
      const panel = document.querySelector('.panel--timer');
      if (panel) panel.classList.add('timer--done');
      this.playBeep();
    },

    playBeep() {
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx  = new AudioCtx();
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.8);
      } catch (_e) { /* silent */ }
    },
  };


  /* ================================================================
     UI HELPERS — non-blocking error banner
     ================================================================ */
  const UI = {
    showError(msg) {
      const banner = document.getElementById('error-banner');
      if (!banner) return;
      banner.textContent = msg;
      banner.hidden = false;
      clearTimeout(UI._hideTimer);
      UI._hideTimer = setTimeout(function () { banner.hidden = true; }, 5000);
    },
    _hideTimer: null,
  };

  /* ================================================================
     THEME MODULE — light / dark mode
     ================================================================ */
  const Theme = {
    _current: 'dark',

    load() {
      const saved = Storage.get(Storage.KEYS.THEME);
      Theme._current = (saved === 'light') ? 'light' : 'dark';
      Theme._apply();
    },

    toggle() {
      Theme._current = (Theme._current === 'dark') ? 'light' : 'dark';
      Storage.set(Storage.KEYS.THEME, Theme._current);
      Theme._apply();
    },

    _apply() {
      document.documentElement.setAttribute('data-theme', Theme._current);
      const btn = document.getElementById('theme-toggle');
      if (btn) btn.textContent = (Theme._current === 'dark') ? '🌙' : '☀️';
    },
  };


  /* ================================================================
     5. TASK MODULE
     CRUD operations on tasks, inline editing, persistence, rendering.
     - Task.load()               → parse localStorage → tasks[], or []
     - Task.save()               → JSON.stringify(tasks) → localStorage
     - Task.add(title)           → trim, validate, push, save, render
     - Task.edit(id, newTitle)   → find by id, update title, save, render
     - Task.toggle(id)           → flip completed flag, save, render
     - Task.delete(id)           → splice from array, save, render
     - Task.enterEditMode(id)    → replace title span with focused input
     - Task.exitEditMode(id, save) → validate, update or restore, render
     - Task.render()             → rebuild #task-list DOM (cap 1000)
     - Task.renderEmpty()        → show empty-state message
     ================================================================ */
  let _tasks = [];
  let _editingId = null;
  let _taskSort = 'insertion';   // 'insertion' | 'active' | 'completed' | 'alpha'

  const Task = {
    _uid() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    load() {
      const data = Storage.get(Storage.KEYS.TASKS);
      if (Array.isArray(data)) {
        _tasks = data;
      } else {
        _tasks = [];
        if (data !== null) UI.showError('Task data was corrupt and has been reset.');
      }
    },

    save() {
      Storage.set(Storage.KEYS.TASKS, _tasks);
    },

    loadSort() {
      const saved = Storage.get(Storage.KEYS.TASK_SORT);
      const valid = ['insertion', 'active', 'completed', 'alpha'];
      if (valid.indexOf(saved) !== -1) _taskSort = saved;
      const sel = document.getElementById('task-sort');
      if (sel) sel.value = _taskSort;
    },

    setSort(value) {
      _taskSort = value;
      Storage.set(Storage.KEYS.TASK_SORT, value);
      Task.render();
    },

    /** Returns a sorted copy of _tasks for rendering. Never mutates _tasks. */
    _sorted() {
      const copy = _tasks.slice();
      if (_taskSort === 'active') {
        copy.sort(function (a, b) { return Number(a.completed) - Number(b.completed) || a.createdAt - b.createdAt; });
      } else if (_taskSort === 'completed') {
        copy.sort(function (a, b) { return Number(b.completed) - Number(a.completed) || a.createdAt - b.createdAt; });
      } else if (_taskSort === 'alpha') {
        copy.sort(function (a, b) { return a.title.localeCompare(b.title); });
      }
      // 'insertion' → original order
      return copy;
    },

    add(rawTitle) {
      const title = rawTitle.trim();
      if (!title) return false;

      // Duplicate prevention — case-insensitive
      const lower = title.toLowerCase();
      const isDupe = _tasks.some(function (t) { return t.title.toLowerCase() === lower; });
      if (isDupe) {
        UI.showError('Task "' + title + '" already exists.');
        return false;
      }

      _tasks.push({ id: Task._uid(), title: title, completed: false, createdAt: Date.now() });
      Task.save();
      Task.render();
      return true;
    },

    edit(id, newTitle) {
      const trimmed = newTitle.trim();
      const task = _tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      if (trimmed) {
        // Duplicate check — allow keeping the same title
        const lower = trimmed.toLowerCase();
        const isDupe = _tasks.some(function (t) { return t.id !== id && t.title.toLowerCase() === lower; });
        if (isDupe) {
          UI.showError('A task named "' + trimmed + '" already exists.');
          Task.render();
          return;
        }
        task.title = trimmed;
      }
      Task.save();
      Task.render();
    },

    toggle(id) {
      const task = _tasks.find(function (t) { return t.id === id; });
      if (!task) return;
      task.completed = !task.completed;
      Task.save();
      Task.render();
    },

    delete(id) {
      _tasks = _tasks.filter(function (t) { return t.id !== id; });
      Task.save();
      Task.render();
    },

    enterEditMode(id) {
      if (_editingId && _editingId !== id) {
        const oldInput = document.querySelector('.task-edit-input[data-id="' + _editingId + '"]');
        if (oldInput) Task.exitEditMode(_editingId, true);
      }
      _editingId = id;
      const span = document.querySelector('.task-title[data-id="' + id + '"]');
      if (!span) return;
      const task = _tasks.find(function (t) { return t.id === id; });
      if (!task) return;

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 'task-edit-input';
      input.dataset.id = id;
      input.value = task.title;
      input.maxLength = 255;

      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter')  { e.preventDefault(); Task.exitEditMode(id, true);  }
        if (e.key === 'Escape') { e.preventDefault(); Task.exitEditMode(id, false); }
      });
      input.addEventListener('blur', function () {
        setTimeout(function () { if (_editingId === id) Task.exitEditMode(id, true); }, 100);
      });

      span.replaceWith(input);
      input.focus();
      input.select();
    },

    exitEditMode(id, save) {
      if (_editingId === id) _editingId = null;
      const input = document.querySelector('.task-edit-input[data-id="' + id + '"]');
      if (!input) return;
      if (save) {
        Task.edit(id, input.value);
      } else {
        Task.render();
      }
    },

    render() {
      const list = document.getElementById('task-list');
      if (!list) return;
      list.innerHTML = '';

      if (_tasks.length === 0) { Task.renderEmpty(list); return; }

      const visible = Task._sorted().slice(0, 1000);
      visible.forEach(function (task) {
        const li = document.createElement('li');
        li.className = 'task-item' + (task.completed ? ' task-item--completed' : '');
        li.dataset.id = task.id;

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'task-checkbox';
        cb.checked = task.completed;
        cb.setAttribute('aria-label', 'Mark "' + task.title + '" complete');
        cb.addEventListener('change', function () { Task.toggle(task.id); });

        const span = document.createElement('span');
        span.className = 'task-title';
        span.dataset.id = task.id;
        span.textContent = task.title;

        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'task-edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.setAttribute('aria-label', 'Edit task');
        editBtn.addEventListener('click', function () { Task.enterEditMode(task.id); });

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'task-delete-btn';
        delBtn.textContent = '✕';
        delBtn.setAttribute('aria-label', 'Delete task');
        delBtn.addEventListener('click', function () { Task.delete(task.id); });

        li.appendChild(cb);
        li.appendChild(span);
        li.appendChild(editBtn);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    },

    renderEmpty(list) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No tasks yet';
      list.appendChild(li);
    },
  };


  /* ================================================================
     6. LINK MODULE
     CRUD for quick links, URL normalization, persistence, rendering.
     - Link.load()             → parse localStorage → links[], or []
     - Link.save()             → JSON.stringify(links) → localStorage (≤200 ms)
     - Link.add(label, url)    → validate, normalize URL, push, save, render
     - Link.delete(id)         → splice, save, render
     - Link.normalizeUrl(url)  → prepend "https://" if no http(s):// prefix
     - Link.render()           → rebuild #link-list DOM
     - Link.renderEmpty()      → show empty-state message
     - Link.validateInputs()   → return { labelError, urlError } or null
     ================================================================ */
  let _links = [];   // in-memory link array

  const Link = {
    _uid() {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
      return Date.now().toString(36) + Math.random().toString(36).slice(2);
    },

    load() {
      const data = Storage.get(Storage.KEYS.LINKS);
      if (Array.isArray(data)) {
        _links = data;
      } else {
        _links = [];
        if (data !== null) UI.showError('Link data was corrupt and has been reset.');
      }
    },

    save() {
      Storage.set(Storage.KEYS.LINKS, _links);
    },

    normalizeUrl(url) {
      if (/^https?:\/\//i.test(url)) return url;
      return 'https://' + url;
    },

    validateInputs(label, url) {
      const errors = {};
      if (!label.trim()) errors.labelError = 'Label is required.';
      if (!url.trim())   errors.urlError   = 'URL is required.';
      return Object.keys(errors).length ? errors : null;
    },

    add(rawLabel, rawUrl) {
      const label = rawLabel.trim();
      const url   = rawUrl.trim();
      const errors = Link.validateInputs(label, url);

      // Clear previous errors
      const labelErr = document.getElementById('link-label-error');
      const urlErr   = document.getElementById('link-url-error');
      if (labelErr) labelErr.textContent = '';
      if (urlErr)   urlErr.textContent   = '';

      if (errors) {
        if (errors.labelError && labelErr) labelErr.textContent = errors.labelError;
        if (errors.urlError   && urlErr)   urlErr.textContent   = errors.urlError;
        return;
      }

      _links.push({ id: Link._uid(), label: label, url: Link.normalizeUrl(url) });
      Link.save();
      Link.render();

      // Clear inputs and refocus label (Req 8.7)
      document.getElementById('link-label').value = '';
      document.getElementById('link-url').value   = '';
      document.getElementById('link-label').focus();
    },

    delete(id) {
      _links = _links.filter(function (l) { return l.id !== id; });
      Link.save();
      Link.render();
    },

    render() {
      const list = document.getElementById('link-list');
      if (!list) return;
      list.innerHTML = '';

      if (_links.length === 0) {
        Link.renderEmpty(list);
        return;
      }

      _links.forEach(function (link) {
        const li = document.createElement('li');
        li.className = 'link-item';

        const a = document.createElement('a');
        a.className = 'link-btn';
        a.href = link.url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = link.label;

        const delBtn = document.createElement('button');
        delBtn.type = 'button';
        delBtn.className = 'link-delete-btn';
        delBtn.textContent = '✕';
        delBtn.setAttribute('aria-label', 'Delete link');
        delBtn.addEventListener('click', function () { Link.delete(link.id); });

        li.appendChild(a);
        li.appendChild(delBtn);
        list.appendChild(li);
      });
    },

    renderEmpty(list) {
      const li = document.createElement('li');
      li.className = 'empty-state';
      li.textContent = 'No links saved yet';
      list.appendChild(li);
    },
  };


  /* ================================================================
     7. INIT — DOMContentLoaded Bootstrap
     Called once the DOM is ready. Loads persisted data, starts modules,
     and attaches all event listeners.
     ================================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    // Theme
    Theme.load();
    document.getElementById('theme-toggle').addEventListener('click', function () { Theme.toggle(); });

    // Greeting name
    Greeting.loadName();
    Clock.start();
    document.getElementById('greeting').addEventListener('click', function (e) {
      // Don't open edit mode if an input is already active inside it
      if (e.target.tagName !== 'INPUT') Greeting.editName();
    });
    document.getElementById('greeting').style.cursor = 'pointer';

    // Timer
    Timer.loadDuration();
    Timer.init();
    document.getElementById('timer-start').addEventListener('click', function () { Timer.start(); });
    document.getElementById('timer-stop').addEventListener('click',  function () { Timer.stop();  });
    document.getElementById('timer-reset').addEventListener('click', function () { Timer.reset(); });
    document.getElementById('timer-set').addEventListener('click', function () {
      Timer.setDuration(document.getElementById('timer-minutes').value);
    });
    document.getElementById('timer-minutes').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') Timer.setDuration(e.target.value);
    });

    // Tasks
    Task.load();
    Task.loadSort();
    Task.render();

    const taskInput = document.getElementById('task-input');
    function submitTask() {
      if (Task.add(taskInput.value)) taskInput.value = '';
      else taskInput.focus();
    }
    document.getElementById('task-add').addEventListener('click', submitTask);
    taskInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { e.preventDefault(); submitTask(); }
    });
    document.getElementById('task-sort').addEventListener('change', function (e) {
      Task.setSort(e.target.value);
    });

    // Quick Links — inject error spans
    const labelInput = document.getElementById('link-label');
    const urlInput   = document.getElementById('link-url');
    const labelErr   = document.createElement('span');
    labelErr.id = 'link-label-error';
    labelErr.className = 'field-error';
    labelErr.setAttribute('aria-live', 'polite');
    labelInput.after(labelErr);
    const urlErr = document.createElement('span');
    urlErr.id = 'link-url-error';
    urlErr.className = 'field-error';
    urlErr.setAttribute('aria-live', 'polite');
    urlInput.after(urlErr);

    Link.load();
    Link.render();
    document.getElementById('link-add').addEventListener('click', function () {
      Link.add(labelInput.value, urlInput.value);
    });
  });

}());
