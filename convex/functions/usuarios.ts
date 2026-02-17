import { v } from "convex/values";
import { query } from "../_generated/server";

export const obtenerUsuarios = query({
  handler: async (ctx) => {
    return await ctx.db.query("usuarios").collect();
  },
});

export const getUserByFullName = query({
  args: {
    nombre: v.string(),
    apellido: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("usuarios")
      .withIndex("by_fullname", (q) =>
        q.eq("nombre", args.nombre).eq("apellido", args.apellido)
      )
      .unique();
  },
});
