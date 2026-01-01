async function loadMarkdownFile(filename) {
    try {
        const response = await fetch(filename);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error(`Error loading ${filename}:`, error);
        return '';
    }
}

function parseFrontMatter(content) {
    const lines = content.split('\n');
    const data = {};
    let frontMatterEnded = false;
    const contentLines = [];
    
    lines.forEach(line => {
        if (!frontMatterEnded) {
            const colonIndex = line.indexOf(':');
            if (colonIndex > 0) {
                const key = line.substring(0, colonIndex).trim();
                const value = line.substring(colonIndex + 1).trim();
                if (key && value) {
                    data[key] = value;
                }
            } else if (line.trim() === '') {
                frontMatterEnded = true;
            }
        } else {
            contentLines.push(line);
        }
    });
    
    return { data, content: contentLines.join('\n').trim() };
}

async function loadPortfolio() {
    
    
    if (typeof marked === 'undefined') {
        console.error('Marked.js library not loaded');
        return;
    }
    
    const nameElement = document.getElementById('name');
    const titleElement = document.getElementById('title');
    const aboutElement = document.getElementById('about');
    const blogElement = document.getElementById('blog');
    const projectsElement = document.getElementById('projects');
    const contactElement = document.getElementById('contact');

    
    const aboutContent = await loadMarkdownFile('content/about.md');
    const blogContent = await loadMarkdownFile('content/blog.md');
    const projectsContent = await loadMarkdownFile('content/projects.md');
    const contactContent = await loadMarkdownFile('content/contact.md');
    
    

    if (aboutContent) {
        const { data, content } = parseFrontMatter(aboutContent);
        nameElement.textContent = data.name || 'Your Name';
        titleElement.textContent = data.title || 'Your Title';
        aboutElement.innerHTML = marked.parse(content);
    }

    if (blogContent) {
        const { data, content } = parseFrontMatter(blogContent);
        let blogHTML = '<h2>Blog</h2>';
        
        if (data.description) {
            blogHTML += `<p>${data.description}</p>`;
        }
        
        blogHTML += marked.parse(content);
        
        if (data.link) {
            blogHTML += `<p><a href="${data.link}" target="_blank" class="blog-link">Visit Blog →</a></p>`;
        }
        
        blogElement.innerHTML = blogHTML;
    }

    if (projectsContent) {
        
        const projects = projectsContent.split('---').filter(p => p.trim());
        
        let projectsHTML = '<h2>Projects</h2>';

        // Split by --- and look for entries that start with ---\nname:
        const projectEntries = [];
        let currentProject = '';
        let inProject = false;
        
        projectsContent.split('\n').forEach(line => {
            if (line === '---') {
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
        
        
        
        projectEntries.forEach((project, index) => {
            const trimmedProject = project.trim();
            if (!trimmedProject) return;
            
            const { data, content } = parseFrontMatter(trimmedProject);
            
            if (data.name && data.name.trim()) {
                projectsHTML += `
                    <div class="project">
                        <h3>${data.name}</h3>
                        <p>${data.description || ''}</p>
                        <div>${marked.parse(content)}</div>
                        ${data.link ? `<p><a href="${data.link}" target="_blank">View Project</a></p>` : ''}
                    </div>
                `;
            } else {
                
            }
        });

        projectsElement.innerHTML = projectsHTML;
        
    } else {
        console.error('No projects content found');
    }

    if (contactContent) {
        contactElement.innerHTML = '<h2>Contact</h2>' + marked.parse(contactContent);
    }
}

function initThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const body = document.body;
    
    // Check for saved theme preference or default to light mode
    const currentTheme = localStorage.getItem('theme') || 'light';
    
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
    
    themeToggle.addEventListener('click', () => {
        const isCurrentlyDark = body.classList.contains('dark-mode');
        
        if (isCurrentlyDark) {
            body.classList.remove('dark-mode');
            themeToggle.textContent = '🌙';
            localStorage.setItem('theme', 'light');
        } else {
            body.classList.add('dark-mode');
            themeToggle.textContent = '☀️';
            localStorage.setItem('theme', 'dark');
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadPortfolio();
    initThemeToggle();
});
