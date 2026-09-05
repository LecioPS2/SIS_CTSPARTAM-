const path = require('path');
const fs = require('fs');

function getUploadsDir() {
  let uploadsDir = path.join(__dirname, '..', '..', 'uploads');
  if (__dirname.includes('hbuilds/versions')) {
    const domainRoot = __dirname.split('hbuilds/versions')[0];
    uploadsDir = path.join(domainRoot, 'persistent_uploads');
  }
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  return uploadsDir;
}

module.exports = { getUploadsDir };
