/**
 * Media Library Storage Utility
 * Handles localStorage CRUD operations for library, playlists, history, and favorites
 * Now supports multi-profile isolation
 */

import { getActiveProfileId } from './profileManager';

// Get profile-specific storage key
const getKey = (baseKey) => {
    const profileId = getActiveProfileId();
    return `${baseKey}_${profileId}`;
};

const BASE_KEYS = {
    LIBRARY: 'mediaLibrary',
    PLAYLISTS: 'mediaPlaylists',
    HISTORY: 'watchHistory',
    FAVORITES: 'favorites',
    CONTINUE_WATCHING: 'continueWatching'
};

// Generate unique ID
const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

// ===== LIBRARY (All saved media) =====

export const getLibrary = () => {
    try {
        return JSON.parse(localStorage.getItem(getKey(BASE_KEYS.LIBRARY))) || [];
    } catch {
        return [];
    }
};

export const saveToLibrary = (item) => {
    const library = getLibrary();
    const newItem = {
        id: generateId(),
        title: item.title || 'Untitled',
        url: item.url,
        thumbnail: item.thumbnail || null,
        type: item.type || 'video',
        addedAt: new Date().toISOString(),
        ...item
    };

    if (!library.some(i => i.url === item.url)) {
        library.unshift(newItem);
        localStorage.setItem(getKey(BASE_KEYS.LIBRARY), JSON.stringify(library));
    }
    return newItem;
};

export const removeFromLibrary = (id) => {
    const library = getLibrary().filter(item => item.id !== id);
    localStorage.setItem(getKey(BASE_KEYS.LIBRARY), JSON.stringify(library));
};

export const updateLibraryItem = (id, updates) => {
    const library = getLibrary().map(item =>
        item.id === id ? { ...item, ...updates } : item
    );
    localStorage.setItem(getKey(BASE_KEYS.LIBRARY), JSON.stringify(library));
};

// ===== FAVORITES =====

export const getFavorites = () => {
    try {
        return JSON.parse(localStorage.getItem(getKey(BASE_KEYS.FAVORITES))) || [];
    } catch {
        return [];
    }
};

export const addToFavorites = (item) => {
    const favorites = getFavorites();
    const newItem = {
        id: generateId(),
        title: item.title || 'Untitled',
        url: item.url,
        thumbnail: item.thumbnail || null,
        addedAt: new Date().toISOString(),
        ...item
    };

    if (!favorites.some(i => i.url === item.url)) {
        favorites.unshift(newItem);
        localStorage.setItem(getKey(BASE_KEYS.FAVORITES), JSON.stringify(favorites));
    }
    return newItem;
};

export const removeFromFavorites = (url) => {
    const favorites = getFavorites().filter(item => item.url !== url);
    localStorage.setItem(getKey(BASE_KEYS.FAVORITES), JSON.stringify(favorites));
};

export const isFavorite = (url) => {
    return getFavorites().some(item => item.url === url);
};

export const toggleFavorite = (item) => {
    if (isFavorite(item.url)) {
        removeFromFavorites(item.url);
        return false;
    } else {
        addToFavorites(item);
        return true;
    }
};

// ===== WATCH HISTORY =====

export const getHistory = () => {
    try {
        return JSON.parse(localStorage.getItem(getKey(BASE_KEYS.HISTORY))) || [];
    } catch {
        return [];
    }
};

export const addToHistory = (item) => {
    let history = getHistory();
    history = history.filter(i => i.url !== item.url);

    const newItem = {
        id: generateId(),
        title: item.title || 'Untitled',
        url: item.url,
        thumbnail: item.thumbnail || null,
        watchedAt: new Date().toISOString(),
        ...item
    };

    history.unshift(newItem);
    if (history.length > 100) history = history.slice(0, 100);

    localStorage.setItem(getKey(BASE_KEYS.HISTORY), JSON.stringify(history));
    return newItem;
};

export const clearHistory = () => {
    localStorage.setItem(getKey(BASE_KEYS.HISTORY), JSON.stringify([]));
};

export const removeFromHistory = (id) => {
    const history = getHistory().filter(item => item.id !== id);
    localStorage.setItem(getKey(BASE_KEYS.HISTORY), JSON.stringify(history));
};

/**
 * Update history item with playback progress
 * This keeps progress in history even if removed from Continue Watching
 */
export const updateHistoryProgress = (url, currentTime, duration) => {
    if (!url || !duration || duration === Infinity) return;

    const progressPercent = (currentTime / duration) * 100;
    let history = getHistory();

    history = history.map(item => {
        if (item.url === url) {
            return {
                ...item,
                currentTime,
                duration,
                progressPercent,
                lastProgressUpdate: new Date().toISOString()
            };
        }
        return item;
    });

    localStorage.setItem(getKey(BASE_KEYS.HISTORY), JSON.stringify(history));
};

