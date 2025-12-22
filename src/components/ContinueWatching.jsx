import React from 'react';
import { motion } from 'framer-motion';
import { Play, Clock, X } from 'lucide-react';
import { getContinueWatching, clearVideoProgress } from '../utils/libraryStorage';

const ContinueWatching = ({ onPlay, refreshTrigger }) => {
    const [items, setItems] = React.useState([]);

    React.useEffect(() => {
        setItems(getContinueWatching());
    }, [refreshTrigger]);

    const handleRemove = (e, url) => {
        e.stopPropagation();
        clearVideoProgress(url);
        setItems(getContinueWatching());
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const formatTimeLeft = (current, duration) => {
        const left = duration - current;
        const mins = Math.floor(left / 60);
        return `${mins} min left`;
    };

    if (items.length === 0) return null;

    return (
        <div className="continue-watching">
            <h2 className="cw-title">
                <Clock size={20} /> Continue Watching
            </h2>
            <div className="cw-scroll">
                {items.map((item, index) => (
                    <motion.div
                        key={item.id}
                        className="cw-card"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onPlay(item.url, item.title, item.currentTime)}
                    >
                        <div className="cw-thumb">
                            {item.thumbnail ? (
                                <img src={item.thumbnail} alt="" />
                            ) : (
                                <div className="cw-thumb-placeholder">
                                    <Play size={24} />
                                </div>
                            )}
                            <div className="cw-progress-bar">
                                <div
                                    className="cw-progress-fill"
                                    style={{ width: `${item.progressPercent}%` }}
                                />
                            </div>
                            <button
                                className="cw-remove"
                                onClick={(e) => handleRemove(e, item.url)}
                            >
                                <X size={14} />
                            </button>
                            <div className="cw-play-overlay">
                                <Play size={28} fill="white" />
                            </div>
                        </div>
                        <div className="cw-info">
                            <span className="cw-name">{item.title}</span>
                            <span className="cw-time">
                                {formatTimeLeft(item.currentTime, item.duration)}
                            </span>
                        </div>
                    </motion.div>
                ))}
            </div>

            <style>{`
                .continue-watching {
                    padding: 20px 24px;
                    margin-bottom: 10px;
                }

                .cw-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 18px;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 16px;
                }

                .cw-title svg {
                    color: #e50914;
                }

                .cw-scroll {
                    display: flex;
                    gap: 14px;
                    overflow-x: auto;
                    padding-bottom: 10px;
                    scrollbar-width: none;
                    -ms-overflow-style: none;
                }

                .cw-scroll::-webkit-scrollbar {
                    display: none;
                }

                .cw-card {
                    flex-shrink: 0;
                    width: 180px;
                    cursor: pointer;
                    border-radius: 12px;
                    overflow: hidden;
                    background: #1a1a1a;
                    transition: box-shadow 0.2s;
                }

                .cw-card:hover {
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
                }

                .cw-thumb {
                    position: relative;
                    width: 100%;
                    height: 100px;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                }

                .cw-thumb img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .cw-thumb-placeholder {
                    width: 100%;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #444;
                }

                .cw-progress-bar {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 4px;
                    background: rgba(255, 255, 255, 0.2);
                }

                .cw-progress-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #e50914, #ff4444);
                    border-radius: 0 2px 2px 0;
                }

                .cw-remove {
                    position: absolute;
                    top: 6px;
                    right: 6px;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    background: rgba(0, 0, 0, 0.7);
                    border: none;
                    color: #fff;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s;
                }

                .cw-card:hover .cw-remove {
                    opacity: 1;
                }

                .cw-remove:hover {
                    background: #e50914;
                }

                .cw-play-overlay {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 44px;
                    height: 44px;
                    border-radius: 50%;
                    background: rgba(229, 9, 20, 0.9);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    opacity: 0;
                    transition: opacity 0.2s, transform 0.2s;
                }

                .cw-card:hover .cw-play-overlay {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1.1);
                }

                .cw-info {
                    padding: 10px 12px;
                }

                .cw-name {
                    display: block;
                    font-size: 13px;
                    font-weight: 500;
                    color: #fff;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .cw-time {
                    display: block;
                    font-size: 11px;
                    color: #888;
                    margin-top: 3px;
                }

                @media (max-width: 768px) {
                    .continue-watching {
                        padding: 16px;
                    }

                    .cw-card {
                        width: 150px;
                    }

                    .cw-thumb {
                        height: 85px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ContinueWatching;
