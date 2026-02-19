import React, { useEffect, useMemo, useState } from "react";
import "./App.css";

const STORAGE_KEY = "retro_todos_v1";

/**
 * @typedef {"all" | "active" | "completed"} Filter
 */

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} text
 * @property {boolean} completed
 * @property {number} createdAt
 */

function loadTodos() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Minimal validation to avoid runtime issues if storage is corrupted.
    return parsed
      .filter((t) => t && typeof t.id === "string" && typeof t.text === "string")
      .map((t) => ({
        id: t.id,
        text: t.text,
        completed: Boolean(t.completed),
        createdAt: typeof t.createdAt === "number" ? t.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

function saveTodos(todos) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Ignore storage write failures (e.g., private mode restrictions).
  }
}

// PUBLIC_INTERFACE
function App() {
  /** @type {[Todo[], Function]} */
  const [todos, setTodos] = useState(() => loadTodos());
  /** @type {[string, Function]} */
  const [newText, setNewText] = useState("");
  /** @type {[Filter, Function]} */
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    saveTodos(todos);
  }, [todos]);

  const stats = useMemo(() => {
    const total = todos.length;
    const completed = todos.filter((t) => t.completed).length;
    const active = total - completed;
    return { total, active, completed };
  }, [todos]);

  const visibleTodos = useMemo(() => {
    if (filter === "active") return todos.filter((t) => !t.completed);
    if (filter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }, [todos, filter]);

  // PUBLIC_INTERFACE
  const addTodo = (e) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;

    const todo = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      text,
      completed: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [todo, ...prev]);
    setNewText("");
  };

  // PUBLIC_INTERFACE
  const toggleTodo = (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  // PUBLIC_INTERFACE
  const deleteTodo = (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  // PUBLIC_INTERFACE
  const clearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return (
    <div className="App">
      <div className="retroBg" aria-hidden="true" />

      <main className="shell">
        <header className="header">
          <div className="brand">
            <div className="brandMark" aria-hidden="true">
              RT
            </div>
            <div className="brandText">
              <h1 className="title">Retro To-Do Terminal</h1>
              <p className="subtitle">
                Add tasks, complete them, delete them — and they persist locally.
              </p>
            </div>
          </div>

          <div className="statusPanel" role="status" aria-label="Task statistics">
            <div className="statusItem">
              <span className="statusLabel">TOTAL</span>
              <span className="statusValue">{stats.total}</span>
            </div>
            <div className="statusItem">
              <span className="statusLabel">ACTIVE</span>
              <span className="statusValue">{stats.active}</span>
            </div>
            <div className="statusItem">
              <span className="statusLabel">DONE</span>
              <span className="statusValue">{stats.completed}</span>
            </div>
          </div>
        </header>

        <section className="panel" aria-label="Add a new task">
          <form className="addForm" onSubmit={addTodo}>
            <label className="srOnly" htmlFor="newTodo">
              New task
            </label>
            <div className="inputShell">
              <span className="prompt" aria-hidden="true">
                &gt;
              </span>
              <input
                id="newTodo"
                className="textInput"
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Type a task and press ENTER…"
                autoComplete="off"
                maxLength={120}
              />
            </div>
            <button className="btn primary" type="submit">
              Add
            </button>
          </form>

          <div className="toolbar" aria-label="Task filters and actions">
            <div className="filters" role="group" aria-label="Filter tasks">
              <button
                type="button"
                className={`chip ${filter === "all" ? "active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All
              </button>
              <button
                type="button"
                className={`chip ${filter === "active" ? "active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Active
              </button>
              <button
                type="button"
                className={`chip ${filter === "completed" ? "active" : ""}`}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>

            <button
              type="button"
              className="btn ghost"
              onClick={clearCompleted}
              disabled={stats.completed === 0}
              aria-disabled={stats.completed === 0}
            >
              Clear completed
            </button>
          </div>
        </section>

        <section className="panel listPanel" aria-label="Task list">
          {visibleTodos.length === 0 ? (
            <div className="empty">
              <p className="emptyTitle">No tasks here.</p>
              <p className="emptyHint">
                {filter === "completed"
                  ? "Complete something first, then it will show up here."
                  : filter === "active"
                    ? "All tasks are completed (nice)."
                    : "Add your first task above."}
              </p>
            </div>
          ) : (
            <ul className="todoList" aria-label="To-do items">
              {visibleTodos.map((t) => (
                <li key={t.id} className={`todoItem ${t.completed ? "done" : ""}`}>
                  <button
                    type="button"
                    className="check"
                    onClick={() => toggleTodo(t.id)}
                    aria-label={t.completed ? "Mark as not completed" : "Mark as completed"}
                  >
                    <span className="checkBox" aria-hidden="true">
                      {t.completed ? "✓" : ""}
                    </span>
                  </button>

                  <div className="todoTextWrap">
                    <span className="todoText">{t.text}</span>
                    <span className="todoMeta">
                      {new Date(t.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="btn danger"
                    onClick={() => deleteTodo(t.id)}
                    aria-label="Delete task"
                  >
                    Del
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <footer className="footer">
          <span className="footerText">
            Tip: Use the filters to view Active/Completed. Data is stored in your browser
            (localStorage).
          </span>
        </footer>
      </main>
    </div>
  );
}

export default App;
