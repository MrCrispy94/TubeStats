import { VideoEntry } from '../types';

// Optimization: Singleton element for decoding to avoid creating 50k DOM nodes
let decoderTextArea: HTMLTextAreaElement | null = null;
const convertHtmlEntities = (str: string) => {
  if (typeof document === 'undefined') return str;
  if (!decoderTextArea) {
    decoderTextArea = document.createElement('textarea');
  }
  decoderTextArea.innerHTML = str;
  return decoderTextArea.value;
};

export const parseYouTubeHistory = async (file: File): Promise<VideoEntry[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        reject(new Error('File is empty'));
        return;
      }

      const entries: VideoEntry[] = [];
      
      // Regex explanation:
      // Watched ... -> Start
      // href="([^"]+)" -> Video URL
      // >([^<]+)< -> Video Title
      // .*? -> Non-greedy match until next anchor (Channel)
      // href="([^"]+)" -> Channel URL
      // >([^<]+)< -> Channel Name
      // .*? -> Non-greedy match until break
      // <br>([^<]+) -> Date
      // Note: ".*?" can be risky if entries are malformed, but filters below catch the garbage.
      const regex = /Watched\s+<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>.*?<br>([^<]+)/g;
      
      let match;
      let parseErrors = 0;

      while ((match = regex.exec(content)) !== null) {
        try {
          const videoUrl = match[1];
          const rawTitle = match[2];
          const channelUrl = match[3];
          const rawChannel = match[4];
          const dateStr = match[5];

          const title = convertHtmlEntities(rawTitle);
          const channel = convertHtmlEntities(rawChannel);

          // --- FILTERING LOGIC ---
          // 1. Filter out "Products: YouTube" / "Why is this here?" / "From Google Ads"
          // These often appear when the regex skips a missing channel link and grabs footer text.
          if (
            channel === 'here' ||
            channel.includes('Products:') ||
            channel.includes('Why is this here?') ||
            channel.includes('From Google Ads') ||
            title.includes('From Google Ads') ||
            title === 'Visited YouTube Music'
          ) {
            continue;
          }

          // Parse Date
          // Date format in HTML is usually localized, e.g., "Oct 24, 2023, 8:32:01 PM EDT"
          const date = new Date(dateStr);

          // Extract ID
          let id = '';
          try {
            const urlObj = new URL(videoUrl);
            id = urlObj.searchParams.get('v') || videoUrl;
          } catch (e) {
            id = videoUrl;
          }

          if (!isNaN(date.getTime())) {
            entries.push({
              title,
              url: videoUrl,
              channel,
              channelUrl,
              date,
              id
            });
          }
        } catch (err) {
          parseErrors++;
        }
      }

      console.log(`Parsed ${entries.length} videos. Errors: ${parseErrors}`);
      resolve(entries);
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};