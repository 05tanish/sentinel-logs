import { app } from './App.js';
import { connectDB, pool } from './config/db.js';

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });

  // graceful shutdown — closes DB connections cleanly when Docker stops
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      pool.end(() => {
        console.log('DB pool closed');
        process.exit(0);
      });
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      pool.end(() => {
        console.log('DB pool closed');
        process.exit(0);
      });
    });
  });
});
