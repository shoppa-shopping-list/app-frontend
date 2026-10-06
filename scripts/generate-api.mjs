import { readFile, writeFile } from 'node:fs/promises';
import { generateEndpoints } from '@rtk-query/codegen-openapi';
import prettier from 'prettier';

const target = new URL('../src/shared/api/generated.ts', import.meta.url);
const schema = new URL('../openapi.json', import.meta.url);
if (process.argv.includes('--sync')) {
  await writeFile(
    schema,
    await readFile(new URL('../../app-backend/openapi.json', import.meta.url)),
  );
}
const output = await generateEndpoints({
  schemaFile: schema.pathname,
  apiFile: './baseApi',
  apiImport: 'baseApi',
  hooks: true,
  filterEndpoints: (name) => !['getApiEvents', 'postApiSession'].includes(name),
});
if (typeof output !== 'string') throw new Error('OpenAPI generator returned no source');
const formatted = await prettier.format(
  output.replaceAll(
    '/** status 204 Default Response */ any',
    '/** status 204 Default Response */ void',
  ),
  {
    ...(await prettier.resolveConfig(target.pathname)),
    parser: 'typescript',
  },
);
if (process.argv.includes('--check')) {
  if ((await readFile(target, 'utf8')) !== formatted) {
    throw new Error('API types are stale. Run npm run api:generate.');
  }
} else {
  await writeFile(target, formatted);
}
