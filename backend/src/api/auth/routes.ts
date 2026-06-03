import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';
import { config } from '../../config/index.js';
import { query } from '../../db/index.js';

interface AuthUser {
  id: string;
  email: string;
  password: string;
  role: string;
  name: string;
}

const router = Router();

const isProduction = config.nodeEnv === 'production';
const cookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
};

const jwtSecret = config.jwt.secret as string;
const jwtExpire: StringValue = config.jwt.expiresIn as unknown as StringValue;
const jwtSignOptions: SignOptions = {
  expiresIn: jwtExpire
};

function createJwtToken(user: AuthUser) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role }, jwtSecret, jwtSignOptions);
}

function sanitizeUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name
  };
}

router.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_REQUEST',
        message: 'Email and password are required.'
      }
    });
  }

  const result = await query<AuthUser>(
    'SELECT id, email, password, role, name FROM users WHERE LOWER(email) = LOWER($1)',
    [String(email)]
  );
  const user = result.rows[0];

  if (!user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid email or password.'
      }
    });
  }

  const isPasswordValid = await bcrypt.compare(String(password), user.password);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_FAILED',
        message: 'Invalid email or password.'
      }
    });
  }

  // Future integration point: WebAuthn / Passkeys would be checked here in addition to password auth.
  const token = createJwtToken(user);

  res.cookie('token', token, cookieOptions);

  return res.json({
    success: true,
    data: {
      user: sanitizeUser(user)
    }
  });
});

router.get('/me', async (req: Request, res: Response) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.'
      }
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret) as JwtPayload & {
      id: string;
      email: string;
      role: string;
    };

    const result = await query<AuthUser>(
      'SELECT id, email, password, role, name FROM users WHERE id = $1',
      [payload.id]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required.'
        }
      });
    }

    return res.json({
      success: true,
      data: {
        user: sanitizeUser(user)
      }
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.'
      }
    });
  }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token', cookieOptions);

  return res.json({
    success: true,
    data: {
      message: 'Logged out successfully.'
    }
  });
});

router.post('/magic-link', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      message: 'Magic link sent to email'
    }
  });
});

router.post('/verify-token', (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      token: 'jwt-token-here',
      user: {
        id: 'user-id',
        email: 'user@example.com',
        name: 'User Name'
      }
    }
  });
});

export default router;
