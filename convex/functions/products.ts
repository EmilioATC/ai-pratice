import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

export const getProducts = query({
  handler: async (ctx) => {
    return await ctx.db.query("products").collect();
  },
});

export const createProducts = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    sku: v.string(),
    createdAt: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("products", {
      ...args,
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    name: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    sku: v.string(),
    createdAt: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      price: args.price,
      stock: args.stock,
      sku: args.sku,
      createdAt: args.createdAt,
      active: args.active,
    });
  },
});
