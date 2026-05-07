-- Remove seed students from both public and auth schemas
-- 1. Get the IDs of users linked to students
DO $$
DECLARE
    student_user_ids UUID[];
BEGIN
    SELECT array_agg(id) INTO student_user_ids FROM public.users WHERE role = 'student';

    -- 2. Delete from public.students (this will cascade to public.users)
    DELETE FROM public.students;

    -- 3. Delete from auth.users (this will clean up the auth system)
    -- We use the collected IDs to ensure we only delete student accounts
    IF student_user_ids IS NOT NULL THEN
        DELETE FROM auth.users WHERE id = ANY(student_user_ids);
    END IF;
    
    -- Also delete any remaining students in auth that might not be in public.users
    DELETE FROM auth.users WHERE email LIKE '%@forge.local';
END $$;
