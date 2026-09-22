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

## Data Model

The imported template is stored as structured data rather than as one large HTML document.

The main hierarchy is:

**Template → Sections → Items → Comments**

Ordering information is stored with the imported records so the original template sequence can be maintained.

This structure allows individual parts of the imported template to be edited and saved independently.

**Supabase** is used as the persistent backend.

The database schema used by the project is included in:

`supabase/schema.sql`

## How I Checked My Work

I tested the complete workflow using the included InterNACHI Residential Spectora export.

I verified that:

- The spreadsheet can be imported successfully.
- Imported sections, items, and comments are displayed.
- The imported template contains 13 sections.
- Edits can be saved and retrieved.
- Saved data remains available after reopening the application.
- A template can be duplicated.
- The duplicated template can be edited independently.
- Editing the copy does not modify the original.
- Data remains stored in the Supabase backend.
- An invalid `.xlsx` file is rejected with a visible error message instead of being imported.

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

Some exported fields can contain rich HTML or formatting. The importer may preserve this content as imported text/HTML, but the current editor does not attempt to recreate every rich-text formatting feature available in Spectora.

This is treated as an importer/editor limitation rather than assuming that the information was missing from the original export.

Invalid or unreadable spreadsheet input is rejected with a visible error rather than being silently accepted.

## Known Limitations

The project focuses on the required template-import and editing workflow rather than recreating the complete Spectora or Hive Inspect product.

Rich HTML contained inside exported fields may be preserved as imported content rather than being fully converted into a visual rich-text editing experience.

The importer is intended for Spectora HTML-text spreadsheet exports. Other spreadsheet structures or unrelated Excel files are not guaranteed to import correctly.

The editor focuses on section names, item names, and comment text rather than providing a complete rich-text template editing experience.

The application currently uses a simple take-home/demo access model without implementing a complete user authentication and authorization system. A production application would require appropriate Supabase Row Level Security policies and user-level access controls.

## What I Left Out and Why

I deliberately focused on faithful importing, editing, persistence, independent template copies, and clear import failure handling.

Features such as inspection report creation, scheduling, payments, homeowner portals, and other inspection-management functionality were not implemented because they are outside the scope of this assignment.

I also kept the editor focused on the core workflow instead of attempting to reproduce every feature of a full inspection-template editor within the available development time.

Full rich-text editing was intentionally left out. The application preserves the imported content while keeping the editing interface simple and focused on the required fields.

## Meaningful Improvement

After completing the core workflow, I focused on making import failures clear to the user.

Instead of silently creating an incomplete template when the uploaded spreadsheet cannot be read, the application rejects invalid input and displays a visible error message.

This makes the import process easier to understand and helps prevent invalid template data from being stored in the backend.

## Tools and Credits

The application was built using:

- Next.js
- TypeScript
- Supabase
- Vercel

The project started from a standard `create-next-app` project.

AI coding tools were used during development to help understand requirements, generate and refine implementation ideas, troubleshoot issues, and review the solution.

I reviewed and tested the resulting implementation and verified the main import, edit, persistence, duplication, and failure-case workflows.

## Approximate Time Spent

Approximately two focused days were spent exploring the products, understanding the Spectora export structure, implementing the importer and editor, testing persistence and duplication, handling failure cases, documenting limitations, and preparing the project for submission.