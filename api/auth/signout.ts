
import { serialize } from 'cookie';

export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const cookie = serialize('session', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        expires: new Date(0), // Set to a past date to expire immediately
        path: '/',
    });
    
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ message: 'Signed out successfully' });
}
