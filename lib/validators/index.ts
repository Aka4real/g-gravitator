import { z } from "zod";

export const clientInquirySchema = z.object({
  name: z.string().trim().min(2, "Name is required (min 2 chars)").max(120),
  email: z.string().trim().email("Enter a valid business email"),
  company: z.string().trim().max(140).optional().nullable(),
  tier: z.enum(["GRAVITY_AUDIT", "VELOCITY_MVP", "LAB_RETAINER", "CUSTOM"]),
  budget_range: z.string().trim().max(100).optional().nullable(),
  timeline: z.string().trim().max(100).optional().nullable(),
  project_brief: z
    .string()
    .trim()
    .min(15, "Provide a concise architectural or operational brief (min 15 chars)")
    .max(4000),
});

export const orbitApplicationSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(120),
  email: z.string().trim().email("Enter a valid email address"),
  track: z.enum(["AI_ENGINEERING", "FULLSTACK_SYSTEMS", "KINETIC_DESIGN"]),
  portfolio_url: z
    .string()
    .trim()
    .url("Provide a valid GitHub or portfolio URL (include https://)")
    .optional()
    .or(z.literal("")),
  proof_of_work: z
    .string()
    .trim()
    .min(10, "Describe or link the hardest system you have built")
    .max(2000),
});

export const newsletterSubscribeSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  source: z.string().trim().max(64).optional().default("journal"),
});

export const hackathonSubmitUrlSchema = z.object({
  url: z.string().trim().url("Provide a valid X (Twitter) post or hackathon URL"),
  raw_context: z.string().trim().max(2500).optional(),
  submitter_note: z.string().trim().max(500).optional(),
});

export const adminCurateSchema = z.discriminatedUnion("entity", [
  z.object({
    entity: z.literal("hackathon"),
    id: z.string().min(1),
    is_published: z.boolean().optional(),
    is_featured: z.boolean().optional(),
    oxakalabs_status: z
      .enum(["NONE", "SCOUTING", "SQUAD_DEPLOYED", "SUBMITTED", "WON"])
      .optional(),
  }),
  z.object({
    entity: z.literal("news"),
    id: z.string().min(1),
    is_pinned: z.boolean().optional(),
    is_published: z.boolean().optional(),
  }),
  z.object({
    entity: z.literal("inquiry"),
    id: z.string().min(1),
    status: z.enum(["NEW", "REVIEWED", "DISCOVERY_CALL", "CLOSED_WON", "ARCHIVED"]),
  }),
]);
