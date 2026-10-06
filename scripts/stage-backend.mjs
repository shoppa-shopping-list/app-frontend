import { cp, access } from 'node:fs/promises';
const dist = new URL('../dist/', import.meta.url);
const destination = new URL('../../app-backend/public/', import.meta.url);
await access(new URL('index.html', dist));
await cp(dist, destination, { recursive: true });
