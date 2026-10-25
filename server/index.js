/**
 * NAHJ Virtual Science Labs — API and production server.
 *   development: `npm run dev` runs Vite (5173) and this API (8787); Vite proxies /api.
 *   production:  `npm run build && npm start` serves dist/ and /api from one port.
 * The app itself lives in ./app.js (also used by the Vercel function in api/index.js).
 */
import { app } from './app.js';
import { assistantAvailable, assistantModel, assistantProvider } from './assistant.js';

const port = Number(process.env.PORT ?? process.env.API_PORT ?? 8787);
app.listen(port, (err) => {
  if (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use — another copy of the server is probably still running.`);
      console.error('Close that window (or stop it with Ctrl+C), or start this one on another port, e.g. set PORT=8788 in .env.');
    } else {
      console.error('Could not start the server:', err.message);
    }
    process.exit(1);
  }
  console.log(`NAHJ Virtual Labs server on http://localhost:${port}  (AI assistant: ${assistantAvailable() ? `${assistantProvider() === 'gemini' ? 'Google Gemini' : 'Claude API'}, ${assistantModel()}` : 'not configured — offline tutor in use'})`);
});
