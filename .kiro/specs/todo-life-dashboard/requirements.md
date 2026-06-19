# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application built with vanilla HTML, CSS, and JavaScript. It serves as a personal productivity hub displayed in the browser, combining a contextual greeting, a focus timer, a persistent to-do list, and a customizable quick links panel. All user data is stored locally using the browser's Local Storage API — no backend or signup required.

The app must work as a standalone web page or browser extension in modern browsers (Chrome, Firefox, Edge, Safari). The interface must be clean, minimal, and responsive with no noticeable lag.

---

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **App**: The Dashboard application.
- **Clock**: The UI component that displays the current time and date.
- **Greeting**: The UI component that displays a time-of-day salutation.
- **Focus_Timer**: The UI component that manages a 25-minute countdown session.
- **Task_List**: The UI component that manages the user's to-do items.
- **Task**: A single to-do item with a title, a completion state, and a unique identifier.
- **Quick_Links**: The UI component that manages user-defined shortcut URLs.
- **Link**: A single quick-link entry with a label and a URL.
- **Local_Storage**: The browser's `localStorage` API used for client-side persistence.
- **Modern_Browser**: Chrome, Firefox, Edge, or Safari in their current stable release.

---

## Requirements

### Requirement 1: Display Current Time and Date

**User Story:** As a user, I want to see the current time and date on the dashboard, so that I always know what time it is without leaving the page.

#### Acceptance Criteria

1. THE Clock SHALL display the current time in HH:MM:SS 24-hour format using the user's local system time, updated every second.
2. THE Clock SHALL display the current date including the full day of the week, day number, full month name, and four-digit year (e.g., "Monday, 16 June 2025").
3. WHEN the page loads, THE Clock SHALL begin updating immediately — within one second — without requiring user interaction.
4. IF the system clock crosses midnight while the page is open, THEN THE Clock SHALL update the displayed date to the new day without requiring a page reload.

---

### Requirement 2: Contextual Greeting

**User Story:** As a user, I want to see a greeting that reflects the time of day, so that the dashboard feels personal and context-aware.

#### Acceptance Criteria

1. WHEN the current local hour is between 05:00 (inclusive) and 11:59 (inclusive), THE Greeting SHALL display "Good Morning".
2. WHEN the current local hour is between 12:00 (inclusive) and 17:59 (inclusive), THE Greeting SHALL display "Good Afternoon".
3. WHEN the current local hour is between 18:00 (inclusive) and 20:59 (inclusive), THE Greeting SHALL display "Good Evening".
4. WHEN the current local hour is between 21:00 (inclusive) and 04:59 (inclusive, spanning midnight), THE Greeting SHALL display "Good Night".
5. WHEN the local time crosses a greeting boundary while the page is open, THE Greeting SHALL update to the new greeting text within one second without requiring a page reload.
6. THE Greeting SHALL display exactly one greeting string at a time; no two greeting strings SHALL be visible simultaneously.

---

### Requirement 3: Focus Timer

**User Story:** As a user, I want a 25-minute countdown timer with Start, Stop, and Reset controls, so that I can use the Pomodoro technique to manage focused work sessions.

#### Acceptance Criteria

1. WHEN the page loads, THE Focus_Timer SHALL display a countdown initialized to 25:00 (twenty-five minutes and zero seconds).
2. WHEN the user activates the Start control while the Focus_Timer is in the idle or paused state, THE Focus_Timer SHALL begin counting down one second at a time using the browser's setInterval or equivalent mechanism.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second in MM:SS format.
4. WHEN the user activates the Stop control while the Focus_Timer is counting down, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the user activates the Reset control in any state, THE Focus_Timer SHALL cancel any active interval, clear any session-end notification, and reset the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop the interval automatically, display a visible on-screen indicator (e.g., a message or color change), and play an audible beep using the Web Audio API or an audio element.
7. WHILE the Focus_Timer is counting down or the countdown has reached 00:00, THE Focus_Timer SHALL disable the Start control to prevent duplicate intervals.
8. WHILE the Focus_Timer is in the idle, paused, or exhausted (00:00) state, THE Focus_Timer SHALL disable the Stop control.

---

### Requirement 4: To-Do List — Add and Display Tasks

**User Story:** As a user, I want to add new tasks to a list, so that I can keep track of things I need to do.

#### Acceptance Criteria

