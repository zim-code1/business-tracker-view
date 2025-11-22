import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://foxzgclyezyfqhmjbyfq.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZveHpnY2x5ZXp5ZnFobWpieWZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3OTA4NDYsImV4cCI6MjA3OTM2Njg0Nn0.1urhXdAwzlkR-oxplu-J8u2NzEiZBSji_2fQLz7bQ8k'

export const supabase = createClient(supabaseUrl, supabaseKey)