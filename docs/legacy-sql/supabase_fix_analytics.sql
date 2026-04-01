-- Add unique metrics columns
ALTER TABLE campaign_analytics 
ADD COLUMN IF NOT EXISTS unique_opened INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicked INTEGER DEFAULT 0;

-- Simple function to recalculate analytics from events
CREATE OR REPLACE FUNCTION recalculate_campaign_analytics(campaign_uuid TEXT)
RETURNS void AS $$
DECLARE
    sent_count INTEGER;
    unique_open_count INTEGER;
    unique_click_count INTEGER;
    total_open_count INTEGER;
    total_click_count INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(DISTINCT subscriber_id) INTO sent_count
    FROM email_events WHERE campaign_id = campaign_uuid AND event_type = 'sent';

    SELECT COUNT(DISTINCT subscriber_id) INTO unique_open_count
    FROM email_events WHERE campaign_id = campaign_uuid AND event_type = 'opened';
    
    SELECT COUNT(*) INTO total_open_count
    FROM email_events WHERE campaign_id = campaign_uuid AND event_type = 'opened';

    SELECT COUNT(DISTINCT subscriber_id) INTO unique_click_count
    FROM email_events WHERE campaign_id = campaign_uuid AND event_type = 'clicked';
    
    SELECT COUNT(*) INTO total_click_count
    FROM email_events WHERE campaign_id = campaign_uuid AND event_type = 'clicked';

    -- Upsert analytics
    INSERT INTO campaign_analytics (
        campaign_id, 
        total_sent, -- Note: total_sent might be tracked separately in campaign table, but here we can approx
        unique_opened, 
        total_opened,
        unique_clicked,
        total_clicked,
        open_rate,
        click_rate,
        updated_at
    )
    VALUES (
        campaign_uuid,
        GREATEST(sent_count, 1), -- Avoid div by zero
        unique_open_count,
        total_open_count,
        unique_click_count,
        total_click_count,
        ROUND((unique_open_count::DECIMAL / GREATEST(sent_count, 1)) * 100, 2),
        ROUND((unique_click_count::DECIMAL / GREATEST(sent_count, 1)) * 100, 2),
        NOW()
    )
    ON CONFLICT (campaign_id) DO UPDATE SET
        unique_opened = EXCLUDED.unique_opened,
        total_opened = EXCLUDED.total_opened,
        unique_clicked = EXCLUDED.unique_clicked,
        total_clicked = EXCLUDED.total_clicked,
        open_rate = EXCLUDED.open_rate,
        click_rate = EXCLUDED.click_rate,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
