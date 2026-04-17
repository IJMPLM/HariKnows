#!/usr/bin/env node

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const OUTPUT_PATH = path.join(__dirname, '..', 'docs', 'context', 'complete_raw_prompt.txt');
const ENDPOINT_PATH = '/api/chat/debug/raw-prompt';
const LAUNCH_SETTINGS_PATH = path.join(__dirname, '..', 'backend', 'HariKnowsBackend', 'Properties', 'launchSettings.json');

function getClientForUrl(url) {
  return url.startsWith('https://') ? https : http;
}

function parseApiUrlsFromLaunchSettings() {
  if (!fs.existsSync(LAUNCH_SETTINGS_PATH)) {
    return [];
  }

  try {
    const raw = fs.readFileSync(LAUNCH_SETTINGS_PATH, 'utf8').replace(/^\uFEFF/, '');
    const json = JSON.parse(raw);
    const profiles = json && json.profiles ? Object.values(json.profiles) : [];
    const urls = [];

    for (const profile of profiles) {
      if (!profile || typeof profile.applicationUrl !== 'string') {
        continue;
      }

      const candidates = profile.applicationUrl
        .split(';')
        .map((u) => u.trim())
        .filter(Boolean);

      for (const candidate of candidates) {
        urls.push(`${candidate}${ENDPOINT_PATH}`);
      }
    }

    return [...new Set(urls)];
  } catch (error) {
    console.warn(`Warning: unable to parse launch settings at ${LAUNCH_SETTINGS_PATH}: ${error.message}`);
    return [];
  }
}

function getCandidateApiUrls() {
  const envUrl = process.env.RAW_PROMPT_API_URL || process.env.API_URL;
  const cliUrl = process.argv[2];
  const configured = [cliUrl, envUrl].filter(Boolean);

  const normalizedConfigured = configured.map((url) => {
    const normalized = url.endsWith(ENDPOINT_PATH) ? url : `${url.replace(/\/$/, '')}${ENDPOINT_PATH}`;
    return normalized;
  });

  const discovered = parseApiUrlsFromLaunchSettings();
  const fallback = [`http://localhost:5240${ENDPOINT_PATH}`, `https://localhost:7013${ENDPOINT_PATH}`];

  return [...new Set([...normalizedConfigured, ...discovered, ...fallback])];
}

function sendRequest(apiUrl, payload) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(apiUrl);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      rejectUnauthorized: false,
    };

    const client = getClientForUrl(apiUrl);
    const req = client.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve({ statusCode: res.statusCode, body: data, apiUrl });
      });
    });

    req.on('error', (error) => {
      const detail = [error.code, error.message, String(error)]
        .filter(Boolean)
        .join(' | ');
      reject(new Error(`${apiUrl} -> ${detail}`));
    });

    req.write(payload);
    req.end();
  });
}

function parseResponseBody(body, apiUrl, statusCode) {
  if (!body || !body.trim()) {
    throw new Error(`${apiUrl} returned status ${statusCode} with an empty response body`);
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    throw new Error(`${apiUrl} returned non-JSON response (status ${statusCode}): ${body.slice(0, 300)}`);
  }
}

async function generateRawPrompt() {
  console.log('Generating RAG raw prompt...');
  const payload = JSON.stringify({ content: 'test message' });
  const apiUrls = getCandidateApiUrls();
  console.log(`Trying ${apiUrls.length} API URL candidate(s)...`);

  const errors = [];

  for (const apiUrl of apiUrls) {
    console.log(`Trying: ${apiUrl}`);

    try {
      const { statusCode, body } = await sendRequest(apiUrl, payload);
      const response = parseResponseBody(body, apiUrl, statusCode);

      if (statusCode !== 200) {
        const errorMessage = response && response.error
          ? response.error
          : body.slice(0, 300);
        throw new Error(`${apiUrl} returned status ${statusCode}: ${errorMessage}`);
      }

      const rawPrompt = response.rawPrompt;
      const responsePayload = response.payload;

      if (!rawPrompt) {
        throw new Error(`${apiUrl} response did not include rawPrompt`);
      }

      const output = [
        '# Exact Prompt Sent To Gemini',
        '',
        '## Raw Prompt String',
        '',
        rawPrompt,
        '',
        '',
        '## Gemini API Payload',
        '',
        JSON.stringify(responsePayload, null, 2),
      ];

      const outputDir = path.dirname(OUTPUT_PATH);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(OUTPUT_PATH, output.join('\n'), 'utf8');
      console.log(`✓ RAG raw prompt saved to ${OUTPUT_PATH}`);
      console.log(`✓ Source endpoint: ${apiUrl}`);
      return;
    } catch (error) {
      errors.push(error.message || String(error));
      console.warn(`Failed: ${error.message || String(error)}`);
    }
  }

  throw new Error([
    'Unable to generate raw prompt from any known backend endpoint.',
    'Checked URLs:',
    ...apiUrls.map((u) => `- ${u}`),
    'Failures:',
    ...errors.map((e) => `- ${e}`),
    'Tip: start backend with `npm run dev:backend` or set RAW_PROMPT_API_URL.',
  ].join('\n'));
}

generateRawPrompt()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error.message);
    process.exit(1);
  });
