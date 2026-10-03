import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { put, list, get } from '@vercel/blob';

const ROOT = process.cwd();
const LOCAL_DATA_DIR = path.join(ROOT, '.data');

function useBlobStorage(){
  return process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview';
}

function assertCollection(collection){
  if(!['rsvp', 'wishes'].includes(collection)){
    throw new Error('Collection tidak valid.');
  }
}

function cleanText(value, maxLength){
  return String(value ?? '').trim().slice(0, maxLength);
}

async function readBlobJson(pathname){
  const result = await get(pathname, {
    access: 'private',
    useCache: false,
  });

  if(!result) return null;

  const text = await new Response(result.stream).text();
  return JSON.parse(text);
}

async function listBlobRecords(collection){
  const records = [];
  let cursor;

  do{
    const result = await list({
      prefix: `${collection}/`,
      cursor,
    });

    for(const blob of result.blobs){
      try{
        const record = await readBlobJson(blob.pathname);
        if(record) records.push(record);
      }catch(error){
        console.error(`Gagal membaca ${blob.pathname}:`, error);
      }
    }

    cursor = result.hasMore ? result.cursor : undefined;
  }while(cursor);

  return records;
}

async function listLocalRecords(collection){
  const dir = path.join(LOCAL_DATA_DIR, collection);

  try{
    const names = await fs.readdir(dir);
    const jsonFiles = names.filter((name) => name.endsWith('.json'));

    const records = await Promise.all(
      jsonFiles.map(async (name) => {
        try{
          const raw = await fs.readFile(path.join(dir, name), 'utf8');
          return JSON.parse(raw);
        }catch(error){
          console.error(`Gagal membaca ${collection}/${name}:`, error);
          return null;
        }
      })
    );

    return records.filter(Boolean);
  }catch(error){
    if(error.code === 'ENOENT') return [];
    throw error;
  }
}

export async function listRecords(collection){
  assertCollection(collection);

  const records = useBlobStorage()
    ? await listBlobRecords(collection)
    : await listLocalRecords(collection);

  return records.sort((a, b) => {
    return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
  });
}

export async function saveRecord(collection, payload){
  assertCollection(collection);

  const createdAt = new Date().toISOString();
  const id = randomUUID();

  const record = {
    id,
    ...payload,
    createdAt,
  };

  const safeTime = createdAt.replace(/[:.]/g, '-');
  const filename = `${safeTime}-${id}.json`;
  const pathname = `${collection}/${filename}`;
  const body = JSON.stringify(record, null, 2);

  if(useBlobStorage()){
    await put(pathname, body, {
      access: 'private',
      contentType: 'application/json; charset=utf-8',
    });
  }else{
    const dir = path.join(LOCAL_DATA_DIR, collection);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), body, 'utf8');
  }

  return record;
}

export function sanitizeRsvp(input){
  const allowedStatus = new Set(['Hadir', 'Tidak Hadir', 'Ragu']);
  const name = cleanText(input?.name, 120);
  const status = allowedStatus.has(input?.status) ? input.status : 'Ragu';

  let count = Number.parseInt(input?.count, 10);
  if(!Number.isFinite(count)) count = 1;
  count = Math.min(Math.max(count, 1), 10);

  const msg = cleanText(input?.msg, 1000);

  if(!name){
    throw new Error('Nama wajib diisi.');
  }

  return { name, status, count, msg };
}

export function sanitizeWish(input){
  const name = cleanText(input?.name, 120);
  const text = cleanText(input?.text, 1500);

  if(!name){
    throw new Error('Nama wajib diisi.');
  }

  if(!text){
    throw new Error('Ucapan wajib diisi.');
  }

  return { name, text };
}

export async function parseJsonBody(req){
  if(req.body && typeof req.body === 'object'){
    return req.body;
  }

  if(typeof req.body === 'string' && req.body){
    return JSON.parse(req.body);
  }

  const chunks = [];
  for await(const chunk of req){
    chunks.push(Buffer.from(chunk));
  }

  if(!chunks.length) return {};

  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

export function allowMethods(req, res, methods){
  if(methods.includes(req.method)) return true;

  res.setHeader('Allow', methods.join(', '));
  res.status(405).json({ message: 'Method tidak diizinkan.' });
  return false;
}

export function noStore(res){
  res.setHeader('Cache-Control', 'no-store, max-age=0');
}

export function requireAdmin(req, res){
  const expected = process.env.ADMIN_EXPORT_KEY;

  if(!expected){
    res.status(500).json({
      message: 'ADMIN_EXPORT_KEY belum dikonfigurasi.',
    });
    return false;
  }

  const headerKey = req.headers['x-admin-key'];
  const queryKey = req.query?.key;
  const provided = Array.isArray(headerKey) ? headerKey[0] : (headerKey || queryKey);

  if(provided !== expected){
    res.status(401).json({ message: 'Unauthorized.' });
    return false;
  }

  return true;
}

export function csvCell(value){
  const text = String(value ?? '').replace(/\r?\n/g, ' ');
  return `"${text.replace(/"/g, '""')}"`;
}

export function formatJakartaDate(value){
  if(!value) return '';

  try{
    return new Intl.DateTimeFormat('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date(value));
  }catch{
    return String(value);
  }
}
