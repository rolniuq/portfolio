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
    let html = '<h2>Blog</h2>';

    if (content) {
      html += marked.parse(content);
    }
    if (data.link) {
      html += `<a href="${data.link}" target="_blank" class="blog-link">Read the blog →</a>`;
    }

    blogEl.innerHTML = html;
    blogEl.classList.remove('is-loading');
    blogEl.classList.add('is-loaded');
  }

  /* ── Projects ── */
  if (projectsText && projectsEl) {
    const projectEntries = [];
    let currentProject = '';
    let inProject = false;

    projectsText.split('\n').forEach((line) => {
      if (line.trim() === '---') {
        if (inProject && currentProject.trim()) {
          projectEntries.push(currentProject);
        }
        currentProject = '';
        inProject = true;
      } else {
        currentProject += line + '\n';
      }
    });

    if (currentProject.trim()) {
      projectEntries.push(currentProject);
    }

    let html = '<h2>Projects</h2>';

    projectEntries.forEach((project) => {
      const trimmed = project.trim();
      if (!trimmed) return;

      const { data, content } = parseFrontMatter(trimmed);
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

function initNavScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((link) => {
            const targetId = link.getAttribute('href').substring(1);
            link.classList.toggle('active', targetId === entry.target.id);
          });
        }
      });
    },
    { threshold: 0.3 },
  );

  sections.forEach((section) => observer.observe(section));
}


/* ═══════════════════════════════════════════
   Init
   ═══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  loadPortfolio();
  initThemeToggle();
  initNavScrollSpy();
});
