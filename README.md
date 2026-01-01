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
- CSS3
- Vanilla JavaScript
- Marked.js (for Markdown parsing)
- Python3 (for local development server)

## Project Structure

```
portfolio/
├── index.html              # Main HTML file (GitHub Pages entry point)
├── src/                    # Source code directory
│   ├── css/
│   │   └── style.css       # Stylesheets
│   ├── js/
│   │   └── script.js       # JavaScript functionality
│   └── assets/
│       └── images/
│           └── kappara.png # Favicon and images
├── content/                # Markdown content files
│   ├── about.md            # About section content
│   ├── projects.md         # Projects showcase
│   └── contact.md          # Contact information
├── scripts/                # Utility scripts
│   └── start-server.py     # Local development server
├── start-server.py         # Main server script (root level)
└── README.md               # This file
```

## Getting Started

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/rolniuq/portfolio.git
   cd portfolio
   ```

2. **Start the development server**
   ```bash
   python3 start-server.py
   ```
   
   This will start a local server at `http://localhost:8000` and open your browser automatically.

3. **Optional: Specify a different port**
   ```bash
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

- **Project One**: A minimal web application built with vanilla JavaScript and modern CSS
- **Darker PDF**: Python script to convert PDFs to dark mode
- **Task Hub**: Fullstack Go application for task management with web and desktop apps

## Contact

- Email: truongquynh2525@gmail.com
- GitHub: https://github.com/rolniuq
- LinkedIn: https://www.linkedin.com/in/quynh-vo-87b627234/

## License

This project is open source and available under the [MIT License](LICENSE).