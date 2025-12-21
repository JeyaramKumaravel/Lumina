import React, { useState } from 'react';
import { ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Heart } from 'lucide-react';

// Mock comments data

const Comments = ({ videoId, comments: initialComments = [] }) => {
    const [comments, setComments] = useState(initialComments);
    const [sortBy, setSortBy] = useState('top');
    const [showSortMenu, setShowSortMenu] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [likedComments, setLikedComments] = useState({});
    const [expandedReplies, setExpandedReplies] = useState({});

    const formatNumber = (num) => {
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const handleLikeComment = (commentId) => {
        setLikedComments(prev => ({
            ...prev,
            [commentId]: !prev[commentId]
        }));
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;

        const comment = {
            id: Date.now(),
            user: 'You',
            avatar: null,
            text: newComment,
            time: 'Just now',
            likes: 0,
            replies: 0
        };

        setComments([comment, ...comments]);
        setNewComment('');
    };

    const totalComments = comments.length;

    return (
        <div className="yt-comments">
            {/* Comments Header */}
            <div className="yt-comments-header">
                <span className="yt-comments-count">
                    {formatNumber(totalComments)} Comments
                </span>
                <button
                    className="yt-sort-btn"
                    onClick={() => setShowSortMenu(!showSortMenu)}
                >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z" />
                    </svg>
                    Sort by
                </button>
                {showSortMenu && (
                    <div className="yt-sort-menu">
                        <div
                            className={`yt-sort-option ${sortBy === 'top' ? 'active' : ''}`}
                            onClick={() => { setSortBy('top'); setShowSortMenu(false); }}
                        >
                            Top comments
                        </div>
                        <div
                            className={`yt-sort-option ${sortBy === 'newest' ? 'active' : ''}`}
                            onClick={() => { setSortBy('newest'); setShowSortMenu(false); }}
                        >
                            Newest first
                        </div>
                    </div>
                )}
            </div>

            {/* Add Comment */}
            <div className="yt-add-comment">
                <img
                    src="https://ui-avatars.com/api/?name=You&background=3ea6ff&color=fff&size=40"
                    alt=""
                    className="yt-comment-avatar"
                />
                <div className="yt-comment-input-wrapper">
                    <input
                        type="text"
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="yt-comment-input"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    />
                    {newComment && (
                        <div className="yt-comment-actions">
                            <button
                                className="yt-cancel-btn"
                                onClick={() => setNewComment('')}
                            >
                                Cancel
                            </button>
                            <button
                                className="yt-submit-btn"
                                onClick={handleAddComment}
                            >
                                Comment
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Comments List */}
            <div className="yt-comments-list">
                {comments.map(comment => (
                    <div key={comment.id} className="yt-comment">
                        <img
                            src={comment.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.user)}&background=282828&color=fff&size=40`}
                            alt=""
                            className="yt-comment-avatar"
                        />
                        <div className="yt-comment-content">
                            <div className="yt-comment-header">
                                <span className="yt-comment-user">@{comment.user}</span>
                                <span className="yt-comment-time">{comment.time}</span>
                            </div>
                            <p className="yt-comment-text">{comment.text}</p>
                            <div className="yt-comment-footer">
                                <button
                                    className={`yt-comment-like ${likedComments[comment.id] ? 'active' : ''}`}
                                    onClick={() => handleLikeComment(comment.id)}
                                >
                                    <ThumbsUp size={16} fill={likedComments[comment.id] ? 'white' : 'none'} />
                                    <span>{formatNumber(comment.likes + (likedComments[comment.id] ? 1 : 0))}</span>
                                </button>
                                <button className="yt-comment-dislike">
                                    <ThumbsDown size={16} />
                                </button>
                                <button className="yt-comment-reply">Reply</button>
                            </div>
                            {comment.replies > 0 && (
                                <button
                                    className="yt-view-replies"
                                    onClick={() => setExpandedReplies(prev => ({
                                        ...prev,
                                        [comment.id]: !prev[comment.id]
                                    }))}
                                >
                                    {expandedReplies[comment.id] ? (
                                        <><ChevronUp size={16} /> Hide replies</>
                                    ) : (
                                        <><ChevronDown size={16} /> {comment.replies} replies</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Comments;
