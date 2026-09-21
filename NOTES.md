# Hive Inspect — Spectora Template Importer

## What I Built

I built a web application that imports a Spectora HTML-text spreadsheet export and converts it into structured, editable template data.

The application allows a user to:

- Upload a Spectora `.xls` or `.xlsx` export.
- Preserve the template hierarchy of sections, items, and comments.
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

The importer is designed for Spectora's HTML-text spreadsheet export format rather than the plain-text export.

## Data Model

The imported template is stored as structured data rather than as one large HTML document.

The main hierarchy is:

**Template → Sections → Items → Comments**

This allows individual parts of the imported template to be edited and saved independently.

Supabase is used as the persistent backend.

## How I Checked My Work

I tested the complete workflow using the included InterNACHI Residential Spectora export.

I verified that:

- The spreadsheet can be imported successfully.
- Imported sections, items, and comments are displayed.
- Edits can be saved and retrieved.
- A template can be duplicated.
- The duplicated template can be edited independently.
- Editing the copy does not modify the original.
- Data remains stored in the Supabase backend.
- An invalid `.xlsx` file is rejected with a visible error message instead of being imported.

I also tested the duplicate API directly and received a successful HTTP 200 response.

For failure-case testing, I attempted to import an invalid `.xlsx` file containing no valid spreadsheet data. The application rejected the import and displayed a clear error message:

**"The Excel file contains no data."**

No invalid template was created.

## Known Limitations

The project focuses on the required template-import and editing workflow rather than recreating the complete Spectora or Hive Inspect product.

Rich HTML contained inside exported fields may be preserved as imported content rather than being fully converted into a visual rich-text editing experience.

The importer is intended for Spectora HTML-text spreadsheet exports. Other spreadsheet structures or unrelated Excel files are not guaranteed to import correctly.

The editor focuses on section names, item names, and comment text rather than providing a complete rich-text template editing experience.

## What I Left Out and Why

I deliberately focused on faithful importing, editing, persistence, and independent template copies.

Features such as inspection report creation, scheduling, payments, homeowner portals, and other inspection-management functionality were not implemented because they are outside the scope of this assignment.

I also kept the editor focused on the core workflow instead of attempting to reproduce every feature of a full inspection-template editor within the available development time.

## Tools and Credits

The application was built using Next.js and Supabase and started from a standard `create-next-app` project.

AI coding tools were used during development to help understand requirements, generate and refine implementation ideas, troubleshoot issues, and review the solution.

I reviewed and tested the resulting implementation and verified the main import, edit, persistence, duplication, and failure-case workflows.

## Approximate Time Spent

Approximately two focused days were spent exploring the products, understanding the Spectora export structure, implementing the importer and editor, testing persistence and duplication, handling failure cases, and preparing the project for submission.