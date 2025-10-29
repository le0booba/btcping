
import { encrypt } from '../../lib/auth';
import { serialize } from 'cookie';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // In a real app, you'd verify user credentials here
    const user = { email };
    
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const session = await encrypt({ user, expires });

    const cookie = serialize('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      expires,
      path: '/',
      sameSite: 'lax',
    });
    
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ message: 'Signed in successfully' });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}
