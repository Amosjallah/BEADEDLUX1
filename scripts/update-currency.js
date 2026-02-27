import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndUpdateCurrency() {
    console.log('Checking store_settings...');
    const { data: settings, error: settingsError } = await supabase.from('store_settings').select('*');
    if (settingsError) {
        console.error('Error fetching store_settings:', settingsError.message);
    } else {
        console.log('Current store_settings:', JSON.stringify(settings, null, 2));

        // Update currency to USD if it exists
        for (const setting of settings || []) {
            const updates: any = {};
            let needsUpdate = false;

            if (setting.currency && setting.currency !== 'USD') {
                updates.currency = 'USD';
                needsUpdate = true;
            }
            if (setting.currency_symbol && setting.currency_symbol !== '$') {
                updates.currency_symbol = '$';
                needsUpdate = true;
            }

            if (needsUpdate) {
                console.log(`Updating setting ${setting.id}...`);
                const { error: updateError } = await supabase.from('store_settings').update(updates).eq('id', setting.id);
                if (updateError) {
                    console.error(`Error updating setting ${setting.id}:`, updateError.message);
                } else {
                    console.log(`Successfully updated setting ${setting.id}`);
                }
            }
        }
    }
}

checkAndUpdateCurrency();
