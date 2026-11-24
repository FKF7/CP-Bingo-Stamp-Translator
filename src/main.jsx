import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import bundledStamps from "./stamps.json";
import "./style.css";

const SIZE = 25;
const BOARD_KEY = "stamp-sync-board-v1";
const RENAMED_STAMPS = {
  "3 Coin Bag Bubbles": "3 Coin Bubbles",
  "Crabs Treasure": "Crab's Treasure",
  "Get The Worm": "Get the Worm",
  "Astro 40": "Astro40",
  "Easy jump": "Easy Jump",
  "Chef's hat": "Chef's Hat",
};

function readSaved(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function StampPicker({ index, value, names, used, onSelect }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [placement, setPlacement] = useState({ up: false, maxHeight: 225 });
  const container = useRef(null);
  const input = useRef(null);
  const menu = useRef(null);
  const activeOption = useRef(null);

  const matches = useMemo(
    () =>
      names.filter(
        (name) =>
          (name === value || !used.has(name)) &&
          name.toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [names, query, used, value],
  );

  useEffect(() => {
    if (!open) return;
    const close = (event) => {
      if (!container.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;

    function updatePlacement() {
      const square = container.current;
      const list = menu.current;
      if (!square || !list) return;

      const bounds = square.getBoundingClientRect();
      const spaceAbove = Math.max(0, bounds.top - 8);
      const spaceBelow = Math.max(0, window.innerHeight - bounds.bottom - 8);
      const neededHeight = Math.min(225, list.scrollHeight);
      const up = spaceBelow < neededHeight && spaceAbove > spaceBelow;
      const maxHeight = Math.min(225, Math.floor(up ? spaceAbove : spaceBelow));

      setPlacement((previous) =>
        previous.up === up && previous.maxHeight === maxHeight
          ? previous
          : { up, maxHeight },
      );
    }

    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    window.addEventListener("scroll", updatePlacement, true);
    return () => {
      window.removeEventListener("resize", updatePlacement);
      window.removeEventListener("scroll", updatePlacement, true);
    };
  }, [open, matches]);

  useEffect(() => {
    const list = menu.current;
    const option = activeOption.current;
    if (!open || !list || !option) return;

    const listBounds = list.getBoundingClientRect();
    const optionBounds = option.getBoundingClientRect();
    if (optionBounds.top < listBounds.top) {
      list.scrollTop += optionBounds.top - listBounds.top;
    } else if (optionBounds.bottom > listBounds.bottom) {
      list.scrollTop += optionBounds.bottom - listBounds.bottom;
    }
  }, [active, open, matches, placement]);

  function select(name) {
    onSelect(index, name);
    setOpen(false);
    setQuery("");
  }

  function handleKeyDown(event) {
    if (event.key === "Escape") {
      setOpen(false);
      input.current?.blur();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((previous) =>
        Math.min(previous + 1, Math.max(matches.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((previous) => Math.max(previous - 1, 0));
    } else if (event.key === "Enter" && open && matches[active]) {
      event.preventDefault();
      select(matches[active]);
    }
  }

  return (
    <div
      className={`input-cell ${value ? "filled" : ""}`}
      ref={container}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
      onClick={(event) => {
        if (
          event.target === input.current ||
          event.target.closest(".picker-menu, .clear-cell")
        )
          return;
        setQuery("");
        setActive(0);
        setOpen(true);
        input.current?.focus();
      }}
    >
      <span className="cell-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="picker-wrap">
        <input
          ref={input}
          role="combobox"
          aria-label={`Stamp for square ${index + 1}`}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`options-${index}`}
          aria-activedescendant={
            open && matches[active]
              ? `stamp-option-${index}-${active}`
              : undefined
          }
          value={open ? query : value}
          title={value || undefined}
          placeholder="Search stamp…"
          onFocus={() => {
            setQuery("");
            setActive(0);
            setOpen(true);
          }}
          onClick={() => {
            if (!open) {
              setQuery("");
              setActive(0);
              setOpen(true);
            }
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setActive(0);
            setOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        {value && (
          <button
            className="clear-cell"
            tabIndex={-1}
            title="Clear square"
            aria-label={`Clear square ${index + 1}`}
            onClick={(event) => {
              event.stopPropagation();
              select("");
            }}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div
          className={`picker-menu ${placement.up ? "open-up" : ""}`}
          id={`options-${index}`}
          role="listbox"
          ref={menu}
          style={{ maxHeight: placement.maxHeight }}
        >
          {matches.length ? (
            matches.map((name, optionIndex) => (
              <button
                key={name}
                id={`stamp-option-${index}-${optionIndex}`}
                ref={optionIndex === active ? activeOption : null}
                type="button"
                tabIndex={-1}
                role="option"
                aria-selected={name === value}
                className={optionIndex === active ? "active" : ""}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(name)}
              >
                {name}
              </button>
            ))
          ) : (
            <div className="no-results">No matching stamps</div>
          )}
        </div>
      )}
    </div>
  );
}

function App() {
  const catalog = bundledStamps;
  const [board, setBoard] = useState(() => {
    const saved = readSaved(BOARD_KEY, []);
    return Array.from({ length: SIZE }, (_, i) => {
      const name = RENAMED_STAMPS[saved[i]] ?? saved[i];
      return typeof name === "string" && Object.hasOwn(catalog, name)
        ? name
        : "";
    });
  });
  const names = useMemo(
    () => Object.keys(catalog).sort((a, b) => a.localeCompare(b)),
    [catalog],
  );
  const used = useMemo(() => new Set(board.filter(Boolean)), [board]);

  useEffect(() => {
    localStorage.setItem(BOARD_KEY, JSON.stringify(board));
  }, [board]);

  function changeSquare(index, value) {
    setBoard((previous) =>
      previous.map((item, i) => (i === index ? value : item)),
    );
  }

  return (
    <main className="app-shell">
      <section className="board-layout" aria-label="Bingo boards">
        <div className="board-section">
          <div className="section-heading">
            <h2>Stamp names</h2>
            <button
              className="clear-board"
              onClick={() => setBoard(Array(SIZE).fill(""))}
            >
              Clear board
            </button>
          </div>
          <div className="board input-board">
            {board.map((value, index) => (
              <StampPicker
                key={index}
                index={index}
                value={value}
                names={names}
                used={used}
                onSelect={changeSquare}
              />
            ))}
          </div>
        </div>
        <div className="board-section">
          <div className="section-heading">
            <h2>Stamp goals</h2>
          </div>
          <div className="board output-board">
            {board.map((name, index) => {
              const stamp = catalog[name];
              return (
                <div
                  key={index}
                  className={`output-cell ${stamp ? `difficulty-${stamp.difficulty}` : ""}`}
                >
                  {stamp ? (
                    <div className="output-content">
                      <span className="output-game">{stamp.game}</span>
                      {stamp.description && (
                        <span className="output-description">
                          {stamp.description}
                        </span>
                      )}
                    </div>
                  ) : (
                    <>
                      <span className="empty-number">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="empty-mark">+</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
