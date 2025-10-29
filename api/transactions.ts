import { sql } from '@vercel/postgres';
import { NextApiRequest, NextApiResponse } from 'next';
import type { WatchedTransaction } from '../types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT txid as id, status, confirmations, "blockHeight" 
        FROM WatchedTransactions 
        ORDER BY added_at DESC;
      `;
      res.status(200).json(rows);

    } else if (req.method === 'POST') {
      const { id, status, confirmations, blockHeight } = req.body as WatchedTransaction;
      if (!id || typeof status === 'undefined' || typeof confirmations === 'undefined') {
        return res.status(400).json({ message: 'Missing required transaction fields.' });
      }

      await sql`
        INSERT INTO WatchedTransactions (txid, status, confirmations, "blockHeight")
        VALUES (${id}, ${status}, ${confirmations}, ${blockHeight})
        ON CONFLICT (txid) DO UPDATE SET
          status = EXCLUDED.status,
          confirmations = EXCLUDED.confirmations,
          "blockHeight" = EXCLUDED."blockHeight";
      `;
      res.status(201).json({ message: 'Transaction added or updated successfully.' });

    } else if (req.method === 'DELETE') {
        const { txid } = req.query;
        if (!txid || typeof txid !== 'string') {
            return res.status(400).json({ message: 'Transaction ID is required.' });
        }

        await sql`DELETE FROM WatchedTransactions WHERE txid = ${txid};`;
        res.status(200).json({ message: 'Transaction removed successfully.' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
