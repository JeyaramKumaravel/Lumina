import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Star, Clock, Film, RefreshCw } from 'lucide-react';
import { fetchAllPlaylists, getFeaturedPlaylist } from '../utils/m3uPlaylistService';

const HomePage = ({ onPlayVideo, onPlaylistsLoaded }) => {
    const [playlists, setPlaylists] = useState([]);
    const [featuredPlaylist, setFeaturedPlaylist] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        loadPlaylists();
    }, []);

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

    const handlePlayEpisode = (episode) => {
        if (onPlayVideo) {
            onPlayVideo(episode.url, episode.title, episode.packageName);
        }
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
            {/* Hero Section */}
            {featuredPlaylist && (
                <HeroSection
                    playlist={featuredPlaylist}
                    onPlay={handlePlayEpisode}
                />
            )}

            {/* Content Rows */}
            <div className="content-rows">
                {playlists.map((playlist, index) => (
                    <ContentRow
                        key={playlist.id}
                        playlist={playlist}
                        onPlayEpisode={handlePlayEpisode}
                        delay={index * 0.1}
                    />
                ))}
            </div>

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

                .content-rows {
                    padding: 20px 0;
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

                .loading-row {
                    margin-bottom: 32px;
                }

                .loading-title {
                    height: 24px;
                    width: 200px;
                    background: #222;
                    border-radius: 8px;
                    margin-bottom: 16px;
                    animation: shimmer 1.5s infinite;
                }

                .loading-cards {
                    display: flex;
                    gap: 16px;
                    overflow: hidden;
                }

                .loading-card {
                    min-width: 180px;
                    height: 270px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    border-radius: 12px;
                    animation: shimmer 1.5s infinite;
                }

                @keyframes shimmer {
                    0%, 100% { opacity: 0.5; }
                    50% { opacity: 0.8; }
                }
            `}</style>
        </div>
    );
};

// Hero Section Component
const HeroSection = ({ playlist, onPlay }) => {
    const firstEpisode = playlist.episodes[0];

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
                    <p className="hero-description">
                        Watch {playlist.name} - All {playlist.episodeCount} episodes available now!
                    </p>
                    <div className="hero-actions">
                        <motion.button
                            className="play-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => onPlay(firstEpisode)}
                        >
                            <Play size={22} fill="black" /> Play
                        </motion.button>
                        <motion.button
                            className="info-btn"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            More Info
                        </motion.button>
                    </div>
                </motion.div>
            </div>

            <style>{`
                .hero-section {
                    position: relative;
                    height: 65vh;
                    min-height: 400px;
                    max-height: 600px;
                    overflow: hidden;
                }

                .hero-backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-size: cover;
                    background-position: center top;
                    filter: blur(0px);
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
                        rgba(10, 10, 10, 0.7) 40%,
                        rgba(10, 10, 10, 0.3) 70%,
                        transparent 100%
                    ),
                    linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(10, 10, 10, 0.5) 70%,
                        rgba(10, 10, 10, 1) 100%
                    );
                }

                .hero-content {
                    position: relative;
                    height: 100%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 0 48px;
                    max-width: 600px;
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
                    margin-bottom: 16px;
                }

                .hero-title {
                    font-size: clamp(28px, 5vw, 52px);
                    font-weight: 800;
                    line-height: 1.1;
                    margin-bottom: 16px;
                    text-shadow: 2px 2px 20px rgba(0, 0, 0, 0.5);
                }

                .hero-meta {
                    display: flex;
                    gap: 20px;
                    margin-bottom: 16px;
                    font-size: 14px;
                    color: #aaa;
                }

                .hero-meta span {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }

                .hero-description {
                    font-size: 16px;
                    color: #ccc;
                    line-height: 1.5;
                    margin-bottom: 24px;
                    max-width: 450px;
                }

                .hero-actions {
                    display: flex;
                    gap: 12px;
                }

                .play-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 32px;
                    background: white;
                    border: none;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 700;
                    color: black;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .play-btn:hover {
                    background: #e6e6e6;
                }

                .info-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 14px 28px;
                    background: rgba(255, 255, 255, 0.15);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    color: white;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .info-btn:hover {
                    background: rgba(255, 255, 255, 0.25);
                }

                @media (max-width: 768px) {
                    .hero-section {
                        height: 55vh;
                        min-height: 350px;
                    }

                    .hero-content {
                        padding: 0 20px;
                    }

                    .hero-actions {
                        flex-direction: column;
                    }

                    .play-btn, .info-btn {
                        width: 100%;
                        justify-content: center;
                    }
                }
            `}</style>
        </motion.div>
    );
};

// Content Row Component (Netflix-style carousel)
const ContentRow = ({ playlist, onPlayEpisode, delay }) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.8;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <motion.div
            className="content-row"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.5 }}
        >
            <div className="row-header">
                <h2 className="row-title">{playlist.name}</h2>
                <span className="episode-count">{playlist.episodeCount} Episodes</span>
            </div>

            <div className="carousel-container">
                <AnimatePresence>
                    {canScrollLeft && (
                        <motion.button
                            className="scroll-btn scroll-left"
                            onClick={() => scroll('left')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ChevronLeft size={28} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div
                    className="episode-carousel"
                    ref={scrollRef}
                    onScroll={checkScroll}
                >
                    {playlist.episodes.map((episode, index) => (
                        <EpisodeCard
                            key={episode.id}
                            episode={episode}
                            index={index + 1}
                            onClick={() => onPlayEpisode(episode)}
                        />
                    ))}
                </div>

                <AnimatePresence>
                    {canScrollRight && (
                        <motion.button
                            className="scroll-btn scroll-right"
                            onClick={() => scroll('right')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ChevronRight size={28} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            <style>{`
                .content-row {
                    margin-bottom: 36px;
                    padding: 0 16px;
                }

                .row-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding: 0 8px;
                }

                .row-title {
                    font-size: 20px;
                    font-weight: 700;
                    color: #fff;
                }

                .episode-count {
                    font-size: 13px;
                    color: #888;
                    padding: 4px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                }

                .carousel-container {
                    position: relative;
                }

                .episode-carousel {
                    display: flex;
                    gap: 14px;
                    overflow-x: auto;
                    scroll-behavior: smooth;
                    padding: 8px;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .episode-carousel::-webkit-scrollbar {
                    display: none;
                }

                .scroll-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 48px;
                    height: 48px;
                    background: rgba(20, 20, 20, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    transition: all 0.2s;
                    backdrop-filter: blur(10px);
                }

                .scroll-btn:hover {
                    background: rgba(40, 40, 40, 0.95);
                    transform: translateY(-50%) scale(1.1);
                }

                .scroll-left {
                    left: -8px;
                }

                .scroll-right {
                    right: -8px;
                }

                @media (max-width: 768px) {
                    .scroll-btn {
                        display: none;
                    }

                    .content-row {
                        padding: 0 12px;
                    }

                    .row-title {
                        font-size: 18px;
                    }
                }
            `}</style>
        </motion.div>
    );
};

// Episode Card Component
const EpisodeCard = ({ episode, index, onClick }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            className="episode-card"
            whileHover={{ scale: 1.05, y: -8 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            onClick={onClick}
        >
            <div className="card-image">
                <img
                    src={episode.thumbnail}
                    alt={episode.title}
                    loading="lazy"
                />
                <div className="card-overlay">
                    <motion.div
                        className="play-icon"
                        initial={{ scale: 0 }}
                        animate={{ scale: isHovered ? 1 : 0 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                    >
                        <Play size={32} fill="white" />
                    </motion.div>
                </div>
                <span className="episode-number">E{index}</span>
            </div>
            <div className="card-info">
                <h3 className="card-title">{episode.title}</h3>
                <span className="card-package">{episode.packageName}</span>
            </div>

            <style>{`
                .episode-card {
                    flex-shrink: 0;
                    width: 180px;
                    cursor: pointer;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #1a1a1a;
                    transition: box-shadow 0.3s;
                }

                .episode-card:hover {
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
                }

                .card-image {
                    position: relative;
                    width: 100%;
                    height: 240px;
                    overflow: hidden;
                }

                .card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s;
                }

                .episode-card:hover .card-image img {
                    transform: scale(1.1);
                }

                .card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(
                        180deg,
                        transparent 0%,
                        rgba(0, 0, 0, 0.3) 60%,
                        rgba(0, 0, 0, 0.7) 100%
                    );
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .episode-card:hover .card-overlay {
                    opacity: 1;
                }

                .play-icon {
                    width: 56px;
                    height: 56px;
                    background: rgba(229, 9, 20, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 20px rgba(229, 9, 20, 0.5);
                }

                .episode-number {
                    position: absolute;
                    top: 8px;
                    left: 8px;
                    padding: 4px 10px;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    border-radius: 6px;
                    font-size: 12px;
                    font-weight: 700;
                    color: #fff;
                }

                .card-info {
                    padding: 12px;
                }

                .card-title {
                    font-size: 14px;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 4px;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.3;
                }

                .card-package {
                    font-size: 12px;
                    color: #888;
                }

                @media (max-width: 768px) {
                    .episode-card {
                        width: 140px;
                    }

                    .card-image {
                        height: 190px;
                    }

                    .card-title {
                        font-size: 13px;
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
        {[1, 2, 3].map(row => (
            <div key={row} className="loading-row">
                <div className="loading-title" />
                <div className="loading-cards">
                    {[1, 2, 3, 4, 5, 6].map(card => (
                        <div key={card} className="loading-card" />
                    ))}
                </div>
            </div>
        ))}
    </div>
);

export default HomePage;
