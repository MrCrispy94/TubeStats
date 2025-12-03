import React, { useState } from 'react';
import { WatchStats, VideoEntry, AnalysisStatus } from '../types';
import { analyzeViewingHabits, estimateWatchTimeSmartly, analyzeMusicTrends } from '../services/geminiService';

interface SmartDashboardProps {
  stats: WatchStats;
  rawData: VideoEntry[];
}

// Helper function to calculate top stats for a subset of data
const calculateSubsetStats = (entries: VideoEntry[]) => {
    const videoCounts = new Map<string, { title: string; count: number; channel: string; url: string }>();
    const channelCounts = new Map<string, number>();

    for (const entry of entries) {
        const key = entry.id || entry.url;
        if (!videoCounts.has(key)) {
            videoCounts.set(key, { title: entry.title, count: 0, channel: entry.channel, url: entry.url });
        }
        videoCounts.get(key)!.count++;

        const cName = entry.channel || 'Unknown Channel';
        channelCounts.set(cName, (channelCounts.get(cName) || 0) + 1);
    }

    const topVideos = Array.from(videoCounts.values()).sort((a, b) => b.count - a.count).slice(0, 10);
    const topChannels = Array.from(channelCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { topVideos, topChannels };
};


export const SmartDashboard: React.FC<SmartDashboardProps> = ({ stats, rawData }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [estimatedMinutesAI, setEstimatedMinutesAI] = useState<number>(0);
  const [avgDuration, setAvgDuration] = useState<number>(0); 

  const yearSpan = stats.firstDate && stats.lastDate 
    ? stats.lastDate.getFullYear() - stats.firstDate.getFullYear() + 1 
    : 1;

  const handleGeneralAnalysis = async () => {
    setStatus(AnalysisStatus.ANALYZING);

    try {
      // 1. Get a sample of titles to guess average duration via AI
      const sample = rawData
        .sort(() => 0.5 - Math.random())
        .slice(0, 30)
        .map(v => v.title);
      
      const smartAvg = await estimateWatchTimeSmartly(sample);
      setAvgDuration(smartAvg);

      const totalMins = stats.totalVideos * smartAvg;
      setEstimatedMinutesAI(totalMins);

      // 2. Get Personality Profile
      const dateRange = `${stats.firstDate?.getFullYear()} - ${stats.lastDate?.getFullYear()}`;
      const text = await analyzeViewingHabits(
        stats.topVideos, 
        stats.topChannels, 
        stats.totalVideos,
        dateRange
      );
      setAnalysis(text);
      setStatus(AnalysisStatus.COMPLETE);

    } catch (err) {
      console.error(err);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const handleMusicAnalysis = async () => {
    setStatus(AnalysisStatus.ANALYZING);
    try {
      const firstYear = stats.firstDate!.getFullYear();
      const lastYear = stats.lastDate!.getFullYear();

      if (firstYear === lastYear) {
        setAnalysis(`Music trend analysis requires at least two different years of data to compare. Your history only contains data for ${firstYear}.`);
        setStatus(AnalysisStatus.COMPLETE);
        return;
      }

      const firstYearEntries = rawData.filter(d => new Date(d.date).getFullYear() === firstYear);
      const lastYearEntries = rawData.filter(d => new Date(d.date).getFullYear() === lastYear);

      const firstYearStats = calculateSubsetStats(firstYearEntries);
      const lastYearStats = calculateSubsetStats(lastYearEntries);

      const text = await analyzeMusicTrends(firstYearStats, lastYearStats, firstYear, lastYear);
      setAnalysis(text);
      setStatus(AnalysisStatus.COMPLETE);
    } catch (err) {
      console.error(err);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} mins`;
    const days = Math.floor(minutes / (24 * 60));
    const hours = Math.floor((minutes % (24 * 60)) / 60);
    if (days === 0) return `${hours} hours`;
    return `${days} days, ${hours} hours`;
  };

  return (
    <div className="bg-gradient-to-br from-[#2a1a1a] to-[#1e1e1e] border border-red-900/30 rounded-xl p-6 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-600 blur-[80px] opacity-20 pointer-events-none"></div>
      
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
        ✨ AI-Powered Insights
      </h2>
      
      <div className="mb-6 bg-[#0f0f0f]/50 p-4 rounded-lg border border-gray-700">
        <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">Time Calculated (Gaps)</div>
        <div className="text-3xl font-mono text-white">
             {formatDuration(stats.estimatedMinutesDeterministic)}
        </div>
        <div className="text-xs text-gray-500 mt-2">
            Based on time between video starts (capped at 60m per video).
        </div>
      </div>

      {!analysis && status === AnalysisStatus.IDLE && (
        <div className="space-y-4 border-t border-gray-800 pt-4">
           <p className="text-gray-400 text-sm">
            Use AI to generate a personality profile or analyze your music taste evolution over time.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button 
                onClick={handleGeneralAnalysis}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold transition-all w-full flex justify-center items-center gap-2 text-sm"
            >
                Analyze Viewing Habits 🎭
            </button>
            <button 
                onClick={handleMusicAnalysis}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-all w-full flex justify-center items-center gap-2 text-sm"
            >
                Analyze Music Trends 🎵
            </button>
          </div>
        </div>
      )}

      {status === AnalysisStatus.ANALYZING && (
        <div className="text-center py-10 animate-pulse text-red-400">
          Crunching {yearSpan} {yearSpan > 1 ? 'years' : 'year'} of data... 🧠
        </div>
      )}

      {status === AnalysisStatus.ERROR && (
        <div className="text-center py-6 text-red-400 bg-red-900/10 rounded-lg">
          <p>Something went wrong during analysis. Please try again.</p>
          <button 
            onClick={() => setStatus(AnalysisStatus.IDLE)}
            className="mt-2 text-sm underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {status === AnalysisStatus.COMPLETE && (
        <div className="space-y-6 animate-fade-in border-t border-gray-800 pt-4">
          
          {estimatedMinutesAI > 0 && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#0f0f0f]/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">AI Est. Avg Length</div>
                    <div className="text-2xl font-mono text-white">{avgDuration} min</div>
                    <div className="text-xs text-gray-500 mt-2">Based on title sampling</div>
                </div>
                <div className="bg-[#0f0f0f]/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-gray-400 text-xs uppercase tracking-widest mb-1">AI Est. Total Time</div>
                    <div className="text-2xl font-mono text-red-400">{formatDuration(estimatedMinutesAI)}</div>
                    <div className="text-xs text-gray-500 mt-2">If every video was avg length</div>
                </div>
            </div>
          )}

          <div className="prose prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-4">
                {analysis}
            </div>
          </div>

          <button 
             onClick={() => {
                setAnalysis(null);
                setEstimatedMinutesAI(0);
                setAvgDuration(0);
                setStatus(AnalysisStatus.IDLE);
             }}
             className="text-xs text-gray-500 hover:text-white underline"
          >
            Reset Analysis
          </button>
        </div>
      )}
    </div>
  );
};