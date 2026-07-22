require('dotenv').config({ path: '.env.local' });

async function createStorageBucket() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // List existing buckets
  const listRes = await fetch(`${url}/storage/v1/bucket`, {
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
  });
  const buckets = await listRes.json();

  const existing = buckets.find(b => b.name === 'materials');
  if (existing) {
    console.log('Bucket "materials" already exists');
    return;
  }

  // Create bucket
  const createRes = await fetch(`${url}/storage/v1/bucket`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'apikey': key,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: 'materials',
      name: 'materials',
      public: true,
      fileSizeLimit: 52428800,
      allowedMimeTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/x-rar-compressed',
        'application/vnd.rar',
        'application/zip',
        'application/x-zip-compressed',
        'image/jpeg',
        'image/png',
        'image/gif',
        'video/mp4',
        'video/quicktime',
      ],
    }),
  });

  const result = await createRes.json();
  if (createRes.ok) {
    console.log('Bucket "materials" created successfully!');
  } else {
    console.error('Error:', result);
  }
}

createStorageBucket();
