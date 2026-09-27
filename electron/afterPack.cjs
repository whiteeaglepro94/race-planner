const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

exports.default = async function afterPack(context) {
  const appDir = path.join(context.appOutDir, 'resources', 'app');
  const targetNM = path.join(appDir, 'node_modules');

  if (!fs.existsSync(targetNM)) fs.mkdirSync(targetNM, { recursive: true });

  const devRoot = path.resolve(__dirname, '..');
  const srcNM = path.join(devRoot, 'node_modules');

  const modules = [
    'irsdk-node', '@irsdk-node', 'module-alias', 'node-gyp-build', 'bindings', 'node-addon-api',
    'pdfkit', '@noble/ciphers', '@noble/hashes', '@swc/helpers', 'base64-js', 'brotli',
    'clone', 'dfa', 'fast-deep-equal', 'fflate', 'fontkit', 'linebreak', 'pako',
    'png-js', 'restructure', 'tiny-inflate', 'tslib', 'unicode-properties', 'unicode-trie',
  ];
  for (const mod of modules) {
    const src = path.join(srcNM, mod);
    const dst = path.join(targetNM, mod);
    if (fs.existsSync(src) && !fs.existsSync(dst)) {
      fs.cpSync(src, dst, { recursive: true });
      console.log(`  • Copied ${mod} to build`);
    }
  }
};
