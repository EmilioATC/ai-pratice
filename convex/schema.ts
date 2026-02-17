import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  usuarios: defineTable({
    nombre: v.string(),
    apellido: v.string(),
    email: v.string(),
    rol: v.string(),
    activo: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()), 
  })
  .index("by_email", ["email"])
  .index("by_fullname", ["nombre", "apellido"]),

  clients: defineTable({
    fullName: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.string(),
    createdAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive")
    ),
  })
    .index("by_email", ["email"])
    .index("by_status", ["status"]),

  products: defineTable({
    name: v.string(),
    description: v.string(),
    price: v.number(),
    stock: v.number(),
    sku: v.string(),
    createdAt: v.number(),
    active: v.boolean(),
  })
    .index("by_sku", ["sku"])
    .index("by_active", ["active"]),

  orders: defineTable({
    clientId: v.id("clients"),
    items: v.array(
      v.object({
        productId: v.id("products"),
        productName: v.string(),
        quantity: v.number(),
        priceAtPurchase: v.number(),
        subtotal: v.number(),
      })
    ),
    totalAmount: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("paid"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_status", ["status"]),

  claims: defineTable({
    clientId: v.id("clients"),
    orderId: v.id("orders"),
    type: v.union(
      v.literal("refund"),
      v.literal("damaged"),
      v.literal("wrong_item"),
      v.literal("late_delivery"),
      v.literal("other")
    ),
    description: v.string(),
    status: v.union(
      v.literal("open"),
      v.literal("in_review"),
      v.literal("resolved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_order", ["orderId"])
    .index("by_status", ["status"]),
})