# Sentinel-Logs Frontend

Modern React dashboard for the Sentinel-Logs SIEM system.

## Tech Stack

- **React 19** with Hooks
- **Vite** for fast builds
- **Recharts** for visualizations
- **Axios** for API calls
- **Tailwind CSS** for styling

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Features

- 📊 **Real-time Dashboard** - Live log and alert monitoring
- 🔍 **Log Search** - Advanced filtering and search
- 🚨 **Alert Management** - Acknowledge and resolve alerts
- 👥 **User Management** - RBAC with Admin/Analyst/Viewer roles
- 🤖 **Agent Monitoring** - Track agent status and health
- 📈 **Analytics** - Security metrics and trends

## Project Structure

```
frontend/src/
├── components/       # React components
│   ├── tabs/        # Dashboard tabs
│   ├── modals/      # Modal dialogs
│   └── charts/      # Visualization components
├── services/        # API services
├── utils/           # Helper functions
├── App.jsx          # Main app component
└── main.jsx         # Entry point
```

## Configuration

Edit `vite.config.js` for proxy settings:

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/api': 'http://localhost:4000'
    }
  }
})
```

## Development

```bash
# Run with hot reload
npm run dev

# Lint code
npm run lint

# Format code
npm run format
```

## Build

```bash
# Production build
npm run build

# Output: dist/
```

## Environment Variables

Create `.env` file:

```bash
VITE_API_URL=https://your-backend-url
```

## License

MIT License - see [LICENSE](../LICENSE)
