import { uploadBlobValidationFixture } from './lib/vercel-blob-validation';

try {
  const result = await uploadBlobValidationFixture({ env: process.env });
  if (result) console.log(JSON.stringify(result));
} catch (error) {
  console.error('Vercel Blob validation failed', { name: error instanceof Error ? error.name : 'UnknownError' });
  process.exit(1);
}
