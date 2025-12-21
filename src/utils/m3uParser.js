/**
 * Parses M3U playlist content into an array of channel objects.
 * @param {string} content - The raw M3U file content.
 * @returns {Array} - Array of channel objects { name, logo, url, group, id }.
 */
export const parseM3U = (content) => {
    const lines = content.split('\n');
    const channels = [];
    let currentChannel = {};

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
            // Parse metadata
            // Example: #EXTINF:-1 tvg-id="CNN.us" tvg-logo="http://..." group-title="News",CNN US
            const info = line.substring(8);
            const commaIndex = info.lastIndexOf(',');

            // Extract Name (everything after last comma)
            const name = info.substring(commaIndex + 1).trim();
            currentChannel.name = name;

            // Extract Attributes
            const attributes = info.substring(0, commaIndex);

            // Regex for attributes: key="value"
            const logoMatch = attributes.match(/tvg-logo="([^"]*)"/);
            const groupMatch = attributes.match(/group-title="([^"]*)"/);
            const idMatch = attributes.match(/tvg-id="([^"]*)"/);

            if (logoMatch) currentChannel.logo = logoMatch[1];
            if (groupMatch) currentChannel.group = groupMatch[1];
            if (idMatch) currentChannel.id = idMatch[1];

        } else if (line.startsWith('http') || line.startsWith('rtmp') || line.startsWith('rtsp')) {
            // URL Line
            currentChannel.url = line;
            if (currentChannel.name && currentChannel.url) {
                // Add unique ID if missing
                if (!currentChannel.id) {
                    currentChannel.id = btoa(currentChannel.url).substring(0, 12);
                }
                // Fallback for logo
                if (!currentChannel.logo) {
                    currentChannel.logo = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChannel.name)}&background=random`;
                }

                channels.push(currentChannel);
                currentChannel = {}; // Reset
            }
        }
    }

    return channels;
};
