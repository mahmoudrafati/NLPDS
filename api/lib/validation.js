/**
 * Vercel Validation Utilities
 * Simple request validation for Vercel serverless functions
 */

/**
 * Validate request data against schema
 */
export function validateRequest(data, schema) {
  const errors = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required fields
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push({
        field,
        message: `${field} is required`
      });
      continue;
    }

    // Skip validation for optional empty fields
    if (!rules.required && (value === undefined || value === null || value === '')) {
      continue;
    }

    // Type validation
    if (rules.type) {
      if (!validateType(value, rules.type)) {
        errors.push({
          field,
          message: `${field} must be of type ${rules.type}`
        });
        continue;
      }
    }

    // String validations
    if (rules.type === 'string' && typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.minLength} characters long`
        });
      }

      if (rules.maxLength && value.length > rules.maxLength) {
        errors.push({
          field,
          message: `${field} must be no more than ${rules.maxLength} characters long`
        });
      }

      if (rules.pattern && !rules.pattern.test(value)) {
        errors.push({
          field,
          message: `${field} format is invalid`
        });
      }
    }

    // Number validations
    if (rules.type === 'number' && typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        errors.push({
          field,
          message: `${field} must be at least ${rules.min}`
        });
      }

      if (rules.max !== undefined && value > rules.max) {
        errors.push({
          field,
          message: `${field} must be no more than ${rules.max}`
        });
      }
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push({
        field,
        message: `${field} must be one of: ${rules.enum.join(', ')}`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate data type
 */
function validateType(value, expectedType) {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}

/**
 * Sanitize string input
 */
export function sanitizeString(str) {
  if (typeof str !== 'string') return str;
  
  return str
    .trim()
    .replace(/[<>]/g, '') // Basic XSS prevention
    .substring(0, 1000); // Prevent overly long strings
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate username format
 */
export function isValidUsername(username) {
  const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
  return usernameRegex.test(username);
}
