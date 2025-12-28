import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Star, Clock, Film, RefreshCw, Search, X, Link, Tv, Clapperboard, MonitorPlay } from 'lucide-react';
import { fetchAllPlaylists, getFeaturedPlaylist, searchPlaylists } from '../utils/m3uPlaylistService';
import { getHistory, getContinueWatching } from '../utils/libraryStorage';
import ContinueWatching from './ContinueWatching';

const HomePage = ({ onPlayVideo, onPlaylistsLoaded, refreshContinueWatching }) => {
    const [playlists, setPlaylists] = useState([]);
    const [featuredPlaylist, setFeaturedPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState('All');
    const searchInputRef = useRef(null);

    // Check if query is a valid URL for direct playback
    const isValidUrl = (str) => {
        return /^(https?|rtmp|rtsp):\/\//i.test(str.trim());
    };

    useEffect(() => {
        loadPlaylists();
    }, []);

    // Smart search with debounce
    useEffect(() => {
        if (searchQuery.trim().length >= 2 && playlists.length > 0) {
            const results = searchPlaylists(playlists, searchQuery);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, playlists]);

    const loadPlaylists = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchAllPlaylists(forceRefresh);
            setPlaylists(data);
            setFeaturedPlaylist(getFeaturedPlaylist(data));
            if (onPlaylistsLoaded) {
                onPlaylistsLoaded(data);
            }
        } catch (err) {
            setError('Failed to load content. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePlayPlaylist = (playlist) => {
        if (playlist.episodes.length > 0) {
            // Check for saved progress in history and continue watching
            const history = getHistory();
            const continueWatching = getContinueWatching();

            // Find the most recently watched episode from this playlist
            let resumeEpisode = null;
            let resumeTime = 0;
            let latestTimestamp = 0;

            for (const episode of playlist.episodes) {
                // Check continue watching first (has currentTime and timestamp)
                const continueItem = continueWatching.find(item => item.url === episode.url);
                if (continueItem && continueItem.currentTime > 0) {
                    const itemTimestamp = new Date(continueItem.updatedAt || continueItem.addedAt || 0).getTime();
                    if (itemTimestamp > latestTimestamp) {
                        latestTimestamp = itemTimestamp;
                        resumeEpisode = episode;
                        resumeTime = continueItem.currentTime;
                    }
                }

                // Also check history for progress (uses watchedAt timestamp)
                const historyItem = history.find(item => item.url === episode.url);
                if (historyItem) {
                    const itemTimestamp = new Date(historyItem.watchedAt || 0).getTime();
                    if (itemTimestamp > latestTimestamp) {
                        latestTimestamp = itemTimestamp;
                        resumeEpisode = episode;
                        resumeTime = historyItem.currentTime || 0;
                    }
                }
            }

            if (resumeEpisode && onPlayVideo) {
                // Resume from saved position
                onPlayVideo(resumeEpisode.url, resumeEpisode.title, resumeTime);
            } else if (onPlayVideo) {
                // Start from first episode
                const firstEpisode = playlist.episodes[0];
                onPlayVideo(firstEpisode.url, firstEpisode.title, 0);
            }
        }
    };

    const handlePlayEpisode = (episode) => {
        if (onPlayVideo) {
            onPlayVideo(episode.url, episode.title, episode.packageName);
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Direct URL playback handler
    const handlePlayUrl = (url) => {
        if (onPlayVideo) {
            onPlayVideo(url.trim(), 'Direct Link', 'External');
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    // Filter playlists by selected group
    const filteredPlaylists = selectedGroup === 'All'
        ? playlists
        : playlists.filter(p => p.groupTypes && p.groupTypes.includes(selectedGroup));

    const clearSearch = () => {
        setSearchQuery('');
        setSearchResults([]);
        searchInputRef.current?.blur();
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className="home-error">
                <Film size={48} />
                <p>{error}</p>
                <button onClick={() => loadPlaylists(true)} className="retry-btn">
                    <RefreshCw size={18} /> Retry
                </button>
            </div>
        );
    }

    return (
        <div className="home-page">
            {/* Smart Search Bar */}
            <div className="search-container">
                <motion.div
                    className={`search-bar ${isSearchFocused ? 'search-bar-focused' : ''}`}
                    animate={{ width: isSearchFocused ? '100%' : '100%' }}
                >
                    <Search size={20} className="search-icon" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search movies, series, episodes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="search-input"
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={clearSearch}>
                            <X size={18} />
                        </button>
                    )}
                </motion.div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                    {(searchResults.length > 0 || isValidUrl(searchQuery)) && (
                        <motion.div
                            className="search-results"
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {/* Direct URL Play Option */}
                            {isValidUrl(searchQuery) && (
                                <motion.div
                                    className="search-result-item url-play-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    onClick={() => handlePlayUrl(searchQuery)}
                                >
                                    <div className="url-play-icon">
                                        <Link size={24} />
                                    </div>
                                    <div className="result-info">
                                        <span className="result-title">Play this URL</span>
                                        <span className="result-package url-text">{searchQuery.substring(0, 50)}...</span>
                                    </div>
                                    <Play size={18} className="result-play" />
                                </motion.div>
                            )}
                            {searchResults.map((episode, idx) => (
                                <motion.div
                                    key={`${episode.id}-${idx}`}
                                    className="search-result-item"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: (isValidUrl(searchQuery) ? idx + 1 : idx) * 0.03 }}
                                    onClick={() => handlePlayEpisode(episode)}
                                >
                                    <img
                                        src={episode.thumbnail}
                                        alt=""
                                        className="result-thumb"
                                    />
                                    <div className="result-info">
                                        <span className="result-title">{episode.title}</span>
                                        <span className="result-package">{episode.packageName}</span>
                                    </div>
                                    <Play size={18} className="result-play" />
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* No Results */}
                {searchQuery.length >= 2 && searchResults.length === 0 && !isValidUrl(searchQuery) && (
                    <motion.div
                        className="search-no-results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <span>No results found for "{searchQuery}"</span>
                    </motion.div>
                )}
            </div>

            {/* Continue Watching Section */}
            {!searchQuery && (
                <ContinueWatching
                    onPlay={(url, title, currentTime) => onPlayVideo(url, title, currentTime)}
                    refreshTrigger={refreshContinueWatching}
                />
            )}

            {/* Hero Section */}
            {featuredPlaylist && !searchQuery && (
                <HeroSection
                    playlist={featuredPlaylist}
                    onPlay={() => handlePlayPlaylist(featuredPlaylist)}
                />
            )}

            {/* Playlist Cards */}
            {!searchQuery && (
                <div className="content-section">
                    {/* Filter Tabs */}
                    <div className="filter-tabs">
                        {['All', 'Movies', 'Series', 'TV'].map((group) => (
                            <motion.button
                                key={group}
                                className={`filter-tab ${selectedGroup === group ? 'active' : ''}`}
                                onClick={() => setSelectedGroup(group)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {group === 'Movies' && <Clapperboard size={16} />}
                                {group === 'Series' && <MonitorPlay size={16} />}
                                {group === 'TV' && <Tv size={16} />}
                                {group}
                            </motion.button>
                        ))}
                    </div>

                    <h2 className="section-title">
                        {selectedGroup === 'All' ? 'All Series & Movies' : selectedGroup}
                    </h2>
                    <div className="playlist-grid">
                        {filteredPlaylists.map((playlist, index) => (
                            <PlaylistCard
                                key={playlist.id}
                                playlist={playlist}
                                onPlay={() => handlePlayPlaylist(playlist)}
                                delay={index * 0.05}
                            />
                        ))}
                        {filteredPlaylists.length === 0 && (
                            <div className="no-content-msg">
                                No {selectedGroup} content found
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                .home-page {
                    min-height: 100vh;
                    background: linear-gradient(180deg, #0a0a0a 0%, #141414 100%);
                    padding-bottom: 40px;
                }

                .home-error {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 60vh;
                    color: #888;
                    gap: 16px;
                }

                .retry-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 12px 24px;
                    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
                    border: none;
                    border-radius: 8px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s, box-shadow 0.2s;
                }

                .retry-btn:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 25px rgba(229, 9, 20, 0.4);
                }

                /* Search Container */
                .search-container {
                    position: relative;
                    padding: 20px 24px;
                    z-index: 50;
                }

                .search-bar {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    padding: 14px 20px;
                    transition: all 0.3s;
                }

                .search-bar-focused {
                    background: rgba(255, 255, 255, 0.12);
                    border-color: rgba(229, 9, 20, 0.5);
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                }

                .search-icon {
                    color: #888;
                    flex-shrink: 0;
                }

                .search-input {
                    flex: 1;
                    background: none;
                    border: none;
                    color: white;
                    font-size: 16px;
                    outline: none;
                }

                .search-input::placeholder {
                    color: #666;
                }

                .search-clear {
                    padding: 4px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 50%;
                    color: #888;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .search-results {
                    position: absolute;
                    top: 100%;
                    left: 24px;
                    right: 24px;
                    background: #1a1a1a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    max-height: 400px;
                    overflow-y: auto;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
                }

                .search-result-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px 16px;
                    cursor: pointer;
                    transition: background 0.2s;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }

                .search-result-item:last-child {
                    border-bottom: none;
                }

                .search-result-item:hover {
                    background: rgba(255, 255, 255, 0.08);
                }

                .result-thumb {
                    width: 50px;
                    height: 65px;
                    object-fit: cover;
                    border-radius: 6px;
                }

                .result-info {
                    flex: 1;
                    min-width: 0;
                }

                .result-title {
                    display: block;
                    font-size: 14px;
                    font-weight: 500;
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .result-package {
                    display: block;
                    font-size: 12px;
                    color: #888;
                    margin-top: 4px;
                }

                .result-play {
                    color: #e50914;
                    flex-shrink: 0;
                }

                .search-no-results {
                    position: absolute;
                    top: 100%;
                    left: 24px;
                    right: 24px;
                    background: #1a1a1a;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 20px;
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }

                /* URL Play Item */
                .url-play-item {
                    background: linear-gradient(135deg, rgba(229, 9, 20, 0.15) 0%, rgba(229, 9, 20, 0.05) 100%);
                    border-left: 3px solid #e50914;
                }

                .url-play-icon {
                    width: 50px;
                    height: 50px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(229, 9, 20, 0.2);
                    border-radius: 8px;
                    color: #e50914;
                }

                .url-text {
                    font-family: monospace;
                    font-size: 11px;
                }

                /* Filter Tabs */
                .filter-tabs {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 24px;
                    overflow-x: auto;
                    padding-bottom: 8px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .filter-tabs::-webkit-scrollbar {
                    display: none;
                }

                .filter-tab {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 10px 20px;
                    background: rgba(255, 255, 255, 0.08);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 24px;
                    color: #ccc;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    white-space: nowrap;
                    transition: all 0.2s;
                }

                .filter-tab:hover {
                    background: rgba(255, 255, 255, 0.12);
                    color: white;
                }

                .filter-tab.active {
                    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
                    border-color: #e50914;
                    color: white;
                    box-shadow: 0 4px 15px rgba(229, 9, 20, 0.4);
                }

                .no-content-msg {
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: 60px 20px;
                    color: #666;
                    font-size: 16px;
                }

                /* Content Section */
                .content-section {
                    padding: 20px 24px;
                }

                .section-title {
                    font-size: 22px;
                    font-weight: 700;
                    margin-bottom: 20px;
                    color: #fff;
                }

                .playlist-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 20px;
                }

                /* Loading State */
                .loading-state {
                    min-height: 100vh;
                    background: #0a0a0a;
                    padding: 20px;
                }

                .loading-hero {
                    height: 50vh;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 16px;
                    margin-bottom: 40px;
                    animation: shimmer 1.5s infinite;
                }

                .loading-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
                    gap: 20px;
                    padding: 20px;
                }

                .loading-card {
                    height: 260px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 12px;
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }

                @media (max-width: 768px) {
                    .search-container {
                        padding: 16px;
                    }

                    .search-results {
                        left: 16px;
                        right: 16px;
                    }

                    .content-section {
                        padding: 16px;
                    }

                    .playlist-grid {
                        grid-template-columns: repeat(3, 1fr);
                        gap: 12px;
                    }
                }
            `}</style>
        </div>
    );
};

// Hero Section Component
const HeroSection = ({ playlist, onPlay }) => {
    return (
        <motion.div
            className="hero-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <div
                className="hero-backdrop"
                style={{
                    backgroundImage: playlist.thumbnail
                        ? `url(${playlist.thumbnail})`
                        : 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)'
                }}
            />
            <div className="hero-gradient" />

            <div className="hero-content">
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                >
                    <span className="hero-badge">
                        <Star size={14} fill="#ffd700" stroke="#ffd700" /> Featured
                    </span>
                    <h1 className="hero-title">{playlist.name}</h1>
                    <div className="hero-meta">
                        <span><Film size={16} /> {playlist.episodeCount} Episodes</span>
                        <span><Clock size={16} /> New</span>
                    </div>
                    <div className="hero-actions">
                        <motion.button
                            className="play-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={onPlay}
                        >
                            <Play size={22} fill="black" /> Watch Now
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .hero-section {
                    position: relative;
                    height: 55vh;
                    min-height: 350px;
                    max-height: 500px;
                    overflow: hidden;
                    margin: 0 24px;
                    border-radius: 20px;
                }

                .hero-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center top;
                    transform: scale(1.1);
                }

                .hero-gradient {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        90deg, 
                        rgba(10, 10, 10, 0.95) 0%, 
                        rgba(10, 10, 10, 0.6) 50%,
                        transparent 100%
                    ),
                    linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(10, 10, 10, 0.8) 100%
                    );
                }

                .hero-content {
                    position: relative;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 32px;
                    max-width: 500px;
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 14px;
                    background: rgba(255, 215, 0, 0.15);
                    border: 1px solid rgba(255, 215, 0, 0.3);
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    color: #ffd700;
                    margin-bottom: 12px;
                }

                .hero-title {
                    font-size: clamp(24px, 4vw, 40px);
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 12px;
                    text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.5);
                }

                .hero-meta {
                    display: flex;
                    gap: 16px;
                    margin-bottom: 20px;
                    font-size: 14px;
                    color: #aaa;
                }

                .hero-meta span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .hero-actions {
                    display: flex;
                    gap: 12px;
                }

                .play-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 28px;
                    background: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 15px;
                    font-weight: 700;
                    color: black;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .play-btn:hover {
                    background: #e6e6e6;
                    transform: scale(1.02);
                }

                @media (max-width: 768px) {
                    .hero-section {
                        height: 45vh;
                        min-height: 280px;
                        margin: 0 16px;
                        border-radius: 16px;
                    }

                    .hero-content {
                        padding: 20px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

// Playlist Card Component (Single card per playlist)
const PlaylistCard = ({ playlist, onPlay, delay }) => {
    const [isHovered, setIsHovered] = useState(false);

    // Get content type badge
    const getTypeBadge = () => {
        if (playlist.groupTypes?.includes('Movies')) return { label: 'Movie', color: '#e50914' };
        if (playlist.groupTypes?.includes('Series')) return { label: 'Series', color: '#3ea6ff' };
        if (playlist.groupTypes?.includes('TV')) return { label: 'TV', color: '#9b59b6' };
        return null;
    };

    const typeBadge = getTypeBadge();
    const episodeCount = playlist.episodeCount || playlist.episodes?.length || 0;

    return (
        <motion.div
            className="playlist-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.97 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onPlay}
        >
            <div className="card-image">
                <img
                    src={playlist.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=1a1a2e&color=fff&size=300`}
                    alt={playlist.name}
                    loading="lazy"
                />

                {/* Type Badge */}
                {typeBadge && (
                    <div className="card-type-badge" style={{ background: typeBadge.color }}>
                        {typeBadge.label}
                    </div>
                )}

                {/* Episode Count Badge */}
                {episodeCount > 1 && (
                    <div className="card-episode-badge">
                        <span>{episodeCount}</span> EP
                    </div>
                )}

                {/* Hover Glow */}
                <div className="card-glow" />

                {/* Play Button Overlay */}
                <div className="card-overlay">
                    <motion.div
                        className="play-icon"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: isHovered ? 1 : 0, opacity: isHovered ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    >
                        <Play size={26} fill="white" />
                    </motion.div>
                </div>

                {/* Bottom Gradient */}
                <div className="card-bottom-gradient" />

                {/* Card Info */}
                <div className="card-info">
                    <h3 className="card-title">{playlist.name}</h3>
                    {episodeCount > 0 && (
                        <p className="card-subtitle">{episodeCount} {episodeCount === 1 ? 'Episode' : 'Episodes'}</p>
                    )}
                </div>
            </div>

            <style>{`
                .playlist-card {
                    cursor: pointer;
                    border-radius: 14px;
                    overflow: hidden;
                    background: linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%);
                    transition: box-shadow 0.4s ease, transform 0.3s ease;
                    position: relative;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                }

                .playlist-card:hover {
                    box-shadow: 
                        0 12px 40px rgba(229, 9, 20, 0.35), 
                        0 0 80px rgba(229, 9, 20, 0.15),
                        inset 0 0 0 1px rgba(255, 255, 255, 0.1);
                }

                .card-image {
                    position: relative;
                    width: 100%;
                    aspect-ratio: 2 / 3;
                    overflow: hidden;
                }

                .card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.5s ease, filter 0.3s ease;
                }

                .playlist-card:hover .card-image img {
                    transform: scale(1.12);
                    filter: brightness(0.85);
                }

                .card-type-badge {
                    position: absolute;
                    top: 10px;
                    left: 10px;
                    padding: 4px 10px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    color: white;
                    backdrop-filter: blur(8px);
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                    z-index: 3;
                }

                .card-episode-badge {
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 10px;
                    font-weight: 600;
                    color: white;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    z-index: 3;
                }

                .card-episode-badge span {
                    font-weight: 800;
                    color: #e50914;
                }

                .card-glow {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: radial-gradient(
                        ellipse at center,
                        rgba(229, 9, 20, 0.3) 0%,
                        transparent 70%
                    );
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .playlist-card:hover .card-glow {
                    opacity: 1;
                }

                .card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        180deg,
                        rgba(0, 0, 0, 0.1) 0%,
                        rgba(0, 0, 0, 0.4) 100%
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }

                .playlist-card:hover .card-overlay {
                    opacity: 1;
                }

                .play-icon {
                    width: 56px;
                    height: 56px;
                    background: linear-gradient(135deg, #e50914 0%, #b20710 100%);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 
                        0 6px 30px rgba(229, 9, 20, 0.7),
                        inset 0 1px 0 rgba(255, 255, 255, 0.2);
                    border: 2px solid rgba(255, 255, 255, 0.2);
                }

                .card-bottom-gradient {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 60%;
                    background: linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(0, 0, 0, 0.5) 30%,
                        rgba(0, 0, 0, 0.95) 100%
                    );
                    pointer-events: none;
                }

                .card-info {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    padding: 16px 14px;
                    z-index: 2;
                }

                .card-title {
                    font-size: 14px;
                    font-weight: 700;
                    color: #fff;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.35;
                    margin: 0 0 4px;
                    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.9);
                }

                .card-subtitle {
                    font-size: 11px;
                    color: rgba(255, 255, 255, 0.6);
                    margin: 0;
                    font-weight: 500;
                }

                @media (max-width: 768px) {
                    .playlist-card {
                        border-radius: 10px;
                    }

                    .card-title {
                        font-size: 12px;
                    }

                    .card-subtitle {
                        font-size: 10px;
                    }

                    .card-info {
                        padding: 12px 10px;
                    }

                    .card-type-badge {
                        font-size: 8px;
                        padding: 3px 6px;
                        top: 6px;
                        left: 6px;
                    }

                    .card-episode-badge {
                        font-size: 9px;
                        padding: 3px 6px;
                        top: 6px;
                        right: 6px;
                    }

                    .play-icon {
                        width: 44px;
                        height: 44px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

// Loading State Component
const LoadingState = () => (
    <div className="loading-state">
        <div className="loading-hero" />
        <div className="loading-grid">
            {[1, 2, 3, 4, 5, 6].map(card => (
                <div key={card} className="loading-card" />
            ))}
        </div>
    </div>
);

export default HomePage;
