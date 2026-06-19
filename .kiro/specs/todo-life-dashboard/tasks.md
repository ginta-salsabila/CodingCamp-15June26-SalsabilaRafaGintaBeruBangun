# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement a self-contained single-page dashboard in vanilla HTML/CSS/JS with no external dependencies. The app is organized into six IIFE modules inside `js/app.js` (Storage, Clock, Greeting, Timer, Task, Link), persists data to `localStorage`, and is fully testable with fast-check property-based tests.

## Tasks

- [x] 1. Set up project file structure and HTML scaffold
  - Create `index.html` with semantic markup for all four components: Clock/Greeting, Focus Timer, Task List, Quick Links
  - Create `css/style.css` as an empty stylesheet linked from `index.html`
  - Create `js/app.js` with the top-level IIFE wrapper and six commented module sections (Storage, Clock, Greeting, Timer, Task, Link) plus the `DOMContentLoaded` Init block
  - Add element IDs referenced by all modules: `#clock-time`, `#clock-date`, `#greeting`, `#timer-display`, `#timer-start`, `#timer-stop`, `#task-list`, `#link-list`
  - _Requirements: 11.1, 11.2, 12.1, 12.2, 12.5_

- [ ] 2. Implement Storage module
  - [ ] 2.1 Implement `Storage.get(key)` and `Storage.set(key, value)` with `KEYS` constants
    - `Storage.get` returns parsed JSON or `null`; catches `JSON.parse` errors
    - `Storage.set` wraps `localStorage.setItem` in `try/catch`; on `QuotaExceededError` calls `UI.showError` and returns `false`
    - Define `Storage.KEYS = { TASKS: 'dashboard_tasks', LINKS: 'dashboard_links' }`
    - _Requirements: 7.1, 7.2, 7.4, 10.1, 10.2, 12.4_


- [ ] 3. Implement Clock and Greeting modules
  - [ ] 3.1 Implement `Clock.formatTime(d)`, `Clock.formatDate(d)`, and `Clock.start()` / `Clock.tick()`
    - `formatTime` returns `"HH:MM:SS"` in 24-hour local time
    - `formatDate` returns `"Weekday, DD Month YYYY"` (e.g., `"Monday, 16 June 2025"`)
    - `Clock.start()` begins `setInterval(Clock.tick, 1000)`; `tick()` updates `#clock-time`, `#clock-date`, and calls `Greeting.update(hour)`
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ] 3.2 Implement `Greeting.getGreeting(hour)` and `Greeting.update(hour)`
    - `getGreeting` maps 0–23 to exactly one of the four greeting strings per the boundary table
    - `update` writes to `#greeting` only when the greeting string changes
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

  

- [x] 4. Implement Timer module
  - [x] 4.1 Implement `Timer.init()`, `Timer.updateDisplay()`, and `Timer.updateButtons()`
    - `init()` sets `remaining = 1500`, `state = 'idle'`, updates display and buttons
    - `updateDisplay()` formats `remaining` as `"MM:SS"` and writes to `#timer-display`
    - `updateButtons()` enables/disables Start and Stop per the button state table
    - _Requirements: 3.1, 3.7, 3.8_

  - [x] 4.2 Implement `Timer.start()`, `Timer.stop()`, `Timer.reset()`, `Timer.tick()`, `Timer.done()`, and `Timer.playBeep()`
    - `start()` transitions to `running`, creates `setInterval(Timer.tick, 1000)`
    - `stop()` transitions to `paused`, calls `clearInterval`
    - `reset()` calls `clearInterval`, clears done indicator, calls `Timer.init()`
    - `tick()` decrements `remaining` by 1; if `remaining === 0` calls `done()`
    - `done()` transitions to `done`, calls `clearInterval`, shows indicator, calls `playBeep()`
    - `playBeep()` uses Web Audio API inside `try/catch`; silently skips if `AudioContext` unavailable
    - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8_


- [ ] 6. Implement Task module
  - [ ] 6.1 Implement `Task.load()`, `Task.save()`, `Task.add(title)`, and `Task.render()` / `Task.renderEmpty()`
    - `load()` reads `Storage.get(KEYS.TASKS)` and initializes `tasks = result || []`
    - `save()` calls `Storage.set(KEYS.TASKS, tasks)` synchronously
    - `add(title)` trims input; if empty/whitespace-only does nothing; otherwise pushes a new task object `{ id, title, completed: false, createdAt: Date.now() }` using `crypto.randomUUID()` or fallback, calls `save()` and `render()`
    - `render()` rebuilds `#task-list` from `tasks[]` capped at 1,000 items; calls `renderEmpty()` when list is empty
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 7.1, 7.2, 7.3_


  - [ ] 6.4 Implement `Task.toggle(id)` and `Task.delete(id)`
    - `toggle(id)` finds task by id, flips `completed`, calls `save()` and `render()`
    - `delete(id)` splices task by id, calls `save()` and `render()`; triggers `renderEmpty()` if list is now empty
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_


  - [ ] 6.7 Implement `Task.enterEditMode(id)`, `Task.exitEditMode(id, save)`, and multi-edit guard
    - `enterEditMode` replaces title span with focused `<input>` pre-filled with current title
    - `exitEditMode` trims value; if non-empty calls `Task.edit(id, newTitle)`; if empty restores original title; always switches back to display mode
    - Multi-edit guard: opening a second editor commits the first (per requirement 5.3)
    - Wire Enter → commit, Escape → discard, blur → commit
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ] 6.8 Implement `Task.edit(id, newTitle)`
    - Finds task by id; if `newTitle.trim()` is non-empty updates `title`; otherwise leaves title unchanged; calls `save()` and `render()`
    - _Requirements: 5.4_



