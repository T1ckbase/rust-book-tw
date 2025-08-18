import * as path from '@std/path';
import { ensureDirSync } from '@std/fs';
import SYSTEM_PROMPT from './SYSTEM_PROMPT.md' with { type: 'text' };

interface File {
  name: string;
  type: string;
  sha: string;
  download_url: string;
}

if (!Deno.env.has('GEMINI_API_KEY')) throw Error('GEMINI_API_KEY is not set');

ensureDirSync('book');

async function getFiles() {
  const res = await fetch('https://api.github.com/repos/rust-lang/book/contents/nostarch');
  if (!res.ok) throw Error(`${res.status} ${res.statusText}`);
  const data = await res.json() as File[];
  return data.filter((x) => x.type === 'file' && path.extname(x.name) === '.md');
}

async function translateFile({ name, download_url: url }: File) {
  const start = Date.now();
  try {
    console.log(`Downloading: ${name}`);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download ${name}: ${response.status} ${response.statusText}`);
    }
    const content = await response.text();

    const requestBody = JSON.stringify({
      model: 'gemini-2.5-pro',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: content },
      ],
    });

    while (true) {
      try {
        const apiResponse = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
            },
            body: requestBody,
          },
        );

        if (!apiResponse.ok) {
          console.error(`API request failed with status ${apiResponse.status}. Response:`);
          try {
            const responseBody = await apiResponse.json();
            console.error(responseBody[0].error.message);
          } catch {
            const responseBody = await apiResponse.text();
            console.error(responseBody);
          }
          console.log('Retrying in 20 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 20000));
          continue;
        }

        const data = await apiResponse.json();
        const translation: string = data?.choices[0]?.message?.content;
        if (translation) throw Error('Response is empty');
        const outputFile = `book/${name}`;
        await Deno.writeTextFile(outputFile, translation.trim());
        const end = Date.now();
        const seconds = ((end - start) / 1000).toFixed(2);
        console.log(`Translated: ${name} in ${seconds} seconds`);
        break;
      } catch (apiError) {
        console.error('API request failed:', apiError);
        console.log('Retrying in 20 seconds...');
        await new Promise((resolve) => setTimeout(resolve, 20000));
      }
    }
  } catch (error) {
    console.error('Error translating file:', error);
  }
}

const githubShas: Record<string, string> = JSON.parse(Deno.readTextFileSync('./github_shas.json'));
const files = await getFiles();

for (const file of files) {
  if (githubShas[file.name] && githubShas[file.name] === file.sha) {
    console.log(`Already translated: ${file.name}`);
    continue;
  }
  await translateFile(file);
  githubShas[file.name] = file.sha;
}

Deno.writeTextFileSync('./github_shas.json', JSON.stringify(githubShas, null, 2));
