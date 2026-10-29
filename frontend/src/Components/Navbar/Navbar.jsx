import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { Sun, Moon, Menu, X, User, LogOut, ChevronDown, Compass } from "lucide-react";
import "./navbar.css";

const NAV_LINKS = [
  { label: "Play", path: "/play/online", id: "nav-link-play" },
  { label: "Puzzles", path: "/puzzles", id: "nav-link-puzzles" },
  { label: "Academy", path: "/academy", id: "nav-link-academy" },
  { label: "Analysis", path: "/analysis", id: "nav-link-analysis" },
  { label: "Bots", path: "/bots", id: "nav-link-bots" },
  { label: "Tournaments", path: "/tournaments", id: "nav-link-tournaments" },
];

const PULSE_NAV_LINK = {
  label: "Pulse",
  path: "/puzzles/curated",
  id: "nav-link-pulse",
};

const AUTHENTICATED_NAV_LINKS = [
  ...NAV_LINKS.slice(0, 2),
  PULSE_NAV_LINK,
  ...NAV_LINKS.slice(2),
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [tourNavOpen, setTourNavOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { darkMode, toggleDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const navLinks = isAuthenticated ? AUTHENTICATED_NAV_LINKS : NAV_LINKS;

  useEffect(() => {
    const handleTourMobileNav = (event) => {
      const shouldOpen = Boolean(event.detail?.open);
      setTourNavOpen(shouldOpen);
      setOpen(shouldOpen);
    };

    window.addEventListener("guided-tour-mobile-nav", handleTourMobileNav);
    return () => window.removeEventListener("guided-tour-mobile-nav", handleTourMobileNav);
  }, []);

  // Close mobile drawer on Escape key
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setUserMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest(".user-menu-container")) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("click", handleClickOutside);
    }
    return () => document.removeEventListener("click", handleClickOutside);
  }, [userMenuOpen]);

  const handleLinkClick = (targetPath) => {
    setOpen(false);
    setUserMenuOpen(false);
    if (targetPath && location.pathname === targetPath) {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }
  };

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setOpen(false);
    navigate("/");
  };

  const isNavActive = (path) => {
    if (path === "/") return location.pathname === "/";
    if (path === "/puzzles") {
      return (
        location.pathname.startsWith("/puzzles") &&
        location.pathname !== "/puzzles/curated"
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="chess-navbar-wrapper">
      <header className="chess-navbar-pill" role="banner">
        {/* Left: Brand Emblem + Wordmark */}
        <div className="navbar-brand-col">
          <Link to="/" className="navbar-brand-link" onClick={handleLinkClick}>
            <span className="navbar-brand-wordmark">
              Chess<span className="navbar-brand-accent">Pulse</span>
            </span>
            <span className="navbar-telemetry-badge" title="Stockfish 17 In-Browser WASM Engine">
              <span className="navbar-telemetry-dot" />
              SF17
            </span>
          </Link>
        </div>

        {/* Center: Desktop Navigation Links (Inline Pill) */}
        <nav className="navbar-center-menu" aria-label="Main Navigation">
          {navLinks.map((item) => {
            const active = isNavActive(item.path);
            return (
              <Link
                key={item.path}
                id={item.id}
                to={item.path}
                className={`navbar-nav-link ${active ? "active" : ""}`}
                onClick={handleLinkClick}
              >
                <span>{item.label}</span>
                {active && <span className="navbar-active-dot" aria-hidden="true" />}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions, Theme Switch, Auth & Mobile Menu Trigger */}
        <div
          className="navbar-actions-col"
          style={{ display: "flex", flexDirection: "row" }}
        >
          {/* Learn About Platform Tour Pill */}
          <button
            type="button"
            id="nav-tech-tour-btn"
            className="navbar-tour-pill"
            onClick={() => window.dispatchEvent(new CustomEvent("open-guided-tour"))}
            title="Learn About Platform"
          >
            <Compass size={13} className="navbar-tour-icon text-amber-400" />
            <span>Learn About Platform</span>
          </button>

          {/* Theme Toggle Button (Sun/Moon minimal button) */}
          <button
            type="button"
            className="navbar-theme-toggle"
            onClick={toggleDarkMode}
            aria-label={darkMode ? "Switch to light theme" : "Switch to dark theme"}
            title={darkMode ? "Switch to light theme" : "Switch to dark theme"}
          >
            {darkMode ? (
              <Sun size={16} strokeWidth={1.8} className="theme-toggle-svg sun-svg" />
            ) : (
              <Moon size={16} strokeWidth={1.8} className="theme-toggle-svg moon-svg" />
            )}
          </button>

          {/* Auth: User Avatar Dropdown OR Sign In Pill CTA */}
          {isAuthenticated ? (
            <div className="user-menu-container">
              <button
                type="button"
                className="user-avatar-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setUserMenuOpen(!userMenuOpen);
                }}
                aria-label="User account menu"
                aria-expanded={userMenuOpen}
              >
                <img
                  src={
                    user?.avatar ||
                    `https://ui-avatars.com/api/?name=${user?.username || "Player"}&background=f43f5e&color=fff`
                  }
                  alt={user?.username || "Player avatar"}
                  className="user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${user?.username || "Player"}&background=f43f5e&color=fff`;
                  }}
                />
                <ChevronDown size={13} className="user-avatar-chevron" />
              </button>

              {userMenuOpen && (
                <div className="user-dropdown-card" role="menu">
                  <div className="user-dropdown-header">
                    <img
                      src={user?.avatar}
                      alt={user?.username}
                      className="user-dropdown-avatar"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${user?.username || "Player"}&background=f43f5e&color=fff`;
                      }}
                    />
                    <div className="user-dropdown-meta">
                      <div className="user-dropdown-name">{user?.username || "Player"}</div>
                      <div className="user-dropdown-email">{user?.email || "Signed in"}</div>
                    </div>
                  </div>
                  <div className="user-dropdown-divider" />
                  <Link
                    to="/profile"
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={handleLinkClick}
                  >
                    <User size={14} />
                    <span>Profile & Telemetry</span>
                  </Link>
                  <Link
                    to="/customize"
                    className="user-dropdown-item"
                    role="menuitem"
                    onClick={handleLinkClick}
                  >
                    <span>Board Studio</span>
                  </Link>
                  <div className="user-dropdown-divider" />
                  <button
                    type="button"
                    className="user-dropdown-item logout-action"
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/signin"
              className="navbar-cta-pill"
              onClick={handleLinkClick}
            >
              Sign In
            </Link>
          )}

          {/* Mobile Hamburger Trigger */}
          <button
            type="button"
            className="navbar-mobile-toggle"
            onClick={() => setOpen(true)}
            aria-label="Open navigation menu"
            aria-expanded={open}
          >
            <Menu size={20} strokeWidth={2} />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Overlay Menu (Matches PrebuiltUI backdrop-blur slide-in) */}
      <div
        className={`navbar-mobile-overlay ${open ? "is-open" : ""} ${tourNavOpen ? "is-tour-nav-open" : ""}`}
        aria-hidden={!open}
      >
        <div className="navbar-mobile-drawer">
          {/* Drawer Top Bar */}
          <div className="navbar-mobile-header">
            <Link to="/" className="navbar-brand-link" onClick={handleLinkClick}>
              <span className="navbar-brand-wordmark">
                Chess<span className="navbar-brand-accent">Pulse</span>
              </span>
            </Link>
            <button
              type="button"
              className="navbar-mobile-close"
              onClick={() => setOpen(false)}
              aria-label="Close navigation menu"
            >
              <X size={22} strokeWidth={2} />
            </button>
          </div>

          {/* Drawer Navigation Links */}
          <nav className="navbar-mobile-nav">
            {navLinks.map((item, idx) => {
              const active = isNavActive(item.path);
              return (
                <Link
                  key={item.path}
                  id={`mobile-${item.id}`}
                  to={item.path}
                  className={`navbar-mobile-link ${active ? "active" : ""}`}
                  onClick={handleLinkClick}
                  style={{ "--item-idx": idx }}
                >
                  <span className="navbar-mobile-num">0{idx + 1}</span>
                  <span className="navbar-mobile-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer Controls */}
          <div className="navbar-mobile-footer">
            <div className="navbar-mobile-footer-row">
              <button
                type="button"
                className="navbar-mobile-tour-btn"
                onClick={() => {
                  setOpen(false);
                  window.dispatchEvent(new CustomEvent("open-guided-tour"));
                }}
              >
                <Compass size={14} className="text-amber-400" />
                <span>Learn About Platform</span>
              </button>

              <button
                type="button"
                className="navbar-mobile-theme-btn"
                onClick={toggleDarkMode}
              >
                {darkMode ? <Sun size={16} /> : <Moon size={16} />}
                <span>{darkMode ? "Light" : "Dark"}</span>
              </button>

            </div>

            {!isAuthenticated ? (
              <Link
                to="/signin"
                className="navbar-mobile-signin-btn"
                onClick={handleLinkClick}
              >
                Sign In to Studio
              </Link>
            ) : (
              <div className="navbar-mobile-auth-row">
                <Link
                  to="/profile"
                  className="navbar-mobile-profile-btn"
                  onClick={handleLinkClick}
                >
                  <User size={15} />
                  <span>{user?.username || "Profile"}</span>
                </Link>
                <button
                  type="button"
                  className="navbar-mobile-logout-btn"
                  onClick={handleLogout}
                >
                  <LogOut size={15} />
                  <span>Log Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
