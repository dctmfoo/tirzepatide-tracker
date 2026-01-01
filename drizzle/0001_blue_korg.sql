CREATE INDEX "activity_logs_daily_log_id_idx" ON "activity_logs" USING btree ("daily_log_id");--> statement-breakpoint
CREATE INDEX "diet_logs_daily_log_id_idx" ON "diet_logs" USING btree ("daily_log_id");--> statement-breakpoint
CREATE INDEX "mental_logs_daily_log_id_idx" ON "mental_logs" USING btree ("daily_log_id");