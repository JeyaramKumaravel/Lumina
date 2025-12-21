import React, { useState } from 'react';
import { Search, Bell, User, Menu, Video, Mic, Library } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchOverlay from './SearchOverlay';

const Header = ({ onUrlSubmit, onOpenLibrary }) => {
    const [url, setUrl] = useState('');
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (url.trim()) {
            onUrlSubmit(url);
            setShowMobileSearch(false);
        }
    };

    return (
        <header className="header">
            <div className="header-left">
                <div className="logo">
                    <img src="/icon.png" alt="Lumina" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    <span className="logo-text">Lumina</span>
                </div>
            </div>

            {/* Desktop Search Button */}
            <div className="header-right">
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
                    background-color: #0f0f0f;
                    position: sticky;
                    top: 0;
                    z-index: 100;
                }
                
                .header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .logo {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    cursor: pointer;
                }
                
                .logo-text {
                    font-size: 20px;
                    font-weight: 700;
                    letter-spacing: -0.5px;
                    font-family: 'Oswald', 'Roboto', sans-serif;
                }
                
                .header-center {
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    max-width: 640px;
                    margin: 0 40px;
                }
                
                .search-form {
                    display: flex;
                    width: 100%;
                }
                
                .search-input-container {
                    flex: 1;
                    background: #121212;
                    border: 1px solid #303030;
                    border-radius: 40px 0 0 40px;
                    padding: 0 16px;
                    height: 40px;
                    display: flex;
                    align-items: center;
                }
                
                .search-input {
                    width: 100%;
                    font-size: 15px;
                    color: white;
                }
                
                .search-input::placeholder {
                    color: #888;
                }
                
                .search-btn {
                    height: 40px;
                    width: 64px;
                    background: #222;
                    border: 1px solid #303030;
                    border-left: none;
                    border-radius: 0 40px 40px 0;
                    color: white;
                }
                
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                
                .icon-btn {
                    padding: 8px;
                    border-radius: 50%;
                    color: white;
                }
                
                .icon-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }
                
                .profile-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #8e44ad, #3498db);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }
                
                .mobile-only {
                    display: none;
                }
                
                .mobile-search-dropdown {
                    position: absolute;
                    top: 56px;
                    left: 0;
                    right: 0;
                    background: #0f0f0f;
                    padding: 12px 16px;
                    border-bottom: 1px solid #303030;
                }
                
                .mobile-search-form {
                    display: flex;
                    gap: 8px;
                }
                
                .mobile-search-input {
                    flex: 1;
                    background: #121212;
                    border: 1px solid #303030;
                    border-radius: 8px;
                    padding: 10px 14px;
                    font-size: 15px;
                    color: white;
                }
                
                .mobile-search-btn {
                    padding: 10px 16px;
                    background: var(--accent, #ff0000);
                    border-radius: 8px;
                    color: white;
                }
                
                @media (max-width: 768px) {
                    .desktop-only {
                        display: none !important;
                    }
                    
                    .mobile-only {
                        display: flex !important;
                    }
                    
                    .header {
                        padding: 0 12px;
                    }
                    
                    .header-left {
                        gap: 12px;
                    }
                    
                    .logo-text {
                        font-size: 18px;
                    }
                }
            `}</style>
        </header>
    );
};

export default Header;
