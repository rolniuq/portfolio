/* ═══════════════════════════════════════════
   Content Loading
   ═══════════════════════════════════════════ */

async function loadMarkdownFile(filename) {
  try {
    const response = await fetch(filename);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} — ${filename}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return null;
  }
}

/* ── Front matter parser (supports --- delimiters) ── */

function parseFrontMatter(content) {
  const data = {};
  let body = content;

  // Match opening ---
  const firstLine = content.split('\n')[0].trim();
  if (firstLine === '---') {
    const endIdx = content.indexOf('\n---', 3); // look for closing ---
    if (endIdx !== -1) {
      const fmLines = content.slice(3, endIdx).trim().split('\n');
      body = content.slice(endIdx + 4).trim();

      fmLines.forEach((line) => {
        const colonIdx = line.indexOf(':');
        if (colonIdx > 0) {
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          if (key) data[key] = value;
        }
      });
    }
  }

  return { data, content: body };
}


/* ── Blog post fetcher (scrapes the Next.js blog HTML) ── */

async function fetchBlogPosts(blogUrl) {
  try {
    const res = await fetch(blogUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();

    // Extract slugs, titles, dates, excerpts from the RSC payload
    // Note: RSC payload uses escaped quotes: \"slug\":\"value\"
    const slugRe = /\\"slug\\":\\"([^\\"]+)\\"/g;
    const titleRe = /\\"title\\":\\"([^\\"]+)\\"/g;
    const dateRe = /\\"date\\":\\"([^\\"]+)\\"/g;
    const excerptRe = /\\"excerpt\\":\\"([^\\"]+)\\"/g;
    // Extract tags — they appear as [\"tag1\",\"tag2\",...]
    const tagsRe = /\\"tags\\":\[([^\]]+)\]/g;

    const slugs = [...html.matchAll(slugRe)].map((m) => m[1]);
    const titles = [...html.matchAll(titleRe)].map((m) => m[1]);
    const dates = [...html.matchAll(dateRe)].map((m) => m[1]);
    const excerpts = [...html.matchAll(excerptRe)].map((m) => m[1]);
    const tagArrays = [...html.matchAll(tagsRe)].map((m) =>
      [...m[1].matchAll(/\\"([^\\"]+)\\"/g)].map((t) => t[1]),
    );

    // Deduplicate by slug (RSC payload may contain duplicates)
    const seen = new Set();
    const posts = [];
    for (let i = 0; i < slugs.length; i++) {
      if (!slugs[i] || seen.has(slugs[i])) continue;
      seen.add(slugs[i]);
      posts.push({
        slug: slugs[i],
        title: titles[i] || '',
        date: dates[i] || '',
        excerpt: excerpts[i] || '',
        tags: tagArrays[i] || [],
        url: blogUrl.replace(/\/$/, '') + '/' + slugs[i],
      });
    }
    return posts;
  } catch (err) {
    console.error('Error fetching blog posts:', err.message);
    return null;
  }
}


/* ═══════════════════════════════════════════
   Portfolio Builder
   ═══════════════════════════════════════════ */

