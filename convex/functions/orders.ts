import { query } from "../_generated/server";

export const getOrders = query({
  handler: async (ctx) => {
    return await ctx.db.query("orders").collect();
  },
});

export const listOrdersWithClient = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();

    const ordersWithClient = await Promise.all(
      orders.map(async (order) => {
        const client = await ctx.db.get(order.clientId);
        return {
          ...order,
          client,
        };
      })
    );

    return ordersWithClient;
  },
});