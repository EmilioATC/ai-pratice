import { google } from "@ai-sdk/google";
import { streamText } from "ai";

export async function POST(req: Request) {
  const { message, requestId } = await req.json();

  console.log(`[INSTANCIA] Request ${requestId} - Inicio`);

  const result = await streamText({
    model: google("gemini-3-flash-preview"),
    prompt: message,
  });

  console.log(`[INSTANCIA] Request ${requestId} - Modelo iniciado`);

  return result.toTextStreamResponse();
}



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