ALTER TABLE campaigns ADD COLUMN board TEXT;
--> statement-breakpoint
ALTER TABLE campaigns ADD COLUMN rivals TEXT;
--> statement-breakpoint
ALTER TABLE campaigns ADD COLUMN log TEXT;
--> statement-breakpoint
ALTER TABLE campaigns ADD COLUMN status TEXT NOT NULL DEFAULT 'lobby';
--> statement-breakpoint
ALTER TABLE campaigns ADD COLUMN round INTEGER NOT NULL DEFAULT 1;
