import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { password_entry_id } = await req.json();

    const { data: assignment, error: assignmentError } = await supabase
      .from("password_assignments")
      .select("*")
      .eq("password_entry_id", password_entry_id)
      .eq("assigned_to", user.id)
      .maybeSingle();

    if (assignmentError || !assignment) {
      throw new Error("You don't have access to this password entry");
    }

    const { data: passwordEntry, error: entryError } = await supabase
      .from("password_entries")
      .select("*")
      .eq("id", password_entry_id)
      .single();

    if (entryError) throw entryError;

    if (!passwordEntry.otp_required) {
      throw new Error("OTP not required for this entry");
    }

    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    const { data: otpRequest, error: otpError } = await supabase
      .from("otp_requests")
      .insert({
        password_entry_id,
        requested_by: user.id,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        is_used: false,
      })
      .select()
      .single();

    if (otpError) throw otpError;

    console.log(`OTP generated for user ${user.id}: ${otpCode}`);
    console.log(`Expires at: ${expiresAt.toISOString()}`);

    return new Response(
      JSON.stringify({
        success: true,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        message: "OTP generated successfully",
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