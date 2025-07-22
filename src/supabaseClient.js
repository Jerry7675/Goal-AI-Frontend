import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://qlausgvgohcylohrwnpn.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsYXVzZ3Znb2hjeWxvaHJ3bnBuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MDU0OTcsImV4cCI6MjA2NzE4MTQ5N30.wtHv8TCQN-nI9vgSMJhc8dtkwZz5AH6RaRSnpztPDSk";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
