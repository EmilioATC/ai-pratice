import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { google } from "@ai-sdk/google";
import { stepCountIs, streamText, tool } from "ai";
import { ConvexHttpClient } from "convex/browser";
import { z } from "zod";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const obtenerUsuariosTool = tool({
  description: "Obtiene la lista completa de usuarios",
  inputSchema: z.object({}),
  execute: async () => {
    console.log("Consulta de todos los usuarios");
    const usuarios = await convex.query(api.functions.usuarios.obtenerUsuarios);
    return usuarios;
  },
});

const getUserByFullNameTool = tool({
  description: "Obtiene un usuario específico por nombre y apellido",
  inputSchema: z.object({
    nombre: z.string(),
    apellido: z.string(),
  }),

  execute: async ({ nombre, apellido }) => {
    console.log("Buscando información por usuario");
    const user = await convex.query(api.functions.usuarios.getUserByFullName, { nombre, apellido });
    return user;
  },
});

const getSalesInfo = tool({
  description: "Obtiene la lista completa de todas las ventas que existen en el momento con su cliente y producto",
  inputSchema: z.object({}),

  execute: async () => {
    console.log("Consulta de todas ventas");
    const sales = await convex.query(api.functions.orders.listOrdersWithClient);
    console.log(sales);
    return sales;
  },
});

const getProducts = tool({
  description: "Obtiene la lista los productos",
  inputSchema: z.object({}),

  execute: async () => {
    console.log("Consulta de los productos");
    const products = await convex.query(api.functions.products.getProducts);
    console.log(products);
    return products;
  },
});

const getClaims = tool({
  description: "Obtiene la lista los reclamos",
  inputSchema: z.object({}),

  execute: async () => {
    console.log("Consulta de los reclamos");
    const claims = await convex.query(api.functions.claims.listClaimWithClientAndOrder);
    console.log(claims);
    return claims;
  },
});

const createProducts = tool({
  description: "Crear un nuevo producto ",
  inputSchema: z.object({
    name: z.string(),
    description: z.string(),
    price: z.number(),
    stock: z.number(),
    sku: z.string(),
    createdAt: z.number(),
    active: z.boolean(),
  }),

  execute: async ({name,description,price, stock, sku, createdAt, active }) => {
    console.log("Creación de un producto");
    const resultProducts = await convex.mutation(api.functions.products.createProducts, {name,description,price, stock, sku, createdAt, active });
    console.log(resultProducts);
    return resultProducts;
  },
});

const updateProduct = tool({
  description: "Editar un producto ",
  inputSchema: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string(),
    price: z.number(),
    stock: z.number(),
    sku: z.string(),
    createdAt: z.number(),
    active: z.boolean(),
  }),

  execute: async ({id, name,description,price, stock, sku, createdAt, active }) => {
    console.log("Editar un producto");
    const resultProducts = await convex.mutation(api.functions.products.updateProduct, {id: id as Id<"products">, name,description,price, stock, sku, createdAt, active });
    console.log(resultProducts);
    return resultProducts;
  },
});

export async function POST(req: Request) {
  const { message } = await req.json();

  const result = streamText({
    model: google("gemini-3-flash-preview"),
    system: `
      Eres un asistente corporativo.
      Tu comunicación es clara, estructurada y formal.
      Utilizas lenguaje técnico cuando es apropiado.
      Evitas coloquialismos.
      Redactas en párrafos bien organizados.
      Reglas obligatorias:
      - Si necesitas información de usuarios, usa las herramientas disponibles.
      - Nunca inventes información.
      - Si no existe información, responde que no se encontró.
    `,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    tools: {
      obtenerUsuarios: obtenerUsuariosTool,
      getUserByFullName: getUserByFullNameTool,
      getSalesInfo: getSalesInfo,
      getProducts: getProducts,
      getClaims: getClaims,
      createProducts: createProducts,
      updateProduct: updateProduct
    },
    toolChoice: "auto",
    // En AI SDK v6 el loop de tools se controla con stopWhen.
    stopWhen: stepCountIs(5),
    onStepFinish: ({ finishReason, text }) => {
      console.log("[chat.step]", { finishReason, hasText: Boolean(text?.trim()) });
    },
    onFinish: ({ text, finishReason }) => {
      console.log("[chat.finish]", { finishReason, textLength: text.length });
    },
  });

  return result.toTextStreamResponse();
}

// export async function POST(req: Request) {
//   const { message, requestId } = await req.json();

//   console.log(`[INSTANCIA] Request ${requestId} - Inicio`);

//   const result = await streamText({
//     model: google("gemini-3-flash-preview"),

