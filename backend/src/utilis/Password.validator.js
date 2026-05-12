import bcrypt from 'bcryptjs';

// Common weak passwords to block
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty', 'abc123', 
  'monkey', '1234567890', 'letmein', 'trustno1', 'dragon',
  'baseball', 'iloveyou', 'master', 'sunshine', 'ashley',
  'bailey', 'passw0rd', 'shadow', '123123', '654321',
  'superman', 'qazwsx', 'michael', 'football', 'admin',
  'welcome', 'login', 'admin123', 'root', 'toor'
];

export const validatePasswordComplexity = (password) => {
  const errors = [];
  const warnings = [];
  
  // Minimum length check (increased to 12)
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Maximum length check (prevent DoS)
  if (password && password.length > 128) {
    errors.push('Password must not exceed 128 characters');
  }
  
  // Uppercase letter check
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Lowercase letter check
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Numeric digit check
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one numeric digit');
  }
  
  // Special character check
  if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)');
  }
  
  // Check for common passwords
  if (password && COMMON_PASSWORDS.includes(password.toLowerCase())) {
    errors.push('Password is too common. Please choose a more unique password');
  }
  
  // Check for sequential characters (123, abc, etc.)
  if (password && /(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
    warnings.push('Password contains sequential characters. Consider using a more random pattern');
  }
  
  // Check for repeated characters (aaa, 111, etc.)
  if (password && /(.)\1{2,}/.test(password)) {
    warnings.push('Password contains repeated characters. Consider using more variety');
  }
  
  // Calculate password strength score
  let strength = 0;
  if (password) {
    if (password.length >= 12) strength += 1;
    if (password.length >= 16) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) strength += 1;
    if (password.length >= 20) strength += 1;
    
    // Bonus for character variety
    const uniqueChars = new Set(password).size;
    if (uniqueChars >= password.length * 0.7) strength += 1;
  }
  
  const strengthLabel = strength >= 7 ? 'Strong' : strength >= 5 ? 'Medium' : 'Weak';
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: {
      score: strength,
      label: strengthLabel,
      maxScore: 8
    }
  };
};

export const hashPassword = (password) => bcrypt.hash(password, 10);

export const comparePassword = (plain, hashed) => bcrypt.compare(plain, hashed);
