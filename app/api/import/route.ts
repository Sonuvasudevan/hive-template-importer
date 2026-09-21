import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as XLSX from "xlsx";

export const runtime = "nodejs";

type SpectoraRow = {
  "Section Name"?: string;
  "Item Name"?: string;
  "Comment Name"?: string;
  "Comment Text"?: string;
  "Comment Type (info, limit, defect)"?: string;
  "Order (w/i item)"?: number | string;
};

export async function POST(request: Request) {
  try {
    // --------------------------------------------------
    // 1. CHECK SUPABASE ENVIRONMENT VARIABLES
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
    // 2. GET UPLOADED FILE
    // --------------------------------------------------

    const formData = await request.formData();
    const uploadedFile = formData.get("file");

    if (!(uploadedFile instanceof File)) {
      return NextResponse.json(
        { error: "No valid file provided" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 3. READ EXCEL FILE
    // --------------------------------------------------

    const arrayBuffer = await uploadedFile.arrayBuffer();

    const workbook = XLSX.read(arrayBuffer, {
      type: "array",
    });

    const sheetName = workbook.SheetNames[0];

    if (!sheetName) {
      return NextResponse.json(
        { error: "No worksheet found in Excel file" },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json<SpectoraRow>(worksheet, {
      defval: "",
      raw: false,
    });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "The Excel file contains no data" },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. CREATE TEMPLATE
    // --------------------------------------------------

    const templateName = uploadedFile.name.replace(
      /\.(xlsx|xls)$/i,
      ""
    );

    const { data: template, error: templateError } =
      await supabase
        .from("templates")
        .insert({
          name: templateName,
        })
        .select("id, name")
        .single();

    if (templateError || !template) {
      console.error("Template insert error:", templateError);

      throw new Error(
        `Template insert failed: ${
          templateError?.message || "Unknown error"
        }`
      );
    }

    // --------------------------------------------------
    // 5. CREATE UNIQUE SECTIONS
    // --------------------------------------------------

    const sectionNames = Array.from(
      new Set(
        rows
          .map((row) => String(row["Section Name"] || "").trim())
          .filter(Boolean)
      )
    );

    const sectionIdMap = new Map<string, string>();

    for (let sectionIndex = 0; sectionIndex < sectionNames.length; sectionIndex++) {
      const sectionName = sectionNames[sectionIndex];

      const { data: section, error: sectionError } =
        await supabase
          .from("sections")
          .insert({
            template_id: template.id,
            name: sectionName,
            order_index: sectionIndex,
          })
          .select("id")
          .single();

      if (sectionError || !section) {
        throw new Error(
          `Section "${sectionName}" failed: ${
            sectionError?.message || "Unknown error"
          }`
        );
      }

      sectionIdMap.set(sectionName, section.id);
    }

    // --------------------------------------------------
    // 6. CREATE UNIQUE ITEMS
    // --------------------------------------------------

    const itemIdMap = new Map<string, string>();
    const itemCounters = new Map<string, number>();

    for (const row of rows) {
      const sectionName = String(
        row["Section Name"] || ""
      ).trim();

      const itemName = String(
        row["Item Name"] || ""
      ).trim();

      if (!sectionName || !itemName) {
        continue;
      }

      const sectionId = sectionIdMap.get(sectionName);

      if (!sectionId) {
        continue;
      }

      const itemKey = `${sectionName}|||${itemName}`;

      // Already created
      if (itemIdMap.has(itemKey)) {
        continue;
      }

      const currentItemIndex =
        itemCounters.get(sectionName) ?? 0;

      const { data: item, error: itemError } =
        await supabase
          .from("items")
          .insert({
            section_id: sectionId,
            name: itemName,
            order_index: currentItemIndex,
          })
          .select("id")
          .single();

      if (itemError || !item) {
        throw new Error(
          `Item "${itemName}" failed: ${
            itemError?.message || "Unknown error"
          }`
        );
      }

      itemIdMap.set(itemKey, item.id);

      itemCounters.set(
        sectionName,
        currentItemIndex + 1
      );
    }

    // --------------------------------------------------
    // 7. CREATE COMMENTS
    // --------------------------------------------------

    let commentCount = 0;

    for (const row of rows) {
      const sectionName = String(
        row["Section Name"] || ""
      ).trim();

      const itemName = String(
        row["Item Name"] || ""
      ).trim();

      const commentName = String(
        row["Comment Name"] || ""
      ).trim();

      const commentText = String(
        row["Comment Text"] || ""
      ).trim();

      const commentType = String(
        row["Comment Type (info, limit, defect)"] || ""
      ).trim();

      if (!sectionName || !itemName) {
        continue;
      }

      const itemKey = `${sectionName}|||${itemName}`;
      const itemId = itemIdMap.get(itemKey);

      if (!itemId) {
        continue;
      }

      /*
       * Your comments table has:
       *
       * item_id
       * text_html
       * category
       * order_index
       *
       * There is NO separate "Comment Name" column.
       *
       * Therefore:
       * - If Comment Text exists, save that.
       * - Otherwise save Comment Name.
       */

      const textHtml =
        commentText || commentName;

      if (!textHtml) {
        continue;
      }

      const rawOrder =
        row["Order (w/i item)"];

      const parsedOrder =
        typeof rawOrder === "number"
          ? rawOrder
          : Number(rawOrder);

      const orderIndex =
        Number.isFinite(parsedOrder)
          ? parsedOrder
          : commentCount;

      const { error: commentError } =
        await supabase
          .from("comments")
          .insert({
            item_id: itemId,
            text_html: textHtml,
            category: commentType || null,
            order_index: orderIndex,
          });

      if (commentError) {
        throw new Error(
          `Comment "${commentName}" failed: ${commentError.message}`
        );
      }

      commentCount++;
    }

    // --------------------------------------------------
    // 8. SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,
      message: "Spectora template imported successfully",
      template: {
        id: template.id,
        name: template.name,
      },
      imported: {
        sections: sectionNames.length,
        items: itemIdMap.size,
        comments: commentCount,
      },
    });
  } catch (err: unknown) {
    console.error("IMPORT ERROR:", err);

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