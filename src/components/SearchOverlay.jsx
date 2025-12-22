import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Search, Mic, Clock, X, Play, Film } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchPlaylists } from '../utils/m3uPlaylistService';

const SearchOverlay = ({ isOpen, onClose, onSubmit, playlists, onPlayVideo }) => {
    const [query, setQuery] = useState('');
    const [recentSearches, setRecentSearches] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const inputRef = useRef(null);

    // Focus input when overlay opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
            setQuery('');
            setSearchResults([]);
        }
    }, [isOpen]);

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 10));
        }
    }, [isOpen]);

    // Search playlists when query changes
    useEffect(() => {
        if (query.trim().length >= 2 && playlists && playlists.length > 0) {
            setIsSearching(true);
            const results = searchPlaylists(playlists, query);
            setSearchResults(results);
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    }, [query, playlists]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            // Save to recent searches
            const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
            localStorage.setItem('recentSearches', JSON.stringify(updated));
            setRecentSearches(updated);

            // If we have playlist search results, don't submit as URL
            if (searchResults.length === 0) {
                onSubmit(query);
                onClose();
            }
        }
    };

    const handleResultClick = (episode) => {
        // Save to recent searches
        const updated = [episode.title, ...recentSearches.filter(s => s !== episode.title)].slice(0, 10);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);

        if (onPlayVideo) {
            onPlayVideo(episode.url, episode.title, episode.packageName);
        }
        onClose();
    };

    const handleSuggestionClick = (suggestion) => {
        setQuery(suggestion);
    };

    const handleRemoveRecent = (search, e) => {
        e.stopPropagation();
        const updated = recentSearches.filter(s => s !== search);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
        setRecentSearches(updated);
    };

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
                    <Search size={20} className="search-form-icon" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Search movies, series, or paste URL..."
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
                {/* Search Results */}
                {query.trim().length >= 2 && searchResults.length > 0 && (
                    <div className="search-section">
                        <div className="search-section-header">
                            <Film size={18} />
                            Results ({searchResults.length})
                        </div>
                        <div className="search-results-grid">
                            {searchResults.map((episode, idx) => (
                                <motion.div
                                    key={`${episode.id}-${idx}`}
                                    className="search-result-card"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.03 }}
                                    onClick={() => handleResultClick(episode)}
                                >
                                    <div className="result-thumbnail">
                                        <img src={episode.thumbnail} alt="" loading="lazy" />
                                        <div className="result-play-overlay">
                                            <Play size={24} fill="white" />
                                        </div>
                                    </div>
                                    <div className="result-info">
                                        <span className="result-title">{episode.title}</span>
                                        <span className="result-package">{episode.packageName}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* No Results */}
                {query.trim().length >= 2 && searchResults.length === 0 && !isSearching && (
                    <div className="search-no-results">
                        <Search size={48} />
                        <p>No results found for "{query}"</p>
                        <span>Try searching for a different movie or series</span>
                    </div>
                )}

                {/* Recent Searches (when no query) */}
                {query.trim().length < 2 && recentSearches.length > 0 && (
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

                {/* Quick Tips */}
                {query.trim().length < 2 && recentSearches.length === 0 && (
                    <div className="search-tips">
                        <div className="tip-icon">💡</div>
                        <h3>Search Tips</h3>
                        <ul>
                            <li>Search by movie or series name</li>
                            <li>Search by episode number (e.g., "Epi 03")</li>
                            <li>Or paste a direct video URL</li>
                        </ul>
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
                    height: 44px;
                    gap: 10px;
                }

                .search-form-icon {
                    color: #888;
                    flex-shrink: 0;
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
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 16px;
                    font-size: 14px;
                    color: #aaa;
                    font-weight: 600;
                }

                .search-results-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 12px;
                    padding: 0 16px;
                }

                .search-result-card {
                    display: flex;
                    gap: 12px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .search-result-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                    transform: translateY(-2px);
                }

                .result-thumbnail {
                    position: relative;
                    width: 80px;
                    height: 100px;
                    border-radius: 8px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .result-thumbnail img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .result-play-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.4);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .search-result-card:hover .result-play-overlay {
                    opacity: 1;
                }

                .result-info {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    justify-content: center;
                    min-width: 0;
                }

                .result-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: white;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .result-package {
                    font-size: 12px;
                    color: #888;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .search-no-results {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #666;
                    text-align: center;
                }

                .search-no-results p {
                    font-size: 16px;
                    color: #aaa;
                    margin: 16px 0 8px;
                }

                .search-no-results span {
                    font-size: 14px;
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

                .search-remove-btn {
                    padding: 4px;
                    color: #aaa;
                    background: none;
                    border: none;
                }

                .search-tips {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    padding: 60px 20px;
                    color: #888;
                    text-align: center;
                }

                .tip-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }

                .search-tips h3 {
                    font-size: 18px;
                    color: #fff;
                    margin-bottom: 16px;
                }

                .search-tips ul {
                    list-style: none;
                    padding: 0;
                }

                .search-tips li {
                    padding: 8px 0;
                    font-size: 14px;
                }

                @media (max-width: 768px) {
                    .search-results-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default SearchOverlay;
