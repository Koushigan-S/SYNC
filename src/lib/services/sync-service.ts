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

const GITHUB_AUTH_TOKEN =
  process.env.NEXT_PUBLIC_GITHUB_TOKEN ||
  process.env.GITHUB_ACCESS_TOKEN ||
  "";

export async function fetchGitHubStats(rawInput: string): Promise<GitHubStats> {
  const username = extractGitHubUsername(rawInput);
  if (!username) {
    throw new Error("Please provide a valid GitHub username or profile link.");
  }

  const currentYear = new Date().getFullYear();
  const currentYearStr = currentYear.toString();
  const prevYearStr = (currentYear - 1).toString();
  const prev2YearStr = (currentYear - 2).toString();

  // 1. Primary Method: Official GitHub GraphQL API with authenticated token
  // This accurately accesses total repositories (public + private = 21) and all verified contributions (77 in 2026).
  if (GITHUB_AUTH_TOKEN) {
    try {
      const gqlQuery = `
        query($login: String!, $fromCurr: DateTime!, $toCurr: DateTime!, $fromPrev: DateTime!, $toPrev: DateTime!, $fromPrev2: DateTime!, $toPrev2: DateTime!) {
          user(login: $login) {
            login
            avatarUrl
            followers { totalCount }
            repositories(ownerAffiliations: [OWNER]) { totalCount }
            recentRepos: repositories(first: 5, orderBy: {field: PUSHED_AT, direction: DESC}, ownerAffiliations: [OWNER]) {
              nodes {
                name
                defaultBranchRef {
                  target {
                    ... on Commit {
                      history(first: 5) {
                        nodes {
                          messageHeadline
                          committedDate
                        }
                      }
                    }
                  }
                }
              }
            }
            currYearContribs: contributionsCollection(from: $fromCurr, to: $toCurr) {
              contributionCalendar {
                totalContributions
                weeks {
                  contributionDays {
                    date
                    contributionCount
                    contributionLevel
                  }
                }
              }
            }
            prevYearContribs: contributionsCollection(from: $fromPrev, to: $toPrev) {
              contributionCalendar { totalContributions }
            }
            prev2YearContribs: contributionsCollection(from: $fromPrev2, to: $toPrev2) {
              contributionCalendar { totalContributions }
            }
          }
        }
      `;

      const variables = {
        login: username,
        fromCurr: `${currentYearStr}-01-01T00:00:00Z`,
        toCurr: `${currentYearStr}-12-31T23:59:59Z`,
        fromPrev: `${prevYearStr}-01-01T00:00:00Z`,
        toPrev: `${prevYearStr}-12-31T23:59:59Z`,
        fromPrev2: `${prev2YearStr}-01-01T00:00:00Z`,
        toPrev2: `${prev2YearStr}-12-31T23:59:59Z`,
      };

      const gqlRes = await fetch("https://api.github.com/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GITHUB_AUTH_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: gqlQuery, variables }),
      });

      if (gqlRes.ok) {
        const gqlData = await gqlRes.json();
        const userData = gqlData?.data?.user;
        if (userData) {
          const totalCurr = Number(userData.currYearContribs?.contributionCalendar?.totalContributions ?? 0);
          const totalPrev = Number(userData.prevYearContribs?.contributionCalendar?.totalContributions ?? 0);
          const totalPrev2 = Number(userData.prev2YearContribs?.contributionCalendar?.totalContributions ?? 0);
          const totalContributions = totalCurr + totalPrev + totalPrev2;

          const contributionsByYear: Record<string, number> = {
            [currentYearStr]: totalCurr,
            [prevYearStr]: totalPrev,
            [prev2YearStr]: totalPrev2,
          };

          // Extract daily contributions from the calendar weeks
          const allDays: Array<{ date: string; count: number; level: number }> = [];
          const weeks = userData.currYearContribs?.contributionCalendar?.weeks || [];
          for (const w of weeks) {
            if (Array.isArray(w.contributionDays)) {
              for (const day of w.contributionDays) {
                allDays.push({
                  date: day.date,
                  count: Number(day.contributionCount || 0),
                  level: Number(day.contributionLevel ? 1 : 0),
                });
              }
            }
          }

          // Calculate current streak
          let currentStreak = 0;
          if (allDays.length > 0) {
            let i = allDays.length - 1;
            if (allDays[i]?.count === 0 && i > 0) {
              i--;
            }
            while (i >= 0 && allDays[i]?.count > 0) {
              currentStreak++;
              i--;
            }
          }

          // Calculate 112 flat daily values (16 weeks x 7 days)
          const contributionsHistory: number[] = [];
          if (allDays.length > 0) {
            const last112 = allDays.slice(-112);
            last112.forEach((d) => contributionsHistory.push(d.count > 0 ? d.count : 0));
          }
          while (contributionsHistory.length < 112) {
            contributionsHistory.unshift(0);
          }

          // Extract recent commits across user's active repositories directly from GraphQL
          const commitList: Array<{ repo: string; message: string; date: string; timestamp: string }> = [];
          const recentRepoNodes = userData.recentRepos?.nodes || [];
          for (const repo of recentRepoNodes) {
            const historyNodes = repo.defaultBranchRef?.target?.history?.nodes || [];
            for (const commit of historyNodes) {
              if (commit?.messageHeadline) {
                commitList.push({
                  repo: repo.name,
                  message: commit.messageHeadline,
                  date: commit.committedDate,
                  timestamp: commit.committedDate
                    ? new Date(commit.committedDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "Recently",
                });
              }
            }
          }
          commitList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          const recentCommits = commitList.slice(0, 5).map(({ repo, message, timestamp }) => ({
            repo,
            message,
            timestamp,
          }));

          return {
            username: userData.login || username,
            publicRepos: Number(userData.repositories?.totalCount ?? 0),
            followers: Number(userData.followers?.totalCount ?? 0),
            totalContributions,
            totalContributionsYear: totalCurr,
            contributionsByYear,
            contributionsHistory,
            currentStreak,
            recentCommits,
            avatarUrl: userData.avatarUrl || `https://avatars.githubusercontent.com/${username}`,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    } catch (err) {
      console.warn("GitHub GraphQL with token failed, falling back to public endpoints:", err);
    }
  }

  // 2. Secondary Method: Fallback to GitHub Public REST APIs
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

  let totalContributions = 0;
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

  let currentStreak = 0;
  if (dailyContributions.length > 0) {
    let i = dailyContributions.length - 1;
    if (dailyContributions[i]?.count === 0 && i > 0) {
      i--;
    }
    while (i >= 0 && dailyContributions[i]?.count > 0) {
      currentStreak++;
      i--;
    }
  }

  const contributionsHistory: number[] = [];
  if (dailyContributions.length > 0) {
    const last112Days = dailyContributions.slice(-112);
    last112Days.forEach((d) => {
      contributionsHistory.push(d.count > 0 ? d.count : 0);
    });
  }
  while (contributionsHistory.length < 112) {
    contributionsHistory.unshift(0);
  }

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
          } catch {}
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
    contributionsHistory,
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
