import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Mic, Clock, TrendingUp, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SearchOverlay = ({ isOpen, onClose, onSubmit }) => {
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);

    // Focus input when overlay opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 10));
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            // Save to recent searches
            const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            setRecentSearches(updated);

            onSubmit(query);
            onClose();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
        // Save to recent searches
        const updated = [suggestion, ...recentSearches.filter(s => s !== suggestion)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);

        onSubmit(suggestion);
        onClose();
    };

    const handleRemoveRecent = (search, e) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== search);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);
    };

    const suggestions = [
        'minecraft',
        'lofi beats',
        'cooking recipes',
        'react tutorial',
        'music playlist',
        'gaming highlights',
        'tech news',
        'workout music'
    ];

    if (!isOpen) return null;

    return (
        <motion.div
            className="search-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div className="search-overlay-header">
                <button className="search-back-btn" onClick={onClose}>
                    <ArrowLeft size={24} />
                </button>
                <form onSubmit={handleSubmit} className="search-overlay-form">
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search Lumina"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="search-overlay-input"
                    />
                    {query && (
                        <button type="button" className="search-clear-btn" onClick={() => setQuery('')}>
                            <X size={18} />
                        </button>
                    )}
                </form>
                <button className="search-mic-btn">
                    <Mic size={24} />
                </button>
            </div>

            {/* Content */}
            <div className="search-overlay-content">
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                    <div className="search-section">
                        <div className="search-section-header">Recent</div>
                        {recentSearches.map((search, idx) => (
                            <div
                                key={idx}
                                className="search-suggestion-item"
                                onClick={() => handleSuggestionClick(search)}
                            >
                                <Clock size={20} className="search-icon" />
                                <span className="search-suggestion-text">{search}</span>
                                <button
                                    className="search-remove-btn"
                                    onClick={(e) => handleRemoveRecent(search, e)}
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .search-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: #0f0f0f;
                    z-index: 200;
                    display: flex;
                    flex-direction: column;
                }

                .search-overlay-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 12px;
                    background: #0f0f0f;
                    border-bottom: 1px solid #272727;
                }

                .search-back-btn {
                    padding: 8px;
                    color: white;
                    background: none;
                    border: none;
                }

                .search-overlay-form {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    background: #1f1f1f;
                    border-radius: 24px;
                    padding: 0 16px;
                    height: 40px;
                }

                .search-overlay-input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    outline: none;
                }

                .search-overlay-input::placeholder {
                    color: #717171;
                }

                .search-clear-btn {
                    padding: 4px;
                    color: #aaa;
                    background: none;
                    border: none;
                }

                .search-mic-btn {
                    padding: 8px;
                    color: white;
                    background: none;
                    border: none;
                }

                .search-overlay-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 8px 0;
                }

                .search-section {
                    margin-bottom: 16px;
                }

                .search-section-header {
                    padding: 8px 16px;
                    font-size: 14px;
                    color: #aaa;
                    font-weight: 500;
                }

                .search-suggestion-item {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    padding: 12px 16px;
                    cursor: pointer;
                }

                .search-suggestion-item:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .search-icon {
                    color: #aaa;
                    flex-shrink: 0;
                }

                .search-suggestion-text {
                    flex: 1;
                    font-size: 16px;
                    color: white;
                }

                .search-arrow {
                    color: #aaa;
                    transform: rotate(45deg);
                }

                .search-remove-btn {
                    padding: 4px;
                    color: #aaa;
                    background: none;
                    border: none;
                }
            `}</style>
        </motion.div>
    );
};

export default SearchOverlay;
