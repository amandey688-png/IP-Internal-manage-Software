/** Returns 0-3 for password strength (0=empty, 1=weak, 2=medium, 3=strong) */
export function getPasswordStrength(password: string): number {
  if (!password || password.length === 0) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++
  if (score <= 1) return 1
  if (score <= 3) return 2
  return 3
}
