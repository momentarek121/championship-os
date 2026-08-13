import { z } from "zod";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, publicProcedure, router } from "./_core/trpc";
import { createAthleteRegistration, createManualMatch, createPublicRegistration, createTournament, finishMatch, generateAutomaticBrackets, getAthletePortal, getClubs, getPublicParticipants, getTournamentBySlug, getTournamentDashboard, updateMatchStatus, updateRegistrationStatus, updateTournamentWeighIn } from "./db";

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
  tournament: router({
    dashboard: adminProcedure.query(() => getTournamentDashboard()),
    clubs: adminProcedure.query(() => getClubs()),
    create: adminProcedure.input(tournamentInput).mutation(({ input, ctx }) => createTournament({ ...input, registrationSlug: nanoid(10).toLowerCase(), createdBy: ctx.user.id })),
    registerAthlete: adminProcedure.input(z.object({
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
    updateWeighIn: adminProcedure.input(z.object({ tournamentId: z.number(), weighInMode: z.enum(["ibjjf", "custom"]), weighInTolerance: z.string().regex(/^\\d+(\\.\\d{1,2})?$/) })).mutation(({ input, ctx }) => updateTournamentWeighIn(input.tournamentId, input.weighInMode, input.weighInTolerance, ctx.user.id)),
    generateBrackets: adminProcedure.input(z.object({ tournamentId: z.number() })).mutation(({ input, ctx }) => generateAutomaticBrackets(input.tournamentId, ctx.user.id)),
    createManualMatch: adminProcedure.input(z.object({ tournamentId: z.number(), categoryId: z.number(), athleteAId: z.number(), athleteBId: z.number() })).mutation(({ input, ctx }) => createManualMatch({ ...input, actorUserId: ctx.user.id })),
    finishMatch: adminProcedure.input(z.object({ matchId: z.number(), winnerId: z.number(), scoreA: z.number().int().min(0), scoreB: z.number().int().min(0) })).mutation(({ input, ctx }) => finishMatch({ ...input, actorUserId: ctx.user.id })),
    updateMatchStatus: adminProcedure.input(z.object({ matchId: z.number(), status: z.enum(["queued", "called", "live", "no_show"]) })).mutation(({ input, ctx }) => updateMatchStatus(input.matchId, input.status, ctx.user.id)),
    updateRegistration: adminProcedure.input(z.object({
      id: z.number(),
      paymentStatus: z.enum(["unpaid", "pending", "paid", "refunded"]).optional(),
      checkInStatus: z.enum(["not_checked_in", "checked_in"]).optional(),
      weighInStatus: z.enum(["pending", "passed", "overweight"]).optional(),
      seed: z.number().int().min(1).max(999).nullable().optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    })).mutation(({ input, ctx }) => {
      const { id, ...values } = input;
      return updateRegistrationStatus(id, values, ctx.user.id);
    }),
  }),
});
export type AppRouter = typeof appRouter;
