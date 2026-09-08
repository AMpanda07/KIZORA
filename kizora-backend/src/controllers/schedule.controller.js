const axios = require('axios');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 8000;

// Simple in-memory cache for schedule data (15 minutes TTL)
const scheduleCache = new Map();
const CACHE_TTL_MS = 15 * 60 * 1000;

/**
 * Format a Date object or Epoch seconds to Asia/Kolkata date and time components
 */
const formatKolkataDateTime = (dateOrEpochSec) => {
  const d = typeof dateOrEpochSec === 'number' ? new Date(dateOrEpochSec * 1000) : dateOrEpochSec;
  
  // Format YYYY-MM-DD
  const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // 'YYYY-MM-DD'
  
  // Format HH:mm (24-hour)
  const timeStr = d.toLocaleTimeString('en-GB', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

  // Format Weekday (e.g., 'Monday')
  const weekday = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'long' });
  const dayName = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).toUpperCase();
  const dayNumber = parseInt(d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', day: 'numeric' }), 10);

  return { dateStr, timeStr, weekday, dayName, dayNumber };
};

/**
 * Fetch raw airing schedule from AniList GraphQL for a given timestamp window
 */
const fetchAniListAiringSchedule = async (startSec, endSec) => {
  const query = `
    query ($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          hasNextPage
        }
        airingSchedules(
          airingAt_greater: $airingAt_greater
          airingAt_lesser: $airingAt_lesser
          sort: TIME
        ) {
          id
          airingAt
          episode
          media {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              extraLarge
              large
            }
            bannerImage
            genres
            status
            format
            episodes
            averageScore
          }
        }
      }
    }
  `;

  let allSchedules = [];
  let page = 1;
  let hasNext = true;

  while (hasNext && page <= 3) { // fetch max 3 pages (150 items)
    const response = await axios.post('https://graphql.anilist.co', {
      query,
      variables: {
        airingAt_greater: startSec,
        airingAt_lesser: endSec,
        page,
        perPage: 50
      }
    }, {
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': USER_AGENT,
        'Origin': 'https://anilist.co',
        'Referer': 'https://anilist.co/'
      }
    });

    const pageData = response.data?.data?.Page;
    const items = pageData?.airingSchedules || [];
    allSchedules.push(...items);
    hasNext = Boolean(pageData?.pageInfo?.hasNextPage);
    page++;
  }

  return allSchedules;
};

/**
 * Controller: getWeeklySchedule
 * Serves real weekly airing schedule grouped by Monday..Sunday in Asia/Kolkata timezone
 */
const getWeeklySchedule = async (req, res) => {
  try {
    const weekOffset = parseInt(req.query.weekOffset || '0', 10) || 0;
    const cacheKey = `schedule:week:${weekOffset}`;

    // 1. Check in-memory cache
    const cached = scheduleCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      return res.status(200).json(cached.data);
    }

    // 2. Compute Monday..Sunday date range in Asia/Kolkata
    const now = new Date();
    // Get current Kolkata date string 'YYYY-MM-DD'
    const todayKolkataStr = formatKolkataDateTime(now).dateStr;

    // Determine current Monday 00:00:00 UTC relative to Kolkata
    const kolkataNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const dayOfWeek = kolkataNow.getDay(); // 0 = Sun, 1 = Mon ...
    const distToMon = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;

    const monDate = new Date(kolkataNow);
    monDate.setDate(kolkataNow.getDate() + distToMon + (weekOffset * 7));
    monDate.setHours(0, 0, 0, 0);

    // Build the 7 days of the target week
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monDate);
      d.setDate(monDate.getDate() + i);
      const info = formatKolkataDateTime(d);
      weekDays.push({
        date: info.dateStr,
        weekday: info.weekday,
        dayName: info.dayName,
        dayNumber: info.dayNumber,
        isToday: info.dateStr === todayKolkataStr,
        events: []
      });
    }

    // Start & End timestamps for AniList query
    // Buffer start by -12h and end by +12h to handle timezone boundaries safely
    const startSec = Math.floor(monDate.getTime() / 1000) - (12 * 3600);
    const endSec = Math.floor((monDate.getTime() + (7 * 24 * 3600 * 1000))) + (12 * 3600);

    console.log(`[SCHEDULE] Querying AniList for week offset ${weekOffset} (${weekDays[0].date} to ${weekDays[6].date})`);

    // 3. Query AniList
    const rawSchedules = await fetchAniListAiringSchedule(startSec, endSec);
    const nowSec = Math.floor(Date.now() / 1000);

    // 4. Map raw AniList items and group into the 7 week days
    for (const item of rawSchedules) {
      if (!item || !item.media) continue;

      const eventKolkata = formatKolkataDateTime(item.airingAt);
      const targetDayIndex = weekDays.findIndex(d => d.date === eventKolkata.dateStr);

      if (targetDayIndex !== -1) {
        const diffSec = item.airingAt - nowSec;
        let timeUntilAiring = 'Aired';

        if (diffSec > 0) {
          const hours = Math.floor(diffSec / 3600);
          const mins = Math.floor((diffSec % 3600) / 60);
          if (hours > 24) {
            const days = Math.floor(hours / 24);
            timeUntilAiring = `In ${days}d ${hours % 24}h`;
          } else if (hours > 0) {
            timeUntilAiring = `In ${hours}h ${mins}m`;
          } else {
            timeUntilAiring = `In ${mins}m`;
          }
        }

        const media = item.media;
        const title = media.title?.english || media.title?.romaji || 'Untitled Anime';
        const japaneseTitle = media.title?.native || media.title?.romaji || title;

        weekDays[targetDayIndex].events.push({
          id: item.id.toString(),
          animeId: media.id.toString(),
          malId: media.idMal || media.id,
          title,
          japaneseTitle,
          episode: item.episode,
          airingAt: item.airingAt,
          airingTime: eventKolkata.timeStr,
          coverImage: media.coverImage?.extraLarge || media.coverImage?.large,
          bannerImage: media.bannerImage || media.coverImage?.extraLarge,
          genres: media.genres || ['Action'],
          score: media.averageScore ? (media.averageScore / 10).toFixed(1) : null,
          status: diffSec <= 0 ? 'AIRED' : 'UPCOMING',
          timeUntilAiring
        });
      }
    }

    // 5. Sort events chronologically within each day
    for (const day of weekDays) {
      day.events.sort((a, b) => a.airingAt - b.airingAt);
    }

    const payload = {
      success: true,
      weekOffset,
      timezone: 'Asia/Kolkata',
      weekRange: {
        start: weekDays[0].date,
        end: weekDays[6].date
      },
      days: weekDays
    };

    // Save in cache (15 min)
    scheduleCache.set(cacheKey, { data: payload, expiry: Date.now() + CACHE_TTL_MS });

    return res.status(200).json(payload);
  } catch (error) {
    console.error(`[SCHEDULE ERROR] ${error.message}`);
    return res.status(500).json({
      success: false,
      error: 'Unable to load release schedule',
      message: error.message
    });
  }
};

module.exports = {
  getWeeklySchedule
};
