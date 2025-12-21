// User Profile Management Utilities
// Supports multiple profiles with isolated library data

const PROFILES_KEY = 'userProfiles';
const ACTIVE_PROFILE_KEY = 'activeProfileId';

// Generate unique ID
const generateId = () => `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Get all profiles
export const getAllProfiles = () => {
    const saved = localStorage.getItem(PROFILES_KEY);
    if (!saved) {
        // Create default profile
        const defaultProfile = {
            id: 'default',
            name: 'Guest',
            avatarUrl: '',
            createdAt: Date.now()
        };
        localStorage.setItem(PROFILES_KEY, JSON.stringify([defaultProfile]));
        localStorage.setItem(ACTIVE_PROFILE_KEY, 'default');
        return [defaultProfile];
    }
    return JSON.parse(saved);
};

// Get active profile ID
export const getActiveProfileId = () => {
    return localStorage.getItem(ACTIVE_PROFILE_KEY) || 'default';
};

// Get active profile
export const getActiveProfile = () => {
    const profiles = getAllProfiles();
    const activeId = getActiveProfileId();
    return profiles.find(p => p.id === activeId) || profiles[0];
};

// Set active profile
export const setActiveProfile = (profileId) => {
    localStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
};

// Create new profile
export const createProfile = (name, avatarUrl = '') => {
    const profiles = getAllProfiles();
    const newProfile = {
        id: generateId(),
        name: name || 'New Profile',
        avatarUrl,
        createdAt: Date.now()
    };
    profiles.push(newProfile);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    return newProfile;
};

// Update profile
export const updateProfile = (profileId, updates) => {
    const profiles = getAllProfiles();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx !== -1) {
        profiles[idx] = { ...profiles[idx], ...updates };
        localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
        return profiles[idx];
    }
    return null;
};

// Delete profile
export const deleteProfile = (profileId) => {
    if (profileId === 'default') return false; // Can't delete default

    let profiles = getAllProfiles();
    profiles = profiles.filter(p => p.id !== profileId);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));

    // Clear profile-specific data
    localStorage.removeItem(`library_${profileId}`);
    localStorage.removeItem(`favorites_${profileId}`);
    localStorage.removeItem(`history_${profileId}`);
    localStorage.removeItem(`playlists_${profileId}`);

    // Switch to default if deleting active profile
    if (getActiveProfileId() === profileId) {
        setActiveProfile('default');
    }

    return true;
};

// Profile-specific storage keys
export const getProfileStorageKey = (key) => {
    const activeId = getActiveProfileId();
    return `${key}_${activeId}`;
};
