-- Create function to expire free trials that have passed their trial_end date
CREATE OR REPLACE FUNCTION expire_free_trials()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update users where trial has ended
  UPDATE public.users 
  SET 
    subscription_status = 'expired',
    trial_end = trial_end -- Keep the original trial_end for reference
  WHERE 
    subscription_plan = 'free_trial' 
    AND subscription_status = 'trialing'
    AND trial_end IS NOT NULL 
    AND trial_end < NOW();
    
  -- Log how many trials were expired (optional)
  RAISE NOTICE 'Expired % free trials', (
    SELECT COUNT(*) 
    FROM public.users 
    WHERE subscription_plan = 'free_trial' 
    AND subscription_status = 'expired'
    AND trial_end < NOW()
  );
END;
$$;
