import { GoogleGenAI } from "@google/genai";
import { VideoEntry } from "../types";

const getAIClient = () => {
    // Uses the pre-configured environment variable exclusively.
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const analyzeViewingHabits = async (
    topVideos: { title: string, count: number }[],
    topChannels: { name: string, count: number }[],
    totalCount: number,
    dateRange: string
): Promise<string> => {
    try {
        const ai = getAIClient();
        
        const prompt = `
        I have a YouTube watch history dataset with the following stats:
        - Total Videos Watched: ${totalCount}
        - Date Range: ${dateRange}
        - Top 10 Most Watched Videos: ${JSON.stringify(topVideos.slice(0, 10))}
        - Top 10 Most Watched Channels: ${JSON.stringify(topChannels.slice(0, 10))}

        Please provide a fun, "Spotify Wrapped" style personality profile of my viewing habits. 
        1. Give me a creative "Viewer Persona" title (e.g., "The Educational Binge-Watcher").
        2. Estimate the type of content I prefer (Shorts vs Long form) based on the channels and titles.
        3. Provide a rough estimate of total time spent if the average video length was 10 minutes (adjust this average based on if the titles look like Shorts or Music).
        4. Use emojis.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Could not generate analysis.";
    } catch (error) {
        console.error("Gemini Analysis Error:", error);
        throw error;
    }
};

export const analyzeMusicTrends = async (
    firstYearStats: { topVideos: any[], topChannels: any[] },
    lastYearStats: { topVideos: any[], topChannels: any[] },
    firstYear: number,
    lastYear: number
): Promise<string> => {
    try {
        const ai = getAIClient();
        
        const prompt = `
        Analyze the evolution of my musical taste on YouTube based on the following data.

        This is my data from my first year on YouTube, ${firstYear}:
        - Top 10 Watched Videos: ${JSON.stringify(firstYearStats.topVideos)}
        - Top 10 Watched Channels: ${JSON.stringify(firstYearStats.topChannels)}

        This is my data from my most recent year, ${lastYear}:
        - Top 10 Watched Videos: ${JSON.stringify(lastYearStats.topVideos)}
        - Top 10 Watched Channels: ${JSON.stringify(lastYearStats.topChannels)}

        Please provide a detailed analysis:
        1.  **Identify Music Content:** Look through the video titles and channel names in both years and identify what seems to be music-related (e.g., official artist channels, VEVO, music videos, lyric videos, specific genres).
        2.  **Describe My Taste (First Year):** Based on the identified music from ${firstYear}, describe my musical preferences. What genres, artists, or types of music was I into?
        3.  **Describe My Taste (Recent Year):** Now do the same for ${lastYear}. What am I listening to now?
        4.  **Analyze the Evolution:** Compare the two periods. Has my taste evolved? Did I stick with the same artists/genres, or did I explore new ones? Point out specific examples of this change or consistency.
        5.  Conclude with a fun summary of my musical journey on YouTube. Use emojis.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });

        return response.text || "Could not generate music trend analysis.";
    } catch (error) {
        console.error("Gemini Music Analysis Error:", error);
        throw error;
    }
};


export const estimateWatchTimeSmartly = async (sampleTitles: string[]): Promise<number> => {
    try {
        const ai = getAIClient();
        
        const prompt = `
        I have a list of random YouTube video titles from a user's history. 
        Based on these titles, estimate the *average* duration in minutes that this user typically watches.
        Consider if they look like #Shorts (usually < 1 min), Music (3-5 mins), or Video Essays (20+ mins).
        
        Titles:
        ${JSON.stringify(sampleTitles)}

        Return ONLY a single number representing the estimated average duration in minutes. Do not return text.
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
        });
        
        const text = response.text?.trim();
        const number = parseFloat(text || "10");
        return isNaN(number) ? 10 : number;
    } catch (error) {
        console.error("Estimation Error", error);
        return 10; // Fallback default
    }
};