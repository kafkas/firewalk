import * as fs from 'fs';
import * as path from 'path';

function main(): void {
  const docsPath = path.join(__dirname, '../docs');
  const templateFilePath = path.join(__dirname, 'docsIndexTemplate.md');

  function getReverseSortedVersions(): string[] {
    const versionNumRegex = /\d+(?:\.\d+)+$/;
    return fs
      .readdirSync(docsPath)
      .filter((dirName) => versionNumRegex.test(dirName))
      .sort((v1, v2) => v2.localeCompare(v1));
  }

  // Get dynamic content
  const versionList = getReverseSortedVersions()
    .map((version) => `- [${version}](./${version})\n`)
    .join('');
  const templateContent = fs.readFileSync(templateFilePath).toString();
  const content = `${templateContent}\n\n${versionList}`;

  // Write
  fs.writeFileSync(docsPath + '/index.md', content);
}

main();
