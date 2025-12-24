/**
 * M3U Playlist Service
 * Fetches and manages M3U playlists from GitHub repository
 */

const GITHUB_API_URL = 'https://api.github.com/repos/JeyaramKumaravel/m3u-playlist/contents/?ref=main';
const RAW_CONTENT_BASE = 'https://raw.githubusercontent.com/JeyaramKumaravel/m3u-playlist/main/';
const CACHE_KEY = 'lumina_m3u_playlists';
const CACHE_EXPIRY = 1000 * 60 * 30; // 30 minutes

/**
 * Parse M3U content into structured episodes
 */
const parseM3UContent = (content, packageName) => {
    const lines = content.split('\n');
    const episodes = [];
    let currentEpisode = {};

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');
            const title = info.substring(commaIndex + 1).trim();

            // Extract attributes
            const attributes = info.substring(0, commaIndex);
            const logoMatch = attributes.match(/tvg-logo="([^"]*)"/);
            const groupMatch = attributes.match(/group-title="([^"]*)"/i);

            // Normalize group type
            let groupType = 'Other';
            if (groupMatch) {
                const rawGroup = groupMatch[1].toLowerCase();
                if (rawGroup.includes('series') || rawGroup.includes('web series')) {
                    groupType = 'Series';
                } else if (rawGroup.includes('movie') || rawGroup.includes('movies')) {
                    groupType = 'Movies';
                } else if (rawGroup.includes('tv') || rawGroup.includes('live') || rawGroup.includes('channel')) {
                    groupType = 'TV';
                } else {
                    groupType = 'Other';
                }
            }

            // Extract quality from title (1080p, 720p, 480p, 360p)
            const qualityMatch = title.match(/\b(1080p|720p|480p|360p)\b/i);
            const quality = qualityMatch ? qualityMatch[1].toLowerCase() : null;

            // Extract base title (remove quality suffix for grouping)
            const baseTitle = cleanTitle(title).replace(/\s*(1080p|720p|480p|360p)\s*HD?\s*$/i, '').trim();

            currentEpisode = {
                id: `${packageName}_${episodes.length}`,
                title: cleanTitle(title),
                baseTitle: baseTitle,
                quality: quality,
                thumbnail: logoMatch ? logoMatch[1] : null,
                packageName: packageName,
                groupType: groupType
            };
        } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
            currentEpisode.url = line;
            if (currentEpisode.title && currentEpisode.url) {
                // Generate fallback thumbnail if none exists
                if (!currentEpisode.thumbnail) {
                    currentEpisode.thumbnail = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentEpisode.title)}&background=1a1a2e&color=fff&size=300`;
                }
                episodes.push(currentEpisode);
                currentEpisode = {};
            }
        }
    }

    // Group movies with quality variants
    return groupMoviesByQuality(episodes);
};

/**
 * Group movies that have multiple quality versions
 * Keeps series and other content unchanged
 */
const groupMoviesByQuality = (episodes) => {
    const grouped = [];
    const movieGroups = new Map(); // Map baseTitle -> array of quality variants

    for (const episode of episodes) {
        if (episode.groupType === 'Movies' && episode.quality) {
            // This is a movie with quality info - group it
            const key = `${episode.packageName}_${episode.baseTitle}_${episode.thumbnail}`;
            if (!movieGroups.has(key)) {
                movieGroups.set(key, []);
            }
            movieGroups.get(key).push(episode);
        } else {
            // Not a movie or no quality info - add directly
            grouped.push(episode);
        }
    }

    // Process movie groups
    for (const [key, variants] of movieGroups) {
        if (variants.length === 1) {
            // Only one quality - add as regular episode
            grouped.push(variants[0]);
        } else {
            // Multiple qualities - create grouped entry
            // Sort by quality (highest first)
            const qualityOrder = { '1080p': 4, '720p': 3, '480p': 2, '360p': 1 };
            variants.sort((a, b) => (qualityOrder[b.quality] || 0) - (qualityOrder[a.quality] || 0));

            // Create quality variants map
            const qualityVariants = {};
            for (const v of variants) {
                qualityVariants[v.quality] = v.url;
            }

            // Use highest quality as primary, but show clean title
            const primary = variants[0];
            grouped.push({
                ...primary,
                title: primary.baseTitle, // Clean title without quality suffix
                qualityVariants: qualityVariants, // All quality URLs
                hasQualityOptions: true
            });
        }
    }

    return grouped;
};

/**
 * Clean up episode titles for display
 */
const cleanTitle = (title) => {
    return title
        .replace(/Moviesda\.?Mobi\s*-?\s*/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Extract a clean package/series name from filename
 */
const extractPackageName = (filename) => {
    return filename
        .replace('.m3u', '')
        .replace(/_/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Get thumbnail for the package (use first episode's thumbnail)
 */
const getPackageThumbnail = (episodes) => {
    if (episodes.length > 0 && episodes[0].thumbnail) {
        return episodes[0].thumbnail;
    }
    return null;
};

/**
 * Fetch all M3U playlists from GitHub
 */
export const fetchAllPlaylists = async (forceRefresh = false) => {
    // Check cache first
    if (!forceRefresh) {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_EXPIRY) {
                return data;
            }
        }
    }

    try {
        // Fetch list of files from GitHub API
        const response = await fetch(GITHUB_API_URL);
        if (!response.ok) throw new Error('Failed to fetch playlist list');

        const files = await response.json();
        const m3uFiles = files.filter(file => file.name.endsWith('.m3u'));

        // Fetch and parse each M3U file
        const playlists = await Promise.all(
            m3uFiles.map(async (file) => {
                try {
                    const contentResponse = await fetch(file.download_url);
                    const content = await contentResponse.text();
                    const packageName = extractPackageName(file.name);
                    const episodes = parseM3UContent(content, packageName);

                    // Get unique group types from episodes
                    const groupTypes = [...new Set(episodes.map(ep => ep.groupType))];

                    return {
                        id: file.sha,
                        name: packageName,
                        filename: file.name,
                        thumbnail: getPackageThumbnail(episodes),
                        episodes: episodes,
                        episodeCount: episodes.length,
                        groupTypes: groupTypes
                    };
                } catch (err) {
                    console.warn(`Failed to fetch ${file.name}:`, err);
                    return null;
                }
            })
        );

        // Filter out failed fetches and sort by name
        const validPlaylists = playlists
            .filter(p => p !== null && p.episodes.length > 0)
            .sort((a, b) => a.name.localeCompare(b.name));

        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: validPlaylists,
            timestamp: Date.now()
        }));

        return validPlaylists;
    } catch (error) {
        console.error('Error fetching playlists:', error);

        // Return cached data if available, even if expired
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached).data;
        }

        return [];
    }
};

/**
 * Search across all playlists
 */
export const searchPlaylists = (playlists, query) => {
    if (!query || query.trim().length < 2) return [];

    const searchTerm = query.toLowerCase().trim();
    const results = [];

    for (const playlist of playlists) {
        // Check if package name matches
        if (playlist.name.toLowerCase().includes(searchTerm)) {
            // Add all episodes from matching package
            results.push(...playlist.episodes.map(ep => ({
                ...ep,
                matchType: 'package'
            })));
        } else {
            // Search individual episodes
            for (const episode of playlist.episodes) {
                if (episode.title.toLowerCase().includes(searchTerm)) {
                    results.push({
                        ...episode,
                        matchType: 'episode'
                    });
                }
            }
        }
    }

    // Limit results and remove duplicates
    const uniqueResults = results.reduce((acc, curr) => {
        if (!acc.find(item => item.url === curr.url)) {
            acc.push(curr);
        }
        return acc;
    }, []);

    return uniqueResults.slice(0, 30);
};

/**
 * Get recommendations from the same package
 */
export const getPackageRecommendations = (playlists, currentUrl) => {
    for (const playlist of playlists) {
        const currentIndex = playlist.episodes.findIndex(ep => ep.url === currentUrl);
        if (currentIndex !== -1) {
            return {
                packageName: playlist.name,
                currentIndex,
                episodes: playlist.episodes,
                thumbnail: playlist.thumbnail
            };
        }
    }
    return null;
};

/**
 * Find which package a URL belongs to
 */
export const findPackageByUrl = (playlists, url) => {
    for (const playlist of playlists) {
        if (playlist.episodes.some(ep => ep.url === url)) {
            return playlist;
        }
    }
    return null;
};

/**
 * Get a random featured playlist for hero section
 */
export const getFeaturedPlaylist = (playlists) => {
    if (!playlists || playlists.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * playlists.length);
    return playlists[randomIndex];
};

/**
 * Clear the cache
 */
export const clearPlaylistCache = () => {
    localStorage.removeItem(CACHE_KEY);
};
