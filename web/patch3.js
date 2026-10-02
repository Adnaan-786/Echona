const fs = require('fs');
const file = 'public/landing-pages/kage.html';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  '<script src="secret-pathways-assets/three.min.js"></script>',
  '<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>'
);

fs.writeFileSync(file, content);
