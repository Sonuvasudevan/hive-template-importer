create table public.templates (
  id uuid not null default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint templates_pkey primary key (id)
);

create table public.sections (
  id uuid not null default gen_random_uuid(),
  template_id uuid not null,
  name text not null,
  order_index integer not null,
  created_at timestamp with time zone null default now(),
  constraint sections_pkey primary key (id),
  constraint sections_template_id_fkey foreign key (template_id)
    references public.templates (id) on delete cascade
);

create table public.items (
  id uuid not null default gen_random_uuid(),
  section_id uuid not null,
  name text not null,
  order_index integer not null,
  created_at timestamp with time zone null default now(),
  constraint items_pkey primary key (id),
  constraint items_section_id_fkey foreign key (section_id)
    references public.sections (id) on delete cascade
);

create table public.comments (
  id uuid not null default gen_random_uuid(),
  item_id uuid not null,
  text_html text not null,
  category text null,
  order_index integer not null,
  created_at timestamp with time zone null default now(),
  constraint comments_pkey primary key (id),
  constraint comments_item_id_fkey foreign key (item_id)
    references public.items (id) on delete cascade
);