- [ ] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Link module
  - [ ] 8.1 Implement `Link.load()`, `Link.save()`, `Link.normalizeUrl(url)`, `Link.validateInputs()`, `Link.add(label, url)`, and `Link.render()` / `Link.renderEmpty()`
    - `load()` reads `Storage.get(KEYS.LINKS)` and initializes `links = result || []`
    - `save()` calls `Storage.set(KEYS.LINKS, links)` within 200 ms
    - `normalizeUrl(url)` prepends `"https://"` iff the URL doesn't already start with `http://` or `https://` (case-insensitive)
    - `validateInputs()` returns `{ labelError, urlError }` strings or `null`
    - `add(label, url)` validates, normalizes URL, pushes `{ id, label, url }`, calls `save()` and `render()`; on success clears inputs and returns focus to label field
    - `render()` rebuilds `#link-list`; each item is a `<a target="_blank" rel="noopener noreferrer">` button plus a Delete control; calls `renderEmpty()` when list is empty
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 9.1, 10.1, 10.3, 10.4_

  - [ ] 8.3 Implement `Link.delete(id)`
    - Splices link by id, calls `save()` and `render()`; triggers `renderEmpty()` if empty
    - _Requirements: 9.2, 9.3_

- [x] 9. Apply CSS styling
  - [x] 9.1 Write `css/style.css` — layout, typography, and component styles
    - Four-panel grid layout fitting 1280×720 with no vertical scrollbar
    - Minimum 14px font size for all text elements
    - WCAG 2.1 AA contrast ratios: 4.5:1 normal text, 3:1 large text
    - Strikethrough style for completed tasks (`text-decoration: line-through`)
    - Timer done indicator (color change or visible message)
    - Inline validation error styles for label/URL inputs
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 6.2, 6.3, 3.6_

- [ ] 10. Wire Init block and integrate all modules
  - [ ] 10.1 Implement the `DOMContentLoaded` Init block in `js/app.js`
    - Call `Task.load()` then `Task.render()`
    - Call `Link.load()` then `Link.render()`
    - Call `Clock.start()`
    - Call `Timer.init()`
    - Attach all event listeners: task Add button, task input Enter key, link Add button, timer Start/Stop/Reset buttons
    - _Requirements: 1.3, 3.1, 4.1, 7.2, 10.3, 12.1, 12.5_

  - [ ] 10.2 Add error handling: corrupt localStorage data and quota exceeded
    - In `Task.load()` and `Link.load()`, catch JSON parse errors; initialize with `[]` and display non-blocking warning banner
    - `Storage.set` already catches `QuotaExceededError`; wire `UI.showError` to render a dismissable banner
    - _Requirements: 7.4, 10.2, 10.5_

- [ ] 11. Set up fast-check test harness and write remaining unit tests
  - [ ] 11.1 Create `tests/app.test.js` and configure fast-check
    - Install or vendor fast-check (zero runtime dependency — import via CDN in test HTML or use a test runner like Node with `npm install --save-dev fast-check`)
    - Export module functions for testing (or expose via a `window.__test__` hook in `js/app.js` behind a test guard)
    - _Requirements: 12.1, 12.2_


- [ ] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- The design uses vanilla JavaScript throughout — no transpilation or build step required
- All property tests use fast-check and must run a minimum of 100 iterations each
- Each property test is tagged with a comment: `// Feature: todo-life-dashboard, Property N: <property_text>`
- Unit tests and property tests are complementary — both are expected for full coverage
- Checkpoints ensure incremental validation after each major module is complete
- The `crypto.randomUUID()` fallback (`Date.now() + Math.random()`) must be in place for older browser support

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["2.1"] },
    { "id": 1, "tasks": ["2.2", "2.3", "3.1", "3.2", "4.1"] },
    { "id": 2, "tasks": ["3.3", "4.2"] },
    { "id": 3, "tasks": ["4.3", "4.4", "6.1"] },
    { "id": 4, "tasks": ["6.2", "6.3", "6.4", "8.1"] },
    { "id": 5, "tasks": ["6.5", "6.6", "6.7", "8.2", "8.3"] },
    { "id": 6, "tasks": ["6.8", "9.1"] },
    { "id": 7, "tasks": ["6.9", "10.1"] },
    { "id": 8, "tasks": ["10.2", "11.1"] },
    { "id": 9, "tasks": ["11.2", "11.3"] }
  ]
}
```
