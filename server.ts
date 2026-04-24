import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import app from './api/index.ts';

// --- SERVER SETUP ---
async function startServer() {
  const PORT = 3000;

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mode: Development (Vite Middleware)');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Mode: Production (Serving Static Files)');
    const distPath = path.resolve(process.cwd(), 'dist');
    
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sentinel Backend Active: http://localhost:${PORT}`);
  });
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer();
}

export default app;
