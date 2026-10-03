import {
  allowMethods,
  csvCell,
  formatJakartaDate,
  listRecords,
  noStore,
  requireAdmin,
} from './_lib/store.js';

export default async function handler(req, res){
  noStore(res);

  if(!allowMethods(req, res, ['GET'])) return;
  if(!requireAdmin(req, res)) return;

  try{
    const records = await listRecords('wishes');

    const rows = [
      ['No', 'Nama', 'Ucapan / Doa', 'Tanggal'],
      ...records.map((item, index) => [
        index + 1,
        item.name,
        item.text,
        formatJakartaDate(item.createdAt),
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(','))
      .join('\r\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="doa-ucapan.csv"');

    return res.status(200).send('\uFEFF' + csv);
  }catch(error){
    console.error('Export wishes error:', error);
    return res.status(500).json({ message: 'Export ucapan gagal.' });
  }
}
