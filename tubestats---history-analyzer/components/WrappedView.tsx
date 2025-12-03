import React, { useMemo, useState, useEffect } from 'react';
import { VideoEntry } from '../types';

interface WrappedViewProps {
  data: VideoEntry[];
}

const THEMES = [
  {
    name: 'Neon Nights',
    gradient: 'from-purple-400 via-pink-500 to-red-500',
    bgGradient: 'from-purple-900/20 to-black',
    accent: 'text-purple-400',
    border: 'hover:border-purple-500',
    badge: 'bg-pink-600',
    textGradient: 'bg-gradient-to-r from-purple-400 via-pink-500 to-red-500'
  },
  {
    name: 'Oceanic',
    gradient: 'from-cyan-400 via-blue-500 to-indigo-500',
    bgGradient: 'from-blue-900/20 to-black',
    accent: 'text-cyan-400',
    border: 'hover:border-cyan-500',
    badge: 'bg-blue-600',
    textGradient: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500'
  },
  {
    name: 'Sunset',
    gradient: 'from-yellow-400 via-orange-500 to-red-500',
    bgGradient: 'from-orange-900/20 to-black',
    accent: 'text-orange-400',
    border: 'hover:border-orange-500',
    badge: 'bg-orange-600',
    textGradient: 'bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500'
  },
  {
    name: 'Matrix',
    gradient: 'from-emerald-400 via-green-500 to-teal-500',
    bgGradient: 'from-green-900/20 to-black',
    accent: 'text-emerald-400',
    border: 'hover:border-emerald-500',
    badge: 'bg-green-600',
    textGradient: 'bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500'
  },
  {
    name: 'Glacier',
    gradient: 'from-slate-200 via-gray-400 to-slate-500',
    bgGradient: 'from-slate-800/20 to-black',
    accent: 'text-slate-300',
    border: 'hover:border-slate-400',
    badge: 'bg-slate-600',
    textGradient: 'bg-gradient-to-r from-slate-200 via-gray-400 to-slate-500'
  }
];

