# Hive Inspect — Spectora Template Importer & Editor

A web application for importing Spectora HTML-text spreadsheet templates, editing their structured content, and creating independent template copies.

## Features

- Import Spectora `.xls` and `.xlsx` HTML-text spreadsheet exports
- Preserve template sections, items, comments, and ordering
- Edit section names, item names, and comment text
- Save changes to a persistent Supabase backend
- Duplicate templates independently
- Preserve the original when a duplicated template is edited
- Display clear errors when an invalid spreadsheet cannot be imported

## Tech Stack

- Next.js
- TypeScript
- Supabase
- Vercel

## Sample Template

The sample used for development and testing is the **InterNACHI Residential** template exported from Spectora using:

**Export to spreadsheet → Export HTML Text**

The sample export is included at:

`sample/InterNACHI Residential -2026-09-20.xls`

## Local Setup

Clone the repository and install dependencies:

```bash
npm install
```

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Use the values from your own Supabase project.

Do not commit `.env.local` or real credentials to the repository.

## Database Initialization

Create a Supabase project and open the **SQL Editor**.

Run:

`supabase/schema.sql`

This creates the structured database used by the application:

`templates -> sections -> items -> comments`

The tables use UUID primary keys and foreign-key relationships with cascading deletes.

## Run Locally

Start the development server:

```bash
npm run dev
```

Then open:

`http://localhost:3000`

## Testing

The application was checked by:

- Importing the included InterNACHI Residential Spectora export
- Editing imported template content and confirming the changes persist
- Duplicating a template and editing the copy independently
- Confirming the original template remains unchanged
- Refreshing/reopening the application and confirming saved templates remain
- Attempting to import an invalid `.xlsx` file and confirming a visible error is shown and no invalid template is created

## Known Limitations

- The importer is designed for Spectora HTML-text spreadsheet exports with the expected Spectora column structure.
- HTML contained inside individual comment fields is preserved in `text_html`; it is not converted into a full rich-text editing system.
- Unsupported or malformed spreadsheet structures may result in an import error rather than being silently accepted.
