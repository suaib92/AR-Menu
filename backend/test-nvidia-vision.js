const fs = require('fs');
require('dotenv').config({ path: './.env' });

async function run() {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) { console.log('No NVIDIA_API_KEY'); return; }
  
  // A tiny 1x1 base64 image
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  
  try {
    const res = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta/llama-3.2-90b-vision-instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'What is this image?' },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${b64}` } }
            ]
          }
        ],
        max_tokens: 128,
        temperature: 0.2
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Success:', data.choices[0].message.content);
    } else {
      const err = await res.json();
      console.log('❌ Error:', err);
    }
  } catch (e) {
    console.log('❌ Catch Error:', e.message);
  }
}

run();
