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

type ImportWarning = {
  row: number;
  reason: string;
  details?: string;
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
        {
          success: false,
          error: "No valid file provided",
        },
        { status: 400 }
      );
    }

    const fileName = uploadedFile.name;

    if (!/\.(xls|xlsx)$/i.test(fileName)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Unsupported file type. Please upload a Spectora .xls or .xlsx spreadsheet export.",
        },
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
        {
          success: false,
          error: "No worksheet found in Excel file",
        },
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
        {
          success: false,
          error: "The Excel file contains no data",
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 4. VALIDATE EXPECTED SPECTORA COLUMNS
    // --------------------------------------------------

    const firstRow = rows[0] as Record<string, unknown>;

    const hasSectionColumn =
      Object.prototype.hasOwnProperty.call(firstRow, "Section Name");

    const hasItemColumn =
      Object.prototype.hasOwnProperty.call(firstRow, "Item Name");

    if (!hasSectionColumn || !hasItemColumn) {
      return NextResponse.json(
        {
          success: false,
          error:
            'This spreadsheet does not look like a supported Spectora HTML-text export. Expected "Section Name" and "Item Name" columns.',
        },
        { status: 400 }
      );
    }

    // --------------------------------------------------
    // 5. TRACK SKIPPED / PARTIALLY SUPPORTED CONTENT
    // --------------------------------------------------

    const warnings: ImportWarning[] = [];

    rows.forEach((row, index) => {
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

      // +2 because spreadsheet row 1 contains headers.
      const spreadsheetRow = index + 2;

      if (!sectionName) {
        warnings.push({
          row: spreadsheetRow,
          reason: "Row skipped: missing Section Name",
        });

        return;
      }

      if (!itemName) {
        warnings.push({
          row: spreadsheetRow,
          reason: "Row skipped: missing Item Name",
        });

        return;
      }

      if (!commentText && !commentName) {
        warnings.push({
          row: spreadsheetRow,
          reason: "No comment content",
          details:
            "The section and item can still be imported, but this row contains neither Comment Text nor Comment Name.",
        });

        return;
      }

      /*
       * Our current comments table has one text_html field rather than
       * separate Comment Name and Comment Text fields.
       *
       * When both values exist, Comment Text is preserved as the editable
       * comment body. Comment Name is reported explicitly as unsupported
       * metadata instead of being silently discarded.
       */
      if (
        commentName &&
        commentText &&
        commentName !== commentText
      ) {
        warnings.push({
          row: spreadsheetRow,
          reason:
            "Comment Name is not stored as a separate field",
          details: `Comment Name: ${commentName}`,
        });
      }
    });

    // --------------------------------------------------
    // 6. CREATE TEMPLATE
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
      console.error(
        "Template insert error:",
        templateError
      );

      throw new Error(
        `Template insert failed: ${
          templateError?.message || "Unknown error"
        }`
      );
    }

    // --------------------------------------------------
    // 7. CREATE UNIQUE SECTIONS
    // --------------------------------------------------

    const sectionNames = Array.from(
      new Set(
        rows
          .map((row) =>
            String(row["Section Name"] || "").trim()
          )
          .filter(Boolean)
      )
    );

    const sectionIdMap = new Map<string, string>();

    for (
      let sectionIndex = 0;
      sectionIndex < sectionNames.length;
      sectionIndex++
    ) {
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
    // 8. CREATE UNIQUE ITEMS
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
    // 9. CREATE COMMENTS
    // --------------------------------------------------

    let commentCount = 0;
    const commentCounters =
      new Map<string, number>();

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
       * Preserve Comment Text when available.
       *
       * Some Spectora rows may only contain Comment Name.
       * In that case Comment Name becomes the stored content.
       *
       * When both exist, Comment Name is surfaced in the
       * warnings returned by this endpoint because our
       * current schema does not model it separately.
       */
      const textHtml = commentText || commentName;

      if (!textHtml) {
        continue;
      }

      const rawOrder = row["Order (w/i item)"];

      const parsedOrder =
        typeof rawOrder === "number"
          ? rawOrder
          : Number(rawOrder);

      const fallbackOrder =
        commentCounters.get(itemKey) ?? 0;

      const orderIndex =
        rawOrder !== "" &&
        rawOrder !== null &&
        rawOrder !== undefined &&
        Number.isFinite(parsedOrder)
          ? parsedOrder
          : fallbackOrder;

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
          `Comment "${
            commentName || commentText
          }" failed: ${commentError.message}`
        );
      }

      commentCounters.set(
        itemKey,
        fallbackOrder + 1
      );

      commentCount++;
    }

    // --------------------------------------------------
    // 10. SUCCESS
    // --------------------------------------------------

    return NextResponse.json({
      success: true,

      message:
        warnings.length > 0
          ? `Spectora template imported successfully with ${warnings.length} warning(s).`
          : "Spectora template imported successfully with no warnings.",

      template: {
        id: template.id,
        name: template.name,
      },

      imported: {
        sections: sectionNames.length,
        items: itemIdMap.size,
        comments: commentCount,
      },

      warnings: {
        count: warnings.length,
        rows: warnings,
      },

      limitations: [
        "The importer supports Spectora .xls/.xlsx HTML-text spreadsheet exports.",
        "Comment HTML is preserved in the comment text_html field.",
        "The current data model does not store Comment Name separately when Comment Text is also present.",
        "Unsupported or incomplete rows are reported as import warnings instead of being silently ignored.",
      ],
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