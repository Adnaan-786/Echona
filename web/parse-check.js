const fs = require('fs');
const jsonPath = '/Users/adnaan/.gemini/antigravity/brain/55a9ed96-ebd7-41db-9180-2c0f98e3b3f7/.system_generated/steps/367/content.md';
const content = fs.readFileSync(jsonPath, 'utf8');
const jsonStr = content.substring(content.indexOf('{'));
const data = JSON.parse(jsonStr);
for (const file of data.files) {
  console.log(file.path, 'has code?', !!file.code, 'has bytes?', file.bytes);
}
