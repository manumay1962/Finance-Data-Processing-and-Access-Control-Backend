/**
 * API Test Script — Tests all major flows
 * Run: node test-api.js
 */

const http = require('http');

const BASE = 'http://localhost:3000';
let adminToken, analystToken, viewerToken;
let testsPassed = 0;
let testsFailed = 0;

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

function assert(name, condition) {
  if (condition) {
    console.log(`  ✅ ${name}`);
    testsPassed++;
  } else {
    console.log(`  ❌ ${name}`);
    testsFailed++;
  }
}

async function run() {
  console.log('═══════════════════════════════════════════');
  console.log('  Finance Dashboard API — Test Suite');
  console.log('═══════════════════════════════════════════\n');

  // ─── 1. Health Check ──────────────────────────────
  console.log('📋 Health Check');
  const health = await request('GET', '/api/health');
  assert('Health endpoint returns 200', health.status === 200);
  assert('Health response is success', health.body.success === true);

  // ─── 2. Auth — Login ──────────────────────────────
  console.log('\n🔑 Authentication');
  const adminLogin = await request('POST', '/api/auth/login', {
    email: 'admin@finance.com', password: 'password123',
  });
  assert('Admin login succeeds', adminLogin.status === 200);
  assert('Admin gets JWT token', !!adminLogin.body.data?.token);
  adminToken = adminLogin.body.data?.token;

  const analystLogin = await request('POST', '/api/auth/login', {
    email: 'analyst@finance.com', password: 'password123',
  });
  assert('Analyst login succeeds', analystLogin.status === 200);
  analystToken = analystLogin.body.data?.token;

  const viewerLogin = await request('POST', '/api/auth/login', {
    email: 'viewer@finance.com', password: 'password123',
  });
  assert('Viewer login succeeds', viewerLogin.status === 200);
  viewerToken = viewerLogin.body.data?.token;

  const badLogin = await request('POST', '/api/auth/login', {
    email: 'admin@finance.com', password: 'wrongpass',
  });
  assert('Wrong password returns 401', badLogin.status === 401);

  // ─── 3. Auth — Register ───────────────────────────
  console.log('\n📝 Registration');
  const register = await request('POST', '/api/auth/register', {
    name: 'Test User', email: 'test@example.com', password: 'test123',
  });
  assert('Registration succeeds', register.status === 201);
  assert('New user gets viewer role', register.body.data?.role === 'viewer');

  const dupeRegister = await request('POST', '/api/auth/register', {
    name: 'Dupe', email: 'test@example.com', password: 'test123',
  });
  assert('Duplicate email returns 409', dupeRegister.status === 409);

  const badRegister = await request('POST', '/api/auth/register', {
    name: '', email: 'invalid', password: '12',
  });
  assert('Invalid registration returns 400', badRegister.status === 400);
  assert('Validation errors are returned', Array.isArray(badRegister.body.errors));

  // ─── 4. Profile ───────────────────────────────────
  console.log('\n👤 Profile');
  const profile = await request('GET', '/api/auth/me', null, adminToken);
  assert('Get profile with token', profile.status === 200);
  assert('Profile has admin role', profile.body.data?.role === 'admin');

  const noTokenProfile = await request('GET', '/api/auth/me');
  assert('No token returns 401', noTokenProfile.status === 401);

  // ─── 5. RBAC — Access Control ─────────────────────
  console.log('\n🛡️  Access Control (RBAC)');

  // Viewer cannot create records
  const viewerCreate = await request('POST', '/api/records', {
    amount: 100, type: 'income', category: 'salary', date: '2026-04-01',
  }, viewerToken);
  assert('Viewer CANNOT create records (403)', viewerCreate.status === 403);

  // Viewer cannot view records
  const viewerRecords = await request('GET', '/api/records', null, viewerToken);
  assert('Viewer CANNOT view records (403)', viewerRecords.status === 403);

  // Viewer CAN view dashboard summary
  const viewerSummary = await request('GET', '/api/dashboard/summary', null, viewerToken);
  assert('Viewer CAN view dashboard summary', viewerSummary.status === 200);

  // Viewer cannot view analytics
  const viewerTrends = await request('GET', '/api/dashboard/trends', null, viewerToken);
  assert('Viewer CANNOT view analytics (403)', viewerTrends.status === 403);

  // Analyst can read records
  const analystRecords = await request('GET', '/api/records', null, analystToken);
  assert('Analyst CAN view records', analystRecords.status === 200);

  // Analyst cannot create records
  const analystCreate = await request('POST', '/api/records', {
    amount: 100, type: 'income', category: 'salary', date: '2026-04-01',
  }, analystToken);
  assert('Analyst CANNOT create records (403)', analystCreate.status === 403);

  // Analyst cannot manage users
  const analystUsers = await request('GET', '/api/users', null, analystToken);
  assert('Analyst CANNOT manage users (403)', analystUsers.status === 403);

  // Admin can do everything
  const adminRecords = await request('GET', '/api/records', null, adminToken);
  assert('Admin CAN view records', adminRecords.status === 200);

  const adminUsers = await request('GET', '/api/users', null, adminToken);
  assert('Admin CAN manage users', adminUsers.status === 200);

  // ─── 6. Financial Records CRUD ─────────────────────
  console.log('\n💰 Financial Records CRUD');

  const createRecord = await request('POST', '/api/records', {
    amount: 999.50, type: 'expense', category: 'shopping', date: '2026-04-01',
    description: 'Test purchase',
  }, adminToken);
  assert('Admin creates record', createRecord.status === 201);
  assert('Record has correct amount', createRecord.body.data?.amount === 999.5);
  const recordId = createRecord.body.data?.id;

  const getRecord = await request('GET', `/api/records/${recordId}`, null, adminToken);
  assert('Get record by ID', getRecord.status === 200);

  const updateRecord = await request('PUT', `/api/records/${recordId}`, {
    amount: 1200, description: 'Updated purchase',
  }, adminToken);
  assert('Update record', updateRecord.status === 200);
  assert('Amount updated correctly', updateRecord.body.data?.amount === 1200);

  const deleteRecord = await request('DELETE', `/api/records/${recordId}`, null, adminToken);
  assert('Soft-delete record', deleteRecord.status === 200);

  const getDeleted = await request('GET', `/api/records/${recordId}`, null, adminToken);
  assert('Deleted record not found (404)', getDeleted.status === 404);

  // ─── 7. Filtering & Pagination ─────────────────────
  console.log('\n🔍 Filtering & Pagination');

  const filtered = await request('GET', '/api/records?type=income', null, adminToken);
  assert('Filter by type works', filtered.status === 200);
  const allIncome = filtered.body.data?.every((r) => r.type === 'income');
  assert('All filtered records are income', allIncome);

  const paginated = await request('GET', '/api/records?page=1&limit=5', null, adminToken);
  assert('Pagination works', paginated.status === 200);
  assert('Pagination metadata present', !!paginated.body.pagination);
  assert('Limit respected', paginated.body.data?.length <= 5);

  const dateFiltered = await request('GET', '/api/records?startDate=2026-02-01&endDate=2026-02-28', null, adminToken);
  assert('Date range filter works', dateFiltered.status === 200);

  // ─── 8. Dashboard Analytics ────────────────────────
  console.log('\n📊 Dashboard Analytics');

  const summary = await request('GET', '/api/dashboard/summary', null, adminToken);
  assert('Summary returns totals', summary.status === 200);
  assert('Has total_income', typeof summary.body.data?.total_income === 'number');
  assert('Has total_expenses', typeof summary.body.data?.total_expenses === 'number');
  assert('Has net_balance', typeof summary.body.data?.net_balance === 'number');

  const categories = await request('GET', '/api/dashboard/category-totals', null, analystToken);
  assert('Category totals returns data', categories.status === 200);
  assert('Has income categories', Array.isArray(categories.body.data?.income));
  assert('Has expense categories', Array.isArray(categories.body.data?.expense));

  const trends = await request('GET', '/api/dashboard/trends?year=2026', null, analystToken);
  assert('Monthly trends returns 12 months', trends.status === 200);
  assert('Trends has 12 months', trends.body.data?.months?.length === 12);

  const recent = await request('GET', '/api/dashboard/recent-activity?limit=5', null, analystToken);
  assert('Recent activity returns data', recent.status === 200);
  assert('Recent activity respects limit', recent.body.data?.length <= 5);

  // ─── 9. User Management ───────────────────────────
  console.log('\n👥 User Management');

  const users = await request('GET', '/api/users', null, adminToken);
  assert('Get all users', users.status === 200);
  assert('Returns array of users', Array.isArray(users.body.data));

  // Find the test user we registered
  const testUser = users.body.data.find((u) => u.email === 'test@example.com');
  assert('Test user exists', !!testUser);

  if (testUser) {
    const promoteUser = await request('PATCH', `/api/users/${testUser.id}/role`, {
      role: 'analyst',
    }, adminToken);
    assert('Promote user role', promoteUser.status === 200);
    assert('Role updated to analyst', promoteUser.body.data?.role === 'analyst');

    const deactivateUser = await request('PATCH', `/api/users/${testUser.id}/status`, {
      status: 'inactive',
    }, adminToken);
    assert('Deactivate user', deactivateUser.status === 200);
    assert('Status set to inactive', deactivateUser.body.data?.status === 'inactive');

    const deleteUser = await request('DELETE', `/api/users/${testUser.id}`, null, adminToken);
    assert('Delete user', deleteUser.status === 200);
  }

  // ─── 10. Validation ────────────────────────────────
  console.log('\n✏️  Validation');

  const badRecord = await request('POST', '/api/records', {
    amount: -50, type: 'invalid', category: 'nonexistent',
  }, adminToken);
  assert('Invalid record returns 400', badRecord.status === 400);
  assert('Returns validation errors', Array.isArray(badRecord.body.errors));

  const badRole = await request('PATCH', `/api/users/some-id/role`, {
    role: 'superadmin',
  }, adminToken);
  assert('Invalid role returns 400', badRole.status === 400);

  // ─── 11. Edge Cases ────────────────────────────────
  console.log('\n🔧 Edge Cases');

  const notFound = await request('GET', '/api/records/nonexistent-id', null, adminToken);
  assert('Nonexistent record returns 404', notFound.status === 404);

  const badRoute = await request('GET', '/api/nonexistent', null, adminToken);
  assert('Unknown route returns 404', badRoute.status === 404);

  // ─── Summary ───────────────────────────────────────
  console.log('\n═══════════════════════════════════════════');
  console.log(`  Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('═══════════════════════════════════════════\n');

  process.exit(testsFailed > 0 ? 1 : 0);
}

run().catch((err) => {
  console.error('Test runner failed:', err.message);
  process.exit(1);
});
