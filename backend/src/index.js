import { app } from './App.js';
import { connectDB, pool } from './config/db.js';
import { checkSilentAgents } from './modules/Agent/Agent.Service.js';

const PORT = process.env.PORT || 4000;

connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`Backend running on port ${PORT}`);
  });

  // background job — check for silent agents every 5 minutes
  setInterval(checkSilentAgents, 5 * 60 * 1000);
  console.log('Agent heartbeat monitor started (checks every 5 minutes)');

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
