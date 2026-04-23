const REQUIRED = [
  'DATABASE_URL',
  'JWT_SECRET',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
];

const WEAK_PLACEHOLDERS = [
  'your_jwt_secret_change_me',
  'your_jwt_secret_here',
  'changeme',
  'secret',
  'password',
];

export const validateEnv = () => {
  const missing = [];
  const weak = [];

  for (const key of REQUIRED) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  // warn about weak JWT secret
  if (process.env.JWT_SECRET && WEAK_PLACEHOLDERS.includes(process.env.JWT_SECRET)) {
    weak.push('JWT_SECRET is a placeholder — change it before production use');
  }

  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    weak.push('JWT_SECRET is too short — use at least 32 characters');
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach((key) => console.error(`   - ${key}`));
    console.error('\nCopy .env.example to .env and fill in the values.');
    process.exit(1);
  }

  if (weak.length > 0) {
    weak.forEach((msg) => console.warn(`⚠️  WARNING: ${msg}`));
  }

  console.log('✅ Environment validation passed');
};
