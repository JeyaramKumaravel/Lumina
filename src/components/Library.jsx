import React, { useState, useEffect } from 'react';
import {
    Play, Heart, Clock, List,
    ChevronRight, Plus, ArrowLeft,
    Trash2, Edit2, Check, X, Users, UserPlus,
    Download, Upload, Settings
} from 'lucide-react';
import {
    getLibrary, getFavorites, getHistory, getPlaylists,
    removeFromHistory, clearHistory, removeFromFavorites,
    createPlaylist, deletePlaylist, renamePlaylist,
    removeFromPlaylist, exportLibrary, importLibrary
} from '../utils/libraryStorage';
import {
    getAllProfiles, getActiveProfile, setActiveProfile,
    createProfile, updateProfile, deleteProfile
} from '../utils/profileManager';

const Library = ({ isOpen, onClose, onPlayVideo }) => {
    const [view, setView] = useState('main');
    const [activePlaylist, setActivePlaylist] = useState(null);
    const [history, setHistory] = useState([]);
    const [playlists, setPlaylists] = useState([]);
    const [favorites, setFavorites] = useState([]);
    const [library, setLibrary] = useState([]);

    // Profile management
    const [profiles, setProfiles] = useState([]);
    const [activeProfile, setActiveProfileState] = useState(null);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [editName, setEditName] = useState('');
    const [editAvatar, setEditAvatar] = useState('');
    const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
    const [newProfileName, setNewProfileName] = useState('');

    // Playlist creation
    const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');

    useEffect(() => {
        if (isOpen) {
            refreshProfiles();
            refreshData();
        }
    }, [isOpen]);

    const refreshProfiles = () => {
        setProfiles(getAllProfiles());
        setActiveProfileState(getActiveProfile());
    };

    const refreshData = () => {
        setHistory(getHistory());
        setPlaylists(getPlaylists());
        setFavorites(getFavorites());
        setLibrary(getLibrary());
    };

    const handleSwitchProfile = (profileId) => {
        setActiveProfile(profileId);
        refreshProfiles();
        refreshData();
        setShowProfileSwitcher(false);
    };

    const handleCreateProfile = () => {
        if (newProfileName.trim()) {
            const newProfile = createProfile(newProfileName.trim());
            setActiveProfile(newProfile.id);
            refreshProfiles();
            refreshData();
            setNewProfileName('');
            setShowProfileSwitcher(false);
        }
    };

    const handleDeleteProfile = (profileId) => {
        if (profileId !== 'default' && window.confirm('Delete this profile and all its data?')) {
            deleteProfile(profileId);
            refreshProfiles();
            refreshData();
        }
    };

    const handleSaveProfile = () => {
        if (activeProfile) {
            updateProfile(activeProfile.id, { name: editName || 'Guest', avatarUrl: editAvatar });
            refreshProfiles();
            setIsEditingProfile(false);
        }
    };

    const handleCancelEdit = () => {
        setEditName(activeProfile?.name || '');
        setEditAvatar(activeProfile?.avatarUrl || '');
        setIsEditingProfile(false);
    };

    const handleCreatePlaylist = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName.trim());
            refreshData();
            setNewPlaylistName('');
            setShowCreatePlaylist(false);
        }
    };

    // Data Management
    const handleExportData = () => {
        if (window.confirm('Download your library, history, and playlists?')) {
            exportLibrary();
        }
    };

    const handleImportData = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (window.confirm('This will overwrite your current profile data. Continue?')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const success = importLibrary(event.target.result);
                    if (success) {
                        alert('Import successful!');
                        refreshData();
                    } else {
                        alert('Import failed. Invalid file format.');
                    }
                };
                reader.readAsText(file);
            }
        }
    };

    if (!isOpen) return null;

    const handleBack = () => {
        if (showProfileSwitcher) {
            setShowProfileSwitcher(false);
        } else if (showCreatePlaylist) {
            setShowCreatePlaylist(false);
        } else if (view !== 'main') {
            setView('main');
            setActivePlaylist(null);
            refreshData(); // Refresh to show potential changes
        } else {
            onClose();
        }
    };

    // --- Sub-View Renderers ---

    const renderHeader = (title, action) => (
        <div className="yt-you-header-nav">
            <button onClick={handleBack} className="yt-back-btn">
                <ArrowLeft size={24} />
            </button>
            <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '16px' }}>{title}</span>
            <div style={{ marginLeft: 'auto' }}>{action}</div>
        </div>
    );

    const renderVideoList = (items, onRemove, emptyMsg) => (
        <div className="yt-you-list-container" style={{ padding: '60px 0 20px' }}>
            {items.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#aaa' }}>{emptyMsg}</div> : items.map((item, idx) => (
                <div key={item.id || idx} style={{ display: 'flex', gap: '12px', padding: '12px 16px' }}>
                    <div style={{ width: '120px', height: '68px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }} onClick={() => onPlayVideo(item.url, item.title)}>
                        <img src={item.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=333&color=fff`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#aaa' }}>{item.channel || 'Video'} • {item.date || 'Unknown'}</div>
                    </div>
                    {onRemove && (
                        <button onClick={() => { onRemove(item); refreshData(); }} style={{ background: 'none', border: 'none', color: '#aaa', padding: '8px' }}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            ))}
        </div>
    );

    // Profile Switcher View
    if (showProfileSwitcher) {
        return (
            <div className="yt-you-page">
                {renderHeader('Switch Profile')}
                <div style={{ padding: '16px' }}>
                    {profiles.map(profile => (
                        <div
                            key={profile.id}
                            onClick={() => handleSwitchProfile(profile.id)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '12px',
                                borderRadius: '12px',
                                background: profile.id === activeProfile?.id ? 'rgba(255,255,255,0.1)' : 'transparent',
                                marginBottom: '8px',
                                cursor: 'pointer'
                            }}
                        >
                            <img
                                src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=333&color=fff&size=48`}
                                alt=""
                                style={{ width: '48px', height: '48px', borderRadius: '50%' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '500' }}>{profile.name}</div>
                                {profile.id === activeProfile?.id && <div style={{ fontSize: '12px', color: '#aaa' }}>Active</div>}
                            </div>
                            {profile.id !== 'default' && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteProfile(profile.id); }}
                                    style={{ background: 'none', border: 'none', color: '#ff4444', padding: '8px' }}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>
                    ))}

                    {/* Create New Profile */}
                    <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px' }}>
                        <div style={{ fontSize: '14px', color: '#aaa', marginBottom: '12px' }}>Create New Profile</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={newProfileName}
                                onChange={(e) => setNewProfileName(e.target.value)}
                                placeholder="Profile name"
                                style={{ flex: 1, background: '#222', border: '1px solid #444', borderRadius: '8px', padding: '10px 12px', color: 'white', fontSize: '14px' }}
                            />
                            <button
                                onClick={handleCreateProfile}
                                disabled={!newProfileName.trim()}
                                style={{ background: newProfileName.trim() ? '#ff0000' : '#333', border: 'none', borderRadius: '8px', padding: '10px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                                <UserPlus size={18} /> Add
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Create Playlist Modal
    if (showCreatePlaylist) {
        return (
            <div className="yt-you-page">
                {renderHeader('Create Playlist')}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <input
                            type="text"
                            value={newPlaylistName}
                            onChange={(e) => setNewPlaylistName(e.target.value)}
                            placeholder="Playlist name"
                            autoFocus
                            style={{
                                width: '100%',
                                background: 'transparent',
                                border: 'none',
                                borderBottom: '1px solid #3ea6ff',
                                fontSize: '18px',
                                color: 'white',
                                padding: '8px 0',
                                outline: 'none'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '16px' }}>
                        <button
                            onClick={() => setShowCreatePlaylist(false)}
                            style={{ background: 'none', border: 'none', color: 'white', fontWeight: '500' }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreatePlaylist}
                            disabled={!newPlaylistName.trim()}
                            style={{ background: 'none', border: 'none', color: newPlaylistName.trim() ? '#3ea6ff' : '#555', fontWeight: '500' }}
                        >
                            Create
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'history') {
        return (
            <div className="yt-you-page">
                {renderHeader('History', history.length > 0 && (
                    <button onClick={() => { clearHistory(); refreshData(); }} style={{ color: 'white', background: 'none', border: 'none' }}>Clear</button>
                ))}
                {renderVideoList(history, (item) => removeFromHistory(item.id), 'No watch history')}
            </div>
        );
    }

    if (view === 'liked') {
        return (
            <div className="yt-you-page">
                {renderHeader('Liked Videos')}
                {renderVideoList(favorites, (item) => removeFromFavorites(item.url), 'No liked videos')}
            </div>
        );
    }

    if (view === 'playlist' && activePlaylist) {
        return (
            <div className="yt-you-page">
                {renderHeader(activePlaylist.name, (
                    <button
                        onClick={() => {
                            if (window.confirm('Delete this playlist?')) {
                                deletePlaylist(activePlaylist.id);
                                refreshData();
                                handleBack();
                            }
                        }}
                        style={{ color: 'white', background: 'none', border: 'none' }}
                    >
                        <Trash2 size={20} />
                    </button>
                ))}
                {renderVideoList(activePlaylist.items, (item) => {
                    // Find current playlist version to ensure we are modifying live data
                    const plId = activePlaylist.id;
                    const targetItem = item;

                    if (window.confirm('Remove from playlist?')) {
                        // removeFromPlaylist logic
                        removeFromPlaylist(plId, targetItem.id);

                        // Update local state to reflect removal without full refresh needed immediately, or just refresh
                        const updated = playlists.find(p => p.id === plId);
                        if (updated) {
                            updated.items = updated.items.filter(i => i.id !== targetItem.id);
                            setActivePlaylist({ ...updated }); // Update active view
                        }
                        refreshData();
                    }
                }, 'No videos in this playlist')}
            </div>
        );
    }

    // --- Main Dashboard ---

    const avatarUrl = activeProfile?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(activeProfile?.name || 'Guest')}&background=333&color=fff&size=80`;

    return (
        <div className="yt-you-page">
            {/* Nav */}
            <div className="yt-you-header-nav">
                <button onClick={onClose} className="yt-back-btn"><ArrowLeft size={24} /></button>
                <button
                    onClick={() => setShowProfileSwitcher(true)}
                    style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'white', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px' }}
                >
                    <Users size={20} />
                    <span style={{ fontSize: '14px' }}>Switch</span>
                </button>
            </div>

            {/* Profile */}
            <div className="yt-you-profile">
                <img src={avatarUrl} alt="Profile" className="yt-you-avatar" />
                <div className="yt-you-info" style={{ flex: 1 }}>
                    {isEditingProfile ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Your name"
                                style={{ background: '#222', border: '1px solid #444', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '16px' }}
                            />
                            <input
                                type="text"
                                value={editAvatar}
                                onChange={(e) => setEditAvatar(e.target.value)}
                                placeholder="Avatar URL (optional)"
                                style={{ background: '#222', border: '1px solid #444', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '14px' }}
                            />
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handleSaveProfile} style={{ background: '#ff0000', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Check size={16} /> Save
                                </button>
                                <button onClick={handleCancelEdit} style={{ background: '#333', border: 'none', borderRadius: '8px', padding: '8px 16px', color: 'white', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <X size={16} /> Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h1 className="yt-you-name">{activeProfile?.name || 'Guest'}</h1>
                            <button
                                onClick={() => { setEditName(activeProfile?.name || ''); setEditAvatar(activeProfile?.avatarUrl || ''); setIsEditingProfile(true); }}
                                style={{ background: 'none', border: 'none', color: '#aaa', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 0', fontSize: '14px' }}
                            >
                                <Edit2 size={14} /> Edit Profile
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* History Section */}
            {history.length > 0 && (
                <div className="yt-you-section">
                    <div className="yt-you-section-header">
                        <h2>History</h2>
                        <button className="yt-you-view-all" onClick={() => setView('history')}>View all</button>
                    </div>
                    <div className="yt-you-carousel">
                        {history.slice(0, 10).map((item, i) => (
                            <div key={i} className="yt-playlist-card" onClick={() => onPlayVideo(item.url, item.title)}>
                                <div className="yt-playlist-thumb" style={{ position: 'relative' }}>
                                    <img src={item.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.title)}&background=333&color=fff`} alt="" />
                                    <div className="yt-playlist-count"><Play size={10} fill="white" /></div>
                                </div>
                                <div className="yt-playlist-details">
                                    <span className="yt-playlist-title">{item.title}</span>
                                    <span className="yt-playlist-privacy">{item.channel || 'Video'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Playlists Section */}
            <div className="yt-you-section">
                <div className="yt-you-section-header">
                    <h2>Playlists</h2>
                    <div className="yt-you-section-actions">
                        <button onClick={() => setShowCreatePlaylist(true)} style={{ background: 'none', border: 'none', color: 'white', padding: '4px' }}>
                            <Plus size={24} strokeWidth={1.5} />
                        </button>
                        <button className="yt-you-view-all">View all</button>
                    </div>
                </div>

                <div className="yt-you-carousel">
                    {/* Liked Videos */}
                    <div className="yt-playlist-card" onClick={() => setView('liked')}>
                        <div className="yt-playlist-thumb placeholder-likes">
                            <div className="yt-likes-gradient"><Heart size={32} fill="white" /></div>
                            <div className="yt-playlist-count">{favorites.length}</div>
                        </div>
                        <div className="yt-playlist-details">
                            <span className="yt-playlist-title">Liked videos</span>
                            <span className="yt-playlist-privacy">Private</span>
                        </div>
                    </div>

                    {/* User Playlists */}
                    {playlists.map(pl => (
                        <div key={pl.id} className="yt-playlist-card" onClick={() => { setActivePlaylist(pl); setView('playlist'); }}>
                            <div className="yt-playlist-thumb">
                                {pl.items[0]?.thumbnail ? <img src={pl.items[0].thumbnail} alt="" /> : <div className="thumb-placeholder"><List size={32} /></div>}
                                <div className="yt-playlist-count">{pl.items.length}</div>
                            </div>
                            <div className="yt-playlist-details">
                                <span className="yt-playlist-title">{pl.name}</span>
                                <span className="yt-playlist-privacy">Private</span>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete playlist?')) { deletePlaylist(pl.id); refreshData(); } }}
                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', padding: '4px', color: 'white' }}
                            >
                                <Trash2 size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Data & Settings Section */}
            <div className="yt-you-section" style={{ marginTop: '24px', paddingBottom: '40px' }}>
                <div className="yt-you-section-header">
                    <h2>Data & Storage</h2>
                </div>
                <div style={{ display: 'flex', gap: '12px', padding: '0 16px' }}>
                    <button
                        onClick={handleExportData}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#272727', border: 'none', borderRadius: '18px', padding: '12px', color: 'white', fontSize: '14px', fontWeight: '500' }}
                    >
                        <Download size={18} /> Export Data
                    </button>
                    <button
                        onClick={() => document.getElementById('import-file').click()}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: '#272727', border: 'none', borderRadius: '18px', padding: '12px', color: 'white', fontSize: '14px', fontWeight: '500' }}
                    >
                        <Upload size={18} /> Import Data
                    </button>
                    <input
                        id="import-file"
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        style={{ display: 'none' }}
                    />
                </div>
            </div>
        </div>
    );
};

export default Library;
