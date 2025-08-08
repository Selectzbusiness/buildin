// Simple test script to verify OpenRouter API key
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local (CRA) or .env
function loadEnvFiles() {
  const candidates = ['.env.local', '.env'];
  for (const filename of candidates) {
    const envPath = path.join(__dirname, filename);
    if (!fs.existsSync(envPath)) continue;
    const envContent = fs.readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '');
          process.env[key] = value;
        }
      }
    });
  }
}

loadEnvFiles();

const API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;

async function testApiKey() {
  console.log('🔍 Testing OpenRouter API Key...');
  
  if (!API_KEY) {
    console.error('❌ No API key found in environment variables');
    return;
  }
  
  console.log('API Key starts with:', API_KEY.substring(0, 15) + '...');
  if (!API_KEY.startsWith('sk-or-v1-')) {
    console.warn('⚠️ The key does not start with sk-or-v1-. Ensure you are using an OpenRouter key, not a provider key.');
  }
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://selectz.in',
        'X-Title': 'Selectz AI Assistant',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-r1:free',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant.'
          },
          {
            role: 'user',
            content: 'Say "Hello, API key is working!"'
          }
        ],
        max_tokens: 50,
        temperature: 0.7,
      }),
    });

    console.log('Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    console.log('✅ Message:', data.choices?.[0]?.message?.content);
    
  } catch (error) {
    console.error('❌ Network Error:', error.message);
  }
}

testApiKey(); 