//     system: `
//       Eres un asistente corporativo.
//       Usa únicamente la información proporcionada por las herramientas.
//       No inventes datos.
//     `,

//     messages: [
//       {
//         role: "user",
//         content: message,
//       },
//     ],

//     tools: {
//       obtenerUsuarios: {
//         description: "Obtiene la lista completa de usuarios",
//         inputSchema: z.object({}),

//         execute: async () => {
//           console.log("🔧 Ejecutando obtenerUsuarios");

//           const usuarios = await convex.query(
//             api.functions.usuarios.obtenerUsuarios
//           );

//           console.log(usuarios)

//           return usuarios;
//         },
//       },

//       getUserByFullName: {
//         description:
//           "Obtiene un usuario específico por nombre y apellido",

//         inputSchema: z.object({
//           nombre: z.string(),
//           apellido: z.string(),
//         }),

//         execute: async ({ nombre, apellido }) => {
//           console.log("🔧 Ejecutando getUserByFullName");

//           const user = await convex.query(
//             api.functions.usuarios.getUserByFullName,
//             { nombre, apellido }
//           );

//           return user;
//         },
//       },
//     },

//     toolChoice: "auto", // el modelo decide cuándo llamar
//   });

//   console.log(
//     `[INSTANCIA] Request ${requestId} - Modelo iniciado`
//   );

//   return result.toTextStreamResponse();
// }

// export async function POST(req: Request) {
//   const { message, requestId } = await req.json();
// let prompt: string;
//   const words = message.trim().split(" ").toLowerCase()
//   console.log(words)

//   if (
//   words.includes("reporte") ||
//   words.includes("carta") ||
//   words.includes("lista") ||
//   words.includes("consultar")
// ) {
//   console.log("Se encontró una palabra clave");
//   const getUsuarios = await convex.query(api.functions.usuarios.obtenerUsuarios);
//   prompt = `
//     Actúa como asistente corporativo.

//     Responde usando únicamente la información proporcionada.
//     No inventes datos.

//     Pregunta:
//     ${message}

//     Datos de los usuario encontrados:
// ${JSON.stringify(getUsuarios, null, 2)}
// `;
// } else {

//   const extractionPrompt = `
//     Responde con un JSON con estas claves:
//     {"nombre": string | null, "apellido": string | null}

//     Si no hay persona mencionada en este mensaje, devuelve null para ambas.

//     Mensaje:
// ${message}
// `;

//   const extractionResult = await generateText({
//     model: google("gemini-3-flash-preview"),
//     prompt: extractionPrompt,
//   });

//   const text = extractionResult.text.trim();

//   const parsed = safeParseJson(text) ?? {
//     nombre: null,
//     apellido: null,
//   };
//   console.log("1", parsed);
//   const nombre = parsed.nombre ?? null;
//   const apellido = parsed.apellido ?? null;
//   console.log(nombre);
//   console.log(apellido);

//   let user = null;

//   if (nombre && apellido) {
//     user = await convex.query(api.functions.usuarios.getUserByFullName, {
//       nombre,
//       apellido,
//     });
//   }

//   if (user) {
//     prompt = `
//     Actúa como asistente corporativo.

//     Responde usando únicamente la información proporcionada.
//     No inventes datos.

//     Pregunta:
//     ${message}

//     Datos del usuario encontrado:
// ${JSON.stringify(user, null, 2)}
// `;
//   } else {
//     prompt = message;
//   }
// }

//   console.log(`[INSTANCIA] Request ${requestId} - Inicio`);

//   const result = await streamText({
//     model: google("gemini-3-flash-preview"),
//     prompt: prompt,
//   });

//   console.log(`[INSTANCIA] Request ${requestId} - Modelo iniciado`);

//   return result.toTextStreamResponse();
// }

// function safeParseJson(text: string) {
//   try {
//     const firstBracket = text.indexOf("{");
//     const lastBracket = text.lastIndexOf("}");

//     if (firstBracket === -1 || lastBracket === -1) {
//       return null;
//     }

//     const jsonText = text.slice(firstBracket, lastBracket + 1);
//     return JSON.parse(jsonText);
//   } catch {
//     return null;
//   }
// }

// import { openai } from "@ai-sdk/openai";
// import { streamText } from "ai";

// export async function POST(req: Request) {
//   const { message, requestId } = await req.json();

//   console.log(`[INSTANCIA] Request ${requestId} - Inicio`);

//   const result = await streamText({
//     model: openai("gpt-4o-mini"),
//     prompt: message,
//   });

//   console.log(`[INSTANCIA] Request ${requestId} - Modelo iniciado`);

//   return result.toTextStreamResponse();
// }
