import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, Film, ChevronUp, ChevronDown } from 'lucide-react';

const Recommendations = ({
    recommendations,
    currentUrl,
    onPlayEpisode,
    isExpanded,
    onToggleExpand
}) => {
    const scrollRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const currentCardRef = useRef(null);

    useEffect(() => {
        // Scroll to current episode when recommendations change
        if (currentCardRef.current && scrollRef.current) {
            const cardRect = currentCardRef.current.getBoundingClientRect();
            const containerRect = scrollRef.current.getBoundingClientRect();
            const scrollLeft = currentCardRef.current.offsetLeft - containerRect.width / 2 + cardRect.width / 2;
            scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, [currentUrl, recommendations]);

    const checkScroll = () => {
        if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    const scroll = (direction) => {
        if (scrollRef.current) {
            const scrollAmount = scrollRef.current.clientWidth * 0.6;
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    if (!recommendations || recommendations.episodes.length === 0) {
        return null;
    }

    const { packageName, episodes, currentIndex } = recommendations;

    return (
        <motion.div
            className="recommendations-container"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {/* Header */}
            <div className="rec-header" onClick={onToggleExpand}>
                <div className="rec-header-left">
                    <Film size={18} />
                    <h3 className="rec-title">{packageName}</h3>
                    <span className="rec-count">
                        {currentIndex + 1} / {episodes.length}
                    </span>
                </div>
                <button className="expand-btn">
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
                    <span>{isExpanded ? 'Collapse' : 'More Episodes'}</span>
                </button>
            </div>

            {/* Horizontal Carousel (Always Visible) */}
            <div className="rec-carousel-wrapper">
                <AnimatePresence>
                    {canScrollLeft && (
                        <motion.button
                            className="rec-scroll-btn rec-scroll-left"
                            onClick={() => scroll('left')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ChevronLeft size={22} />
                        </motion.button>
                    )}
                </AnimatePresence>

                <div
                    className="rec-carousel"
                    ref={scrollRef}
                    onScroll={checkScroll}
                >
                    {episodes.map((episode, index) => {
                        const isCurrent = episode.url === currentUrl;
                        return (
                            <motion.div
                                key={episode.id}
                                ref={isCurrent ? currentCardRef : null}
                                className={`rec-card ${isCurrent ? 'rec-card-current' : ''}`}
                                whileHover={{ scale: 1.03, y: -4 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => !isCurrent && onPlayEpisode(episode)}
                            >
                                <div className="rec-card-image">
                                    <img
                                        src={episode.thumbnail}
                                        alt={episode.title}
                                        loading="lazy"
                                    />
                                    <div className="rec-card-overlay">
                                        {isCurrent ? (
                                            <div className="now-playing-badge">
                                                <span className="pulse-dot" />
                                                Now Playing
                                            </div>
                                        ) : (
                                            <div className="rec-play-icon">
                                                <Play size={24} fill="white" />
                                            </div>
                                        )}
                                    </div>
                                    <span className="rec-episode-num">E{index + 1}</span>
                                </div>
                                <div className="rec-card-info">
                                    <span className="rec-card-title">{episode.title}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <AnimatePresence>
                    {canScrollRight && (
                        <motion.button
                            className="rec-scroll-btn rec-scroll-right"
                            onClick={() => scroll('right')}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <ChevronRight size={22} />
                        </motion.button>
                    )}
                </AnimatePresence>
            </div>

            {/* Expanded Grid View */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        className="rec-grid"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {episodes.map((episode, index) => {
                            const isCurrent = episode.url === currentUrl;
                            return (
                                <motion.div
                                    key={episode.id}
                                    className={`rec-grid-card ${isCurrent ? 'rec-grid-current' : ''}`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => !isCurrent && onPlayEpisode(episode)}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <div className="rec-grid-thumb">
                                        <img src={episode.thumbnail} alt="" />
                                        {isCurrent && (
                                            <div className="grid-now-playing">
                                                <span className="pulse-dot" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="rec-grid-info">
                                        <span className="rec-grid-num">E{index + 1}</span>
                                        <span className="rec-grid-title">{episode.title}</span>
                                    </div>
                                    {!isCurrent && (
                                        <div className="rec-grid-play">
                                            <Play size={16} fill="white" />
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .recommendations-container {
                    background: linear-gradient(180deg, #0a0a0a 0%, #141414 100%);
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    padding: 16px 0;
                }

                .rec-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 0 16px 12px;
                    cursor: pointer;
                }

                .rec-header-left {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #fff;
                }

                .rec-title {
                    font-size: 16px;
                    font-weight: 700;
                    margin: 0;
                }

                .rec-count {
                    font-size: 13px;
                    color: #888;
                    padding: 3px 10px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }

                .expand-btn {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 8px 14px;
                    background: rgba(255, 255, 255, 0.1);
                    border: none;
                    border-radius: 20px;
                    color: #fff;
                    font-size: 13px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: background 0.2s;
                }

                .expand-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .rec-carousel-wrapper {
                    position: relative;
                    padding: 0 8px;
                }

                .rec-carousel {
                    display: flex;
                    gap: 12px;
                    overflow-x: auto;
                    padding: 8px;
                    scroll-behavior: smooth;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .rec-carousel::-webkit-scrollbar {
                    display: none;
                }

                .rec-scroll-btn {
                    position: absolute;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 36px;
                    height: 36px;
                    background: rgba(20, 20, 20, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    z-index: 10;
                    backdrop-filter: blur(8px);
                }

                .rec-scroll-left { left: 0; }
                .rec-scroll-right { right: 0; }

                .rec-card {
                    flex-shrink: 0;
                    width: 140px;
                    cursor: pointer;
                    border-radius: 10px;
                    overflow: hidden;
                    background: #1a1a1a;
                    border: 2px solid transparent;
                    transition: border-color 0.2s;
                }

                .rec-card-current {
                    border-color: #e50914;
                    box-shadow: 0 0 20px rgba(229, 9, 20, 0.3);
                }

                .rec-card-image {
                    position: relative;
                    width: 100%;
                    height: 180px;
                    overflow: hidden;
                }

                .rec-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s;
                }

                .rec-card:hover .rec-card-image img {
                    transform: scale(1.1);
                }

                .rec-card-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8) 100%);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .rec-card:hover .rec-card-overlay,
                .rec-card-current .rec-card-overlay {
                    opacity: 1;
                }

                .rec-play-icon {
                    width: 44px;
                    height: 44px;
                    background: rgba(229, 9, 20, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .now-playing-badge {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    padding: 6px 12px;
                    background: rgba(229, 9, 20, 0.9);
                    border-radius: 16px;
                    font-size: 12px;
                    font-weight: 600;
                    color: white;
                }

                .pulse-dot {
                    width: 8px;
                    height: 8px;
                    background: #fff;
                    border-radius: 50%;
                    animation: pulse 1.5s ease-in-out infinite;
                }

                @keyframes pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.8); }
                }

                .rec-episode-num {
                    position: absolute;
                    top: 6px;
                    left: 6px;
                    padding: 3px 8px;
                    background: rgba(0, 0, 0, 0.7);
                    backdrop-filter: blur(4px);
                    border-radius: 4px;
                    font-size: 11px;
                    font-weight: 700;
                    color: #fff;
                }

                .rec-card-info {
                    padding: 10px;
                }

                .rec-card-title {
                    font-size: 12px;
                    font-weight: 500;
                    color: #fff;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    line-height: 1.3;
                }

                /* Expanded Grid */
                .rec-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                    gap: 10px;
                    padding: 16px;
                    margin-top: 8px;
                    border-top: 1px solid rgba(255, 255, 255, 0.05);
                    overflow: hidden;
                }

                .rec-grid-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    transition: all 0.2s;
                }

                .rec-grid-card:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .rec-grid-current {
                    background: rgba(229, 9, 20, 0.15);
                    border-color: rgba(229, 9, 20, 0.5);
                }

                .rec-grid-thumb {
                    position: relative;
                    width: 60px;
                    height: 80px;
                    border-radius: 6px;
                    overflow: hidden;
                    flex-shrink: 0;
                }

                .rec-grid-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .grid-now-playing {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 24px;
                    height: 24px;
                    background: rgba(229, 9, 20, 0.9);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .rec-grid-info {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    min-width: 0;
                }

                .rec-grid-num {
                    font-size: 11px;
                    font-weight: 700;
                    color: #888;
                }

                .rec-grid-title {
                    font-size: 13px;
                    font-weight: 500;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .rec-grid-play {
                    width: 32px;
                    height: 32px;
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    flex-shrink: 0;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .rec-grid-card:hover .rec-grid-play {
                    opacity: 1;
                }

                @media (max-width: 768px) {
                    .rec-scroll-btn {
                        display: none;
                    }

                    .rec-card {
                        width: 120px;
                    }

                    .rec-card-image {
                        height: 150px;
                    }

                    .rec-grid {
                        grid-template-columns: 1fr;
                    }

                    .expand-btn span {
                        display: none;
                    }
                }
            `}</style>
        </motion.div>
    );
};

export default Recommendations;
