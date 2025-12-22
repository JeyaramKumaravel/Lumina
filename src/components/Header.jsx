import React, { useState } from 'react';
import { Search, Library, Home } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchOverlay from './SearchOverlay';

const Header = ({ onUrlSubmit, onOpenLibrary, onGoHome, showHomeButton, playlists, onPlayVideo }) => {
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo" onClick={onGoHome} style={{ cursor: 'pointer' }}>
                    <img src="/icon.png" alt="Lumina" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <span className="logo-text">Lumina</span>
                </div>
            </div>

            {/* Desktop Search Button */}
            <div className="header-right">
                {showHomeButton && (
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="icon-btn home-btn"
                        onClick={onGoHome}
                        title="Home"
                    >
                        <Home size={22} />
                    </motion.button>
                )}

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="icon-btn"
                    onClick={() => setShowMobileSearch(true)}
                >
                    <Search size={22} />
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    className="icon-btn"
                    onClick={onOpenLibrary}
                    title="Media Library"
                >
                    <Library size={22} />
                </motion.button>
            </div>

            {/* Fullscreen Search Overlay */}
            <AnimatePresence>
                {showMobileSearch && (
                    <SearchOverlay
                        isOpen={showMobileSearch}
                        onClose={() => setShowMobileSearch(false)}
                        onSubmit={(query) => {
                            onUrlSubmit(query);
                            setShowMobileSearch(false);
                        }}
                        playlists={playlists}
                        onPlayVideo={(url, title, packageName) => {
                            onPlayVideo(url, title, packageName);
                            setShowMobileSearch(false);
                        }}
                    />
                )}
            </AnimatePresence>

            <style>{`
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 0 16px;
                    height: 56px;
                    background-color: rgba(15, 15, 15, 0.95);
                    backdrop-filter: blur(10px);
                    position: sticky;
                    top: 0;
                    z-index: 100;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    transition: opacity 0.2s;
                }

                .logo:hover {
                    opacity: 0.8;
                }
                
                .logo-text {
                    font-size: 22px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    font-family: 'Oswald', 'Roboto', sans-serif;
                    background: linear-gradient(135deg, #fff 0%, #888 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .icon-btn {
                    padding: 10px;
                    border-radius: 50%;
                    color: white;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    transition: background 0.2s;
                }
                
                .icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .home-btn {
                    background: rgba(229, 9, 20, 0.15);
                    color: #e50914;
                }

                .home-btn:hover {
                    background: rgba(229, 9, 20, 0.25);
                }
                
                @media (max-width: 768px) {
                    .header {
                        padding: 0 12px;
                    }
                    
                    .header-left {
                        gap: 12px;
                    }
                    
                    .logo-text {
                        font-size: 20px;
                    }

                    .icon-btn {
                        padding: 8px;
                    }
                }
            `}</style>
        </header>
    );
};

export default Header;
