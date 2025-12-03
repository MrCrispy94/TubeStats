import React, { useState } from 'react';
import { WatchStats } from '../types';

interface TopStatsProps {
  stats: WatchStats;
}

export const TopStats: React.FC<TopStatsProps> = ({ stats }) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'channels'>('videos');

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 shadow-lg overflow-hidden flex flex-col h-[500px]">
      <div className="flex border-b border-gray-800">
        <button
          onClick={() => setActiveTab('videos')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${
            activeTab === 'videos' ? 'bg-[#2a2a2a] text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Most Watched Videos
        </button>
        <button
          onClick={() => setActiveTab('channels')}
          className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider ${
            activeTab === 'channels' ? 'bg-[#2a2a2a] text-red-500 border-b-2 border-red-500' : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          Top Channels
        </button>
      </div>

      <div className="overflow-y-auto flex-1 p-0 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#121212] sticky top-0">
            <tr>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase">Rank</th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase">
                {activeTab === 'videos' ? 'Title' : 'Channel Name'}
              </th>
              <th className="p-4 text-xs font-medium text-gray-500 uppercase text-right">Plays</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {activeTab === 'videos' ? (
              stats.topVideos.slice(0, 50).map((video, idx) => (
                <tr key={idx} className="hover:bg-[#2a2a2a] transition-colors">
                  <td className="p-4 text-gray-500 w-16 text-center">{idx + 1}</td>
                  <td className="p-4">
                    <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-gray-200 hover:text-red-400 font-medium block truncate max-w-[250px] sm:max-w-md">
                      {video.title}
                    </a>
                    <span className="text-xs text-gray-500">{video.channel}</span>
                  </td>
                  <td className="p-4 text-right text-red-400 font-mono font-bold">{video.count}</td>
                </tr>
              ))
            ) : (
              stats.topChannels.slice(0, 50).map((channel, idx) => (
                <tr key={idx} className="hover:bg-[#2a2a2a] transition-colors">
                  <td className="p-4 text-gray-500 w-16 text-center">{idx + 1}</td>
                  <td className="p-4">
                    <span className="text-gray-200 font-medium block truncate">
                      {channel.name}
                    </span>
                  </td>
                  <td className="p-4 text-right text-red-400 font-mono font-bold">{channel.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
