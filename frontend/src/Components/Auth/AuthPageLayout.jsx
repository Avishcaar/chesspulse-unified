import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Crosshair, Swords } from 'lucide-react';
import ThemeSwitch from '../common/ThemeSwitch';
import './auth-page.css';

const boardPieces = [
  { square: 2, piece: '♞' },
  { square: 5, piece: '♟' },
  { square: 8, piece: '♜' },
  { square: 11, piece: '♙' },
  { square: 14, piece: '♘' },
];

function StudyBoard() {
  return (
    <div className="auth-study-board" aria-hidden="true">
      <div className="auth-board-grid">
        {Array.from({ length: 16 }, (_, index) => {
          const piece = boardPieces.find(({ square }) => square === index);
          return (
            <span className={`auth-board-square ${(Math.floor(index / 4) + index % 4) % 2 ? 'is-dark' : ''}`} key={index}>
              {piece?.piece}
            </span>
          );
        })}
      </div>
      <span className="auth-board-coordinate auth-board-coordinate-file">a&nbsp; b&nbsp; c&nbsp; d</span>
      <span className="auth-board-coordinate auth-board-coordinate-rank">4<br />3<br />2<br />1</span>
      <span className="auth-board-note">Your next move, made clearer.</span>
    </div>
  );
}

export function GoogleMark() {
  return (
    <svg className="auth-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.6c3.9-3.6 6.1-8.8 6.1-14.9Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.6 27.8a12 12 0 0 1 0-7.6V15H5.8a20 20 0 0 0 0 18l6.8-5.2Z" />
      <path fill="#EA4335" d="M24 11.8c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 15l6.8 5.2c1.6-4.8 6.1-8.4 11.4-8.4Z" />
    </svg>
  );
}

export default function AuthPageLayout({ mode, children }) {
  const isSignup = mode === 'signup';

  return (
    <main className={`auth-gateway ${isSignup ? 'auth-gateway-signup' : 'auth-gateway-signin'}`}>
      <div className="auth-theme-switch"><ThemeSwitch size="10px" /></div>

      <section className="auth-frame" aria-label={isSignup ? 'Create a ChessPulse account' : 'Sign in to ChessPulse'}>
        <aside className="auth-story">
          <div className="auth-story-topline">
            <Link className="auth-wordmark" to="/" aria-label="ChessPulse home">
              Chess<span>Pulse</span>
            </Link>
            <span className="auth-story-index">THE STUDY ROOM</span>
          </div>

          <div className="auth-story-copy">
            <p className="auth-kicker">A better way to play</p>
            <h1>{isSignup ? <>Make every<br />move <em>count.</em></> : <>Pick up where<br />your game <em>left off.</em></>}</h1>
            <p className="auth-story-description">
              {isSignup
                ? 'Build your chess practice around the things you want to get better at.'
                : 'Your puzzles, games, and next good idea are waiting for you.'}
            </p>
          </div>

          <StudyBoard />

          <div className="auth-story-foot">
            <span><Crosshair size={15} /> Practice with purpose</span>
            <span className="auth-foot-divider" />
            <span><BookOpen size={15} /> Learn at your pace</span>
          </div>
        </aside>

        <section className="auth-form-side">
          <div className="auth-form-heading">
            <div className="auth-form-heading-icon"><Swords size={19} strokeWidth={1.8} /></div>
            <p>{isSignup ? 'Start your study' : 'Welcome back'}</p>
            <h2>{isSignup ? 'Create your account' : 'Sign in to ChessPulse'}</h2>
            <span>{isSignup ? 'A few details, then you’re ready to play.' : 'Your next session is just around the corner.'}</span>
          </div>

          {children}

          <div className="auth-security-note">
            <span className="auth-security-dot" />
            <span>Your account and progress stay yours.</span>
          </div>
        </section>
      </section>
    </main>
  );
}
