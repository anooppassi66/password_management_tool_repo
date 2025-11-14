import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { password_entry_id, assigned_to } = await req.json();

    const { data: passwordEntry, error: entryError } = await supabase
      .from("password_entries")
      .select("website_name, website_url")
      .eq("id", password_entry_id)
      .single();

    if (entryError) throw entryError;

    const { data: employees, error: employeeError } = await supabase
      .from("users")
      .select("email, name")
      .in("id", assigned_to);

    if (employeeError) throw employeeError;

    console.log(`Sending access notifications to ${employees.length} employees`);
    console.log(`Password entry: ${passwordEntry.website_name}`);
    console.log(`Recipients: ${employees.map(e => e.email).join(", ")}`);

    const { error: updateError } = await supabase
      .from("password_assignments")
      .update({ notification_sent: true })
      .eq("password_entry_id", password_entry_id)
      .in("assigned_to", assigned_to);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${employees.length} employees`,
        recipients: employees.map(e => e.email),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});