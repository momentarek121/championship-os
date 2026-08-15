import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import type { User } from "../../drizzle/schema";
import { ENV } from "./env";
import { canRole } from "@shared/roles";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

const directOperationsUser = (): User => ({ id: 0, openId: "direct-operations", name: "Direct Operations", email: null, loginMethod: "direct", role: "admin", createdAt: new Date(0), updatedAt: new Date(0), lastSignedIn: new Date(0) });

const capabilityProcedure = (capability: Parameters<typeof canRole>[1]) => t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const user = ctx.user ?? directOperationsUser();
    if (!ctx.user && !ENV.ownerOpenId) return next({ ctx: { ...ctx, user } });
    if (!canRole(user.role, capability) && user.openId !== ENV.ownerOpenId) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user } });
  }),
);

export const staffProcedure = capabilityProcedure("dashboard");
export const registrationProcedure = capabilityProcedure("registration");
export const weighInProcedure = capabilityProcedure("weigh_in");
export const bracketProcedure = capabilityProcedure("brackets");
export const refereeProcedure = capabilityProcedure("scoring");

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;
    const user = ctx.user ?? directOperationsUser();
    if (!canRole(user.role, "dashboard") && user.openId !== ENV.ownerOpenId) {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }
    return next({ ctx: { ...ctx, user } });
  }),
);
