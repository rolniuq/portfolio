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
    const frontMatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontMatterRegex);

    if (match) {
        const frontMatter = match[1];
        const markdown = match[2];

        const data = {};
        frontMatter.split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                data[key.trim()] = valueParts.join(':').trim();
            }
        });

        return { data, content: markdown };
    }

    return { data: {}, content };
}

async function loadPortfolio() {
    console.log('Loading portfolio...');
    
    const nameElement = document.getElementById('name');
    const titleElement = document.getElementById('title');
    const aboutElement = document.getElementById('about');
    const projectsElement = document.getElementById('projects');
    const contactElement = document.getElementById('contact');

    console.log('Loading content files...');
    const aboutContent = await loadMarkdownFile('content/about.md');
    const projectsContent = await loadMarkdownFile('content/projects.md');
    const contactContent = await loadMarkdownFile('content/contact.md');
    
    console.log('About content:', aboutContent ? 'loaded' : 'failed');
    console.log('Projects content:', projectsContent ? 'loaded' : 'failed');
    console.log('Contact content:', contactContent ? 'loaded' : 'failed');

    if (aboutContent) {
        const { data, content } = parseFrontMatter(aboutContent);
        nameElement.textContent = data.name || 'Your Name';
        titleElement.textContent = data.title || 'Your Title';
        aboutElement.innerHTML = marked.parse(content);
    }

    if (projectsContent) {
        console.log('Parsing projects...');
        const projects = projectsContent.split('---').filter(p => p.trim());
        console.log('Found projects:', projects.length);
        let projectsHTML = '<h2>Projects</h2>';

        projects.forEach((project, index) => {
            const { data, content } = parseFrontMatter(project.trim());
            console.log(`Project ${index}:`, data);
            if (data.name) {
                projectsHTML += `
                    <div class="project">
                        <h3>${data.name}</h3>
                        <p>${data.description || ''}</p>
                        <div>${marked.parse(content)}</div>
                        ${data.link ? `<p><a href="${data.link}" target="_blank">View Project</a></p>` : ''}
                    </div>
                `;
            }
        });

        projectsElement.innerHTML = projectsHTML;
        console.log('Projects rendered');
    } else {
        console.error('No projects content found');
    }

    if (contactContent) {
        contactElement.innerHTML = '<h2>Contact</h2>' + marked.parse(contactContent);
    }
}

document.addEventListener('DOMContentLoaded', loadPortfolio);
