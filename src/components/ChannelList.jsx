import React, { useState, useMemo } from 'react';
import { Search, ToggleLeft, ToggleRight } from 'lucide-react';

const ChannelList = ({ channels, onSelectChannel, currentChannel }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredChannels = useMemo(() => {
        return channels.filter(channel => {
            return channel.name.toLowerCase().includes(searchTerm.toLowerCase());
        });
    }, [channels, searchTerm]);

    // Group channels by category
    const groupedChannels = useMemo(() => {
        const groups = {};
        filteredChannels.forEach(channel => {
            const group = channel.group || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(channel);
        });
        return groups;
    }, [filteredChannels]);

    return (
        <div className="yt-upnext">
            {/* Header */}
            <div className="yt-upnext-header">
                <span className="yt-upnext-title">Up next</span>
            </div>

            {/* Search */}
            <div className="yt-upnext-search">
                <Search size={16} />
                <input
                    type="text"
                    placeholder="Search channels"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Channel Items */}
            <div className="yt-upnext-list">
                {Object.keys(groupedChannels).length === 0 ? (
                    <div className="yt-no-result">No channels found</div>
                ) : (
                    Object.entries(groupedChannels).map(([group, groupChannels]) => (
                        <div key={group} className="yt-channel-group">
                            {Object.keys(groupedChannels).length > 1 && (
                                <div className="yt-group-header">{group}</div>
                            )}
                            {groupChannels.map((channel, index) => (
                                <div
                                    key={channel.id + channel.url}
                                    className={`yt-upnext-item ${currentChannel?.url === channel.url ? 'active' : ''}`}
                                    onClick={() => onSelectChannel(channel)}
                                >
                                    {/* Index or Now Playing */}
                                    <div className="yt-upnext-index">
                                        {currentChannel?.url === channel.url ? (
                                            <div className="yt-now-playing">
                                                <span></span>
                                                <span></span>
                                                <span></span>
                                            </div>
                                        ) : (
                                            <span>{index + 1}</span>
                                        )}
                                    </div>

                                    {/* Thumbnail */}
                                    <div className="yt-upnext-thumb">
                                        <img
                                            src={channel.logo}
                                            alt=""
                                            onError={(e) => {
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(channel.name)}&background=282828&color=fff&size=168`
                                            }}
                                        />
                                        <span className="yt-live-badge">LIVE</span>
                                    </div>

                                    {/* Info */}
                                    <div className="yt-upnext-info">
                                        <div className="yt-upnext-name">{channel.name}</div>
                                        <div className="yt-upnext-meta">
                                            <span>{channel.group || 'Live Stream'}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ChannelList;
