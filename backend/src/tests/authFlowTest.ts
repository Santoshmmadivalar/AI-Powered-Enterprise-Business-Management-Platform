/**
 * Authentication System End-to-End Test Suite
 * 
 * Verifies complete authentication lifecycle:
 * - User Registration (Sign Up) -> User saved in database & JWT returned
 * - User Login -> Password verified via bcrypt & JWT generated
 * - Protected Endpoint Access -> JWT token verified in authMiddleware
 * - Invalid Credentials & Error Handling -> Proper error messages
 * 
 * Run with: npx ts-node src/tests/authFlowTest.ts
 */

import dotenv from 'dotenv';
import axios from 'axios';
import assert from 'assert';

dotenv.config();

const API_BASE = 'http://localhost:5050/api';

async function runAuthSystemTests() {
  console.log('=== Starting Authentication System E2E Validation Tests ===\n');

  const testEmail = `user.test.${Date.now()}@outpro.india`;
  const testPassword = 'SecurePassword123!';
  const testName = 'Automated Test User';

  let authToken = '';

  // 1. Test Registration (Sign Up)
  console.log('1. Testing User Registration (Sign Up)...');
  try {
    const res = await axios.post(`${API_BASE}/auth/register`, {
      name: testName,
      email: testEmail,
      password: testPassword,
      role: 'user'
    });

    assert.strictEqual(res.status, 201, 'Registration should return HTTP 201');
    assert.strictEqual(res.data.success, true, 'Response success should be true');
    assert.ok(res.data.data.token, 'JWT token should be returned upon registration');
    assert.strictEqual(res.data.data.user.email, testEmail, 'Returned user email should match');

    authToken = res.data.data.token;
    console.log('   ✅ Registration Passed: User saved & JWT token issued.');
  } catch (err: any) {
    console.error('   ❌ Registration Failed:', err.response?.data || err.message);
    throw err;
  }

  // 2. Test Login with Created User
  console.log('\n2. Testing User Login...');
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: testPassword
    });

    assert.strictEqual(res.status, 200, 'Login should return HTTP 200');
    assert.strictEqual(res.data.success, true, 'Response success should be true');
    assert.ok(res.data.data.token, 'JWT token should be returned upon login');
    assert.strictEqual(res.data.data.user.name, testName, 'Returned user name should match');

    console.log('   ✅ Login Passed: Password verified & JWT token issued.');
  } catch (err: any) {
    console.error('   ❌ Login Failed:', err.response?.data || err.message);
    throw err;
  }

  // 3. Test Login with Seed Accounts (Admin Demo)
  console.log('\n3. Testing Demo Account Login (admin@outpro.india)...');
  try {
    const res = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@outpro.india',
      password: 'password123'
    });

    assert.strictEqual(res.status, 200, 'Admin login should return HTTP 200');
    assert.strictEqual(res.data.data.user.role, 'admin', 'Admin role should be returned');
    console.log('   ✅ Demo Login Passed: Admin portal account authenticated successfully.');
  } catch (err: any) {
    console.error('   ❌ Demo Login Failed:', err.response?.data || err.message);
    throw err;
  }

  // 4. Test Protected Route Access (/auth/me)
  console.log('\n4. Testing Protected Route Access (/auth/me)...');
  try {
    const res = await axios.get(`${API_BASE}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    assert.strictEqual(res.status, 200, 'Protected route should return HTTP 200');
    assert.strictEqual(res.data.data.email, testEmail, 'Authenticated user data returned');
    console.log('   ✅ Protected Route Passed: JWT token verified successfully.');
  } catch (err: any) {
    console.error('   ❌ Protected Route Failed:', err.response?.data || err.message);
    throw err;
  }

  // 5. Test Invalid Credentials Error Handling
  console.log('\n5. Testing Invalid Credentials Error Handling...');
  try {
    await axios.post(`${API_BASE}/auth/login`, {
      email: testEmail,
      password: 'WrongPassword999'
    });
    console.error('   ❌ Expected login to fail, but it succeeded!');
  } catch (err: any) {
    assert.strictEqual(err.response?.status, 401, 'Should return HTTP 401 Unauthorized');
    assert.strictEqual(err.response?.data?.message, 'Invalid email or password', 'Error message should match');
    console.log('   ✅ Invalid Credentials Error Passed: HTTP 401 returned correctly.');
  }

  // 6. Test Duplicate Registration Error Handling
  console.log('\n6. Testing Existing User Registration Error Handling...');
  try {
    await axios.post(`${API_BASE}/auth/register`, {
      name: testName,
      email: testEmail,
      password: testPassword
    });
    console.error('   ❌ Expected duplicate registration to fail, but it succeeded!');
  } catch (err: any) {
    assert.strictEqual(err.response?.status, 400, 'Should return HTTP 400 Bad Request');
    assert.strictEqual(err.response?.data?.message, 'Email is already registered', 'Error message should match');
    console.log('   ✅ Existing User Registration Error Passed: HTTP 400 returned correctly.');
  }

  console.log('\n=================================================');
  console.log('🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! 🎉');
  console.log('=================================================\n');
}

if (require.main === module) {
  runAuthSystemTests().catch(() => process.exit(1));
}
