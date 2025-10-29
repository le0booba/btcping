import { sql } from '@vercel/postgres';

export default async function handler(req: any, res: any) {
  // POST request handles setting the notification level and doesn't depend on env vars
  if (req.method === 'POST') {
    try {
      const { notificationLevel } = req.body;

      if (!notificationLevel || !['first', 'first_two', 'all'].includes(notificationLevel)) {
        return res.status(400).json({ message: 'Invalid notification level provided.' });
      }

      // Ensure table exists before inserting
      await sql`
        CREATE TABLE IF NOT EXISTS AppSettings (
            key VARCHAR(255) PRIMARY KEY,
            value VARCHAR(255) NOT NULL
        );
      `;
      
      await sql`
        INSERT INTO AppSettings (key, value)
        VALUES ('notificationLevel', ${notificationLevel})
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `;

      return res.status(200).json({ message: 'Settings updated successfully.' });
    } catch (error) {
      console.error('API Settings POST Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }

  if (req.method === 'GET') {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;

    // Core Telegram settings must be configured via environment variables for GET to succeed
    if (!chatId || !botToken) {
      return res.status(404).json({ message: 'Telegram settings are not configured in environment variables.' });
    }

    try {
      let notificationLevel = 'first'; // Default value
      try {
        const { rows } = await sql`
            SELECT value FROM AppSettings WHERE key = 'notificationLevel' LIMIT 1;
        `;
        if (rows.length > 0) {
            notificationLevel = rows[0].value;
        }
      } catch (e: any) {
          // If table doesn't exist, we just proceed with the default value.
          // The POST handler will create the table when settings are first saved.
          if (!e.message.includes('relation "appsettings" does not exist')) {
              throw e; // Re-throw other errors
          }
      }
      
      return res.status(200).json({
        chatId,
        botToken,
        notificationLevel,
      });

    } catch (error) {
      console.error('API Settings GET Error:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  
  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