1. THE Task_List SHALL provide a text input field accepting task titles up to 255 characters and an Add button.
2. WHEN the user submits a non-empty, non-whitespace-only task title via the Add button or the Enter key, THE Task_List SHALL trim leading and trailing whitespace, append the new Task to the end of the list, and clear the input field.
3. IF the user attempts to submit an empty or whitespace-only task title, THEN THE Task_List SHALL not add a Task, SHALL retain the current input field content, and SHALL return focus to the input field.
4. WHEN a Task is added, THE Task_List SHALL assign the Task a unique identifier (e.g., a timestamp or UUID) that is stored with the Task and remains unchanged across page reloads, edits, and completion state changes.
5. THE Task_List SHALL display all stored Tasks in insertion order (oldest first).
6. WHEN the Task_List contains no Tasks, THE Task_List SHALL display an empty-state message (e.g., "No tasks yet") in place of the list.
7. THE Task_List SHALL not enforce a maximum number of Tasks, but SHALL cap rendering at 1,000 visible Tasks to maintain UI performance.

---

### Requirement 5: To-Do List — Edit Tasks

**User Story:** As a user, I want to edit existing task titles inline, so that I can correct or update tasks without deleting and re-adding them.

#### Acceptance Criteria

1. THE Task_List SHALL provide a dedicated Edit button or icon for each Task, visible in the Task's display row.
2. WHEN the user activates the Edit control for a Task, THE Task_List SHALL replace the Task's title text with an inline text input field pre-filled with the current title and focused automatically.
3. IF the user activates the Edit control for a second Task while another Task is already in edit mode, THEN THE Task_List SHALL save any pending changes to the first Task (applying the same empty-value rule as criterion 4) and switch the second Task into edit mode.
4. WHEN the user confirms the edit by pressing Enter or activating a Save control, THE Task_List SHALL trim the input value; IF the trimmed value is non-empty, THEN THE Task_List SHALL update the Task title and return to display mode; IF the trimmed value is empty or whitespace-only, THEN THE Task_List SHALL discard the change and restore the original title in display mode.
5. WHEN the user cancels the edit by pressing Escape or activating a Cancel control, THE Task_List SHALL discard any unsaved changes and return the Task to display mode with the original title unchanged.

---

### Requirement 6: To-Do List — Complete and Delete Tasks

**User Story:** As a user, I want to mark tasks as done and delete tasks I no longer need, so that I can track progress and keep my list tidy.

#### Acceptance Criteria

1. THE Task_List SHALL provide a checkbox control for each Task to toggle its completion state.
2. WHEN the user checks the checkbox for an incomplete Task, THE Task_List SHALL set the Task's completion state to complete and apply a strikethrough style to the Task title text.
3. WHEN the user unchecks the checkbox for a completed Task, THE Task_List SHALL set the Task's completion state to incomplete and remove the strikethrough style.
4. THE Task_List SHALL provide a Delete button or icon for each Task.
5. WHEN the user activates the Delete control for a Task, THE Task_List SHALL immediately remove that Task from the rendered list and from Local_Storage without displaying a confirmation dialog.
6. WHEN a Task is deleted, THE Task_List SHALL re-render the remaining Tasks; IF no Tasks remain, THE Task_List SHALL display the empty-state message defined in Requirement 4.

---

### Requirement 7: To-Do List — Persistence

**User Story:** As a user, I want my tasks to be saved automatically so that they are still present when I reload or revisit the page.

#### Acceptance Criteria

1. WHEN a Task is added, edited, completed, uncompleted, or deleted, THE Task_List SHALL synchronously write the complete updated task array as a JSON string to Local_Storage under a fixed key before the triggering user interaction returns control to the browser.
2. WHEN the page loads, THE Task_List SHALL read and parse the task JSON from Local_Storage and render all stored Tasks before enabling the Add button or any task-level controls.
3. IF Local_Storage contains no task data on page load, THEN THE Task_List SHALL render an empty list with the empty-state message and enable the Add input normally.
4. IF Local_Storage contains task data that cannot be parsed as valid JSON on page load, THEN THE Task_List SHALL discard the corrupt data, initialize with an empty task list, and display a non-blocking warning message to the user.

---

### Requirement 8: Quick Links — Add and Display Links

**User Story:** As a user, I want to add shortcut buttons to my favorite websites, so that I can open them quickly from the dashboard.

#### Acceptance Criteria

