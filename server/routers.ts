import { z } from "zod";
import { nanoid } from "nanoid";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { createAthleteRegistration, createPublicRegistration, createTournament, getClubs, getTournamentBySlug, getTournamentDashboard, updateRegistrationStatus } from "./db";

const tournamentInput = z.object({
  name: z.string().min(2),
  sport: z.string().min(2),
  location: z.string().optional(),
  ruleset: z.string().default("Standard"),
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
    bySlug: publicProcedure.input(z.object({ slug: z.string().min(3) })).query(({ input }) => getTournamentBySlug(input.slug)),
    submit: publicProcedure.input(z.object({
      slug: z.string().min(3), fullName: z.string().min(2), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), gender: z.enum(["male", "female"]), belt: z.string().min(2), expectedWeight: z.number().positive(),
    })).mutation(async ({ input }) => {
      const tournament = await getTournamentBySlug(input.slug);
      if (!tournament) throw new Error("Tournament registration link not found");
      return createPublicRegistration({ ...input, tournamentId: tournament.id, expectedWeight: input.expectedWeight.toFixed(2) });
    }),
  }),
  tournament: router({
    dashboard: protectedProcedure.query(() => getTournamentDashboard()),
    clubs: protectedProcedure.query(() => getClubs()),
    create: protectedProcedure.input(tournamentInput).mutation(({ input, ctx }) => createTournament({ ...input, registrationSlug: nanoid(10).toLowerCase(), createdBy: ctx.user.id })),
    registerAthlete: protectedProcedure.input(z.object({
      tournamentId: z.number(),
      fullName: z.string().min(2),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      gender: z.enum(["male", "female"]),
      belt: z.string().min(2),
      expectedWeight: z.number().positive(),
      clubId: z.number().optional(),
    })).mutation(({ input }) => createAthleteRegistration({
      athlete: {
        fullName: input.fullName,
        email: input.email || null,
        phone: input.phone || null,
        gender: input.gender,
        belt: input.belt,
        expectedWeight: input.expectedWeight.toFixed(2),
        clubId: input.clubId ?? null,
      },
      registration: { tournamentId: input.tournamentId, status: "pending", paymentStatus: "unpaid", checkInStatus: "not_checked_in", weighInStatus: "pending" },
    })),
    updateRegistration: protectedProcedure.input(z.object({
      id: z.number(),
      paymentStatus: z.enum(["unpaid", "pending", "paid", "refunded"]).optional(),
      checkInStatus: z.enum(["not_checked_in", "checked_in"]).optional(),
      weighInStatus: z.enum(["pending", "passed", "overweight"]).optional(),
      status: z.enum(["pending", "approved", "rejected"]).optional(),
    })).mutation(({ input, ctx }) => {
      const { id, ...values } = input;
      return updateRegistrationStatus(id, values, ctx.user.id);
    }),
  }),
});
export type AppRouter = typeof appRouter;
