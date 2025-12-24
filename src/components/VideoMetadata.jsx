import React, { useState } from 'react';
import {
    ThumbsUp, ThumbsDown, Share2,
    BookmarkPlus, Bell, ChevronDown
} from 'lucide-react';
import BottomSheet from './BottomSheet';
import Comments from './Comments';

const VideoMetadata = ({ video, channel, isLiked: propIsLiked, onLike, onDislike, onShare, onSave, onDownload }) => {
    const [showComments, setShowComments] = useState(false);
    const [showDescription, setShowDescription] = useState(false);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [internalIsLiked, setInternalIsLiked] = useState(false);

    // Use prop if available, else internal state
    const isLiked = propIsLiked !== undefined ? propIsLiked : internalIsLiked;

    const [isDisliked, setIsDisliked] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // ...

    const handleLike = () => {
        if (propIsLiked === undefined) {
            // Only toggle internal if not controlled
            setInternalIsLiked(!internalIsLiked);
        }
        if (isLiked) {
            // Removing like
            setIsDisliked(false);
        } else {
            // Adding like
            setIsDisliked(false);
        }
        onLike?.();
    };

    const handleDislike = () => {
        // ... dislike logic ...
        if (isDisliked) {
            setIsDisliked(false);
        } else {
            setIsDisliked(true);
            // If controlled, notify parent we disliked (usually clears like)
            // But for now just visually toggle off like if internal
            if (propIsLiked === undefined) setInternalIsLiked(false);
        }
        onDislike?.();
    };

    const handleSubscribe = () => {
        setIsSubscribed(!isSubscribed);
        if (!isSubscribed) {
            setShowNotifications(true);
        }
    };

    // Format numbers like YouTube (1.2M, 500K, etc.)
    const formatNumber = (num) => {
        if (!num) return '0';
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 100000) return `${(num / 100000).toFixed(1)} lakh`;
        if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
        return num.toString();
    };

    // Use real data or default to 0/empty
    const views = video?.views || 0;
    const likes = video?.likes || 0;
    const dislikes = video?.dislikes || 0;
    const subscribers = channel?.subscribers || 0;


    return (
        <>
            <div className="yt-metadata">
                {/* Video Title */}
                <h1 className="yt-video-title">
                    {video?.title || channel?.name || 'Video Title'}
                </h1>

                {/* Actions Row */}
                <div className="yt-metadata-actions-row">

                    {/* Like/Dislike Pill */}
                    <div className="yt-like-dislike-pill">
                        <button
                            className={`yt-pill-btn ${isLiked ? 'active' : ''}`}
                            onClick={handleLike}
                        >
                            <ThumbsUp size={20} fill={isLiked ? 'white' : 'none'} />
                            <span>{formatNumber(likes + (isLiked ? 1 : 0))}</span>
                        </button>
                        <div className="yt-pill-separator"></div>
                        <button
                            className={`yt-pill-btn ${isDisliked ? 'active' : ''}`}
                            onClick={handleDislike}
                        >
                            <ThumbsDown size={20} fill={isDisliked ? 'white' : 'none'} />
                        </button>
                    </div>

                    {/* Share */}
                    <button className="yt-action-pill" onClick={onShare}>
                        <Share2 size={20} />
                        <span>Share</span>
                    </button>

                    {/* Download */}
                    <button className="yt-action-pill" onClick={onDownload}>
                        <div className="yt-download-icon-wrapper">
                            <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style={{ width: '24px', height: '24px', fill: 'white' }}><g><path d="M17 18v1H6v-1h11zm-.5-6.6-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-4.9z"></path></g></svg>
                        </div>
                        <span>Download</span>
                    </button>

                    {/* Save */}
                    <button className="yt-action-pill" onClick={onSave}>
                        <BookmarkPlus size={20} />
                        <span>Save</span>
                    </button>
                </div>

                {/* Expandable Description */}
            </div>

            {/* Description Sheet */}
            <BottomSheet
                isOpen={showDescription}
                onClose={() => setShowDescription(false)}
                title="Description"
            >
                <div className="yt-sheet-description">
                    <h3 className="yt-sheet-video-title">{video?.title || channel?.name || 'Video Title'}</h3>
                    <div className="yt-sheet-stats">
                        <div className="yt-sheet-stat-item">
                            <span className="yt-stat-value">{formatNumber(likes)}</span>
                            <span className="yt-stat-label">Likes</span>
                        </div>
                        <div className="yt-sheet-stat-item">
                            <span className="yt-stat-value">{formatNumber(views)}</span>
                            <span className="yt-stat-label">Views</span>
                        </div>
                        <div className="yt-sheet-stat-item">
                            <span className="yt-stat-value">{video?.date || '2024'}</span>
                            <span className="yt-stat-label">Date</span>
                        </div>
                    </div>

                    <div className="yt-sheet-text-content">
                        <p>{video?.description || `
This is standard description text that would appear here. 
It supports multiple lines and links.
                        
Key Features:
• 4K Video Playback
• Immersive Audio
• Premium Experience
                        
Music in this video:
Song: Fade
Artist: Alan Walker
                    `}</p>
                        <p>{channel?.group || '#viral #trending'}</p>
                    </div>

                    <div className="yt-sheet-channel-row">
                        <img
                            src={channel?.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(channel?.name || 'C')}&background=ff0000&color=fff&size=48`}
                            alt=""
                            className="yt-channel-avatar-large"
                        />
                        <div className="yt-channel-details">
                            <span className="yt-channel-name-large">{channel?.name || 'Channel'}</span>
                            <span className="yt-channel-subs-large">{formatNumber(subscribers)} subscribers</span>
                        </div>
                    </div>
                </div>
            </BottomSheet>

            {/* Comments Sheet */}
            <BottomSheet
                isOpen={showComments}
                onClose={() => setShowComments(false)}
                title="Comments"
            >
                <Comments comments={video?.comments || []} />
            </BottomSheet>
        </>
    );
};

export default VideoMetadata;
