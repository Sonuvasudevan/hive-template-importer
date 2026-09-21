import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL is missing");
    }

    if (!supabaseKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
    }

    const supabase = createClient(
      supabaseUrl.trim(),
      supabaseKey.trim(),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data, error } = await supabase
      .from("templates")
      .select("id, name, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      templates: data ?? [],
    });
  } catch (err: unknown) {
    console.error("GET TEMPLATES ERROR:", err);

    const message =
      err instanceof Error ? err.message : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}