-- Fix seed login passwords to "password123" (run in pgAdmin or psql on database lcims)
-- Use after lcims_schema.sql was loaded with old invalid bcrypt hashes.

UPDATE users SET password_hash = '$2b$10$t5Md69UkSFukmB7lzkyQ9OVOQvNi5KsTv.QGpFuw748udaeu1uM3W'
WHERE email = 'manager@dailygrind.com';

UPDATE users SET password_hash = '$2b$10$M45tCZbgxUhYKxO3fFJRz.0baMVCawxKHEnv5aV1TBG3aR/fDLb1m'
WHERE email = 'staff@dailygrind.com';

UPDATE users SET password_hash = '$2b$10$UeE6zBqz1S/skKEuahWi9.dVxsHtwq/s3UPZT.6h1GXQmq0Gbgbm2'
WHERE email = 'admin@lcims.com';
