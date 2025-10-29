import { sql } from '@vercel/postgres';
import { encrypt, decrypt } from '../lib/crypto';

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { rows } = await sql`SELECT telegram_chat_id, telegram_bot_token_encrypted, telegram_notification_level FROM Settings WHERE id = 1;`;

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Settings not found.' });
      }

      const settings = rows[0];
      const botToken = settings.telegram_bot_token_encrypted 
        ? decrypt(settings.telegram_bot_token_encrypted)
        : null;

      res.status(200).json({
        chatId: settings.telegram_chat_id,
        botToken: botToken,
        notificationLevel: settings.telegram_notification_level,
      });

    } else if (req.method === 'POST') {
      const { chatId, botToken, notificationLevel } = req.body;
      
      if (!chatId || !botToken || !notificationLevel) {
        return res.status(400).json({ message: 'Missing required settings fields.' });
      }

      const encryptedToken = encrypt(botToken);

      await sql`
        UPDATE Settings
        SET telegram_chat_id = ${chatId},
            telegram_bot_token_encrypted = ${encryptedToken},
            telegram_notification_level = ${notificationLevel}
        WHERE id = 1;
      `;
      res.status(200).json({ message: 'Settings saved successfully.' });

    } else {
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('Settings API Error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}