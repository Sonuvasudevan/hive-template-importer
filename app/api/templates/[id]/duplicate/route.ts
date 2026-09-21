import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // --------------------------------------------------
    // SUPABASE CONNECTION
    // --------------------------------------------------

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

    // --------------------------------------------------
    // 1. GET ORIGINAL TEMPLATE
    // --------------------------------------------------

    const { data: originalTemplate, error: templateError } =
      await supabase
        .from("templates")
        .select("id, name")
        .eq("id", id)
        .single();

    if (templateError || !originalTemplate) {
      return NextResponse.json(
        {
          success: false,
          error: templateError?.message || "Template not found",
        },
        { status: 404 }
      );
    }

    // --------------------------------------------------
    // 2. CREATE NEW TEMPLATE
    // --------------------------------------------------

    const duplicateName = `${originalTemplate.name} - Copy`;

    const { data: newTemplate, error: newTemplateError } =
      await supabase
        .from("templates")
        .insert({
          name: duplicateName,
        })
        .select("id, name, created_at, updated_at")
        .single();

    if (newTemplateError || !newTemplate) {
      throw new Error(
        newTemplateError?.message ||
          "Could not create duplicate template"
      );
    }

    // --------------------------------------------------
    // 3. GET ORIGINAL SECTIONS
    // --------------------------------------------------

    const { data: originalSections, error: sectionsError } =
      await supabase
        .from("sections")
        .select("id, name, order_index")
        .eq("template_id", id)
        .order("order_index", { ascending: true });

    if (sectionsError) {
      throw new Error(sectionsError.message);
    }

    // --------------------------------------------------
    // 4. COPY EACH SECTION
    // --------------------------------------------------

    for (const section of originalSections || []) {
      const { data: newSection, error: newSectionError } =
        await supabase
          .from("sections")
          .insert({
            template_id: newTemplate.id,
            name: section.name,
            order_index: section.order_index,
          })
          .select("id")
          .single();

      if (newSectionError || !newSection) {
        throw new Error(
          newSectionError?.message ||
            "Could not duplicate section"
        );
      }

      // --------------------------------------------------
      // 5. GET ITEMS FROM ORIGINAL SECTION
      // --------------------------------------------------

      const { data: originalItems, error: itemsError } =
        await supabase
          .from("items")
          .select("id, name, order_index")
          .eq("section_id", section.id)
          .order("order_index", { ascending: true });

      if (itemsError) {
        throw new Error(itemsError.message);
      }

      // --------------------------------------------------
      // 6. COPY EACH ITEM
      // --------------------------------------------------

      for (const item of originalItems || []) {
        const { data: newItem, error: newItemError } =
          await supabase
            .from("items")
            .insert({
              section_id: newSection.id,
              name: item.name,
              order_index: item.order_index,
            })
            .select("id")
            .single();

        if (newItemError || !newItem) {
          throw new Error(
            newItemError?.message ||
              "Could not duplicate item"
          );
        }

        // --------------------------------------------------
        // 7. GET COMMENTS FROM ORIGINAL ITEM
        // --------------------------------------------------

        const { data: originalComments, error: commentsError } =
          await supabase
            .from("comments")
            .select(
              "id, text_html, category, order_index"
            )
            .eq("item_id", item.id)
            .order("order_index", { ascending: true });

        if (commentsError) {
          throw new Error(commentsError.message);
        }

        // --------------------------------------------------
        // 8. COPY COMMENTS
        // --------------------------------------------------

        if (
          originalComments &&
          originalComments.length > 0
        ) {
          const commentsToInsert = originalComments.map(
            (comment) => ({
              item_id: newItem.id,
              text_html: comment.text_html,
              category: comment.category,
              order_index: comment.order_index,
            })
          );

          const { error: insertCommentsError } =
            await supabase
              .from("comments")
              .insert(commentsToInsert);

          if (insertCommentsError) {
            throw new Error(insertCommentsError.message);
          }
        }
      }
    }

    // --------------------------------------------------
    // SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Template duplicated successfully",
      template: newTemplate,
    });
  } catch (err: unknown) {
    console.error("DUPLICATE TEMPLATE ERROR:", err);

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