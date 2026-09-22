# Hive Inspect — Spectora Template Importer & Editor

A web application for importing Spectora HTML-text spreadsheet templates, editing their structured content, and creating independent template copies.

## Features

- Import Spectora `.xls` and `.xlsx` HTML-text spreadsheet exports
- Preserve template sections, items, comments, and ordering
- Edit section names, item names, and comment text
- Save changes to a persistent Supabase backend
- Duplicate templates independently
- Preserve the original when a duplicated template is edited
- Report unsupported or incomplete spreadsheet content as visible import warnings
- Display clear errors when an invalid spreadsheet cannot be imported

## Tech Stack

- Next.js
- TypeScript
- Supabase
- Vercel

## Sample Template

The sample used for development and testing is the **InterNACHI Residential** template.

It was exported from Spectora using:

**Export to spreadsheet → Export HTML Text**

The sample export is committed to this repository at:

`sample/InterNACHI Residential -2026-09-20.xls`

No real customer information is included in the sample.

## Local Setup

Clone the repository and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root.

The application uses Supabase environment variables. Configure:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Use values from your own Supabase project.

`SUPABASE_SERVICE_ROLE_KEY` is server-side only. Never expose it through a `NEXT_PUBLIC_` variable.

Do not commit `.env.local` or real credentials to the repository.

## Database Initialization

Create a Supabase project and open the **SQL Editor**.

Run the SQL contained in:

`supabase/schema.sql`

This creates the structured database used by the application:

`templates → sections → items → comments`

The application stores imported template content as structured records rather than one opaque HTML document.

The tables use UUID primary keys and foreign-key relationships with cascading deletes.

## Run Locally

Start the development server:

```bash
npm run dev
```

Then open:

`http://localhost:3000`

## Import Behavior

The importer expects Spectora `.xls` or `.xlsx` HTML-text spreadsheet exports with the expected Spectora columns.

For the included InterNACHI Residential sample, the importer creates:

- 13 sections
- 69 items
- 392 comments

When information cannot be represented separately by the current data model, the importer reports it as an **import warning instead of silently dropping it**.

Warning details can be expanded in the UI so the affected spreadsheet row and unsupported information remain visible.

For example, the current schema stores comment text but does not have a separate field for `Comment Name` when both `Comment Name` and `Comment Text` are present. Those values are therefore reported visibly as import warnings.

## Testing

The application was checked by:

- Importing the included InterNACHI Residential Spectora export
- Confirming the expected section, item, and comment counts
- Reviewing visible import warnings for unsupported information
- Editing imported template content and confirming the changes persist
- Duplicating a template and editing the copy independently
- Confirming the original template remains unchanged
- Refreshing/reopening the application and confirming saved templates remain
- Attempting to import an invalid `.xlsx` file and confirming a visible error is shown and no invalid template is created
- Running a production build with `npm run build`
- Testing the deployed Vercel application against the persistent Supabase backend

## Known Limitations

- The importer is designed for Spectora HTML-text spreadsheet exports with the expected Spectora column structure.
- HTML contained inside individual comment fields is preserved in `text_html`; it is not converted into a full rich-text editing system.
- The current schema does not store `Comment Name` separately when `Comment Text` is also present. The importer exposes these values through visible warnings rather than silently hiding the limitation.
- Unsupported or malformed spreadsheet structures may result in an import error.
- The project is a take-home/demo implementation and does not include a production authentication or authorization model.

## Deployment

The application is deployed on Vercel:

`https://hive-importer-app.vercel.app`

The deployed application uses Supabase for persistent storage.

## Additional Notes

See `NOTES.md` for implementation decisions, supported input, limitations, testing details, trade-offs, and development notes.