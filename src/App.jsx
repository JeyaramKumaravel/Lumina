import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Library from './components/Library';
import HomePage from './components/HomePage';
import Recommendations from './components/Recommendations';
import { getPackageRecommendations } from './utils/m3uPlaylistService';

function App() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [currentVideoTitle, setCurrentVideoTitle] = useState('');
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [resumeTime, setResumeTime] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [refreshContinueWatching, setRefreshContinueWatching] = useState(0);

  // Handle shared URLs from Web Share Target API
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedUrl = urlParams.get('url') || urlParams.get('text');

    if (sharedUrl) {
      // Extract video URL from shared content (might be a full URL or just text containing a URL)
      const urlMatch = sharedUrl.match(/(https?:\/\/[^\s]+)/);
      const videoUrl = urlMatch ? urlMatch[1] : sharedUrl;

      if (videoUrl.startsWith('http')) {
        setCurrentVideoUrl(videoUrl);
        setCurrentVideoTitle(urlParams.get('title') || 'Shared Video');
        // Clear URL params after handling
        window.history.replaceState({}, document.title, '/');
      }
    }
  }, []);

  // Update recommendations when video or playlists change
  useEffect(() => {
    if (currentVideoUrl && playlists.length > 0) {
      const recs = getPackageRecommendations(playlists, currentVideoUrl);
      setRecommendations(recs);
    } else {
      setRecommendations(null);
    }
  }, [currentVideoUrl, playlists]);

  const handlePlayFromLibrary = (url, title, resumeFrom = 0) => {
    setCurrentVideoUrl(url);
    setCurrentVideoTitle(title || '');
    setResumeTime(resumeFrom);
    setShowLibrary(false);
  };

  const handlePlayFromHome = (url, title, resumeFrom = 0) => {
    setCurrentVideoUrl(url);
    setCurrentVideoTitle(title || '');
    setResumeTime(typeof resumeFrom === 'number' ? resumeFrom : 0);
  };

  const handlePlayFromRecommendation = (episode) => {
    setCurrentVideoUrl(episode.url);
    setCurrentVideoTitle(episode.title);
    setCurrentEpisode(episode);
    setResumeTime(0); // Recommendations start fresh
  };

  const handlePlaylistsLoaded = (loadedPlaylists) => {
    setPlaylists(loadedPlaylists);
  };

  const handleGoHome = () => {
    setCurrentVideoUrl('');
    setCurrentVideoTitle('');
    setCurrentEpisode(null);
    setResumeTime(0);
    setRecommendations(null);
    // Trigger refresh of Continue Watching section
    setRefreshContinueWatching(prev => prev + 1);
  };

  return (
    <div style={styles.appContainer}>
      <Header
        onOpenLibrary={() => setShowLibrary(true)}
        onGoHome={handleGoHome}
        showHomeButton={!!currentVideoUrl}
      />

      <main style={styles.mainContent}>
        {!currentVideoUrl ? (
          <HomePage
            onPlayVideo={handlePlayFromHome}
            onPlaylistsLoaded={handlePlaylistsLoaded}
            refreshContinueWatching={refreshContinueWatching}
          />
        ) : (
          <>
            <VideoPlayer
              videoUrl={currentVideoUrl}
              resumeTime={resumeTime}
              videoTitle={currentVideoTitle}
              seriesData={recommendations}
              onPlayNext={handlePlayFromRecommendation}
              playlists={playlists}
              onVideoUrlChange={(url, time) => { setCurrentVideoUrl(url); setResumeTime(time); }}
            />
            {recommendations && (
              <Recommendations
                recommendations={recommendations}
                currentUrl={currentVideoUrl}
                onPlayEpisode={handlePlayFromRecommendation}
              />
            )}
          </>
        )}
      </main>

      <Library
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
        onPlayVideo={handlePlayFromLibrary}
      />
    </div>
  );
}

const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: '#0f0f0f',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
  }
};

export default App;

