-- Add optional description column to samples (nullable, can stay empty)
alter table samples add column if not exists description text;
