import React, { useState, useEffect, useRef } from 'react';
import { VideoEntry } from '../types';

interface HistoryListProps {
  data: VideoEntry[];
}

const ITEMS_PER_PAGE = 50;

export const HistoryList: React.FC<HistoryListProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sort by date desc (newest first)
  const sortedData = React.useMemo(() => {
    return [...data].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [data]);

  const totalPages = Math.ceil(sortedData.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = sortedData.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-800 shadow-lg flex flex-col h-[800px] animate-fade-in">
      {/* Header / Pagination */}
      <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#121212] rounded-t-xl sticky top-0 z-10">
        <h3 className="text-xl font-bold text-white">Watch History ({sortedData.length.toLocaleString()} videos)</h3>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-white text-sm transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 rounded text-white text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* List Container */}
      <div ref={scrollRef} className="overflow-y-auto flex-1 p-4 space-y-4 custom-scrollbar">
        {currentItems.map((video, idx) => (
          <div 
            key={`${video.id}-${idx}`} 
            className="flex flex-col sm:flex-row gap-4 p-3 rounded-xl hover:bg-[#2a2a2a] transition-all group cursor-pointer border border-transparent hover:border-gray-700"
          >
            {/* Thumbnail Wrapper */}
            <div className="relative shrink-0 w-full sm:w-[160px] aspect-video bg-black rounded-lg overflow-hidden">
               {video.id && !video.id.includes('http') ? (
                  <img 
                    src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/320x180/000000/333333?text=No+Thumbnail';
                    }}
                  />
               ) : (
                 <div className="w-full h-full flex items-center justify-center bg-gray-900 text-gray-700 text-xs">
                    No Thumbnail
                 </div>
               )}
            </div>

            {/* Content */}
            <div className="flex flex-col justify-start min-w-0 flex-1">
              <div className="flex justify-between items-start gap-2">
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-white font-semibold text-base line-clamp-2 hover:text-red-500 transition-colors" title={video.title}>
                    {video.title}
                </a>
                <a href={video.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-white transition-opacity">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                </a>
              </div>
              
              <div className="mt-1 text-sm text-gray-400 flex items-center gap-1 hover:text-gray-200">
                <a href={video.channelUrl} target="_blank" rel="noopener noreferrer" className="truncate max-w-[200px]">
                    {video.channel}
                </a>
                <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              </div>

              <div className="mt-auto pt-2 text-xs text-gray-500 font-medium">
                Watched on {video.date.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })} at {video.date.toLocaleTimeString(undefined, {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};