const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

async function downloadFile(url, dest, expectedSha256) {
  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
      }
      
      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const hash = crypto.createHash('sha256').update(buffer).digest('hex');
        if (expectedSha256 && hash !== expectedSha256) {
          console.warn(`Hash mismatch for ${url}. Expected ${expectedSha256}, got ${hash}`);
        }
        
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buffer);
        resolve();
      });
    }).on('error', reject);
  });
}

async function main() {
  const jsonPath = '/Users/adnaan/.gemini/antigravity/brain/55a9ed96-ebd7-41db-9180-2c0f98e3b3f7/.system_generated/steps/367/content.md';
  const content = fs.readFileSync(jsonPath, 'utf8');
  const jsonStr = content.substring(content.indexOf('{'));
  const data = JSON.parse(jsonStr);

  const destDir = 'src/lib/threeui';
  const publicDir = 'public';
  const baseUrl = 'https://threeui.com/';

  for (const file of data.files) {
    if (file.path.startsWith('src/shaders/')) {
      const targetPath = path.join(destDir, file.path.replace('src/shaders/', ''));
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, file.code || '');
      console.log('Wrote', targetPath);
    } else if (file.path.startsWith('public/')) {
      const targetPath = path.join(publicDir, file.path.replace('public/', ''));
      const url = baseUrl + file.path.replace('public/', '');
      console.log('Downloading', url);
      await downloadFile(url, targetPath, file.sha256);
      console.log('Downloaded', targetPath);
    }
  }

  fs.writeFileSync(path.join(destDir, 'index.ts'), `
export * from './landing-pages/LandingPages';
export { default as style } from './threeui.css';
  `);
  
  const binaries = [
    ['public/landing-pages/secret-pathways-assets/generated/kage-sanmon-preview.webp', '23937f8c8350c55730c3bd17066a250548b2d29aad0e6ffb96218c1354b6db43'],
    ['public/landing-pages/secret-pathways-assets/generated/kage-approach.webp', '39ff338936097e1bde0c4eadcf09805b9890862703186e67314942de7e0bc36c'],
    ['public/landing-pages/secret-pathways-assets/generated/kage-lantern-court.webp', 'c0a6ff7da1cd6909d66e2f3f690b0d524a693e01d2222ab846d0074a90f47471'],
    ['public/landing-pages/secret-pathways-assets/generated/kage-moonwater.webp', 'b8c8060c51c87a103bae619b3a4cc8b8b80632649d83f1f2c2299051e7f9b400'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/temple-wall.webp', '41c00f017e4ecf2147ee468d74da955bb4e2dad773f75a575022842eaf7609ce'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/pine-tree.webp', '79b233716d067bbc64c1507f79e4a30ba5f445995158c78562cc5b81f607ede7'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/tall-grass.webp', '8db0b5fbd160a7225391a6283a99681e346e205f24191031657285ef85ef12d2'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/sakura-branch.webp', '48564194d40496090dbf3bba2a68785cf91fafb655dc8d43ac16f6678aff196d'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/maple-leaves.webp', '35a90fec62c1a6bbfbbe73cd5d7b1acb889e80546d404182ef9a45fe417b531f'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/stone-lantern.webp', 'd5f3c881bc9d92b72eaaff2b709614d66e21a19e14025d2b9b16a15ab52df3bc'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/garden-bush.webp', '707e2516ebc0108041fe0ddc26d8bff0a69dc9700641f837765018b64e9ff15e'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/basalt-stones.webp', '150f1c87e181d651c318168c271bb65c9c8abac6dea6f2421fdd081c5b740471'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/hill.webp', 'ffba816244bcba98e4e33c6ee56165edfe4048db4af122ef3f5822180a85edbc'],
    ['public/landing-pages/secret-pathways-assets/foreground/png/shrine-ruins.webp', '77006e58f2066e6fa9bfc504df396db49b1c7977858fa52d34dd2dad5feced77']
  ];

  for (const [binPath, expectedHash] of binaries) {
    const targetPath = path.join(publicDir, binPath.replace('public/', ''));
    if (!fs.existsSync(targetPath)) {
      const url = baseUrl + binPath.replace('public/', '');
      console.log('Downloading binary', url);
      await downloadFile(url, targetPath, expectedHash);
      console.log('Downloaded binary', targetPath);
    }
  }
}

main().catch(console.error);
