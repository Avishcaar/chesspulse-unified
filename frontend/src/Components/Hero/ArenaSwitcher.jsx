import React from "react";
import "./arenaswitcher.css";

const ARENAS = [
  { id: "classic", name: "Forest", color: "#10b981" },
  { id: "blitz", name: "Crimson", color: "#f43f5e" },
  { id: "gold", name: "Amber", color: "#d6a34a" },
];

export default function ArenaSwitcher({ currentArena, onSelectArena }) {
  return (
    <div className="arena-carousel-root">
      <span className="arena-switcher-label">Set the scene</span>
      <div className="arena-cards-row" role="group" aria-label="Hero color theme">
        {ARENAS.map((arena) => {
          const isActive = arena.id === currentArena;

          return (
            <button
              key={arena.id}
              type="button"
              className={`arena-card ${isActive ? "active" : ""}`}
              onClick={() => onSelectArena(arena.id)}
              aria-pressed={isActive}
              aria-label={`Set scene to ${arena.name}`}
              style={{ "--card-accent": arena.color }}
            >
              <span className="arena-swatch" aria-hidden="true" />
              <span className="arena-card-name">{arena.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
