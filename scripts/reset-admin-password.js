import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;

// Database connection from environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:siem@localhost:5432/siem',
  ssl: false
});

async function resetAdminPassword() {
  try {
    const username = 'admin';
    
    // Require password from environment variable
    if (!process.env.ADMIN_PASSWORD) {
      console.error('❌ Error: ADMIN_PASSWORD environment variable is required');
      console.error('');
      console.error('Usage:');
      console.error('  ADMIN_PASSWORD=your_secure_password node scripts/reset-admin-password.js');
      console.error('');
      process.exit(1);
    }
    
    const newPassword = process.env.ADMIN_PASSWORD;
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update the password
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE username = $2 RETURNING id, username, role',
      [hashedPassword, username]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Password reset successfully!');
      console.log('');
      console.log('Login Credentials:');
      console.log('==================');
      console.log(`Username: ${username}`);
      console.log(`Password: ${newPassword}`);
      console.log('');
      console.log('⚠️  IMPORTANT: Store this password securely!');
    } else {
      console.log('❌ User not found');
    }
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

resetAdminPassword();
