SELECT id, email, role, full_name, username 
FROM profiles 
WHERE username ILIKE '%miguel%' OR email ILIKE '%miguel%';
