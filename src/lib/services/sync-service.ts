import { GitHubStats, LeetCodeStats } from "@/types";

export function extractGitHubUsername(input: string): string {
  let cleaned = input.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "");
  return cleaned.replace(/^@/, "").replace(/\/+$/, "").trim();
}

export function extractLeetCodeUsername(input: string): string {
  let cleaned = input.trim().replace(/\/+$/, "");
  cleaned = cleaned.replace(/^(?:https?:\/\/)?(?:www\.)?leetcode\.com\/(?:u\/)?/i, "");
  cleaned = cleaned.replace(/^u\//i, "");
  return cleaned.replace(/^@/, "").replace(/\/+$/, "").trim();
}

export async function fetchGitHubStats(rawInput: string): Promise<GitHubStats> {
  const username = extractGitHubUsername(rawInput);
  if (!username) {
    throw new Error("Please provide a valid GitHub username or profile link.");
  }

  // 1. Fetch live user data from GitHub public API
  let userData: any = {
    login: username,
    public_repos: 0,
    followers: 0,
    avatar_url: `https://avatars.githubusercontent.com/${username}`,
  };

  try {
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`);
    if (userRes.ok) {
      userData = await userRes.json();
    }
  } catch (err) {
    console.warn("GitHub user fetch warning:", err);
  }

  // 2. Fetch live contributions from github-contributions-api (both all-time totals and last-year daily calendar)
  let totalContributions = 0;
  const currentYearStr = new Date().getFullYear().toString();
  let totalContributionsYear = 0;
  let contributionsByYear: Record<string, number> = {};
  let dailyContributions: Array<{ date: string; count: number; level: number }> = [];

  try {
    const [allTimeRes, lastYearRes] = await Promise.allSettled([
      fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=all`),
      fetch(`https://github-contributions-api.jogruber.de/v4/${encodeURIComponent(username)}?y=last`),
    ]);

    if (allTimeRes.status === "fulfilled" && allTimeRes.value.ok) {
      const contribData = await allTimeRes.value.json();
      if (contribData.total && typeof contribData.total === "object") {
        contributionsByYear = contribData.total;
        totalContributionsYear =
          contribData.total[currentYearStr] ||
          contribData.total["2026"] ||
          0;
        totalContributions = Object.values(contribData.total).reduce(
          (a: number, b: any) => a + (Number(b) || 0),
          0
        ) as number;
      }
    }

    if (lastYearRes.status === "fulfilled" && lastYearRes.value.ok) {
      const lastYearData = await lastYearRes.value.json();
      if (Array.isArray(lastYearData.contributions)) {
        dailyContributions = lastYearData.contributions;
      }
    }
  } catch (e) {
    console.warn("GitHub contributions API warning:", e);
  }

  // 3. Compute real-time streak from daily contributions
  let currentStreak = 0;
  if (dailyContributions.length > 0) {
    let i = dailyContributions.length - 1;
    // If today has 0 contributions so far, check starting from yesterday
    if (dailyContributions[i]?.count === 0 && i > 0) {
      i--;
    }
    while (i >= 0 && dailyContributions[i]?.count > 0) {
      currentStreak++;
      i--;
    }
  }

  // 4. Compute real-time 16-week contributions grid (16 weeks x 7 days)
  let contributionsByWeek: number[][] = [];
  if (dailyContributions.length >= 7) {
    const last112Days = dailyContributions.slice(-112);
    const weeks: number[][] = [];
    for (let w = 0; w < last112Days.length; w += 7) {
      const chunk = last112Days.slice(w, w + 7).map((d) => (d.count > 0 ? d.count : 0));
      while (chunk.length < 7) chunk.push(0);
      weeks.push(chunk);
    }
    contributionsByWeek = weeks;
  } else {
    contributionsByWeek = Array.from({ length: 16 }, () => Array(7).fill(0));
  }

  // 5. Fetch real live recent commits from user's active repositories
  let recentCommits: Array<{ repo: string; message: string; timestamp: string }> = [];

  try {
    const eventsRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=30`
    );
    if (eventsRes.ok) {
      const events = await eventsRes.json();
      if (Array.isArray(events) && events.length > 0) {
        const pushRepos = Array.from(
          new Set(
            events
              .filter((ev: any) => ev.type === "PushEvent" && ev.repo?.name)
              .map((ev: any) => ev.repo.name)
          )
        );

        if (pushRepos.length > 0) {
          const topRepo = pushRepos[0];
          try {
            const commitsRes = await fetch(
              `https://api.github.com/repos/${topRepo}/commits?per_page=5`
            );
            if (commitsRes.ok) {
              const commitsData = await commitsRes.json();
              if (Array.isArray(commitsData)) {
                commitsData.forEach((c: any) => {
                  if (recentCommits.length < 5) {
                    recentCommits.push({
                      repo: topRepo,
                      message: c.commit?.message?.split("\n")[0] || "Update",
                      timestamp: c.commit?.author?.date
                        ? new Date(c.commit.author.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })
                        : "Recently",
                    });
                  }
                });
              }
            }
          } catch {
            // ignore
          }
        }
      }
    }
  } catch (err) {
    console.warn("GitHub commits fetch error:", err);
  }

  return {
    username: userData.login || username,
    publicRepos: Number(userData.public_repos) || 0,
    followers: Number(userData.followers) || 0,
    totalContributions,
    totalContributionsYear,
    contributionsByYear,
    contributionsByWeek,
    currentStreak,
    recentCommits,
    avatarUrl: userData.avatar_url || `https://avatars.githubusercontent.com/${username}`,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchLeetCodeStats(rawInput: string): Promise<LeetCodeStats> {
  const username = extractLeetCodeUsername(rawInput);
  if (!username) {
    throw new Error("Please provide a valid LeetCode username or profile link.");
  }

  let stats: LeetCodeStats | null = null;

  // 1. Primary: leetcode-api-faisalshohag.vercel.app (CORS-enabled, reliable, full submission breakdown)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);
    const apiRes = await fetch(
      `https://leetcode-api-faisalshohag.vercel.app/${encodeURIComponent(username)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (data && (data.totalSolved !== undefined || data.easySolved !== undefined)) {
        const recentSubmissions = Array.isArray(data.recentSubmissions)
          ? data.recentSubmissions.slice(0, 5).map((s: any) => ({
              title: s.title || "Algorithm Problem",
              difficulty:
                s.statusDisplay === "Accepted"
                  ? "Solved"
                  : s.statusDisplay || "Solved",
              timestamp: s.timestamp
                ? new Date(Number(s.timestamp) * 1000).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "Recently",
            }))
          : [];

        // Live acceptance rate calculation from total submissions
        const allSubmission = Array.isArray(data.totalSubmissions)
          ? data.totalSubmissions.find((s: any) => s.difficulty === "All")
          : null;
        const totalSubCount = allSubmission?.submissions || data.totalSolved || 1;
        const acCount = allSubmission?.count || data.totalSolved || 0;
        const acceptanceRate = totalSubCount > 0
          ? Number(Math.min(100, Math.max(0, (acCount / totalSubCount) * 100)).toFixed(1))
          : 0;

        stats = {
          username,
          totalSolved: Number(data.totalSolved ?? 0),
          easy: Number(data.easySolved ?? 0),
          medium: Number(data.mediumSolved ?? 0),
          hard: Number(data.hardSolved ?? 0),
          ranking: Number(data.ranking ?? 0),
          acceptanceRate,
          recentSubmissions,
          lastUpdated: new Date().toISOString(),
        };
      }
    }
  } catch (err) {
    console.warn("Primary LeetCode API warning:", err);
  }

  // 2. Secondary fallback: alfa-leetcode-api.onrender.com
  if (!stats) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      const apiRes = await fetch(
        `https://alfa-leetcode-api.onrender.com/userProfile/${encodeURIComponent(username)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (apiRes.ok) {
        const data = await apiRes.json();
        if (data && (data.totalSolved !== undefined || data.easySolved !== undefined)) {
          const recentSubmissions = Array.isArray(data.recentSubmissions)
            ? data.recentSubmissions.slice(0, 5).map((s: any) => ({
                title: s.title || "Algorithm Problem",
                difficulty: s.difficulty || "Solved",
                timestamp: s.timestamp
                  ? new Date(Number(s.timestamp) * 1000).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "Recently",
              }))
            : [];

          stats = {
            username,
            totalSolved: Number(data.totalSolved ?? 0),
            easy: Number(data.easySolved ?? 0),
            medium: Number(data.mediumSolved ?? 0),
            hard: Number(data.hardSolved ?? 0),
            ranking: Number(data.ranking ?? 0),
            acceptanceRate: Number(data.acceptanceRate ?? 0),
            recentSubmissions,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn("Secondary LeetCode API warning:", err);
    }
  }

  if (!stats) {
    throw new Error(`Could not fetch live LeetCode stats for @${username}. Please check the username.`);
  }

  return stats;
}
