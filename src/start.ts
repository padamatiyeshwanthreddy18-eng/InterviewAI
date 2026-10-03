import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { app } from '../server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`\n  🚀 InterviewAI is running! Access it in your browser at:\n`);
    console.log(`  👉 Localhost:  http://localhost:${PORT}`);
    console.log(`  👉 Network IP: http://127.0.0.1:${PORT}\n`);
  });
}

startServer();
