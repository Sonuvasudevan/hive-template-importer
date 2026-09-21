# Hive Inspect — Spectora Template Importer & Editor

A web application for importing Spectora HTML-text spreadsheet templates, editing their structured content, and creating independent template copies.

## Features

- Import Spectora `.xls` and `.xlsx` HTML-text spreadsheet exports
- Preserve template sections, items, comments, and ordering
- Edit section names, item names, and comment text
- Save changes to a persistent backend
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

The sample export is included in:

`sample/InterNACHI Residential -2026-09-20.xls`

## Local Setup

Clone the repository and install the dependencies:

```bash
npm install