// ===== CONTINUE WATCHING (Video Progress) =====

export const getContinueWatching = () => {
    try {
        return JSON.parse(localStorage.getItem(getKey(BASE_KEYS.CONTINUE_WATCHING))) || [];
    } catch {
        return [];
    }
};

/**
 * Save video progress for resume later
 * Only saves if between 5% and 95% watched
 */
export const saveVideoProgress = (url, currentTime, duration, title = 'Video', thumbnail = null) => {
    if (!url || !duration || duration === Infinity) return;

    const progressPercent = (currentTime / duration) * 100;

    // Only save if between 5% and 95%
    if (progressPercent < 5 || progressPercent > 95) return;

    let continueWatching = getContinueWatching();

    // Remove existing entry for this URL
    continueWatching = continueWatching.filter(i => i.url !== url);

    const newItem = {
        id: generateId(),
        url,
        title,
        thumbnail,
        currentTime,
        duration,
        progressPercent,
        lastWatched: new Date().toISOString()
    };

    // Add to beginning (most recent first)
    continueWatching.unshift(newItem);

    // Keep only last 20 items
    if (continueWatching.length > 20) {
        continueWatching = continueWatching.slice(0, 20);
    }

    localStorage.setItem(getKey(BASE_KEYS.CONTINUE_WATCHING), JSON.stringify(continueWatching));
    return newItem;
};

/**
 * Get saved progress for a specific video
 */
export const getVideoProgress = (url) => {
    const continueWatching = getContinueWatching();
    return continueWatching.find(i => i.url === url) || null;
};

/**
 * Clear progress when video is completed (>95% watched)
 */
export const clearVideoProgress = (url) => {
    const continueWatching = getContinueWatching().filter(i => i.url !== url);
    localStorage.setItem(getKey(BASE_KEYS.CONTINUE_WATCHING), JSON.stringify(continueWatching));
};

// ===== PLAYLISTS =====

export const getPlaylists = () => {
    try {
        return JSON.parse(localStorage.getItem(getKey(BASE_KEYS.PLAYLISTS))) || [];
    } catch {
        return [];
    }
};

export const createPlaylist = (name, description = '') => {
    const playlists = getPlaylists();
    const newPlaylist = {
        id: generateId(),
        name,
        description,
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    playlists.unshift(newPlaylist);
    localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(playlists));
    return newPlaylist;
};

export const deletePlaylist = (playlistId) => {
    const playlists = getPlaylists().filter(p => p.id !== playlistId);
    localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(playlists));
};

export const addToPlaylist = (playlistId, item) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);

    if (playlist && !playlist.items.some(i => i.url === item.url)) {
        playlist.items.push({
            id: generateId(),
            title: item.title || 'Untitled',
            url: item.url,
            thumbnail: item.thumbnail || null,
            addedAt: new Date().toISOString()
        });
        playlist.updatedAt = new Date().toISOString();
        localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(playlists));
    }
};

export const removeFromPlaylist = (playlistId, itemId) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);

    if (playlist) {
        playlist.items = playlist.items.filter(i => i.id !== itemId);
        playlist.updatedAt = new Date().toISOString();
        localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(playlists));
    }
};

export const renamePlaylist = (playlistId, newName) => {
    const playlists = getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);

    if (playlist) {
        playlist.name = newName;
        playlist.updatedAt = new Date().toISOString();
        localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(playlists));
    }
};

// ===== IMPORT/EXPORT =====

export const exportLibrary = () => {
    const data = {
        library: getLibrary(),
        playlists: getPlaylists(),
        history: getHistory(),
        favorites: getFavorites(),
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `media-library-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importLibrary = (jsonString) => {
    try {
        const data = JSON.parse(jsonString);

        if (data.library) localStorage.setItem(getKey(BASE_KEYS.LIBRARY), JSON.stringify(data.library));
        if (data.playlists) localStorage.setItem(getKey(BASE_KEYS.PLAYLISTS), JSON.stringify(data.playlists));
        if (data.history) localStorage.setItem(getKey(BASE_KEYS.HISTORY), JSON.stringify(data.history));
        if (data.favorites) localStorage.setItem(getKey(BASE_KEYS.FAVORITES), JSON.stringify(data.favorites));

        return true;
    } catch (e) {
        console.error('Import failed:', e);
        return false;
    }
};

// ===== CLEAR ALL =====

export const clearAllData = () => {
    localStorage.removeItem(getKey(BASE_KEYS.LIBRARY));
    localStorage.removeItem(getKey(BASE_KEYS.PLAYLISTS));
    localStorage.removeItem(getKey(BASE_KEYS.HISTORY));
    localStorage.removeItem(getKey(BASE_KEYS.FAVORITES));
};
