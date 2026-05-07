-- Clear seed activity data but keep users and students
TRUNCATE public.attendance, public.materials, public.sessions, public.import_log RESTART IDENTITY CASCADE;
