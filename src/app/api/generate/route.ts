import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert HTML5 game developer. When given a game description, you generate a COMPLETE, self-contained HTML file that implements a playable browser game.

Rules:
- Output ONLY the HTML code, no markdown fences, no explanation
- The game must be a single HTML file with inline CSS and JavaScript
- Use Canvas API or DOM manipulation — no external dependencies
- The game must be immediately playable with keyboard/mouse/touch
- Include a start screen with the game title and "Click to Start" or "Press Space"
- Include score tracking and a game-over state with "Play Again"
- Use vibrant colors and smooth animations
- Make controls intuitive: arrow keys / WASD for movement, space for action
- Add touch controls for mobile (tap/swipe)
- The game should be fun and polished — add particle effects, screen shake, sound effects (Web Audio API) where appropriate
- Ensure the canvas/game area fills the viewport responsively
- Add a brief instructions overlay showing controls
- The HTML must start with <!DOCTYPE html> and be completely valid`;

export async function POST(req: NextRequest) {
  try {
    const { prompt, preset } = await req.json();

    const gamePrompt = preset
      ? `Create a ${preset} game with the following details: ${prompt || "Make it fun and engaging with multiple levels of difficulty."}`
      : prompt;

    if (!gamePrompt) {
      return Response.json({ error: "No prompt provided" }, { status: 400 });
    }

    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: `Create a playable HTML5 game based on this description:\n\n${gamePrompt}`,
        },
      ],
      system: SYSTEM_PROMPT,
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return Response.json(
        { error: "Unexpected response type" },
        { status: 500 }
      );
    }

    let html = content.text.trim();
    // Strip markdown fences if the model wraps them
    if (html.startsWith("```")) {
      html = html.replace(/^```(?:html)?\n?/, "").replace(/\n?```$/, "");
    }

    return Response.json({ html });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Generation failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
