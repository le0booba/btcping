
import { sql } from '@vercel/postgres';
import type { WatchedTransaction } from '../types';
import { withAuth } from '../lib/auth';

async function handler(req: any, res: any) {
  const { user } = req; // Injected by withAuth middleware
  
  try {
    // Ensure table exists with the new user_email column
    await sql`
      CREATE TABLE IF NOT EXISTS WatchedTransactions (
        txid VARCHAR(64) NOT NULL,
        user_email TEXT NOT NULL,
        status VARCHAR(20) NOT NULL,
        confirmations INTEGER NOT NULL,
        block_height INTEGER,
        added_at TIMESTAMPTZ DEFAULT NOW(),
        PRIMARY KEY (txid, user_email)
      );
    `;

    if (req.method === 'GET') {
      const { rows } = await sql`
        SELECT txid as id, status, confirmations, block_height 
        FROM WatchedTransactions 
        WHERE user_email = ${user.email}
        ORDER BY added_at DESC;
      `;
      res.status(200).json(rows);

    } else if (req.method === 'POST') {
      const { id, status, confirmations, block_height } = req.body as WatchedTransaction;
      if (!id || typeof status === 'undefined' || typeof confirmations === 'undefined') {
        return res.status(400).json({ message: 'Missing required transaction fields.' });
      }

      await sql`
        INSERT INTO WatchedTransactions (txid, user_email, status, confirmations, block_height)
        VALUES (${id}, ${user.email}, ${status}, ${confirmations}, ${block_height})
        ON CONFLICT (txid, user_email) DO UPDATE SET
          status = EXCLUDED.status,
          confirmations = EXCLUDED.confirmations,
          block_height = EXCLUDED.block_height;
      `;
      res.status(201).json({ message: 'Transaction added or updated successfully.' });

    } else if (req.method === 'DELETE') {
        const { txid } = req.query;
        if (!txid || typeof txid !== 'string') {
            return res.status(400).json({ message: 'Transaction ID is required.' });
        }

        await sql`
          DELETE FROM WatchedTransactions 
          WHERE txid = ${txid} AND user_email = ${user.email};
        `;
        res.status(200).json({ message: 'Transaction removed successfully.' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error)
 {
    console.error('API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

export default withAuth(handler);
