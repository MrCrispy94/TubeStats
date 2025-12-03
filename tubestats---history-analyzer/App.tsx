import React, { useState, useMemo } from 'react';
import { parseYouTubeHistory } from './utils/parser';
import { VideoEntry, WatchStats, TimeGranularity } from './types';
import { HistoryChart } from './components/HistoryChart';
import { TopStats } from './components/TopStats';
import { SmartDashboard } from './components/SmartDashboard';
import { HistoryList } from './components/HistoryList';
import { WrappedView } from './components/WrappedView';

type TabView = 'dashboard' | 'history' | 'wrapped';

const App = () => {
  const [data, setData] = useState<VideoEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [granularity, setGranularity] = useState<TimeGranularity>('month');
  const [activeTab, setActiveTab] = useState<TabView>('dashboard');

  // Compute stats only when data changes
  const stats: WatchStats | null = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Sort data chronologically for time gap analysis
    const sortedData = [...data].sort((a, b) => a.date.getTime() - b.date.getTime());

    const videoCounts = new Map<string, { title: string; count: number; channel: string; url: string }>();
    const channelCounts = new Map<string, number>();
    let minDate = sortedData[0].date;
    let maxDate = sortedData[sortedData.length - 1].date;
    const uniqueIds = new Set<string>();
    let totalMinutesCalculated = 0;

    for (let i = 0; i < sortedData.length; i++) {
        const entry = sortedData[i];
        
        // --- Tally Logic ---
        uniqueIds.add(entry.id);
        
        const key = entry.id || entry.url;
        if (!videoCounts.has(key)) {
            videoCounts.set(key, { title: entry.title, count: 0, channel: entry.channel, url: entry.url });
        }
        videoCounts.get(key)!.count++;

        const cName = entry.channel || 'Unknown Channel';
        channelCounts.set(cName, (channelCounts.get(cName) || 0) + 1);

        // --- Duration Calculation Logic ---
        // We look at the gap between this video and the next.
        // If the gap is reasonable (e.g., < 60 mins), we assume that was the watch time.
        // If it's huge (e.g. slept, stopped watching), we cap it at a default (e.g. 15 mins).
        let duration = 15; // fallback
        const nextEntry = sortedData[i + 1];
        
        if (nextEntry) {
            const diffMs = nextEntry.date.getTime() - entry.date.getTime();
            const diffMins = diffMs / 1000 / 60;
            
            // If watched another video within 60 mins, use that gap as duration
            // (Assuming they watched Video A until Video B started)
            if (diffMins > 0 && diffMins < 60) {
                duration = diffMins;
            }
        }
        totalMinutesCalculated += duration;
    }

    const topVideos = Array.from(videoCounts.values()).sort((a, b) => b.count - a.count);
    const topChannels = Array.from(channelCounts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalVideos: data.length,
      uniqueVideos: uniqueIds.size,
      topVideos,
      topChannels,
      firstDate: minDate,
      lastDate: maxDate,
      estimatedMinutesDeterministic: Math.floor(totalMinutesCalculated)
    };
  }, [data]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const parsedData = await parseYouTubeHistory(file);
      setData(parsedData);
      setActiveTab('dashboard');
    } catch (err) {
      alert("Error parsing file. Ensure it is the 'watch-history.html' from Google Takeout.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12 font-sans selection:bg-red-500 selection:text-white">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-6">
            <div>
                <h1 className="text-4xl font-black tracking-tighter text-white">
                Tube<span className="text-red-600">Stats</span>
                </h1>
                <p className="text-gray-500 mt-1">Visualize your complete viewing history</p>
            </div>
            
            {data && (
                <nav className="hidden md:flex bg-[#1e1e1e] rounded-lg p-1 border border-gray-700">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'dashboard' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Dashboard
                    </button>
                    <button 
                         onClick={() => setActiveTab('history')}
                         className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Full History
                    </button>
                    <button 
                         onClick={() => setActiveTab('wrapped')}
                         className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'wrapped' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        <span>Wrapped</span>
                        <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">New</span>
                    </button>
                </nav>
            )}
          </div>
          
          {!data && (
            <label className="cursor-pointer bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-all shadow-lg flex items-center gap-2 group">
              <svg className="w-5 h-5 text-gray-400 group-hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              <span>Upload watch-history.html</span>
              <input type="file" accept=".html" onChange={handleFileUpload} className="hidden" />
            </label>
          )}

            {data && (
                <div className="md:hidden flex gap-2">
                     <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`px-3 py-1 text-xs rounded border ${activeTab === 'dashboard' ? 'bg-white text-black border-white' : 'text-gray-400 border-gray-700'}`}
                    >
                        Stats
                    </button>
                    <button 
                         onClick={() => setActiveTab('history')}
                         className={`px-3 py-1 text-xs rounded border ${activeTab === 'history' ? 'bg-white text-black border-white' : 'text-gray-400 border-gray-700'}`}
                    >
                        History
                    </button>
                     <button 
                         onClick={() => setActiveTab('wrapped')}
                         className={`px-3 py-1 text-xs rounded border ${activeTab === 'wrapped' ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none' : 'text-gray-400 border-gray-700'}`}
                    >
                        Wrapped
                    </button>
                </div>
            )}
        </header>

        {loading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-400 animate-pulse">Parsing history file...</p>
            </div>
        )}

        {/* Content Area */}
        {data && stats && !loading && (
          <div className="animate-fade-in">
            
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Total Views</div>
                        <div className="text-3xl font-black text-white mt-1">{stats.totalVideos.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Unique Videos</div>
                        <div className="text-3xl font-black text-white mt-1">{stats.uniqueVideos.toLocaleString()}</div>
                    </div>
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Most Active Date</div>
                        <div className="text-3xl font-black text-white mt-1">
                            {stats.lastDate?.toLocaleDateString()}
                        </div>
                    </div>
                    <div className="bg-[#1e1e1e] p-6 rounded-xl border border-gray-800">
                        <div className="text-gray-500 text-sm uppercase font-bold tracking-wider">Top Channel</div>
                        <div className="text-xl font-bold text-red-500 mt-2 truncate">
                            {stats.topChannels[0]?.name}
                        </div>
                        <div className="text-xs text-gray-500">{stats.topChannels[0]?.count} plays</div>
                    </div>
                    </div>

                    {/* Main Layout Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column: Charts */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-end space-x-2">
                            {(['day', 'month', 'year'] as TimeGranularity[]).map(g => (
                                <button
                                    key={g}
                                    onClick={() => setGranularity(g)}
                                    className={`px-3 py-1 text-xs uppercase font-bold rounded ${granularity === g ? 'bg-red-600 text-white' : 'bg-[#1e1e1e] text-gray-400 hover:text-white'}`}
                                >
                                    {g}
                                </button>
                            ))}
                        </div>
                        <HistoryChart data={data} granularity={granularity} />
                        
                        <SmartDashboard stats={stats} rawData={data} />
                    </div>

                    {/* Right Column: Top Stats */}
                    <div className="lg:col-span-1">
                        <TopStats stats={stats} />
                    </div>

                    </div>
                </div>
            )}
            
            {activeTab === 'history' && (
                <HistoryList data={data} />
            )}

            {activeTab === 'wrapped' && (
                <WrappedView data={data} />
            )}

          </div>
        )}
        
        {/* Empty State / Intro */}
        {!data && !loading && (
          <div className="bg-[#1e1e1e] rounded-xl p-12 text-center border border-dashed border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-2">How to get your data?</h2>
            <p className="text-gray-400 max-w-lg mx-auto mb-8">
              1. Go to Google Takeout<br/>
              2. Deselect all, then select <strong>YouTube</strong><br/>
              3. Choose "history" only (HTML format)<br/>
              4. Download, unzip, and upload <code>watch-history.html</code> here.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default App;