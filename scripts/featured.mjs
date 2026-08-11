#!/usr/bin/env node
/**
 * Featured Project pipeline:
 * 1. Fetch public repos for the GitHub user.
 * 2. Filter out forks, archived repos, and meta repos (portfolio, blog).
 * 3. Send repo summaries to Gemini; ask it to pick the best showcase project
 *    and write a short blurb.
 * 4. Write featured.json (or leave the previous one untouched on failure).
 *
 * Requires env: GH_TOKEN (GitHub token) and GEMINI_API_KEY.
 * Node 18+ (global fetch), no dependencies.
 */

const GH_USER = 'rolniuq';
const META_REPOS = new Set(['portfolio', 'blog']);
const GEMINI_MODEL = 'gemini-2.5-flash'; // fallback; runtime resolution preferred
const OUTPUT = 'featured.json';

const ghToken = process.env.GH_TOKEN;
const geminiKey = process.env.GEMINI_API_KEY;

if (!ghToken || !geminiKey) {
  console.error('❌ Missing GH_TOKEN or GEMINI_API_KEY');
  process.exit(1);
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

// Pick a usable generation model at runtime so model renames don't break the
// pipeline. Prefer available flash-class models with JSON output support.
async function resolveGeminiModel() {
  const data = await fetchJson(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`,
  );

  const preferred = [
    /gemini-3.*flash/i,
    /gemini-2\.[5-9].*flash/i,
    /gemini-flash-latest/i,
    /gemini-1\.[5-9].*flash/i,
  ];

  const models = data.models || [];
  for (const re of preferred) {
    const match = models.find(
      (m) => re.test(m.name) && (m.supportedGenerationMethods || []).includes('generateContent'),
    );
    if (match) {
      console.log(`🧠 Using model ${match.name.replace(/^models\//, '')}`);
      return match.name.replace(/^models\//, '');
    }
  }

  const any = models.find(
    (m) => (m.supportedGenerationMethods || []).includes('generateContent'),
  );
  if (any) {
    console.log(`🧠 Using fallback model ${any.name.replace(/^models\//, '')}`);
    return any.name.replace(/^models\//, '');
  }

  console.log('⚠️ No generateContent model found — falling back to constant');
  return GEMINI_MODEL;
}

async function fetchRepos() {
  const repos = await fetchJson(
    `https://api.github.com/users/${GH_USER}/repos?per_page=100&sort=updated`,
    {
      headers: {
        Authorization: `token ${ghToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'featured-project-worker',
      },
    },
  );

  const metaNames = META_REPOS;
  return repos
    .filter((r) => !r.fork)
    .filter((r) => !r.archived)
    .filter((r) => !metaNames.has(r.name))
    .map((r) => ({
      name: r.name,
      description: r.description || '',
      language: r.language || '',
      topics: r.topics || [],
      stars: r.stargazers_count || 0,
      forks: r.forks_count || 0,
      pushed_at: r.pushed_at || '',
      html_url: r.html_url,
      homepage: r.homepage || '',
    }));
}

function buildPrompt(repos) {
  const list = repos
    .map((r) => {
      const topics = r.topics.length ? ` topics:[${r.topics.join(', ')}]` : '';
      const stars = r.stars > 0 ? ` stars:${r.stars}` : '';
      return `- ${r.name} (${r.language || 'n/a'}${topics}${stars}) - ${r.description}`;
    })
    .join('\n');

  return `You are selecting the single best open-source project to feature at the top of a software engineer's portfolio.

Here are the candidate repositories:

${list}

Pick the ONE project that is most impressive, complete, and worth showcasing. Prefer projects that demonstrate real engineering (complexity, polish, usefulness) over simple utilities.

Respond with ONLY valid JSON, no markdown fences, exactly this shape:
{"name":"<exact repo name>","blurb":"<1-2 sentence engaging description>","tags":["<up to 4 relevant tags>"]}`;
}

async function askGemini(model, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;

  const data = await fetchJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    }),
  });

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no text');
  return JSON.parse(text);
}

async function main() {
  const repos = await fetchRepos();
  if (repos.length === 0) {
    console.error('⚠️ No candidate repos found — leaving featured.json untouched');
    process.exit(1);
  }

  console.log(`📦 ${repos.length} candidate repos found`);

  const model = await resolveGeminiModel();
  const pick = await askGemini(model, buildPrompt(repos));

  const repo = repos.find((r) => r.name === pick.name);
  if (!repo) {
    console.error(`❌ Gemini picked unknown repo "${pick.name}" — no write`);
    process.exit(1);
  }

  const featured = {
    name: repo.name,
    url: repo.html_url,
    description: repo.description,
    blurb: pick.blurb || repo.description,
    tags: Array.isArray(pick.tags) && pick.tags.length ? pick.tags.slice(0, 4) : (repo.topics || []).slice(0, 4),
    selected_by: 'gemini',
    updated_at: new Date().toISOString(),
  };

  await import('node:fs/promises')
    .then((fs) => fs.writeFile(OUTPUT, JSON.stringify(featured, null, 2) + '\n'));

  console.log(`✅ Featured: ${featured.name} → ${OUTPUT}`);
}

main().catch((err) => {
  console.error('❌ Pipeline failed — featured.json untouched:', err.message);
  process.exit(1);
});