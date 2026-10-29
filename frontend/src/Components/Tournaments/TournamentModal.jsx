import React, { useState, useMemo } from "react";
import { X, Radio, Calendar, ExternalLink, ChevronDown, ChevronRight, Trophy } from "lucide-react";
import "./tournament-modal.css";

export default function TournamentModal({ tournament, onClose, showLiveButton, onSelectRound, selectedRoundId }) {
    const { tour, rounds, image, sections } = tournament;
    const [expandedSections, setExpandedSections] = useState(new Set());

    const toggleSection = (sectionName) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionName)) {
            newExpanded.delete(sectionName);
        } else {
            newExpanded.add(sectionName);
        }
        setExpandedSections(newExpanded);
    };

    const formattedSubtitleParts = useMemo(() => {
        if (!tour?.description) return [];
        // Clean markdown links, asterisks, and HTML
        let clean = tour.description
            .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/[*_`#]/g, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/https?:\/\/\S+/g, '')
            .trim();

        // Split on pipes or newlines to extract discrete bullet metadata
        const parts = clean
            .split(/[|\n]/)
            .map(p => p.trim())
            .filter(p => p.length > 0 && p !== '-' && p !== '·');

        return parts;
    }, [tour?.description]);

    const formatTime = (dateString) => {
        if (!dateString) return "";

        const roundDate = new Date(dateString);
        const now = new Date();

        const time = roundDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit'
        });

        if (roundDate.toDateString() === now.toDateString()) {
            return `Today ${time}`;
        }

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (roundDate.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow ${time}`;
        }

        const date = roundDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        return `${date}, ${time}`;
    };

    return (
        <div className="tournament-modal-overlay" onClick={onClose}>
            <div className="tournament-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    type="button"
                    className="modal-close-icon-btn"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    <X size={18} />
                </button>

                <div className="modal-header">
                    {image && (
                        <div className="modal-image">
                            <img src={image} alt={tour?.name || "Tournament"} />
                        </div>
                    )}

                    <div className="modal-header-meta">
                        <span className="modal-kicker">
                            <Trophy size={13} />
                            <span>OFFICIAL FIDE BROADCAST</span>
                        </span>
                        <h2 className="modal-title">{tour?.name || "Tournament"}</h2>

                        {formattedSubtitleParts.length > 0 && (
                            <div className="modal-subtitle-chips">
                                {formattedSubtitleParts.map((part, idx) => (
                                    <span key={idx} className="modal-sub-chip">
                                        {part}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-body">
                    {sections ? (
                        <div className="modal-sections">
                            <div className="modal-section-headline">
                                <span>{sections.length} Tournament Divisions</span>
                            </div>

                            {sections.map((section, idx) => {
                                const isExpanded = expandedSections.has(section.name);
                                const hasOngoing = section.rounds.some(r => r.ongoing);

                                return (
                                    <div key={idx} className="modal-section-item">
                                        <button
                                            type="button"
                                            className="modal-section-header"
                                            onClick={() => toggleSection(section.name)}
                                        >
                                            <div className="modal-section-title">
                                                <span>{section.name}</span>
                                                {hasOngoing && (
                                                    <span className="section-live-badge">
                                                        <span className="live-dot" /> LIVE
                                                    </span>
                                                )}
                                            </div>
                                            <span className="section-toggle">
                                                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                            </span>
                                        </button>

                                        {isExpanded && (
                                            <div className="modal-section-rounds">
                                                {section.rounds.map((round) => (
                                                    <div key={round.id} className="modal-round-item">
                                                        <div className="modal-round-info">
                                                            <span className="modal-round-name">{round.name}</span>
                                                            {round.ongoing && (
                                                                <span className="round-live-badge">
                                                                    <span className="live-dot" /> LIVE
                                                                </span>
                                                            )}
                                                            {!round.ongoing && !round.finished && round.startsAt && (
                                                                <span className="round-upcoming-badge">
                                                                    <Calendar size={11} />
                                                                    <span>{formatTime(round.startsAt)}</span>
                                                                </span>
                                                            )}
                                                        </div>
                                                        {showLiveButton && (round.ongoing || !round.finished) && (
                                                            <button
                                                                type="button"
                                                                className={`modal-watch-btn ${!round.ongoing ? 'upcoming' : ''}`}
                                                                onClick={() => {
                                                                    onSelectRound && onSelectRound(round.id, `${tour?.name} - ${section.name}`);
                                                                    onClose();
                                                                }}
                                                                disabled={!round.ongoing}
                                                            >
                                                                {round.ongoing ? "Watch Live" : "Starts Soon"}
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        rounds && rounds.length > 0 && (
                            <div className="modal-rounds">
                                <div className="modal-section-headline">
                                    <span>Tournament Rounds ({rounds.length})</span>
                                </div>
                                <div className="modal-rounds-list">
                                    {rounds.map((round) => (
                                        <div key={round.id} className="modal-round-item">
                                            <div className="modal-round-info">
                                                <span className="modal-round-name">{round.name}</span>
                                                {round.ongoing && (
                                                    <span className="round-live-badge">
                                                        <span className="live-dot" /> LIVE
                                                    </span>
                                                )}
                                                {!round.ongoing && !round.finished && round.startsAt && (
                                                    <span className="round-upcoming-badge">
                                                        <Calendar size={11} />
                                                        <span>{formatTime(round.startsAt)}</span>
                                                    </span>
                                                )}
                                            </div>
                                            {showLiveButton && (round.ongoing || !round.finished) && (
                                                <button
                                                    type="button"
                                                    className={`modal-watch-btn ${!round.ongoing ? 'upcoming' : ''}`}
                                                    onClick={() => {
                                                        onSelectRound && onSelectRound(round.id, tour?.name);
                                                        onClose();
                                                    }}
                                                    disabled={!round.ongoing}
                                                >
                                                    {round.ongoing ? "Watch Live" : "Starts Soon"}
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    )}
                </div>

                {tour?.url && (
                    <div className="modal-footer">
                        <a
                            href={tour.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="modal-lichess-link"
                        >
                            <span>Inspect Official Lichess Broadcast</span>
                            <ExternalLink size={13} />
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}
