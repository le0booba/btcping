
import { getSession } from '../../lib/auth';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const session = await getSession(req);
    if (session) {
      res.status(200).json(session);
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  } catch (error) {
    console.error('Session fetch error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
