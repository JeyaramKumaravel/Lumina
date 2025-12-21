import React, { useState } from 'react';
import Header from './components/Header';
import VideoPlayer from './components/VideoPlayer';
import Library from './components/Library';

function App() {
  const [currentVideoUrl, setCurrentVideoUrl] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);

  const handleUrlSubmit = (url) => {
    setCurrentVideoUrl(url);
  };

  const handlePlayFromLibrary = (url, title) => {
    setCurrentVideoUrl(url);
    setShowLibrary(false);
  };

  return (
    <div style={styles.appContainer}>
      <Header
        onUrlSubmit={handleUrlSubmit}
        onOpenLibrary={() => setShowLibrary(true)}
      />
      <main style={styles.mainContent}>
        <VideoPlayer videoUrl={currentVideoUrl} />
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
