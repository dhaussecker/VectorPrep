export interface YouTubeResult {
  title: string;
  videoId: string;
  url: string;
}

export async function searchYouTubeVideos(
  query: string,
  maxResults = 2,
): Promise<YouTubeResult[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.warn("YOUTUBE_API_KEY not set — skipping YouTube search");
    return [];
  }

  try {
    const params = new URLSearchParams({
      part: "snippet",
      q: query + " tutorial explanation",
      type: "video",
      maxResults: String(maxResults),
      relevanceLanguage: "en",
      safeSearch: "strict",
      key: apiKey,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params}`,
    );

    if (!res.ok) {
      console.warn(`YouTube API error (${res.status}):`, await res.text());
      return [];
    }

    const data = await res.json();
    return (data.items || []).map((item: any) => ({
      title: item.snippet?.title || "",
      videoId: item.id?.videoId || "",
      url: `https://www.youtube.com/watch?v=${item.id?.videoId}`,
    }));
  } catch (err) {
    console.warn("YouTube search failed:", err);
    return [];
  }
}
