// Set env vars before any test imports the app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.MAGIC_LINK_SECRET = 'test-magic-secret';
