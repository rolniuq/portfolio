#!/usr/bin/env python3
"""
Simple HTTP server for local development
Usage: python start-server.py [port]
Default port: 8000
"""

import http.server
import socketserver
import sys
import webbrowser
import os
from pathlib import Path

def start_server(port=8000):
    """Start the HTTP server"""
    
    # Change to the script's directory (project root)
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    class CustomHandler(http.server.SimpleHTTPRequestHandler):
        def do_GET(self):
            if self.path == '/':
                self.path = '/src/index.html'
            return super().do_GET()
    
    Handler = CustomHandler
    
    try:
        with socketserver.TCPServer(("", port), Handler) as httpd:
            print(f"🚀 Server started at http://localhost:{port}")
            print(f"📁 Serving directory: {script_dir}")
            print("Press Ctrl+C to stop the server")
            
            # Open browser automatically
            webbrowser.open(f"http://localhost:{port}")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {port} is already in use. Try a different port:")
            print(f"   python start-server.py {port + 1}")
        else:
            print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    port = 8000
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ Invalid port number. Using default port 8000")
            port = 8000
    
    if port < 1 or port > 65535:
        print("❌ Port must be between 1 and 65535")
        sys.exit(1)
    
    start_server(port)