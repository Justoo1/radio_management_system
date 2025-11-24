'use client';

import { useState, useEffect } from 'react';
import { Volume2, Zap, Radio, Sparkles, Play } from 'lucide-react';
import { Howl } from 'howler';

interface InstantAudio {
  id: string;
  name: string;
  audioUrl: string;
  duration: number;
  type: string;
  buttonColor?: string;
  icon?: string;
  hotkey?: string;
}

interface InstantPlayPadProps {
  onPlay: (audioId: string) => void;
}

export function InstantPlayPad({ onPlay }: InstantPlayPadProps) {
  const [audios, setAudios] = useState<InstantAudio[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInstantAudios();
  }, []);

  const fetchInstantAudios = async () => {
    try {
      const response = await fetch('/api/onair/instant-audios');
      const data = await response.json();
      setAudios(data);
    } catch (error) {
      console.error('Error fetching instant audios:', error);
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audio: InstantAudio) => {
    // Play locally with Howler.js
    const sound = new Howl({
      src: [audio.audioUrl],
      volume: 1.0,
      onplay: () => {
        setPlaying(audio.id);
        onPlay(audio.id);
      },
      onend: () => {
        setPlaying(null);
      },
    });

    sound.play();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'JINGLE':
        return <Radio className="w-6 h-6" />;
      case 'SOUND_EFFECT':
        return <Volume2 className="w-6 h-6" />;
      case 'STATION_ID':
        return <Sparkles className="w-6 h-6" />;
      default:
        return <Zap className="w-6 h-6" />;
    }
  };

  const getButtonColor = (color?: string) => {
    if (color) return color;

    const colors = [
      'from-blue-600 to-blue-700',
      'from-purple-600 to-purple-700',
      'from-pink-600 to-pink-700',
      'from-green-600 to-green-700',
      'from-yellow-600 to-yellow-700',
      'from-red-600 to-red-700',
    ];

    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-6 border border-slate-700 shadow-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-white mb-1">Instant Play</h3>
          <p className="text-sm text-slate-400">
            Click to play jingles, sound effects, and station IDs
          </p>
        </div>
        <div className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs font-medium">
          {audios.length} sounds
        </div>
      </div>

      {audios.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <Volume2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg">No instant audio configured</p>
          <p className="text-sm mt-1">Add jingles and sound effects in settings</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {audios.map((audio) => (
            <button
              key={audio.id}
              onClick={() => playAudio(audio)}
              disabled={playing === audio.id}
              className={`
                group relative p-6 rounded-xl bg-gradient-to-br ${getButtonColor(audio.buttonColor)}
                hover:scale-105 active:scale-95 transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
                shadow-lg hover:shadow-xl
                ${playing === audio.id ? 'animate-pulse' : ''}
              `}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-white/20 rounded-full">
                  {playing === audio.id ? (
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="flex gap-1">
                        <div className="w-1 h-6 bg-white animate-pulse"></div>
                        <div className="w-1 h-6 bg-white animate-pulse delay-75"></div>
                        <div className="w-1 h-6 bg-white animate-pulse delay-150"></div>
                      </div>
                    </div>
                  ) : (
                    getIcon(audio.type)
                  )}
                </div>
                <div className="text-center">
                  <p className="font-bold text-white text-sm leading-tight">
                    {audio.name}
                  </p>
                  <p className="text-xs text-white/70 mt-1">
                    {audio.duration}s • {audio.type}
                  </p>
                </div>
                {audio.hotkey && (
                  <span className="absolute top-2 right-2 px-2 py-1 bg-black/30 text-white text-xs rounded font-mono">
                    {audio.hotkey}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add New Button */}
      <button className="mt-6 w-full py-3 border-2 border-dashed border-slate-600 hover:border-purple-500 rounded-lg text-slate-400 hover:text-purple-400 transition-colors flex items-center justify-center gap-2">
        <Play className="w-5 h-5" />
        Add New Instant Audio
      </button>
    </div>
  );
}
