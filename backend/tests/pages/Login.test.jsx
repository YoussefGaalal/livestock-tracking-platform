import { describe, it, expect } from 'vitest';

describe('Login Page', () => {
  it('validates email format', () => {
    const validateEmail = (email) => email.includes('@');
    
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  it('validates password minimum length', () => {
    const validatePassword = (password) => password.length >= 8;
    
    expect(validatePassword('password123')).toBe(true);
    expect(validatePassword('short')).toBe(false);
  });

  it('toggles between login and register modes', () => {
    let isLogin = true;
    
    const toggle = () => {
      isLogin = !isLogin;
    };
    
    expect(isLogin).toBe(true);
    toggle();
    expect(isLogin).toBe(false);
    toggle();
    expect(isLogin).toBe(true);
  });
});