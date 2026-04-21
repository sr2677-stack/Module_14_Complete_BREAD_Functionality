const API = 'http://localhost:5000/api';
let token = localStorage.getItem('token') || null;

// Show calc section if already logged in
if (token) {
  document.getElementById('auth-panel').style.display = 'none';
  document.getElementById('calc-section').style.display = 'block';
  browseCalcs();
}

async function register() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return setMsg('auth-msg', 'Fields required', 'red');

  const res = await fetch(`${API}/register`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  setMsg('auth-msg', res.ok ? 'Registered! Now login.' : data.error, res.ok ? 'green' : 'red');
}

async function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  if (!username || !password) return setMsg('auth-msg', 'Fields required', 'red');

  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.access_token;
    localStorage.setItem('token', token);
    document.getElementById('auth-panel').style.display = 'none';
    document.getElementById('calc-section').style.display = 'block';
    browseCalcs();
  } else {
    setMsg('auth-msg', data.error, 'red');
  }
}

function logout() {
  token = null;
  localStorage.removeItem('token');
  document.getElementById('auth-panel').style.display = 'block';
  document.getElementById('calc-section').style.display = 'none';
}

async function browseCalcs() {
  const res = await fetch(`${API}/calculations`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  const tbody = document.getElementById('calc-body');
  tbody.innerHTML = '';
  data.forEach(c => {
    tbody.innerHTML += `<tr>
      <td>${c.id}</td><td>${c.operation}</td>
      <td>${c.operand1}</td><td>${c.operand2}</td>
      <td>${c.result}</td><td>${c.created_at}</td>
    </tr>`;
  });
}

async function addCalc() {
  const operation = document.getElementById('operation').value;
  const operand1 = parseFloat(document.getElementById('operand1').value);
  const operand2 = parseFloat(document.getElementById('operand2').value);

  if (isNaN(operand1) || isNaN(operand2))
    return setMsg('add-msg', 'Operands must be numbers', 'red');

  const res = await fetch(`${API}/calculations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ operation, operand1, operand2 })
  });
  const data = await res.json();
  setMsg('add-msg', res.ok ? `Created! Result: ${data.result}` : data.error, res.ok ? 'green' : 'red');
  if (res.ok) browseCalcs();
}

async function editCalc() {
  const id = document.getElementById('edit-id').value;
  const operation = document.getElementById('edit-operation').value;
  const operand1 = parseFloat(document.getElementById('edit-operand1').value);
  const operand2 = parseFloat(document.getElementById('edit-operand2').value);

  if (!id) return setMsg('edit-msg', 'ID is required', 'red');
  if (isNaN(operand1) || isNaN(operand2))
    return setMsg('edit-msg', 'Operands must be numbers', 'red');

  const res = await fetch(`${API}/calculations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ operation, operand1, operand2 })
  });
  const data = await res.json();
  setMsg('edit-msg', res.ok ? `Updated! New result: ${data.result}` : data.error, res.ok ? 'green' : 'red');
  if (res.ok) browseCalcs();
}

async function deleteCalc() {
  const id = document.getElementById('delete-id').value;
  if (!id) return setMsg('delete-msg', 'ID is required', 'red');

  const res = await fetch(`${API}/calculations/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  setMsg('delete-msg', res.ok ? 'Deleted!' : data.error, res.ok ? 'green' : 'red');
  if (res.ok) browseCalcs();
}

function setMsg(id, msg, color) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.color = color;
}