async function loadPortfolio() {
  if (typeof marked === 'undefined') {
    console.error('Marked.js library not loaded');
    return;
  }

  const nameEl = document.getElementById('name');
  const titleEl = document.getElementById('title');
  const aboutEl = document.getElementById('about');
  const blogEl = document.getElementById('blog');
  const projectsEl = document.getElementById('projects');
  const contactEl = document.getElementById('contact');

  // Show loading state
  [aboutEl, blogEl, projectsEl, contactEl].forEach((el) => {
    if (el) el.classList.add('is-loading');
  });

  const [aboutText, blogText, projectsText, contactText] = await Promise.all([
    loadMarkdownFile('content/about.md'),
    loadMarkdownFile('content/blog.md'),
    loadMarkdownFile('content/projects.md'),
    loadMarkdownFile('content/contact.md'),
  ]);

  /* ── About ── */
  if (aboutText && aboutEl) {
    const { data, content } = parseFrontMatter(aboutText);
    nameEl.textContent = data.name || 'Your Name';
    titleEl.textContent = data.title || 'Your Title';

    let html = marked.parse(content);

    // Append skills tags from front matter
    if (data.skills) {
      const skills = data.skills.split(',').map((s) => s.trim()).filter(Boolean);
      if (skills.length) {
        html += '<ul class="skills-list">';
        skills.forEach((skill) => {
          html += `<li class="skill-tag">${skill}</li>`;
        });
        html += '</ul>';
      }
    }

    aboutEl.innerHTML = html;
    aboutEl.classList.remove('is-loading');
    aboutEl.classList.add('is-loaded');
  }

  /* ── Blog ── */
  if (blogText && blogEl) {
    const { data, content } = parseFrontMatter(blogText);
    const blogBaseUrl = data.link || 'https://rolniuqblogs.vercel.app/';

    let html = '<h2>Blog</h2>';

    if (content) {
      html += marked.parse(content);
    }

    // Card grid container
    html += '<div class="blog-grid" id="blogGrid">';
    html += '<p class="blog-grid-empty">Loading posts…</p>';
    html += '</div>';

    // Link to full blog
    if (data.link) {
      html += `<a href="${data.link}" target="_blank" class="blog-link">Read the blog →</a>`;
    }

    blogEl.innerHTML = html;
    blogEl.classList.remove('is-loading');
    blogEl.classList.add('is-loaded');

    // Fetch and render blog posts asynchronously
    fetchBlogPosts(blogBaseUrl).then((posts) => {
      const grid = document.getElementById('blogGrid');
      if (!grid) return;

      if (!posts || posts.length === 0) {
        grid.innerHTML = '<p class="blog-grid-empty">No posts yet.</p>';
        return;
      }

      // Limit to 2 rows of 3 = 6 posts max
      const displayPosts = posts.slice(0, 6);

      grid.innerHTML = displayPosts
        .map(
          (post) => `
        <a href="${post.url}" target="_blank" class="blog-card">
          <div class="blog-card-tags">
            ${post.tags
              .map((tag) => `<span class="blog-card-tag">${tag}</span>`)
              .join('')}
          </div>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
          <div class="blog-card-date">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            ${post.date}
          </div>
        </a>
      `,
        )
        .join('');
    });
  }

  /* ── Projects ── */
  if (projectsText && projectsEl) {
    // Each project is delimited by --- lines with this pattern:
    //
    //   ---
    //   name: Project Name
    //   description: ...
    //   tags: ...
    //   link: ...
    //   ---
    //
    //   Optional body text.
    //
    //   ---   <-- separator between projects
    //
    // State machine: first --- starts a project + front matter,
    // second --- closes front matter, third --- closes the project.
    const lines = projectsText.split('\n');
    const projectBodies = [];
    let currentProject = null;
    let inFrontMatter = false;

    for (const line of lines) {
      if (line.trim() === '---') {
        if (currentProject === null) {
          // First --- : start a new project and enter front matter
          currentProject = '';
          inFrontMatter = true;
          currentProject += line + '\n';
        } else if (inFrontMatter) {
          // Second --- : close front matter section
          inFrontMatter = false;
          currentProject += line + '\n';
        } else {
          // Third --- : end of project body → push and reset
          projectBodies.push(currentProject);
          currentProject = null;
        }
      } else if (currentProject !== null) {
        currentProject += line + '\n';
      }
    }
    // Don't forget the last project if the file doesn't end with ---
    if (currentProject !== null) {
      projectBodies.push(currentProject);
    }

    let html = '<h2>Projects</h2>';

    projectBodies.forEach((body) => {
      const { data, content } = parseFrontMatter(body);
      if (!data.name || !data.name.trim()) return;

      html += '<div class="project">';
      html += `<h3>${data.name}</h3>`;

      // Tech tags
      if (data.tags) {
        const tags = data.tags.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.length) {
          html += '<div class="project-tags">';
          tags.forEach((tag) => {
            html += `<span class="project-tag">${tag}</span>`;
          });
          html += '</div>';
        }
      }

      if (data.description) {
        html += `<p>${data.description}</p>`;
      }
      if (content) {
        // Use div wrapper to avoid nested <p> from marked
        html += `<div>${marked.parse(content)}</div>`;
      }
      if (data.link) {
        html += `<p class="project-links"><a href="${data.link}" target="_blank">View Project →</a></p>`;
      }
      html += '</div>';
    });

    projectsEl.innerHTML = html;
    projectsEl.classList.remove('is-loading');
    projectsEl.classList.add('is-loaded');
  }

  /* ── Contact ── */
  if (contactText && contactEl) {
    const html = '<h2>Contact</h2>' + marked.parse(contactText);
    contactEl.innerHTML = html;
    contactEl.classList.remove('is-loading');
    contactEl.classList.add('is-loaded');
  }

  // Refresh scroll spy now that dynamic content has landed
  if (typeof updateNavSpy === 'function') {
    updateNavSpy();
  }
}


