-- Update admin users with simple passwords for current authentication system
UPDATE admin_users SET password_hash = '123' WHERE username = 'eva';
UPDATE admin_users SET password_hash = '123' WHERE username = 'sajna';
UPDATE admin_users SET password_hash = '9054' WHERE username = 'binu';

-- Also ensure all users are active
UPDATE admin_users SET is_active = true;