export const WrappedView: React.FC<WrappedViewProps> = ({ data }) => {
  // 1. Get available years
  const years = useMemo(() => {
    if (!data || data.length === 0) return [];
    // Ensure dates are Date objects and perform explicit type sort
    const uniqueYears = Array.from(new Set(data.map(d => new Date(d.date).getFullYear())));
    return uniqueYears.sort((a: number, b: number) => b - a); // Descending
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Set default year when years are loaded
  useEffect(() => {
    if (years.length > 0 && selectedYear === null) {
        setSelectedYear(years[0]);
    }
  }, [years, selectedYear]);

  // 2. Filter stats based on selected year
  const stats = useMemo(() => {
    if (!data || data.length === 0 || selectedYear === null) return null;

    // Filter for that year (ensure Date conversion)
    const yearData = data.filter((d) => new Date(d.date).getFullYear() === selectedYear);

    // Aggregation
    const channelMap = new Map<string, { count: number; name: string; sampleVideoId: string }>();
    const videoMap = new Map<string, { count: number; entry: VideoEntry }>();

    yearData.forEach((v) => {
      // Channels
      const cName = v.channel || 'Unknown';
      if (!channelMap.has(cName)) {
        channelMap.set(cName, { count: 0, name: cName, sampleVideoId: v.id });
      }
      const c = channelMap.get(cName)!;
      c.count++;
      if (!c.sampleVideoId && v.id) c.sampleVideoId = v.id;

      // Videos
      const vKey = v.id || v.url;
      if (!videoMap.has(vKey)) {
        videoMap.set(vKey, { count: 0, entry: v });
      }
      videoMap.get(vKey)!.count++;
    });

    const topChannels = Array.from(channelMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topVideos = Array.from(videoMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      year: selectedYear,
      topChannels,
      topVideos,
      totalViews: yearData.length,
    };
  }, [data, selectedYear]);

  if (!stats || selectedYear === null) return null;

  // Select Theme based on Year
  // We use modulo so it cycles through themes if there are many years
  const yearIndex = years.indexOf(selectedYear);
  const safeIndex = yearIndex >= 0 ? yearIndex : 0;
  const themeIndex = safeIndex % THEMES.length;
  const theme = THEMES[themeIndex];

  return (
    <div className={`animate-fade-in w-full max-w-5xl mx-auto pb-20`}>
      
      {/* Year Selector */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 py-4 sticky top-0 bg-[#0f0f0f]/90 backdrop-blur-md z-20 border-b border-gray-800">
        {years.map(y => (
            <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1 rounded-full text-sm font-bold transition-all ${
                    selectedYear === y 
                    ? `bg-white text-black scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]` 
                    : 'bg-[#1e1e1e] text-gray-400 hover:text-white hover:bg-[#2a2a2a]'
                }`}
            >
                {y}
            </button>
        ))}
      </div>

      {/* Hero Header */}
      <div className="text-center py-12 mb-8 relative">
         <div className={`absolute inset-0 bg-gradient-to-b ${theme.bgGradient} opacity-20 pointer-events-none blur-3xl rounded-full`}></div>
        <h1 className={`text-6xl md:text-8xl font-black text-transparent bg-clip-text ${theme.textGradient} tracking-tighter mb-4 drop-shadow-2xl transition-all duration-500`}>
          {stats.year}
        </h1>
        <h2 className="text-2xl md:text-4xl font-bold text-white uppercase tracking-widest">
          Wrapped
        </h2>
        <p className="text-gray-400 mt-4 text-lg">
          You watched <span className="text-white font-bold">{stats.totalViews.toLocaleString()}</span> videos in {stats.year}.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">
        
        {/* Top Channels Section */}
        <div className="space-y-6">
          <h3 className={`text-3xl font-black text-white italic -rotate-1 mb-8 text-center md:text-left transition-colors duration-500`}>
            #TopChannels
          </h3>
          <div className="space-y-4">
            {stats.topChannels.map((channel, idx) => (
              <div
                key={channel.name}
                className={`group relative h-24 bg-[#1a1a1a] rounded-xl overflow-hidden flex items-center border border-gray-800 ${theme.border} transition-all hover:scale-[1.02] shadow-xl`}
              >
                {/* Background Image (Blurred) */}
                <div className="absolute inset-0 z-0 opacity-30">
                  <img
                    src={`https://img.youtube.com/vi/${channel.sampleVideoId}/mqdefault.jpg`}
                    alt="Channel Art"
                    className="w-full h-full object-cover blur-sm scale-110"
                  />
                </div>
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent z-0"></div>

                {/* Rank */}
                <div className={`relative z-10 w-16 h-full flex items-center justify-center text-5xl font-black text-gray-800 group-hover:text-white/20 transition-colors`}>
                  {idx + 1}
                </div>

                {/* Content */}
                <div className="relative z-10 flex-1 px-4">
                  <h4 className="text-xl font-bold text-white truncate">{channel.name}</h4>
                  <p className={`text-sm font-bold ${theme.accent} transition-colors duration-500`}>{channel.count} plays</p>
                </div>
              </div>
            ))}
            {stats.topChannels.length === 0 && (
                <div className="text-gray-500 text-center py-10 italic">No channel data found for this year.</div>
            )}
          </div>
        </div>

        {/* Top Videos Section */}
        <div className="space-y-6">
          <h3 className={`text-3xl font-black text-white italic rotate-1 mb-8 text-center md:text-left transition-colors duration-500`}>
            #OnRepeat
          </h3>
          <div className="grid grid-cols-1 gap-6">
            {stats.topVideos.map((item, idx) => (
              <a
                key={`${item.entry.url}-${idx}`}
                href={item.entry.url}
                target="_blank"
                rel="noreferrer"
                className={`group block relative aspect-video md:aspect-[21/9] rounded-xl overflow-hidden shadow-2xl border border-gray-800 ${theme.border} transition-all hover:-translate-y-1`}
              >
                {/* Thumbnail */}
                <img
                  src={`https://img.youtube.com/vi/${item.entry.id}/hqdefault.jpg`}
                  alt={item.entry.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/640x360/000000/333333?text=Video';
                  }}
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 group-hover:opacity-70 transition-opacity"></div>

                {/* Rank Badge */}
                <div className={`absolute top-2 left-2 ${theme.badge} text-white font-black text-sm px-3 py-1 rounded shadow-lg transition-colors duration-500`}>
                  #{idx + 1}
                </div>

                {/* Text Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h4 className="text-white font-bold text-lg leading-tight line-clamp-2 drop-shadow-md transition-colors">
                    {item.entry.title}
                  </h4>
                  <div className="flex justify-between items-end mt-2">
                    <span className="text-gray-300 text-xs font-medium bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                        {item.entry.channel}
                    </span>
                    <span className="text-white font-mono font-bold text-lg">
                      {item.count} <span className="text-xs font-sans font-normal text-gray-400">views</span>
                    </span>
                  </div>
                </div>
              </a>
            ))}
             {stats.topVideos.length === 0 && (
                <div className="text-gray-500 text-center py-10 italic">No video data found for this year.</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-20 text-center">
          <div className={`inline-block p-1 rounded-full ${theme.textGradient} transition-all duration-500`}>
             <div className="bg-[#0f0f0f] rounded-full px-8 py-3">
                 <p className="text-gray-400 font-medium">
                     That's a wrap on <span className="text-white font-bold">{stats.year}</span>! 🎬
                 </p>
             </div>
          </div>
      </div>
    </div>
  );
};
