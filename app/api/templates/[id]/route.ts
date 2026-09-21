import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// --------------------------------------------------
// CREATE SUPABASE CLIENT
// --------------------------------------------------

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is missing");
  }

  if (!supabaseKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return createClient(
    supabaseUrl.trim(),
    supabaseKey.trim(),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

// ==================================================
// GET ONE TEMPLATE
// ==================================================

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getSupabase();

    // --------------------------------------------------
    // 1. GET TEMPLATE
    // --------------------------------------------------

    const { data: template, error: templateError } =
      await supabase
        .from("templates")
        .select("id, name, created_at, updated_at")
        .eq("id", id)
        .single();

    if (templateError || !template) {
      return NextResponse.json(
        {
          success: false,
          error:
            templateError?.message ||
            "Template not found",
        },
        {
          status: 404,
        }
      );
    }

    // --------------------------------------------------
    // 2. GET SECTIONS
    // --------------------------------------------------

    const { data: sections, error: sectionsError } =
      await supabase
        .from("sections")
        .select(
          "id, template_id, name, order_index"
        )
        .eq("template_id", id)
        .order("order_index", {
          ascending: true,
        });

    if (sectionsError) {
      throw new Error(sectionsError.message);
    }

    const sectionIds = (sections || []).map(
      (section) => section.id
    );

    // --------------------------------------------------
    // 3. GET ITEMS
    // --------------------------------------------------

    let items: any[] = [];

    if (sectionIds.length > 0) {
      const { data, error } = await supabase
        .from("items")
        .select(
          "id, section_id, name, order_index"
        )
        .in("section_id", sectionIds)
        .order("order_index", {
          ascending: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      items = data || [];
    }

    const itemIds = items.map(
      (item) => item.id
    );

    // --------------------------------------------------
    // 4. GET COMMENTS
    // --------------------------------------------------

    let comments: any[] = [];

    if (itemIds.length > 0) {
      const { data, error } = await supabase
        .from("comments")
        .select(
          "id, item_id, text_html, category, order_index"
        )
        .in("item_id", itemIds)
        .order("order_index", {
          ascending: true,
        });

      if (error) {
        throw new Error(error.message);
      }

      comments = data || [];
    }

    // --------------------------------------------------
    // 5. BUILD NESTED STRUCTURE
    // --------------------------------------------------

    const nestedSections = (sections || []).map(
      (section) => ({
        ...section,

        items: items
          .filter(
            (item) =>
              item.section_id === section.id
          )
          .map((item) => ({
            ...item,

            comments: comments.filter(
              (comment) =>
                comment.item_id === item.id
            ),
          })),
      })
    );

    // --------------------------------------------------
    // 6. RETURN TEMPLATE
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      template: {
        ...template,
        sections: nestedSections,
      },
    });
  } catch (err: unknown) {
    console.error(
      "GET TEMPLATE ERROR:",
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}

// ==================================================
// UPDATE / SAVE TEMPLATE
// ==================================================

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();

    const supabase = getSupabase();

    // --------------------------------------------------
    // 1. UPDATE TEMPLATE NAME
    // --------------------------------------------------

    if (body.name !== undefined) {
      const templateName = String(
        body.name
      ).trim();

      if (!templateName) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Template name cannot be empty",
          },
          {
            status: 400,
          }
        );
      }

      const { error: templateError } =
        await supabase
          .from("templates")
          .update({
            name: templateName,
          })
          .eq("id", id);

      if (templateError) {
        throw new Error(
          `Template update failed: ${templateError.message}`
        );
      }
    }

    // --------------------------------------------------
    // 2. UPDATE SECTIONS
    // --------------------------------------------------

    for (const section of body.sections || []) {
      if (!section.id) {
        continue;
      }

      const { error: sectionError } =
        await supabase
          .from("sections")
          .update({
            name: String(
              section.name || ""
            ).trim(),
          })
          .eq("id", section.id)
          .eq("template_id", id);

      if (sectionError) {
        throw new Error(
          `Section update failed: ${sectionError.message}`
        );
      }

      // ------------------------------------------------
      // 3. UPDATE ITEMS
      // ------------------------------------------------

      for (const item of section.items || []) {
        if (!item.id) {
          continue;
        }

        const { error: itemError } =
          await supabase
            .from("items")
            .update({
              name: String(
                item.name || ""
              ).trim(),
            })
            .eq("id", item.id)
            .eq(
              "section_id",
              section.id
            );

        if (itemError) {
          throw new Error(
            `Item update failed: ${itemError.message}`
          );
        }

        // ----------------------------------------------
        // 4. UPDATE COMMENTS
        // ----------------------------------------------

        for (
          const comment of
          item.comments || []
        ) {
          if (!comment.id) {
            continue;
          }

          const commentText = String(
            comment.text_html || ""
          );

          const commentCategory =
            comment.category
              ? String(
                  comment.category
                ).trim()
              : null;

          const {
            error: commentError,
          } = await supabase
            .from("comments")
            .update({
              text_html: commentText,
              category:
                commentCategory,
            })
            .eq("id", comment.id)
            .eq("item_id", item.id);

          if (commentError) {
            throw new Error(
              `Comment update failed: ${commentError.message}`
            );
          }
        }
      }
    }

    // --------------------------------------------------
    // 5. SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message:
        "Template saved successfully",
    });
  } catch (err: unknown) {
    console.error(
      "UPDATE TEMPLATE ERROR:",
      err
    );

    const message =
      err instanceof Error
        ? err.message
        : "Internal server error";

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: 500,
      }
    );
  }
}