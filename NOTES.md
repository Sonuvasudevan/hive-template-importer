# Hive Inspect — Spectora Template Importer

## What I Built

I built a web application that imports a Spectora HTML-text spreadsheet export and converts it into structured, editable template data.

The application allows a user to:

- Upload a Spectora `.xls` or `.xlsx` export.
- Preserve the template hierarchy of sections, items, and comments.
- Preserve the ordering of imported template content.
- View imported templates.
- Edit section names, item names, and comment text.
- Save changes to the database.
- Duplicate a template.
- Edit the duplicated template independently without changing the original.
- Retrieve saved templates after reopening the application.
- See visible warnings when exported information is present but is not fully represented by the current data model.
- See clear errors when an invalid spreadsheet cannot be imported.

## Sample Input

I used the **InterNACHI Residential** template from Spectora.

The template was exported from Spectora using:

**Export to spreadsheet → Export HTML Text**

The sample file used for development and testing is included in:

`sample/InterNACHI Residential -2026-09-20.xls`

No real customer information is included in the sample.

## Supported Input

The importer accepts Spectora spreadsheet exports in:

- `.xls`
- `.xlsx`

The importer is designed for Spectora's **HTML-text spreadsheet export format** rather than the plain-text export.

The importer reads the spreadsheet structure and maps supported Spectora content into templates, sections, items, and comments instead of storing the entire spreadsheet as one opaque HTML document.

The importer validates the spreadsheet structure before importing it. Invalid or unreadable spreadsheet input is rejected with a visible error.

## Data Model

The imported template is stored as structured data rather than as one large HTML document.

The main hierarchy is:

**Template → Sections → Items → Comments**

Ordering information is stored with the imported records so the original template sequence can be maintained.

This structure allows individual parts of the imported template to be edited and saved independently.

**Supabase** is used as the persistent backend.

The database schema used by the project is included in:

`supabase/schema.sql`

## Import Mapping and Preservation

The importer maps the Spectora spreadsheet into the structured database hierarchy.

For the included InterNACHI Residential sample, the imported result contains:

- 13 sections
- 69 items
- 392 comments

Section and item ordering is preserved using the order in which the records appear in the spreadsheet.

Comment ordering uses Spectora's comment order information when available.

Comment HTML/text is stored in the `text_html` field.

The importer also distinguishes between content that can be stored directly and information that is present in the spreadsheet but is not represented separately by the current schema.

For example, when both `Comment Name` and `Comment Text` are present, the current comment model stores the comment text but does not have a separate `Comment Name` field.

Instead of silently hiding this limitation, the importer reports the affected spreadsheet rows as visible import warnings. The warning details include the unsupported `Comment Name` value so the information remains visible to the user.

For the included InterNACHI Residential sample, the application currently reports 309 such import warnings.

The warning list is collapsed by default to keep the interface readable and can be expanded to inspect individual affected rows and values.

## How I Checked My Work

I tested the complete workflow using the included InterNACHI Residential Spectora export.

I verified that:

- The spreadsheet can be imported successfully.
- The imported template contains 13 sections.
- The imported template contains 69 items.
- The imported template contains 392 comments.
- Unsupported information is reported through visible import warnings.
- Warning details identify the affected spreadsheet rows and unsupported values.
- Imported sections, items, and comments are displayed.
- Edits can be saved and retrieved.
- Saved data remains available after reopening the application.
- A template can be duplicated.
- The duplicated template can be edited independently.
- Editing the copy does not modify the original.
- Data remains stored in the Supabase backend.
- An invalid `.xlsx` file is rejected with a visible error message instead of being imported.
- The application builds successfully using `npm run build`.
- The final application works from the deployed Vercel production URL.

For the independent-copy test, I edited a comment in the original template and then created a duplicate. I changed the corresponding comment in the duplicate to **"COPY INDEPENDENCE TEST"** and verified that the original retained its own value.

I also tested the duplicate API directly and received a successful HTTP 200 response.

For failure-case testing, I attempted to import an invalid `.xlsx` file containing no valid spreadsheet data. The application rejected the import and displayed a clear error message:

