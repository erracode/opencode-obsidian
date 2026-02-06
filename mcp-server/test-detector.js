const { ContentDetector } = require('./dist/core/detector.js');

const detector = new ContentDetector();

const content = `# CKC_API_GATEWAY_REST
git tag -a v2.8.5 -m "fix general"
git push --tags`;

console.log('Testing content:');
console.log(content);
console.log('\n---\n');

const detected = detector.analyze(content);

console.log('Detected:');
console.log('- gitTags:', detected.gitTags);
console.log('- gitTags.length:', detected.gitTags.length);
console.log('- azureIds:', detected.azureIds);
console.log('- repositories:', detected.repositories);