/* ═══════════════════════════════════════════
   Theme Toggle
   ═══════════════════════════════════════════ */

function initThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  const html = document.documentElement;

  if (!toggle) return;

  const saved = localStorage.getItem('theme') || 'dark';

  if (saved === 'dark') {
    html.setAttribute('data-theme', 'dark');
    toggle.textContent = '☀️';
  } else {
    toggle.textContent = '🌙';
  }

  toggle.addEventListener('click', () => {
    const isDark = html.getAttribute('data-theme') === 'dark';
    if (isDark) {
      html.removeAttribute('data-theme');
      toggle.textContent = '🌙';
      localStorage.setItem('theme', 'light');
    } else {
      html.setAttribute('data-theme', 'dark');
      toggle.textContent = '☀️';
      localStorage.setItem('theme', 'dark');
    }
  });
}


/* ═══════════════════════════════════════════
   Navigation — Scroll Spy
   ═══════════════════════════════════════════ */

let updateNavSpy = null; // exposed so loadPortfolio can refresh after content loads

function initNavScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  updateNavSpy = function updateActiveLink() {
    const headerEl = document.querySelector('header');
    const headerH = headerEl ? headerEl.offsetHeight : 120;
    const scrollY = window.scrollY + headerH + 20; // offset for sticky header
    let currentId = sections[0]?.id;

    // Find the last section whose top is above the scroll position
    sections.forEach((section) => {
      if (section.offsetTop <= scrollY) {
        currentId = section.id;
      }
    });

    navLinks.forEach((link) => {
      const targetId = link.getAttribute('href').substring(1);
      link.classList.toggle('active', targetId === currentId);
    });
  };

  window.addEventListener('scroll', updateNavSpy, { passive: true });
  updateNavSpy(); // set initial state
}


/* ═══════════════════════════════════════════
   Sticky Header Effects
   ═══════════════════════════════════════════ */

function initStickyHeader() {
  const header = document.querySelector('header');
  const goTopBtn = document.getElementById('goToTop');
  if (!header) return;

  // Use IntersectionObserver to detect when header is "stuck"
  // A sentinel at the top tells us if we've scrolled past the header
  const sentinel = document.createElement('div');
  sentinel.style.position = 'absolute';
  sentinel.style.top = '0';
  sentinel.style.height = '1px';
  sentinel.style.width = '1px';
  document.body.prepend(sentinel);

  const stuckObserver = new IntersectionObserver(
    ([entry]) => {
      // When the sentinel is NOT intersecting, we've scrolled past it →
      // the header is stuck.
      header.classList.toggle('is-stuck', !entry.isIntersecting);
    },
    { threshold: [0] },
  );
  stuckObserver.observe(sentinel);

  // Compact header + go-to-top visibility on scroll
  let ticking = false;
  const handleScroll = () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        const scrolled = window.scrollY > 60;
        header.classList.toggle('is-compact', scrolled);

        if (goTopBtn) {
          goTopBtn.classList.toggle('is-visible', window.scrollY > 400);
        }
        ticking = false;
      });
      ticking = true;
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/* ═══════════════════════════════════════════
   Go to Top
   ═══════════════════════════════════════════ */

function initGoToTop() {
  const btn = document.getElementById('goToTop');
  if (!btn) return;

  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}


/* ═══════════════════════════════════════════
   Init
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio();
  initThemeToggle();
  initNavScrollSpy();
  initStickyHeader();
  initGoToTop();
});
