import { query } from "../_generated/server";

export const getClients = query({
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});