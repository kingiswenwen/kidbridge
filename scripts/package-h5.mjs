import { copyFile, rename } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
await rename(new URL('dist/build/h5/index.html', root), new URL('dist/build/h5/learning.html', root));
await copyFile(new URL('navigation.html', root), new URL('dist/build/h5/index.html', root));
console.log('Packaged navigation homepage and interactive learning entry.');