1. THE Quick_Links SHALL provide a text input for the link label (up to 100 characters), a text input for the URL (up to 2,048 characters), and an Add button.
2. WHEN the user submits a non-empty label and a non-empty URL, THE Quick_Links SHALL trim both values, normalize the URL if needed (criterion 5), add the Link to the collection, persist it, and render it as a clickable element displaying the label text.
3. WHEN the user clicks a rendered Link element, THE Quick_Links SHALL open the Link's stored URL in a new browser tab (target="_blank" with rel="noopener noreferrer").
4. IF the user activates the Add button with an empty or whitespace-only label, THEN THE Quick_Links SHALL not add the Link and SHALL display an inline validation message on the label field indicating it is required.
5. IF the user activates the Add button with an empty or whitespace-only URL, THEN THE Quick_Links SHALL not add the Link and SHALL display an inline validation message on the URL field indicating it is required.
6. IF the submitted URL does not begin with "http://" or "https://" (case-insensitive, after trimming), THEN THE Quick_Links SHALL prepend "https://" to the URL before saving.
7. WHEN a Link is successfully added, THE Quick_Links SHALL clear both input fields and return focus to the label input.

---

### Requirement 9: Quick Links — Delete Links

**User Story:** As a user, I want to remove quick links I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links SHALL render a dedicated Delete button or icon adjacent to each Link element.
2. WHEN the user activates the Delete control for a Link, THE Quick_Links SHALL immediately remove that Link from the rendered panel and from Local_Storage without displaying a confirmation dialog.
3. WHEN a Link is deleted, THE Quick_Links panel SHALL re-render to reflect the removed Link; IF no Links remain, THE Quick_Links SHALL display an empty-state message (e.g., "No links saved yet") in place of the link list.

---

### Requirement 10: Quick Links — Persistence

**User Story:** As a user, I want my quick links to be saved automatically so that they are available every time I open the dashboard.

#### Acceptance Criteria

1. WHEN a Link is added or deleted, THE Quick_Links SHALL write the complete updated link array as a JSON string to Local_Storage under a fixed key within 200 milliseconds of the triggering action.
2. IF a Local_Storage write operation fails (e.g., storage quota exceeded), THEN THE Quick_Links SHALL preserve the in-memory link collection and display a non-blocking error message informing the user that the change could not be saved.
3. WHEN the page loads, THE Quick_Links SHALL read the link collection from Local_Storage and render all stored Links before enabling the Add button and link-level Delete controls.
4. IF Local_Storage contains no link data on page load, THEN THE Quick_Links SHALL render an empty panel with the empty-state message and enable the Add input normally.
5. IF Local_Storage contains link data that cannot be parsed as valid JSON on page load, THEN THE Quick_Links SHALL discard the corrupt data, initialize with an empty link collection, and display a non-blocking warning message to the user.

---

### Requirement 11: Visual Design and Layout

**User Story:** As a user, I want a clean, readable interface with clear visual hierarchy, so that I can use the dashboard comfortably without distraction.

#### Acceptance Criteria

1. THE App SHALL present all four components — Clock/Greeting, Focus_Timer, Task_List, and Quick_Links — on a single page without requiring vertical scrolling on viewports of 1280×720 pixels or larger.
2. THE App SHALL use a single CSS file located at `css/style.css` for all styling.
3. THE App SHALL apply a minimum font size of 14px to all text elements rendered in the UI.
4. THE App SHALL provide color contrast between text and background that meets WCAG 2.1 AA guidelines: a minimum contrast ratio of 4.5:1 for normal text (below 18px regular or below 14px bold) and a minimum contrast ratio of 3:1 for large text (18px or larger regular, or 14px or larger bold).

---

### Requirement 12: Code Structure and Browser Compatibility

**User Story:** As a developer, I want a clean, single-file code structure, so that the project is easy to maintain and extend.

#### Acceptance Criteria

1. THE App SHALL use a single JavaScript file located at `js/app.js` containing all application logic; no other `.js` files SHALL be present in the project.
2. THE App SHALL use only vanilla HTML, CSS, and JavaScript — no external frameworks, libraries (e.g., jQuery), build tools, or transpilers SHALL be referenced or required.
3. THE App SHALL pass all acceptance criteria in this document when tested in the current stable release of Chrome, Firefox, Edge, and Safari without browser-specific workarounds.
4. THE App SHALL use the browser's `localStorage` API exclusively for all client-side data persistence; no cookies, IndexedDB, or sessionStorage SHALL be used for persistent data.
5. WHEN the App's `index.html` is opened directly from the local file system (file:// protocol) in a Modern_Browser, THE App SHALL render and function correctly without errors.
