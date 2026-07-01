# Portfolio

A minimalist portfolio website built with vanilla HTML, CSS, and JavaScript, featuring an organized project structure and dark/light mode support.

## About

This portfolio showcases the work of Võ Hữu Trường Quỳnh (Raymond), a Software Engineer focused on creating clean, functional solutions with an emphasis on simplicity and efficiency.

## Features

- **Minimal Design**: Clean, distraction-free interface
- **Dark/Light Mode**: Toggle between themes with smooth transitions
- **Static Content**: Markdown-based content management
- **Responsive**: Works across all device sizes
- **Fast**: No build tools or frameworks - just vanilla web technologies
- **Organized Structure**: Clean separation of source code, content, and assets

## Tech Stack

- HTML5
- CSS3 (with custom properties)
- Vanilla JavaScript
- Marked.js (for Markdown parsing)
- Node.js or Python3 (for local development server)

## Project Structure

```
portfolio/
├── index.html              # Main HTML file (GitHub Pages entry point)
├── .nojekyll               # Disables Jekyll on GitHub Pages
├── .gitignore              # Prevents committing OS/build artifacts
├── LICENSE                 # MIT license
├── start-server.py         # Local development server
├── README.md               # This file
├── src/                    # Source code directory
│   ├── css/
│   │   └── style.css       # Stylesheets
│   ├── js/
│   │   └── script.js       # JavaScript functionality
│   └── assets/
│       └── images/
│           ├── kappara.png      # Favicon (64x64)
│           └── kappara-full.png # Original favicon (1056x992, kept as backup)
└── content/                # Markdown content files
    ├── about.md            # About section content (name, title, skills)
    ├── projects.md         # Projects showcase (name, description, tags, link)
    ├── blog.md             # Blog section (external link)
    └── contact.md          # Contact information
```

## Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rolniuq/portfolio.git
   cd portfolio
   ```

2. **Start the development server**

   With Node.js:
   ```bash
   node start-server.js
   ```
   
   Or with Python:
   ```bash
   python3 start-server.py
   ```
   
   Either will start a server at `http://localhost:8000` and open your browser automatically.

3. **Optional: Specify a different port**
   ```bash
   node start-server.js 3000
   # or
   python3 start-server.py 3000
   ```

### Content Management

Update your portfolio content by editing the Markdown files in the `content/` directory:

- `about.md`: Personal information and introduction
- `projects.md`: Project showcase (supports front matter for metadata)
- `contact.md`: Contact information and links

### Deployment

**GitHub Pages**: The repository is configured for automatic deployment to GitHub Pages. Simply push changes to the `master` branch.

**Manual Hosting**: Upload the entire directory structure to any web server.

## Projects Featured

- **Task Hub**: Fullstack Go task management with PostgreSQL, NATS, Docker
- **FotoBoo**: RESTful photo booth API with Clean Architecture
- **Jirar**: Modern CLI tool for Jira ticket management
- **Robolo**: Comprehensive GitHub automation bot
- **PDF Darker**: Python utility to convert PDFs to dark mode

## Contact

- Email: truongquynh2525@gmail.com
- GitHub: https://github.com/rolniuq
- LinkedIn: https://www.linkedin.com/in/quynh-vo-87b627234/

## License

This project is open source and available under the [MIT License](LICENSE).