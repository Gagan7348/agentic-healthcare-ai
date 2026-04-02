# Healthcare AI Frontend

React-based frontend for the Agentic Healthcare AI System.

## Features

- Modern React UI with Tailwind CSS
- Multilingual support (English & Hindi)
- Real-time predictions
- Patient database integration
- ASHA mode for community health workers
- AI Chat assistant

## Installation

```
bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx        # Main application
│   ├── main.jsx       # Entry point
│   └── index.css      # Global styles
├── public/
│   └── vite.svg       # Logo
├── index.html          # HTML template
├── package.json        # Dependencies
├── vite.config.js     # Vite configuration
├── tailwind.config.js # Tailwind configuration
└── postcss.config.js  # PostCSS configuration
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## API Integration

The frontend connects to the FastAPI backend at `http://localhost:8000`.

## Technologies

- React 18
- Tailwind CSS
- Axios
- Vite

## License

MIT License
