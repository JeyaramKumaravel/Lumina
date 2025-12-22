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
  const [showLibrary, setShowLibrary] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [recommendations, setRecommendations] = useState(null);

  // Update recommendations when video or playlists change
  useEffect(() => {
    if (currentVideoUrl && playlists.length > 0) {
      const recs = getPackageRecommendations(playlists, currentVideoUrl);
      setRecommendations(recs);
    } else {
      setRecommendations(null);
    }
  }, [currentVideoUrl, playlists]);

  const handlePlayFromLibrary = (url, title) => {
    setCurrentVideoUrl(url);
    setCurrentVideoTitle(title || '');
    setShowLibrary(false);
  };

  const handlePlayFromHome = (url, title, packageName) => {
    setCurrentVideoUrl(url);
    setCurrentVideoTitle(title || '');
  };

  const handlePlayFromRecommendation = (episode) => {
    setCurrentVideoUrl(episode.url);
    setCurrentVideoTitle(episode.title);
  };

  const handlePlaylistsLoaded = (loadedPlaylists) => {
    setPlaylists(loadedPlaylists);
  };

  const handleGoHome = () => {
    setCurrentVideoUrl('');
    setCurrentVideoTitle('');
    setRecommendations(null);
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
          />
        ) : (
          <>
            <VideoPlayer videoUrl={currentVideoUrl} />
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
