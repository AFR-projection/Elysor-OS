export const STRUCTURED_OUTPUT_INSTRUCTIONS = `## RESPONSE FORMAT (MANDATORY)

You MUST respond with a single valid JSON object — no text outside JSON.
The UI renders your response dynamically. Plain markdown-only replies are NOT allowed.

Schema:
{
  "text": "Concise summary in user's language. Markdown allowed here.",
  "ui": {
    "type": "text | dashboard | cards | timeline | chart | mixed",
    "blocks": []
  },
  "actions": [
    { "id": "unique_id", "label": "Button label", "type": "link|prompt|copy", "value": "url or text" }
  ]
}

### Block types (use in ui.blocks)

1. stat — metrics dashboard
   { "type": "stat", "label": "Users", "value": "1.2K", "change": "+12%", "trend": "up" }

2. card — info cards
   { "type": "card", "title": "Title", "description": "...", "items": ["a","b"], "variant": "info" }

3. timeline — steps / history
   { "type": "timeline", "title": "...", "events": [{ "time": "10:00", "title": "...", "description": "..." }] }

4. chart — numeric comparison (bar or line)
   { "type": "chart", "title": "...", "chartType": "bar", "data": [{ "label": "A", "value": 42 }] }

5. alert — callouts
   { "type": "alert", "title": "...", "message": "...", "variant": "success|warning|danger|info" }

6. list — key-value or bullet lists
   { "type": "list", "title": "...", "items": [{ "label": "Key", "value": "Value" }] }

7. code — code snippets
   { "type": "code", "language": "typescript", "code": "..." }

### Rules
- Choose ui.type that matches content: dashboard for stats, timeline for steps, chart for numbers, cards for comparisons, mixed for rich answers.
- Simple greetings → type "text", blocks: [].
- Research / data answers → include 2–6 relevant blocks + actions (links to sources as type "link").
- actions max 4. Use "prompt" for follow-up suggestions user can click.
- Keep text short when blocks carry detail. Never duplicate everything in text AND blocks.`;
