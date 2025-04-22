
import { useRef, useState } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceMessagePlayerProps {
  src: string;
}

export const VoiceMessagePlayer = ({ src }: VoiceMessagePlayerProps) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={togglePlay}
        className="rounded-full bg-gray-200 p-2 hover:bg-gray-300 transition-colors"
      >
        {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
      </button>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        controls={false}
        preload="auto"
      />
      {/* Optionally show duration or progress here */}
    </div>
  );
};
