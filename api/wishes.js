import {
  allowMethods,
  listRecords,
  noStore,
  parseJsonBody,
  sanitizeWish,
  saveRecord,
} from './_lib/store.js';

export default async function handler(req, res){
  noStore(res);

  if(!allowMethods(req, res, ['GET', 'POST'])) return;

  try{
    if(req.method === 'GET'){
      const data = await listRecords('wishes');
      return res.status(200).json({ data });
    }

    const input = await parseJsonBody(req);
    const payload = sanitizeWish(input);
    const data = await saveRecord('wishes', payload);

    return res.status(201).json({ data });
  }catch(error){
    console.error('Wishes API error:', error);

    const status = /wajib|valid/i.test(error.message || '') ? 400 : 500;
    return res.status(status).json({
      message: status === 400
        ? error.message
        : 'Ucapan belum dapat diproses.',
    });
  }
}
