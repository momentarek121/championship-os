import { z } from "zod";
import { nanoid } from "nanoid";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, bracketProcedure, publicProcedure, refereeProcedure, registrationProcedure, router, staffProcedure, weighInProcedure } from "./_core/trpc";
import { canUpdateRegistrationFields } from "@shared/registrationPermissions";
import { createAthleteRegistration, createManualMatch, createPublicRegistration, createTournament, finishMatch, generateAutomaticBrackets, getAthletePortal, getClubs, getPublicParticipants, getTournamentBySlug, getTournamentDashboard, seedDemoTournament, updateMatchSlots, updateMatchStatus, updateRegistrationStatus, updateTournamentSettings, updateTournamentWeighIn, updateUserRole } from "./db";

const tournamentInput = z.object({
  name: z.string().min(2),
  sport: z.string().min(2),
  location: z.string().optional(),
  ruleset: z.string().default("IBJJF Standard"),
  organizationName: z.string().min(2).default("Championship OS"),
  weighInMode: z.enum(["ibjjf", "custom"]).default("ibjjf"),
  weighInTolerance: z.string().regex(/^\\d+(\\.\\d{1,2})?$/).default("0.00"),
});

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  publicRegistration: router({
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getTournamentBySlug(input.slug)),
    participants: publicProcedure.input(z.object({ slug: z.string() })).query(({ input }) => getPublicParticipants(input.slug)),
    athletePortal: publicProcedure.input(z.object({ slug: z.string(), accreditationCode: z.string().min(3) })).query(({ input }) => getAthletePortal(input.slug, input.accreditationCode)),
    submit: publicProcedure.input(z.object({
      slug: z.string().min(3), fullName: z.string().min(2), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), dateOfBirth: z.string().min(1), gender: z.enum(["male", "female"]), belt: z.string().min(2), expectedWeight: z.number().positive(),
    })).mutation(async ({ input }) => {
      const tournament = await getTournamentBySlug(input.slug);
      if (!tournament) throw new Error("Tournament registration link not found");
      return createPublicRegistration({ ...input, tournamentId: tournament.id, expectedWeight: input.expectedWeight.toFixed(2) });
    }),
  }),
  users: router({
    updateRole: adminProcedure.input(z.object({ userId: z.number(), role: z.enum(["user", "admin", "organizer", "registration_staff", "weighin_staff", "referee", "mat_manager", "athlete"]) })).mutation(({ input, ctx }) => updateUserRole({ ...input, actorUserId: ctx.user.id })),
  }),
  tournament: router({
    dashboard: staffProcedure.query(() => getTournamentDashboard()),
    clubs: adminProcedure.query(() => getClubs()),
    create: adminProcedure.input(tournamentInput).mutation(({ input, ctx }) => createTournament({ ...input, registrationSlug: nanoid(10).toLowerCase(), createdBy: ctx.user.id })),
    seedDemo: adminProcedure.mutation(({ ctx }) => seedDemoTournament(ctx.user.id)),
    registerAthlete: registrationProcedure.input(z.object({
      tournamentId: z.number(),
      fullName: z.string().min(2),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      dateOfBirth: z.string().min(1),
      gender: z.enum(["male", "female"]),
      belt: z.string().min(2),
      expectedWeight: z.number().positive(),
      clubId: z.number().optional(),
    })).mutation(({ input }) => createAthleteRegistration({
      athlete: {
        fullName: input.fullName,
        email: input.email || null,
        phone: input.phone || null,
        dateOfBirth: input.dateOfBirth ? new Date(`${input.dateOfBirth}T00:00:00Z`) : null,
        gender: input.gender,
        belt: input.belt,
        expectedWeight: input.expectedWeight.toFixed(2),
        clubId: input.clubId ?? null,
      },
      registration: { tournamentId: input.tournamentId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending" },
      sport: "Brazilian Jiu-Jitsu",
    })),
    updateWeighIn: weighInProcedure.input(z.object({ tournamentId: z.number(), weighInMode: z.enum(["ibjjf", "custom"]), weighInTolerance: z.string().regex(/^\\d+(\\.\\d{1,2})?$/) })).mutation(({ input, ctx }) => updateTournamentWeighIn(input.tournamentId, input.weighInMode, input.weighInTolerance, ctx.user.id)),
    updateSettings: adminProcedure.input(z.object({ tournamentId: z.number(), organizationName: z.string().min(2), weighInMode: z.enum(["ibjjf", "custom"]), weighInTolerance: z.string().regex(/^\\d+(\\.\\d{1,2})?$/), scaleNotes: z.string().max(1000).default("") })).mutation(({ input, ctx }) => updateTournamentSettings({ ...input, actorUserId: ctx.user.id })),
    generateBrackets: bracketProcedure.input(z.object({ tournamentId: z.number() })).mutation(({ input, ctx }) => generateAutomaticBrackets(input.tournamentId, ctx.user.id)),
    createManualMatch: bracketProcedure.input(z.object({ tournamentId: z.number(), categoryId: z.number(), athleteAId: z.number(), athleteBId: z.number() })).mutation(({ input, ctx }) => createManualMatch({ ...input, actorUserId: ctx.user.id })),
    updateMatchSlots: bracketProcedure.input(z.object({ matchId: z.number(), athleteAId: z.number().nullable(), athleteBId: z.number().nullable() })).mutation(({ input, ctx }) => updateMatchSlots({ ...input, actorUserId: ctx.user.id })),
    finishMatch: refereeProcedure.input(z.object({ matchId: z.number(), winnerId: z.number(), scoreA: z.number().int().min(0), scoreB: z.number().int().min(0) })).mutation(({ input, ctx }) => finishMatch({ ...input, actorUserId: ctx.user.id })),
    updateMatchStatus: refereeProcedure.input(z.object({ matchId: z.number(), status: z.enum(["queued", "called", "live", "no_show"]) })).mutation(({ input, ctx }) => updateMatchStatus(input.matchId, input.status, ctx.user.id)),
    updateRegistration: staffProcedure.input(z.object({
      id: z.number(),
      paymentStatus: z.enum(["unpaid", "pending", "paid", "refunded"]).optional(),
      checkInStatus: z.enum(["not_checked_in", "checked_in"]).optional(),
      weighInStatus: z.enum(["pending", "passed", "overweight"]).optional(),
      weighInNotes: z.string().max(1000).optional(),
      seed: z.number().int().min(1).max(999).nullable().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    })).mutation(({ input, ctx }) => {
      const { id, ...values } = input;
      if (ctx.user.openId !== process.env.OWNER_OPEN_ID && !canUpdateRegistrationFields(ctx.user.role, values)) throw new TRPCError({ code: "FORBIDDEN", message: "This role cannot edit these registration fields" });
      return updateRegistrationStatus(id, values, ctx.user.id);
    }),
  }),
});
export type AppRouter = typeof appRouter;
