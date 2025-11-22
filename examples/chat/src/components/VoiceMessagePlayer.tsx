'use client';

import { Pause, Play } from 'lucide-react';
import { useEffect } from 'react';
import { useVoiceVisualizer, VoiceVisualizer } from 'react-voice-visualizer';

interface VoiceMessagePlayerProps {
  audioUrl: string;
}

export function VoiceMessagePlayer({ audioUrl }: VoiceMessagePlayerProps) {
  const recorderControls = useVoiceVisualizer();
  const { setPreloadedAudioBlob, togglePauseResume, isPlaying, isLoading } =
    recorderControls;

  const handleTogglePauseResume = () => {
    togglePauseResume();
  };

  useEffect(() => {
    if (audioUrl) {
      fetch(audioUrl)
        .then(response => response.blob())
        .then(blob => {
          setPreloadedAudioBlob(blob);
        });
    }
  }, [audioUrl]);

  return (
    <div className="voice-player-container">
      <button
        onClick={handleTogglePauseResume}
        className="play-pause-btn"
        disabled={isLoading}
      >
        {isPlaying ? (
          <Pause className="icon" />
        ) : (
          <Play className="icon play-icon" />
        )}
      </button>
      <div className="visualizer-wrapper">
        <VoiceVisualizer
          controls={recorderControls}
          isProgressIndicatorShown={true}
          isControlPanelShown={false}
          //   mainBarColor="#ffffff"
          //   secondaryBarColor="#a0aec0"
          height={40}
          barWidth={3}
          gap={2}
        />
      </div>
    </div>
  );
}
