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
  const [resumeTime, setResumeTime] = useState(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [refreshContinueWatching, setRefreshContinueWatching] = useState(0);

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
    setResumeTime(0); // Recommendations start fresh
  };

  const handlePlaylistsLoaded = (loadedPlaylists) => {
    setPlaylists(loadedPlaylists);
  };

  const handleGoHome = () => {
    setCurrentVideoUrl('');
    setCurrentVideoTitle('');
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

