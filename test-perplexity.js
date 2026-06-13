const key = 'YOUR_API_KEY';
const url = 'https://api.perplexity.ai/chat/completions';
console.log('Testing Perplexity API...');
console.log('Key:', key.substring(0, 10) + '...');

fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`,
  },
  body: JSON.stringify({
    model: 'sonar-pro',
    messages: [{ role: 'user', content: 'What is AI in one sentence?' }],
    temperature: 0.2,
    max_tokens: 100,
  }),
})
  .then((r) => {
    console.log('✓ Status:', r.status);
    return r.text();
  })
  .then((text) => {
    console.log('✓ Response received (first 300 chars):');
    console.log(text.substring(0, 300));
  })
  .catch((e) => {
    console.error('✗ Error:', e.message);
  });
