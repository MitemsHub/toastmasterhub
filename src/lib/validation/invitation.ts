import { z } from "zod";

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;

export const invitationSchema = z.object({
  meetingTitle: z.string().trim().min(3).max(160),
  meetingDate: z.string().regex(isoDatePattern, "Meeting date must use YYYY-MM-DD format."),
  meetingNote: z.string().trim().max(500).optional().default(""),
});

export type InvitationInput = z.infer<typeof invitationSchema>;