**"The Excel file contains no data."**

No invalid template was created.

## Missing vs Unsupported Information

There is an important difference between information that is **missing from the Spectora export** and information that is **present in the export but not fully supported by this application**.

### Missing from the export

If information is not included in the Spectora HTML-text spreadsheet export, the importer cannot reconstruct or invent that information.

The application only works with information actually available in the uploaded export.

### Present but not fully supported

Information may be present in the spreadsheet but not have a dedicated field in the current application data model.

For example, `Comment Name` may be present alongside `Comment Text`. The current schema does not store `Comment Name` as a separate comment property when comment text is also present.

The application treats this as **unsupported information rather than missing information**.

Affected rows and values are therefore exposed through visible import warnings instead of being silently ignored.

Some exported fields can also contain rich HTML or formatting. The importer preserves supported HTML/text content in `text_html`, but the current editor does not attempt to recreate every rich-text formatting feature available in Spectora.

Invalid or unreadable spreadsheet input is rejected with a visible error rather than being silently accepted.

## Known Limitations

The project focuses on the required template-import and editing workflow rather than recreating the complete Spectora or Hive Inspect product.

The current data model does not store `Comment Name` separately when `Comment Text` is also present. These values are surfaced through visible import warnings.

Rich HTML contained inside exported fields may be preserved as imported content rather than being fully converted into a visual rich-text editing experience.

The importer is intended for Spectora HTML-text spreadsheet exports with the expected Spectora column structure. Other spreadsheet structures or unrelated Excel files are not guaranteed to import correctly.

The editor focuses on section names, item names, and comment text rather than providing a complete rich-text template editing experience.

The application currently uses a simple take-home/demo access model without implementing a complete user authentication and authorization system.

A production application would require appropriate Supabase Row Level Security policies and user-level access controls.

## What I Left Out and Why

I deliberately focused on faithful importing, structured storage, editing, persistence, independent template copies, transparent unsupported-content handling, and clear import failure handling.

Features such as inspection report creation, scheduling, payments, homeowner portals, and other inspection-management functionality were not implemented because they are outside the scope of this assignment.

I also kept the editor focused on the core workflow instead of attempting to reproduce every feature of a full inspection-template editor within the available development time.

Full rich-text editing was intentionally left out. The application preserves supported imported content while keeping the editing interface simple and focused on the required fields.

A complete production authentication and authorization system was also left out because this project is a take-home demonstration focused on the importer and editor workflow.

## Meaningful Improvement

After completing the core import, edit, persistence, and duplication workflow, I focused on making import behavior more transparent to the user.

The importer now distinguishes between successful imports, unsupported information, and invalid input.

When information is present in the spreadsheet but is not represented separately by the current data model, the application reports visible import warnings rather than silently hiding the limitation.

The warning details show the affected spreadsheet row and unsupported value. The warnings are collapsed by default so a large number of warnings does not overwhelm the interface.

When an uploaded spreadsheet cannot be read or does not contain the required structure, the application rejects the import and displays a clear error instead of silently creating an incomplete template.

This improvement makes it easier for a user to understand exactly what was imported, what was not fully supported, and why.

## Hive Inspect Trial

As part of understanding the product workflow, I also created a sample inspection in Hive Inspect, attached a residential template, and published a sample report.

This helped me understand how templates connect to the broader inspection and report workflow and provided context for keeping this take-home implementation focused on template importing and editing.

## Tools and Credits

The application was built using:

- Next.js
- TypeScript
- Supabase
- Vercel

The project started from a standard `create-next-app` project.

AI coding tools were used during development to help understand requirements, generate and refine implementation ideas, troubleshoot issues, and review the solution.

I reviewed and tested the resulting implementation and verified the main import, edit, persistence, duplication, unsupported-content, and failure-case workflows.

## Approximate Time Spent

Approximately two focused days were spent exploring the products, understanding the Spectora export structure, implementing the importer and editor, testing persistence and duplication, handling unsupported content and failure cases, documenting limitations, and preparing the project for submission.