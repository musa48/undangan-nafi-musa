import {
  allowMethods,
  listRecords,
  noStore,
  parseJsonBody,
  sanitizeRsvp,
  saveRecord,
} from './_lib/store.js';

export default async function handler(req, res){
  noStore(res);

  if(!allowMethods(req, res, ['GET', 'POST'])) return;

  try{
    if(req.method === 'GET'){
      const data = await listRecords('rsvp');
      return res.status(200).json({ data });
    }

    const input = await parseJsonBody(req);
    const payload = sanitizeRsvp(input);
    const data = await saveRecord('rsvp', payload);

    return res.status(201).json({ data });
  }catch(error){
    console.error('RSVP API error:', error);

    const status = /wajib|valid/i.test(error.message || '') ? 400 : 500;
    return res.status(status).json({
      message: status === 400
        ? error.message
        : 'Daftar kehadiran belum dapat diproses.',
    });
  }
}
