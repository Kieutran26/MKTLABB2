-- SQL Function to increment plan_creation_count
-- And check if it's within the limit before incrementing
CREATE OR REPLACE FUNCTION public.increment_plan_count(user_uuid UUID)
RETURNS VOID AS $$
DECLARE
    current_count INT;
    current_limit INT;
BEGIN
    SELECT plan_creation_count, plan_limit 
    INTO current_count, current_limit
    FROM public.user_quotas
    WHERE user_id = user_uuid;

    IF current_count < current_limit THEN
        UPDATE public.user_quotas
        SET plan_creation_count = plan_creation_count + 1,
            updated_at = now()
        WHERE user_id = user_uuid;
    ELSE
        RAISE EXCEPTION 'QUOTA_EXCEEDED: You have reached your monthly creation limit.';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
