import { z } from "zod/v4";

export const createRetrospectiveSchema = z.object({
  templateId: z.string(),
  periodType: z.enum(["daily", "weekly", "yearly"]),
  inputMode: z.enum(["wizard", "coach"]).default("wizard"),
  dateStart: z.coerce.date(),
  dateEnd: z.coerce.date(),
  context: z.string().optional(),
});

export const updateRetrospectiveSchema = z.object({
  context: z.string().optional(),
  summary: z.string().optional(),
  status: z.enum(["draft", "completed"]).optional(),
});

export const saveBlocksSchema = z.object({
  blocks: z.array(
    z.object({
      sectionKey: z.string(),
      type: z.string().default("text"),
      contentJson: z.unknown(),
      order: z.number(),
    })
  ),
});

export const createActionItemSchema = z.object({
  title: z.string().min(1),
  dueDate: z.coerce.date().optional(),
  frequency: z.enum(["once", "daily", "weekly"]).default("once"),
  successCriteria: z.string().optional(),
});

export const updateActionItemSchema = z.object({
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
  note: z.string().optional(),
});

export const createShareLinkSchema = z.object({
  retrospectiveId: z.string(),
  scope: z.enum(["full", "summary", "actions"]).default("full"),
  expiresInDays: z.number().optional(), // 7, 30, or undefined for no expiry
});

export type CreateRetrospective = z.infer<typeof createRetrospectiveSchema>;
export type UpdateRetrospective = z.infer<typeof updateRetrospectiveSchema>;
export type SaveBlocks = z.infer<typeof saveBlocksSchema>;
export type CreateActionItem = z.infer<typeof createActionItemSchema>;
export type UpdateActionItem = z.infer<typeof updateActionItemSchema>;
export type CreateShareLink = z.infer<typeof createShareLinkSchema>;
