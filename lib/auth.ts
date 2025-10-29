import { SignJWT, jwtVerify } from 'jose';

const secretKey = process.env.STACK_SECRET_SERVER_KEY;
const key = new TextEncoder().encode(secretKey);
const COOKIE_NAME = 'session';

if (!secretKey) {
  throw new Error('STACK_SECRET_SERVER_KEY environment variable is not set.');
}

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(key);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

export async function getSession(req: any) {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;
    
    // Find the specific cookie from the cookie header string
    const sessionCookie = cookieHeader.split('; ').find(c => c.startsWith(`${COOKIE_NAME}=`));
    if (!sessionCookie) return null;
    
    const session = sessionCookie.split('=')[1];
    return await decrypt(session);
}

// Middleware to protect API routes
export function withAuth(handler: (req: any, res: any) => Promise<void>) {
  return async (req: any, res: any) => {
    const session = await getSession(req);
    if (!session) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    req.user = session; // Attach user to the request object
    return handler(req, res);
  };
}