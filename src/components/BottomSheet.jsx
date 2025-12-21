import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const BottomSheet = ({ isOpen, onClose, title, children }) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="yt-sheet-backdrop"
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0, 0, 0, 0.6)',
                            zIndex: 100
                        }}
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="yt-bottom-sheet"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            position: 'fixed',
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: '#1e1e1e',
                            borderTopLeftRadius: '12px',
                            borderTopRightRadius: '12px',
                            padding: '16px',
                            zIndex: 101,
                            maxHeight: '80vh',
                            display: 'flex',
                            flexDirection: 'column',
                            color: 'white'
                        }}
                    >
                        {/* Header */}
                        <div className="yt-sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{title}</h2>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', padding: '4px', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="yt-sheet-content" style={{ overflowY: 'auto' }}>
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;
