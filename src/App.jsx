import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  Edit3,
  ListFilter,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { todosApi } from "./api";

const CalendarView = lazy(() => import("./CalendarView.jsx"));
const DEFAULT_STUDENT_NAME = "";

const emptyTodo = () => ({
  title: "",
  description: "",
  date_from: toLocalInput(new Date()),
  date_to: toLocalInput(new Date(Date.now() + 60 * 60 * 1000)),
  is_finished: false,
});

function toLocalInput(value) {
  const date = new Date(value);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function toApiDate(value) {
  return new Date(value).toISOString();
}

function formatDate(value) {
  return new Intl.DateTimeFormat("sk-SK", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function App() {
  const [name, setName] = useState(DEFAULT_STUDENT_NAME);
  const [activeName, setActiveName] = useState("");
  const [todos, setTodos] = useState([]);
  const [draft, setDraft] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("date_from");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const run = async (action, success) => {
    setBusy(true);
    setError("");
    try {
      const result = await action();
      setNotice(success);
      return result;
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const load = async (student = name) => {
    const studentName = student.trim();
    if (!studentName) return setError("Zadajte identifikátor študenta.");
    const data = await run(() => todosApi.list(studentName), "Úlohy boli načítané.");
    if (data) {
      setActiveName(studentName);
      setName(studentName);
      setTodos(data);
    }
  };

  useEffect(() => {
    load(DEFAULT_STUDENT_NAME);
  }, []);

  const events = useMemo(
    () =>
      todos.map((todo) => ({
        id: String(todo.id),
        title: todo.title,
        start: todo.date_from,
        end: todo.date_to,
        className: todo.is_finished ? "done-event" : "open-event",
        extendedProps: { todo },
      })),
    [todos],
  );

  const visibleTodos = useMemo(() => {
    const term = query.trim().toLowerCase();
    return todos
      .filter((todo) => filter === "all" || todo.is_finished === (filter === "done"))
      .filter((todo) => todo.title.toLowerCase().includes(term))
      .sort((a, b) => new Date(a[sort]) - new Date(b[sort]));
  }, [todos, filter, query, sort]);

  const openForm = (todo = null, range = null) => {
    setNotice("");
    setError("");
    setDraft(
      todo
        ? {
            ...todo,
            date_from: toLocalInput(todo.date_from),
            date_to: toLocalInput(todo.date_to),
          }
        : {
            ...emptyTodo(),
            ...(range && { date_from: toLocalInput(range.start), date_to: toLocalInput(range.end) }),
          },
    );
  };

  const validate = () => {
    if (!draft.title.trim()) return "Názov je povinný.";
    if (draft.title.length > 200) return "Názov môže mať najviac 200 znakov.";
    if (draft.description.length > 1000) return "Popis môže mať najviac 1000 znakov.";
    if (!draft.date_from || !draft.date_to) return "Zadajte začiatok aj koniec úlohy.";
    if (new Date(draft.date_from) > new Date(draft.date_to)) return "Začiatok nesmie byť po konci.";
  };

  const saveTodo = async (event) => {
    event.preventDefault();
    const validation = validate();
    if (validation) return setError(validation);
    const body = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      date_from: toApiDate(draft.date_from),
      date_to: toApiDate(draft.date_to),
      is_finished: draft.is_finished,
    };
    const saved = await run(
      () => (draft.id ? todosApi.update(activeName, draft.id, body) : todosApi.create(activeName, body)),
      draft.id ? "Úloha bola upravená." : "Úloha bola vytvorená.",
    );
    if (saved) {
      await load();
      setDraft(null);
    }
  };

  const removeTodo = async (todo) => {
    if (!confirm(`Odstrániť úlohu "${todo.title}"?`)) return;
    const ok = await run(() => todosApi.remove(activeName, todo.id), "Úloha bola odstránená.");
    if (ok !== undefined) setTodos((items) => items.filter((item) => item.id !== todo.id));
  };

  const toggleTodo = async (todo) => {
    const changed = await run(
      () => (todo.is_finished ? todosApi.undone(activeName, todo.id) : todosApi.done(activeName, todo.id)),
      todo.is_finished ? "Úloha je opäť otvorená." : "Úloha je dokončená.",
    );
    if (changed) setTodos((items) => items.map((item) => (item.id === changed.id ? changed : item)));
  };

  const resetTodos = async () => {
    if (!confirm("Aktuálne úlohy budú odstránené a nahradené ukážkovými. Pokračovať?")) return;
    const data = await run(() => todosApi.reset(activeName), "Ukážkové dáta boli obnovené.");
    if (data) setTodos(data);
  };

  return (
    <main>
      <header className="topbar">
        <div>
          <h1>TODO List</h1>
        </div>
        <form
          className="student"
          onSubmit={(event) => {
            event.preventDefault();
            load(name);
          }}
        >
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="identifikátor" maxLength="100" />
          <button disabled={busy}>{busy ? "..." : "Načítať"}</button>
        </form>
      </header>

      {(notice || error) && <p className={error ? "message error" : "message"}>{error || notice}</p>}

      {!activeName ? (
        <section className="empty">Úlohy sa načítavajú zo servera.</section>
      ) : (
        <>
          <section className="actions">
            <button className="primary" onClick={() => openForm()}>
              <Plus size={18} /> Nová úloha
            </button>
            <button onClick={resetTodos} disabled={busy}>
              <RefreshCw size={18} /> Obnoviť ukážky
            </button>
          </section>

          <section className="grid">
            <div className="calendar">
              <Suspense fallback={<p className="empty">Kalendár sa načítava...</p>}>
                <CalendarView events={events} onEventClick={openForm} onSelect={(info) => openForm(null, info)} />
              </Suspense>
            </div>

            <aside className="list">
              <div className="tools">
                <label>
                  <ListFilter size={16} />
                  <select value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="all">Všetky</option>
                    <option value="open">Nedokončené</option>
                    <option value="done">Dokončené</option>
                  </select>
                </label>
                <select value={sort} onChange={(e) => setSort(e.target.value)}>
                  <option value="date_from">Od začiatku</option>
                  <option value="date_to">Od konca</option>
                </select>
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Hľadať názov" />
              </div>

              {visibleTodos.length ? (
                visibleTodos.map((todo) => (
                  <article
                    className={`todo ${todo.is_finished ? "finished" : ""} ${
                      !todo.is_finished && new Date(todo.date_to) < new Date() ? "late" : ""
                    }`}
                    key={todo.id}
                  >
                    <button className="state" title="Zmeniť stav" onClick={() => toggleTodo(todo)}>
                      {todo.is_finished ? <RotateCcw size={18} /> : <Check size={18} />}
                    </button>
                    <div>
                      <h3>{todo.title}</h3>
                      <p>{formatDate(todo.date_from)} - {formatDate(todo.date_to)}</p>
                      {todo.description && <small>{todo.description}</small>}
                    </div>
                    <button title="Upraviť" onClick={() => openForm(todo)}>
                      <Edit3 size={18} />
                    </button>
                    <button title="Odstrániť" onClick={() => removeTodo(todo)}>
                      <Trash2 size={18} />
                    </button>
                  </article>
                ))
              ) : (
                <p className="empty">Žiadne úlohy pre aktuálny filter.</p>
              )}
            </aside>
          </section>
        </>
      )}

      {draft && (
        <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && setDraft(null)}>
          <form className="sheet" onSubmit={saveTodo}>
            <header>
              <h2>{draft.id ? "Upraviť úlohu" : "Nová úloha"}</h2>
              <button type="button" onClick={() => setDraft(null)} title="Zavrieť">
                <X size={18} />
              </button>
            </header>
            <label>
              Názov
              <input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} maxLength="200" />
            </label>
            <label>
              Popis
              <textarea
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                maxLength="1000"
              />
            </label>
            <div className="two">
              <label>
                Začiatok
                <input type="datetime-local" value={draft.date_from} onChange={(e) => setDraft({ ...draft, date_from: e.target.value })} />
              </label>
              <label>
                Koniec
                <input type="datetime-local" value={draft.date_to} onChange={(e) => setDraft({ ...draft, date_to: e.target.value })} />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" checked={draft.is_finished} onChange={(e) => setDraft({ ...draft, is_finished: e.target.checked })} />
              Dokončená
            </label>
            <button className="primary" disabled={busy}>
              <Save size={18} /> Uložiť
            </button>
          </form>
        </div>
      )}

      <footer>
        <CalendarDays size={16} />
        O projekte: React, Vite, FullCalendar, Axios, Lucide.
      </footer>
    </main>
  );
}
