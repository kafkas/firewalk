import * as fs from 'fs';
import * as path from 'path';

(() => {
  const docsPath = path.join(__dirname, '../docs');
  const versionNumRegex = /\d+(?:\.\d+)+$/;
  const versions = fs
    .readdirSync(docsPath)
    .filter((dirName) => versionNumRegex.test(dirName))
    .sort((v1, v2) => v2.localeCompare(v1));
  const versionList = versions
    .map((version) => {
      return `### [${version}](./${version})\n`;
    })
    .join('');
  const content = `
# Firecode

## Versions

${versionList}
  `;
  fs.writeFileSync(docsPath + '/index.md', content);
})();
