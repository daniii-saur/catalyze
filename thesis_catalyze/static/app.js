const sendBtn = document.getElementById('send');
const pingBtn = document.getElementById('ping');
const respEl = document.getElementById('response');

async function forward(path, method = 'GET', body = null) {
  const payload = { path, method };
  if (body) payload.body = body;

  const res = await fetch('/api/forward', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const text = await res.text();
  return { status: res.status, text };
}

sendBtn.addEventListener('click', async () => {
  const path = document.getElementById('path').value || '/';
  const method = document.getElementById('method').value || 'GET';
  const bodyText = document.getElementById('body').value.trim();
  let body = null;
  if (bodyText) {
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      respEl.textContent = 'Invalid JSON in body';
      return;
    }
  }

  respEl.textContent = 'Loading...';
  try {
    const r = await forward(path, method, body);
    respEl.textContent = `Status: ${r.status}\n\n${r.text}`;
  } catch (e) {
    respEl.textContent = 'Error: ' + e.message;
  }
});

pingBtn.addEventListener('click', async () => {
  respEl.textContent = 'Pinging...';
  try {
    const res = await fetch('/api/ping');
    const text = await res.text();
    respEl.textContent = `Status: ${res.status}\n\n${text}`;
  } catch (e) {
    respEl.textContent = 'Error: ' + e.message;
  }
});
