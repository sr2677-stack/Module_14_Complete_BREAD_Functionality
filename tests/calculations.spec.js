const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5500'; // frontend served via live server or similar
const API = 'http://localhost:5000/api';

// Helper: create a unique test user
const testUser = { username: `user_${Date.now()}`, password: 'Test@1234' };
let token;

// Setup: register and login via API before UI tests
test.beforeAll(async ({ request }) => {
  await request.post(`${API}/register`, { data: testUser });
  const res = await request.post(`${API}/login`, { data: testUser });
  const body = await res.json();
  token = body.access_token;
});

// ===== POSITIVE SCENARIOS =====

test('Add: Create a new calculation successfully', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');
  await expect(page.locator('#calc-section')).toBeVisible();

  await page.selectOption('#operation', 'add');
  await page.fill('#operand1', '10');
  await page.fill('#operand2', '5');
  await page.click('button:has-text("Calculate")');

  await expect(page.locator('#add-msg')).toHaveText(/Result: 15/);
});

test('Browse: All calculations are displayed after add', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');

  await page.click('button:has-text("Refresh List")');
  const rows = page.locator('#calc-body tr');
  await expect(rows).toHaveCount(await rows.count()); // at least 1
  expect(await rows.count()).toBeGreaterThan(0);
});

test('Edit: Update an existing calculation', async ({ page, request }) => {
  // Create a calc via API first
  const res = await request.post(`${API}/calculations`, {
    data: { operation: 'multiply', operand1: 3, operand2: 4 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const calc = await res.json();

  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');

  await page.fill('#edit-id', String(calc.id));
  await page.selectOption('#edit-operation', 'add');
  await page.fill('#edit-operand1', '20');
  await page.fill('#edit-operand2', '30');
  await page.click('button:has-text("Update")');

  await expect(page.locator('#edit-msg')).toHaveText(/New result: 50/);
});

test('Delete: Remove a calculation successfully', async ({ page, request }) => {
  const res = await request.post(`${API}/calculations`, {
    data: { operation: 'subtract', operand1: 10, operand2: 2 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const calc = await res.json();

  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');

  await page.fill('#delete-id', String(calc.id));
  await page.click('button:has-text("Delete")');

  await expect(page.locator('#delete-msg')).toHaveText('Deleted!');
});

test('Read: Retrieve an existing calculation by ID', async ({ page, request }) => {
  const res = await request.post(`${API}/calculations`, {
    data: { operation: 'add', operand1: 9, operand2: 6 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const calc = await res.json();

  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');

  await page.fill('#read-id', String(calc.id));
  await page.click('button:has-text("Get Calculation")');

  await expect(page.locator('#read-msg')).toHaveText('Calculation loaded');
  await expect(page.locator('#read-result')).toContainText(`ID ${calc.id}`);
});

// ===== NEGATIVE SCENARIOS =====

test('Add: Fails with non-numeric operands', async ({ page }) => {
  await page.goto(BASE_URL);
  await page.fill('#username', testUser.username);
  await page.fill('#password', testUser.password);
  await page.click('button:has-text("Login")');

  // Leave operand fields empty (NaN)
  await page.fill('#operand1', '');
  await page.fill('#operand2', '');
  await page.click('button:has-text("Calculate")');

  await expect(page.locator('#add-msg')).toHaveText(/must be numbers/i);
});

test('Add: Fails on divide by zero', async ({ request }) => {
  const res = await request.post(`${API}/calculations`, {
    data: { operation: 'divide', operand1: 10, operand2: 0 },
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('divide by zero');
});

test('Read: Returns 404 for non-existent ID', async ({ request }) => {
  const res = await request.get(`${API}/calculations/999999`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status()).toBe(404);
});

test('Edit: Rejects non-numeric operands', async ({ request }) => {
  const createRes = await request.post(`${API}/calculations`, {
    data: { operation: 'add', operand1: 1, operand2: 2 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const calc = await createRes.json();

  const res = await request.put(`${API}/calculations/${calc.id}`, {
    data: { operation: 'add', operand1: 'abc', operand2: 2 },
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status()).toBe(400);
  const body = await res.json();
  expect(body.error).toContain('Operands must be numbers');
});

test('Unauthorized: Access without token returns 401', async ({ request }) => {
  const res = await request.get(`${API}/calculations`);
  expect(res.status()).toBe(401);
});

test('Delete: Cannot delete another user\'s calculation', async ({ request }) => {
  // Create calc under testUser
  const calcRes = await request.post(`${API}/calculations`, {
    data: { operation: 'add', operand1: 1, operand2: 1 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const calc = await calcRes.json();

  // Register another user and try to delete
  const other = { username: `other_${Date.now()}`, password: 'Other@1234' };
  await request.post(`${API}/register`, { data: other });
  const loginRes = await request.post(`${API}/login`, { data: other });
  const { access_token } = await loginRes.json();

  const delRes = await request.delete(`${API}/calculations/${calc.id}`, {
    headers: { Authorization: `Bearer ${access_token}` }
  });
  expect(delRes.status()).toBe(404); // Not visible to other user
});
