import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Play, Pause, Volume2, VolumeX, Maximize, Minimize, RotateCcw,
    FastForward, Rewind, Settings, Captions, PictureInPicture2,
    Maximize2, Timer, SkipForward, SkipBack, Tv, Heart, BookmarkPlus,
    ChevronDown, ChevronRight, Share2, Scissors, ThumbsUp, ThumbsDown,
    MoreHorizontal, X, Flag, Lock, Sparkles, Download, Check, Sun
} from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';
import Hls from 'hls.js';
import { parseM3U } from '../utils/m3uParser';
import ChannelList from './ChannelList';
import VideoMetadata from './VideoMetadata';
import BottomSheet from './BottomSheet'; // Import BottomSheet
import {
    saveToLibrary, addToHistory, toggleFavorite, isFavorite,
    getPlaylists, addToPlaylist, removeFromPlaylist, createPlaylist,
    saveVideoProgress, clearVideoProgress, updateHistoryProgress // Continue watching
} from '../utils/libraryStorage';

const VideoPlayer = ({ videoUrl, resumeTime = 0, videoTitle = '' }) => {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const fileInputRef = useRef(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState('0:00');
    const [duration, setDuration] = useState('0:00');
    const [showControls, setShowControls] = useState(true);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [isEnded, setIsEnded] = useState(false);

    // Advanced State
    const [brightness, setBrightness] = useState(1);
    const [showSettings, setShowSettings] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [isLooping, setIsLooping] = useState(false);
    const [captionsEnabled, setCaptionsEnabled] = useState(false);
    const [captionSrc, setCaptionSrc] = useState(null);

    // IPTV State
    const [channels, setChannels] = useState([]);
    const [currentChannel, setCurrentChannel] = useState(null);
    const hlsRef = useRef(null);

    // YouTube Premium Features State
    const [isPiP, setIsPiP] = useState(false);
    const [isTheaterMode, setIsTheaterMode] = useState(false);
    const [isAmbientMode, setIsAmbientMode] = useState(true);
    const [ambientColors, setAmbientColors] = useState(['#000', '#000']);
    const [sleepTimer, setSleepTimer] = useState(null);
    const [sleepTimerRemaining, setSleepTimerRemaining] = useState(0);
    const [autoplayEnabled, setAutoplayEnabled] = useState(true);
    const [qualityLevels, setQualityLevels] = useState([]);
    const [currentQuality, setCurrentQuality] = useState(-1); // -1 = Auto
    const [showQualityMenu, setShowQualityMenu] = useState(false);
    const [showSleepMenu, setShowSleepMenu] = useState(false);
    const canvasRef = useRef(null);
    const sleepTimerRef = useRef(null);

    // Media Library State
    const [isFavorited, setIsFavorited] = useState(false);

    // Playlist State
    const [showSaveSheet, setShowSaveSheet] = useState(false);
    const [playlists, setPlaylists] = useState([]);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

    // External Embed State (YouTube, Instagram, etc.)
    const [embedUrl, setEmbedUrl] = useState(null);
    const [embedType, setEmbedType] = useState(null); // 'youtube', 'instagram', 'twitter', etc.

    // URL Detection Helpers
    const getYouTubeVideoId = (url) => {
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
            /youtube\.com\/shorts\/([^&\n?#]+)/
        ];
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    };

    const getInstagramPostId = (url) => {
        const match = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#]+)/);
        return match ? match[1] : null;
    };

    const getTwitterVideoId = (url) => {
        const match = url.match(/(?:twitter\.com|x\.com)\/[^/]+\/status\/(\d+)/);
        return match ? match[1] : null;
    };

    const isDirectVideoUrl = (url) => {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.ogv', '.avi', '.mov', '.mkv', '.m3u8', '.ts'];
        const lowerUrl = url.toLowerCase();
        return videoExtensions.some(ext => lowerUrl.includes(ext));
    };

    // Gestures State
    const [gestureFeedback, setGestureFeedback] = useState(null);
    const [seekRipple, setSeekRipple] = useState(null);

    const touchStartRef = useRef(null);
    const lastTapRef = useRef(0);
    const gestureActiveRef = useRef(false);
    const initialVolumeRef = useRef(1);
    const initialBrightnessRef = useRef(1);
    const lastSaveTimeRef = useRef(null);

    let controlsTimeout = useRef(null);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!videoRef.current) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k':
                    e.preventDefault();
                    togglePlay();
                    break;
                case 'arrowright':
                case 'l':
                    seek(10);
                    break;
                case 'arrowleft':
                case 'j':
                    seek(-10);
                    break;
                case 'f':
                    toggleFullscreen();
                    break;
                case 'm':
                    toggleMute();
                    break;
                case 'arrowup':
                    adjustVolume(0.1);
                    break;
                case 'arrowdown':
                    adjustVolume(-0.1);
                    break;
                case 'c':
                    toggleCaptions();
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isPlaying, volume, isMuted, isFullscreen, captionsEnabled]);

    // Cleanup HLS on unmount
    useEffect(() => {
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, []);

    // Load Video or Playlist
    useEffect(() => {
        if (!videoUrl) return;

        // Reset states
        setEmbedUrl(null);
        setEmbedType(null);
        setChannels([]);
        setCurrentChannel(null);

        // Check if this URL is favorited
        setIsFavorited(isFavorite(videoUrl));

        // Auto-save to history
        const title = currentChannel?.name || videoUrl.split('/').pop() || 'Video';
        addToHistory({ url: videoUrl, title });

        const loadContent = async () => {
            // Check if M3U Playlist
            if (videoUrl.endsWith('.m3u') || videoUrl.endsWith('.m3u_plus') || videoUrl.includes('#EXTM3U')) {
                try {
                    setIsBuffering(true);
                    const response = await fetch(videoUrl);
                    const text = await response.text();
                    const parsedChannels = parseM3U(text);
                    setChannels(parsedChannels);
                    setIsBuffering(false);

                    if (parsedChannels.length > 0) {
                        loadStream(parsedChannels[0].url);
                        setCurrentChannel(parsedChannels[0]);
                    }
                } catch (error) {
                    console.error("Error loading playlist:", error);
                    setIsBuffering(false);
                }
                return;
            }

            // Check for YouTube
            const ytId = getYouTubeVideoId(videoUrl);
            if (ytId) {
                setEmbedUrl(`https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`);
                setEmbedType('youtube');
                return;
            }

            // Check for Instagram
            const igId = getInstagramPostId(videoUrl);
            if (igId) {
                setEmbedUrl(`https://www.instagram.com/p/${igId}/embed/`);
                setEmbedType('instagram');
                return;
            }

            // Check for Twitter/X
            const twitterId = getTwitterVideoId(videoUrl);
            if (twitterId) {
                // Twitter embeds are complex, open in new tab as fallback
                setEmbedUrl(videoUrl);
                setEmbedType('twitter');
                return;
            }

            // Direct video file or stream
            loadStream(videoUrl);
        };

        loadContent();

    }, [videoUrl]);

    const loadStream = (url) => {
        const video = videoRef.current;
        if (!video) return;

        // Reset states
        setIsBuffering(true);
        setIsEnded(false);

        // Destroy previous HLS instance
        if (hlsRef.current) {
            hlsRef.current.destroy();
            hlsRef.current = null;
        }

        const isHLS = url.includes('.m3u8') || url.includes('/hls/') || url.includes('hls.');

        if (isHLS && Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30, // Optimized buffering
                maxMaxBufferLength: 600,
                // Fix for buffer holes
                maxBufferHole: 0.5,
                nudgeMaxRetry: 5,
            });
            hls.loadSource(url);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                // Resume from saved position
                if (resumeTime > 0) {
                    video.currentTime = resumeTime;
                }
                video.play().catch(e => {
                    // Autoplay blocked - mute and retry
                    video.muted = true;
                    video.play().catch(() => { });
                });
                setIsPlaying(true);
                setIsBuffering(false);
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                // Ignore non-fatal buffer errors (very common)
                const ignoredErrors = [
                    'bufferSeekOverHole', 'bufferNudgeOnStall', 'bufferStalledError',
                    'fragLoadError', 'levelLoadError'
                ];
                if (!data.fatal && ignoredErrors.includes(data.details)) return;

                // Only log fatal errors
                if (data.fatal) {
                    console.warn('Stream error:', data.details);
                    setIsBuffering(false);
                    showGestureFeedback('Stream unavailable', null);
                    // Auto-skip to next channel after 2 seconds
                    if (channels.length > 0) {
                        setTimeout(() => {
                            const currentIdx = channels.findIndex(c => c.url === currentChannel?.url);
                            const nextChannel = channels[(currentIdx + 1) % channels.length];
                            if (nextChannel) handleChannelSelect(nextChannel);
                        }, 2000);
                    }
                }
            });
            hlsRef.current = hls;
        } else if (isHLS && video.canPlayType('application/vnd.apple.mpegurl')) {
            // Native HLS support (Safari)
            video.src = url;
            video.addEventListener('loadedmetadata', function onLoaded() {
                video.removeEventListener('loadedmetadata', onLoaded);
                video.play().catch(e => console.log("Autoplay blocked", e));
                setIsPlaying(true);
                setIsBuffering(false);
            });
        } else {
            // Standard video files (MP4, WebM, OGG, etc.)
            video.src = url;

            const onCanPlay = () => {
                video.removeEventListener('canplay', onCanPlay);
                setIsBuffering(false);
                // Resume from saved position
                if (resumeTime > 0) {
                    video.currentTime = resumeTime;
                }
                video.play().catch(e => {
                    // Autoplay blocked - mute and retry
                    video.muted = true;
                    video.play().catch(() => setIsPlaying(false));
                });
                setIsPlaying(true);
            };

            const onError = (e) => {
                video.removeEventListener('error', onError);
                // Suppress console spam, just show visual feedback
                setIsBuffering(false);
                showGestureFeedback('Video unavailable', null);
            };

            video.addEventListener('canplay', onCanPlay);
            video.addEventListener('error', onError);
            video.load();
        }
    };

    const handleChannelSelect = (channel) => {
        setCurrentChannel(channel);
        loadStream(channel.url);
    };

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = playbackRate;
            videoRef.current.loop = isLooping;
        }
    }, [playbackRate, isLooping]);

    const formatTime = (timeInSeconds) => {
        if (isNaN(timeInSeconds)) return "0:00";
        if (timeInSeconds === Infinity) return "Live"; // IPTV Streams
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = Math.floor(timeInSeconds % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video) return;

        if (video.duration === Infinity) {
            setCurrentTime("Live");
            setDuration("Live");
            setProgress(100);
        } else {
            const progressPercent = (video.currentTime / video.duration) * 100;
            setProgress(progressPercent);
            setCurrentTime(formatTime(video.currentTime));
            setDuration(formatTime(video.duration));

            // Save progress every 5 seconds
            const now = Date.now();
            if (!lastSaveTimeRef.current || now - lastSaveTimeRef.current > 5000) {
                lastSaveTimeRef.current = now;
                const title = videoTitle || currentChannel?.name || video.src.split('/').pop() || 'Video';
                saveVideoProgress(videoUrl, video.currentTime, video.duration, title, null);
                // Also save to history so progress persists even if dismissed from Continue Watching
                updateHistoryProgress(videoUrl, video.currentTime, video.duration);
            }
        }
    };

    const togglePlay = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused || videoRef.current.ended) {
            videoRef.current.play();
            setIsPlaying(true);
            setIsEnded(false);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const seek = (seconds) => {
        if (!videoRef.current || videoRef.current.duration === Infinity) return; // Can't seek live streams easily
        videoRef.current.currentTime += seconds;
        if (seconds > 0) triggerSeekRipple('right');
        else triggerSeekRipple('left');
    };

    const adjustVolume = (delta) => {
        if (!videoRef.current) return;
        let newVol = Math.min(Math.max(videoRef.current.volume + delta, 0), 1);
        videoRef.current.volume = newVol;
        setVolume(newVol);
        setIsMuted(newVol === 0);
        showGestureFeedback(`${Math.round(newVol * 100)}%`, <Volume2 size={24} />, newVol);
    };

    const handleProgressChange = (e) => {
        if (videoRef.current.duration === Infinity) return;
        const newProgress = parseFloat(e.target.value);
        const newTime = (newProgress / 100) * videoRef.current.duration;
        videoRef.current.currentTime = newTime;
        setProgress(newProgress);
    };

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        videoRef.current.volume = newVolume;
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
    };

    const toggleMute = () => {
        if (isMuted) {
            videoRef.current.volume = volume || 1;
            setIsMuted(false);
            showGestureFeedback('Unmuted', <Volume2 size={24} />);
        } else {
            videoRef.current.volume = 0;
            setIsMuted(true);
            showGestureFeedback('Muted', <VolumeX size={24} />);
        }
    };

    const toggleFullscreen = async () => {
        const container = containerRef.current;
        if (!document.fullscreenElement) {
            if (container.requestFullscreen) container.requestFullscreen();
            setIsFullscreen(true);
            // Lock to landscape on mobile
            if (screen.orientation && screen.orientation.lock) {
                try {
                    await screen.orientation.lock('landscape');
                } catch (e) { /* Orientation lock not supported or not in fullscreen */ }
            }
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            setIsFullscreen(false);
            // Unlock orientation
            if (screen.orientation && screen.orientation.unlock) {
                try {
                    screen.orientation.unlock();
                } catch (e) { /* Orientation unlock not supported */ }
            }
        }
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
        setShowSleepMenu(false);
        setShowQualityMenu(false);
    };

    const changePlaybackSpeed = () => {
        const speeds = [0.5, 1, 1.25, 1.5, 2];
        const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        setPlaybackRate(speeds[nextIdx]);
        showGestureFeedback(`${speeds[nextIdx]}x`, <Settings size={24} />);
    };

    const toggleLoop = () => {
        setIsLooping(!isLooping);
        showGestureFeedback(isLooping ? 'Loop Off' : 'Loop On', <RotateCcw size={24} />);
    };

    const toggleCaptions = () => {
        const track = videoRef.current.textTracks[0];
        if (track) {
            if (captionsEnabled) {
                track.mode = 'hidden';
                setCaptionsEnabled(false);
                showGestureFeedback('CC Off', <Captions size={24} />);
            } else {
                track.mode = 'showing';
                setCaptionsEnabled(true);
                showGestureFeedback('CC On', <Captions size={24} fill="white" />);
            }
        } else {
            if (captionSrc) {
                setCaptionsEnabled(!captionsEnabled);
            } else {
                showGestureFeedback('No Subs', <Captions size={24} />);
                fileInputRef.current.click();
            }
        }
    };

    const handleCaptionUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setCaptionSrc(url);
            setCaptionsEnabled(true);
            setIsPlaying(true);
            showGestureFeedback('Subs Loaded', <Captions size={24} fill="white" />);
        }
    };

    // ===== PLAYLIST MANAGEMENT =====

    const handleSaveClick = () => {
        setPlaylists(getPlaylists());
        setShowSaveSheet(true);
        // Also save to library if not already
        if (!isFavorite(videoUrl)) {
            saveToLibrary({ url: videoUrl, title: currentChannel?.name || 'Video' });
        }
    };

    const togglePlaylist = (playlistId) => {
        const playlist = playlists.find(p => p.id === playlistId);
        const isInPlaylist = playlist?.items.some(i => i.url === videoUrl);

        if (isInPlaylist) {
            const item = playlist.items.find(i => i.url === videoUrl);
            removeFromPlaylist(playlistId, item.id);
            showGestureFeedback('Removed from playlist', null);
        } else {
            addToPlaylist(playlistId, { url: videoUrl, title: currentChannel?.name || 'Video' });
            showGestureFeedback('Saved to playlist', <Check size={24} />);
        }
        setPlaylists(getPlaylists()); // Refresh
    };

    const handleCreateNewPlaylist = () => {
        if (newPlaylistName.trim()) {
            const newPl = createPlaylist(newPlaylistName.trim());
            addToPlaylist(newPl.id, { url: videoUrl, title: currentChannel?.name || 'Video' });
            setPlaylists(getPlaylists());
            setNewPlaylistName('');
            setShowNewPlaylistInput(false);
            showGestureFeedback('Playlist created', <Check size={24} />);
        }
    };

    // ===== YOUTUBE PREMIUM FEATURES =====

    // Picture-in-Picture
    const togglePiP = async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPiP(false);
            } else if (videoRef.current) {
                await videoRef.current.requestPictureInPicture();
                setIsPiP(true);
            }
        } catch (error) {
            console.log('PiP not supported', error);
            showGestureFeedback('PiP not available', <PictureInPicture2 size={24} />);
        }
    };

    // Theater Mode
    const toggleTheaterMode = () => {
        setIsTheaterMode(!isTheaterMode);
        showGestureFeedback(isTheaterMode ? 'Default View' : 'Theater Mode', <Tv size={24} />);
    };

    // Ambient Mode - Extract colors from video
    useEffect(() => {
        if (!isAmbientMode || !videoRef.current) return;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = 16;
        canvas.height = 9;

        const extractColors = () => {
            if (videoRef.current && !videoRef.current.paused && ctx) {
                try {
                    ctx.drawImage(videoRef.current, 0, 0, 16, 9);
                    const topLeft = ctx.getImageData(0, 0, 1, 1).data;
                    const bottomRight = ctx.getImageData(15, 8, 1, 1).data;
                    setAmbientColors([
                        `rgb(${topLeft[0]}, ${topLeft[1]}, ${topLeft[2]})`,
                        `rgb(${bottomRight[0]}, ${bottomRight[1]}, ${bottomRight[2]})`
                    ]);
                } catch (e) { }
            }
        };

        const interval = setInterval(extractColors, 500);
        return () => clearInterval(interval);
    }, [isAmbientMode, isPlaying]);

    // Sleep Timer
    const setSleepTimerDuration = (minutes) => {
        if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);

        if (minutes === 0) {
            setSleepTimer(null);
            setSleepTimerRemaining(0);
            setShowSleepMenu(false);
            showGestureFeedback('Timer Off', <Timer size={24} />);
            return;
        }

        const endTime = Date.now() + minutes * 60 * 1000;
        setSleepTimer(endTime);
        setSleepTimerRemaining(minutes * 60);
        setShowSleepMenu(false);
        showGestureFeedback(`Sleep: ${minutes}min`, <Timer size={24} />);

        sleepTimerRef.current = setInterval(() => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            setSleepTimerRemaining(remaining);

            if (remaining <= 0) {
                clearInterval(sleepTimerRef.current);
                if (videoRef.current) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                }
                setSleepTimer(null);
                showGestureFeedback('Sleep Timer', <Timer size={24} />);
            }
        }, 1000);
    };

    // Autoplay next channel
    const playNextChannel = useCallback(() => {
        if (!autoplayEnabled || channels.length === 0 || !currentChannel) return;

        const currentIndex = channels.findIndex(c => c.url === currentChannel.url);
        const nextIndex = (currentIndex + 1) % channels.length;
        const nextChannel = channels[nextIndex];

        handleChannelSelect(nextChannel);
        showGestureFeedback('Next Channel', <SkipForward size={24} />);
    }, [autoplayEnabled, channels, currentChannel]);

    // Quality levels from HLS
    useEffect(() => {
        if (hlsRef.current) {
            hlsRef.current.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
                setQualityLevels(data.levels.map((level, index) => ({
                    index,
                    height: level.height,
                    bitrate: level.bitrate
                })));
            });
        }
    }, [hlsRef.current]);

    const setQuality = (levelIndex) => {
        if (hlsRef.current) {
            hlsRef.current.currentLevel = levelIndex;
            setCurrentQuality(levelIndex);
            setShowQualityMenu(false);
            const label = levelIndex === -1 ? 'Auto' : `${qualityLevels.find(q => q.index === levelIndex)?.height}p`;
            showGestureFeedback(label, <Settings size={24} />);
        }
    };

    // Cleanup sleep timer
    useEffect(() => {
        return () => {
            if (sleepTimerRef.current) clearInterval(sleepTimerRef.current);
        };
    }, []);

    const handleMouseMove = () => {
        setShowControls(true);
        clearTimeout(controlsTimeout.current);
        controlsTimeout.current = setTimeout(() => {
            if (isPlaying && !showSettings && !showSleepMenu && !showQualityMenu) setShowControls(false);
        }, 5000); // 5 seconds for better mobile usability
    };

    const handleMouseLeave = () => {
        if (isPlaying && !showSettings && !showSleepMenu && !showQualityMenu) {
            controlsTimeout.current = setTimeout(() => {
                setShowControls(false);
            }, 3000); // 3 seconds on mouse leave
        }
    };

    const handleVideoEnd = () => {
        if (!isLooping) {
            setIsPlaying(false);
            setIsEnded(true);
            setShowControls(true);
            // Clear progress when video completes
            clearVideoProgress(videoUrl);
        }
    };

    const showGestureFeedback = (text, icon, value = null) => {
        setGestureFeedback({ text, icon, value });
        setTimeout(() => setGestureFeedback(null), 800);
    };

    const triggerSeekRipple = (side) => {
        setSeekRipple(side);
        setTimeout(() => setSeekRipple(null), 600);
    };

    const handleTouchStart = (e) => {
        touchStartRef.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
            timestamp: Date.now()
        };
        gestureActiveRef.current = false;
        initialVolumeRef.current = volume;
        initialBrightnessRef.current = brightness;
    };

    const handleTouchMove = (e) => {
        if (!touchStartRef.current) return;
        const currentX = e.touches[0].clientX;
        const currentY = e.touches[0].clientY;
        const deltaX = currentX - touchStartRef.current.x;
        const deltaY = currentY - touchStartRef.current.y;

        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            gestureActiveRef.current = true;
        }

        if (!gestureActiveRef.current) return;

        const containerHeight = containerRef.current ? containerRef.current.offsetHeight : window.innerHeight;
        const containerWidth = containerRef.current ? containerRef.current.offsetWidth : window.innerWidth;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
            const deltaPercent = (deltaY / containerHeight) * -1.5;
            const touchPercent = (touchStartRef.current.x / containerWidth) * 100;

            // Only adjust brightness/volume on sides, center area is for fullscreen toggle
            if (touchPercent < 35) {
                // Left side - Brightness adjustment
                const newBrightness = Math.min(Math.max(initialBrightnessRef.current + deltaPercent, 0.2), 1);
                setBrightness(newBrightness);
                showGestureFeedback(`${Math.round(newBrightness * 100)}%`, <Sun size={24} />, newBrightness);
            } else if (touchPercent > 65) {
                // Right side - Volume adjustment
                const newVol = Math.min(Math.max(initialVolumeRef.current + deltaPercent, 0), 1);
                videoRef.current.volume = newVol;
                setVolume(newVol);
                setIsMuted(newVol === 0);
                showGestureFeedback(`${Math.round(newVol * 100)}%`, <Volume2 size={24} />, newVol);
            }
            // Center area (35-65%) - no adjustment, reserved for fullscreen toggle
        }
    };

    const handleTouchEnd = (e) => {
        if (!touchStartRef.current) return;
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y;
        const containerWidth = containerRef.current ? containerRef.current.offsetWidth : window.innerWidth;
        const touchStartX = touchStartRef.current.x;
        const touchPercent = (touchStartX / containerWidth) * 100;

        // Only toggle fullscreen on swipe in CENTER area (35-65%), not on sides where brightness/volume controls are
        const isCenterSwipe = touchPercent >= 35 && touchPercent <= 65;

        if (gestureActiveRef.current && Math.abs(deltaY) > 100 && isCenterSwipe) {
            if (deltaY < 0 && !isFullscreen && !showSettings) {
                toggleFullscreen();
            }
            if (deltaY > 0 && isFullscreen) toggleFullscreen();
        }

        if (!gestureActiveRef.current) {
            const now = Date.now();
            if (now - lastTapRef.current < 300) {
                // Double tap
                const containerWidth = containerRef.current ? containerRef.current.offsetWidth : window.innerWidth;
                const tapX = e.changedTouches[0].clientX;
                const tapPercent = (tapX / containerWidth) * 100;

                if (tapPercent < 35) {
                    seek(-10);
                } else if (tapPercent > 65) {
                    seek(10);
                } else {
                    togglePlay();
                    triggerSeekRipple('center');
                }
            } else {
                // Single tap - toggle and keep controls visible longer on mobile
                setTimeout(() => {
                    if (Date.now() - lastTapRef.current > 300) {
                        setShowControls(true);
                        // Keep controls visible for 8 seconds on mobile
                        clearTimeout(controlsTimeout.current);
                        controlsTimeout.current = setTimeout(() => {
                            if (isPlaying && !showSettings && !showSleepMenu && !showQualityMenu) {
                                setShowControls(false);
                            }
                        }, 8000);
                    }
                }, 310);
            }
            lastTapRef.current = now;
        }
        touchStartRef.current = null;
        gestureActiveRef.current = false;
    };

    if (!videoUrl) return <div style={styles.container}><div style={styles.emptyState}><Play size={48} /><p>Paste URL</p></div></div>;

    // Handle embedded content (YouTube, Instagram, etc.)
    if (embedUrl && embedType) {
        return (
            <div style={styles.container}>
                <div style={{ ...styles.videoWrapper, maxWidth: '1280px' }}>
                    {embedType === 'twitter' ? (
                        // Twitter doesn't have easy embed, show fallback
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%',
                            gap: 20,
                            padding: 40
                        }}>
                            <p style={{ color: '#aaa', textAlign: 'center' }}>
                                Twitter/X videos cannot be embedded directly.
                            </p>
                            <a
                                href={embedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: '#1da1f2',
                                    color: 'white',
                                    padding: '12px 24px',
                                    borderRadius: 24,
                                    textDecoration: 'none',
                                    fontWeight: 500
                                }}
                            >
                                Open on Twitter
                            </a>
                        </div>
                    ) : (
                        <iframe
                            src={embedUrl}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                borderRadius: 12
                            }}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            title={`${embedType} embed`}
                        />
                    )}
                </div>
            </div>
        );
    }

    const hasChannels = channels.length > 0;

    // Build the video player content (reused in both layouts)
    const videoPlayerContent = (
        <motion.div
            ref={containerRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ ...styles.videoWrapper, ...(isFullscreen ? styles.fullscreen : {}) }}
            className="video-container video-gesture-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div style={{ ...styles.brightnessOverlay, opacity: 1 - brightness }} />

            <video
                ref={videoRef}
                style={styles.video}
                onTimeUpdate={handleTimeUpdate}
                onWaiting={() => setIsBuffering(true)}
                onPlaying={() => setIsBuffering(false)}
                onEnded={handleVideoEnd}
                playsInline
            />

            <AnimatePresence>
                {gestureFeedback && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="gesture-overlay"
                    >
                        {gestureFeedback.icon}
                        <span className="gesture-text">{gestureFeedback.text}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {seekRipple === 'left' && (
                <div className="ripple-container ripple-left">
                    <div className="ripple-icon">
                        <Rewind size={48} fill="white" />
                        <p style={{ color: 'white' }}>10s</p>
                    </div>
                </div>
            )}
            {seekRipple === 'right' && (
                <div className="ripple-container ripple-right">
                    <div className="ripple-icon">
                        <FastForward size={48} fill="white" />
                        <p style={{ color: 'white' }}>10s</p>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {showControls && (
                    <>
                        {/* Top Bar - Title & Channel (YouTube Mobile Style) */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="yt-mobile-top-bar"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="yt-top-actions">
                                <button onClick={toggleCaptions} className="yt-top-btn">
                                    <Captions size={24} fill={captionsEnabled ? "white" : "none"} />
                                </button>
                                <button onClick={toggleSettings} className="yt-top-btn">
                                    <Settings size={24} />
                                </button>
                            </div>
                        </motion.div>

                        {/* Center Controls - Prev/Play/Next (YouTube Mobile Style) */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="yt-mobile-center-controls"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button className="yt-center-btn" onClick={() => seek(-10)}>
                                <SkipBack size={32} fill="white" />
                            </button>
                            <button className="yt-center-btn yt-play-btn" onClick={togglePlay}>
                                {isBuffering ? (
                                    <div className="yt-spinner" />
                                ) : isPlaying ? (
                                    <Pause size={40} fill="white" />
                                ) : (
                                    <Play size={40} fill="white" />
                                )}
                            </button>
                            <button className="yt-center-btn" onClick={() => seek(10)}>
                                <SkipForward size={32} fill="white" />
                            </button>
                        </motion.div>

                        {/* Bottom Controls */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="yt-mobile-bottom-controls"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Progress Bar */}
                            <div className="yt-progress-row">
                                <span className="yt-time">{currentTime}</span>
                                <div className="yt-progress-container">
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={progress}
                                        onChange={handleProgressChange}
                                        className="yt-progress-bar"
                                        style={{
                                            background: `linear-gradient(to right, #ff0000 ${progress}%, rgba(255,255,255,0.3) ${progress}%)`
                                        }}
                                    />
                                </div>
                                <span className="yt-time">{duration}</span>
                                <span className="yt-quality-badge">
                                    {currentQuality === -1 ? 'Auto' : `${qualityLevels.find(q => q.index === currentQuality)?.height || 720}p`}
                                </span>
                                {!isFullscreen && (
                                    <button
                                        onClick={toggleFullscreen}
                                        style={{ background: 'none', border: 'none', color: 'white', padding: 0, marginLeft: '8px' }}
                                    >
                                        <Maximize size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Action Buttons Row (Fullscreen Only) */}
                            {isFullscreen && (
                                <div className="yt-action-row">
                                    <button className="yt-action-icon" onClick={() => {
                                        const newStatus = toggleFavorite({ url: videoUrl, title: currentChannel?.name || 'Video' });
                                        setIsFavorited(newStatus);
                                        showGestureFeedback(newStatus ? 'Liked' : 'Removed', <ThumbsUp size={24} />);
                                    }}>
                                        <ThumbsUp size={22} fill={isFavorited ? 'white' : 'none'} />
                                    </button>
                                    <button className="yt-action-icon">
                                        <ThumbsDown size={22} />
                                    </button>
                                    <button className="yt-action-icon" onClick={handleSaveClick}>
                                        <BookmarkPlus size={22} />
                                    </button>
                                    <button className="yt-action-icon" onClick={() => {
                                        if (navigator.share) {
                                            navigator.share({ title: currentChannel?.name, url: videoUrl });
                                        } else {
                                            navigator.clipboard.writeText(videoUrl);
                                            showGestureFeedback('Link Copied', null);
                                        }
                                    }}>
                                        <Share2 size={22} />
                                    </button>
                                    <button className="yt-action-icon">
                                        <Download size={22} />
                                    </button>
                                    <button className="yt-action-icon" onClick={toggleSettings}>
                                        <MoreHorizontal size={22} />
                                    </button>
                                    <button className="yt-action-icon" onClick={toggleFullscreen} style={{ marginLeft: 'auto' }}>
                                        {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Bottom Sheet Settings Menu (YouTube Mobile Style) */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="yt-sheet-backdrop"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="yt-bottom-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="yt-sheet-handle" />

                            <div className="yt-sheet-item" onClick={() => { setShowQualityMenu(true); setShowSettings(false); }}>
                                <Settings size={22} />
                                <span>Quality</span>
                                <span className="yt-sheet-value">
                                    {currentQuality === -1 ? 'Auto' : `${qualityLevels.find(q => q.index === currentQuality)?.height || 720}p`}
                                </span>
                                <ChevronRight size={20} />
                            </div>

                            <div className="yt-sheet-item" onClick={changePlaybackSpeed}>
                                <Play size={22} />
                                <span>Playback speed</span>
                                <span className="yt-sheet-value">{playbackRate}x</span>
                                <ChevronRight size={20} />
                            </div>

                            <div className="yt-sheet-item" onClick={toggleCaptions}>
                                <Captions size={22} />
                                <span>Captions</span>
                                <ChevronRight size={20} />
                            </div>

                            <div className="yt-sheet-item" onClick={() => { }}>
                                <Lock size={22} />
                                <span>Lock screen</span>
                            </div>

                            <div className="yt-sheet-item" onClick={() => { setShowSleepMenu(true); setShowSettings(false); }}>
                                <Timer size={22} />
                                <span>Sleep timer</span>
                                <span className="yt-sheet-value">{sleepTimer ? `${Math.floor(sleepTimerRemaining / 60)}min` : 'Off'}</span>
                                <ChevronRight size={20} />
                            </div>

                            <div className="yt-sheet-item" onClick={toggleLoop}>
                                <RotateCcw size={22} />
                                <span>Loop video</span>
                                <div className={`yt-sheet-toggle ${isLooping ? 'active' : ''}`}>
                                    <div className="yt-toggle-thumb" />
                                </div>
                            </div>

                            <div className="yt-sheet-item" onClick={() => setIsAmbientMode(!isAmbientMode)}>
                                <Sparkles size={22} />
                                <span>Ambient mode</span>
                                <div className={`yt-sheet-toggle ${isAmbientMode ? 'active' : ''}`}>
                                    <div className="yt-toggle-thumb" />
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Sleep Timer Bottom Sheet */}
            <AnimatePresence>
                {showSleepMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="yt-sheet-backdrop"
                            onClick={() => setShowSleepMenu(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="yt-bottom-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="yt-sheet-handle" />
                            <div className="yt-sheet-title">Sleep timer</div>

                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(0)}>
                                <span>Off</span>
                                {!sleepTimer && <span className="yt-check">✓</span>}
                            </div>
                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(15)}>
                                <span>15 minutes</span>
                            </div>
                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(30)}>
                                <span>30 minutes</span>
                            </div>
                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(45)}>
                                <span>45 minutes</span>
                            </div>
                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(60)}>
                                <span>1 hour</span>
                            </div>
                            <div className="yt-sheet-item" onClick={() => setSleepTimerDuration(90)}>
                                <span>End of video</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Quality Bottom Sheet */}
            <AnimatePresence>
                {showQualityMenu && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="yt-sheet-backdrop"
                            onClick={() => setShowQualityMenu(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="yt-bottom-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="yt-sheet-handle" />
                            <div className="yt-sheet-title">Quality</div>

                            <div className="yt-sheet-item" onClick={() => setQuality(-1)}>
                                <span>Auto</span>
                                {currentQuality === -1 && <span className="yt-check">✓</span>}
                            </div>
                            {qualityLevels.map(level => (
                                <div key={level.index} className="yt-sheet-item" onClick={() => setQuality(level.index)}>
                                    <span>{level.height}p</span>
                                    {currentQuality === level.index && <span className="yt-check">✓</span>}
                                </div>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Save to Playlist Bottom Sheet */}
            <AnimatePresence>
                {showSaveSheet && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="yt-sheet-backdrop"
                            onClick={() => setShowSaveSheet(false)}
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="yt-bottom-sheet"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="yt-sheet-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 16px 12px' }}>
                                <div className="yt-sheet-title" style={{ margin: 0 }}>Save to playlist</div>
                                <button onClick={() => setShowNewPlaylistInput(true)} style={{ background: 'none', border: 'none', color: '#3ea6ff', fontWeight: '500', fontSize: '14px' }}>
                                    + New Playlist
                                </button>
                            </div>

                            {showNewPlaylistInput && (
                                <div style={{ padding: '0 16px 16px', display: 'flex', gap: '8px' }}>
                                    <input
                                        type="text"
                                        value={newPlaylistName}
                                        onChange={(e) => setNewPlaylistName(e.target.value)}
                                        placeholder="Playlist name"
                                        autoFocus
                                        style={{ flex: 1, background: '#222', border: '1px solid #444', borderRadius: '4px', padding: '8px', color: 'white' }}
                                    />
                                    <button onClick={handleCreateNewPlaylist} disabled={!newPlaylistName.trim()} style={{ background: '#3ea6ff', border: 'none', borderRadius: '4px', padding: '0 16px', color: 'black', fontWeight: '500' }}>
                                        Create
                                    </button>
                                </div>
                            )}

                            <div className="yt-sheet-scroll-content" style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                                {playlists.length === 0 && !showNewPlaylistInput && (
                                    <div style={{ padding: '20px 16px', color: '#aaa', textAlign: 'center' }}>No playlists yet</div>
                                )}
                                {playlists.map(playlist => {
                                    const isIncluded = playlist.items.some(i => i.url === videoUrl);
                                    return (
                                        <div key={playlist.id} className="yt-sheet-item" onClick={() => togglePlaylist(playlist.id)}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span>{playlist.name}</span>
                                                <span style={{ fontSize: '12px', color: '#aaa' }}>{playlist.items.length} videos • Private</span>
                                            </div>
                                            <div className={`yt-checkbox ${isIncluded ? 'checked' : ''}`}>
                                                {isIncluded && <Check size={14} strokeWidth={3} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="yt-sheet-item" onClick={() => setShowSaveSheet(false)} style={{ borderTop: '1px solid #333', marginTop: '8px' }}>
                                <span style={{ textAlign: 'center', width: '100%', fontWeight: '500' }}>Done</span>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </motion.div>
    );

    // YouTube-style two-column layout when channels exist
    if (hasChannels) {
        return (
            <div className={`yt-watch-page ${isTheaterMode ? 'theater-mode' : ''}`}>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleCaptionUpload}
                    style={{ display: 'none' }}
                    accept=".vtt,.srt"
                />

                {/* Ambient Mode Glow */}
                {isAmbientMode && (
                    <div
                        className="ambient-glow"
                        style={{
                            background: `radial-gradient(ellipse at center, ${ambientColors[0]}40, ${ambientColors[1]}20, transparent 70%)`
                        }}
                    />
                )}

                <div className="yt-primary">
                    {videoPlayerContent}

                    {/* Video Metadata Section */}
                    <VideoMetadata
                        key={videoUrl}
                        video={{ title: currentChannel?.name || 'Live Stream' }}
                        channel={currentChannel}
                        isLiked={isFavorited}
                        onLike={() => {
                            const newStatus = toggleFavorite({ url: videoUrl, title: currentChannel?.name || 'Video' });
                            setIsFavorited(newStatus);
                            showGestureFeedback(newStatus ? 'Liked' : 'Removed', <ThumbsUp size={24} />);
                        }}
                        onDislike={() => { }}
                        onShare={() => {
                            if (navigator.share) {
                                navigator.share({ title: currentChannel?.name, url: videoUrl });
                            } else {
                                navigator.clipboard.writeText(videoUrl);
                                showGestureFeedback('Link Copied!', null);
                            }
                        }}
                        onSave={handleSaveClick}
                    />

                </div>
                {!isTheaterMode && (
                    <div className="yt-secondary">
                        <ChannelList
                            channels={channels}
                            currentChannel={currentChannel}
                            onSelectChannel={handleChannelSelect}
                        />
                    </div>
                )}
            </div>
        );
    }

    // Standard single-video layout
    return (
        <div style={styles.container}>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleCaptionUpload}
                style={{ display: 'none' }}
                accept=".vtt,.srt"
            />

            {/* Ambient Mode Glow */}
            {isAmbientMode && (
                <div
                    className="ambient-glow"
                    style={{
                        background: `radial-gradient(ellipse at center, ${ambientColors[0]}40, ${ambientColors[1]}20, transparent 70%)`
                    }}
                />
            )}

            <div className="yt-primary" style={{ width: '100%', maxWidth: '1280px', display: 'flex', flexDirection: 'column' }}>
                {videoPlayerContent}

                {/* Video Metadata Section */}
                <VideoMetadata
                    key={videoUrl}
                    video={{ title: 'Video Playback', date: new Date().toLocaleDateString() }}
                    channel={{ name: 'Local File / Stream', subscribers: 0 }}
                    onLike={() => { }}
                    onDislike={() => { }}
                    onShare={() => {
                        if (navigator.share) {
                            navigator.share({ title: 'Video', url: videoUrl });
                        } else {
                            navigator.clipboard.writeText(videoUrl);
                            showGestureFeedback('Link Copied!', null);
                        }
                    }}
                    onSave={handleSaveClick}
                />
            </div>
        </div>
    );
};

const styles = {
    container: { display: 'flex', justifyContent: 'center', padding: '20px 0', backgroundColor: '#0f0f0f' },
    videoWrapper: { width: '100%', maxWidth: '1280px', aspectRatio: '16/9', backgroundColor: '#000', borderRadius: '12px', overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 60px rgba(0,0,0,0.5)' },
    fullscreen: { maxWidth: '100vw', maxHeight: '100vh', borderRadius: 0, width: '100%', height: '100%', padding: 0, margin: 0, position: 'fixed', top: 0, left: 0, zIndex: 9999 },
    video: { width: '100%', height: '100%', objectFit: 'contain' },
    centerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 5 },
    loadingSpinner: { width: '50px', height: '50px', border: '4px solid rgba(255,255,255,0.3)', borderTop: '4px solid #fff', borderRadius: '50%' },
    controlsOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)', padding: '10px 16px 20px', display: 'flex', flexDirection: 'column', gap: '10px', zIndex: 10 },
    progressBarContainer: { width: '100%', height: '16px', display: 'flex', alignItems: 'center', cursor: 'pointer', marginBottom: '4px' },
    progressBar: { width: '100%', height: '4px', borderRadius: '2px', appearance: 'none' },
    controlsRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    leftControls: { display: 'flex', alignItems: 'center', gap: '10px' },
    rightControls: { display: 'flex', alignItems: 'center', gap: '10px' },
    controlBtn: { padding: '8px', borderRadius: '50%', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    volumeContainer: { display: 'flex', alignItems: 'center', gap: '8px' },
    volumeSlider: { cursor: 'pointer', marginLeft: '5px' },
    timeText: { fontSize: '14px', color: '#ddd', fontFamily: 'Roboto, sans-serif', marginLeft: '8px' },
    brightnessOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 5, backgroundColor: 'black' },
    emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', marginTop: '100px' }
};

export default VideoPlayer;
