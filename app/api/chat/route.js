import { NextResponse } from "next/server";

const systemPrompt = `
You are an AI-powered customer support assistant for Headstarter AI, a platform that provides AI-driven interviews for aspiring software engineers.
1. Provide concise, accurate answers. Limit responses to one or two sentences.
2. Use **bold** for topics or section headers.
3. Ensure each topic or question starts on a new line.
4. Directly address user queries with clear, actionable information.
5. Guide users to troubleshooting pages or technical support if needed.
6. Maintain user privacy and avoid sharing personal information.
7. If unsure about any information, offer to connect the user with a human representative.

**Example Responses:**

- **How to Download Python 3**
  To download Python 3, follow these steps:
  - **Windows**: Visit the [Python download page](https://www.python.org/downloads/) and download the installer. Run it and follow the installation instructions.
  - **macOS**: Use Homebrew: "brew install python".
  - **Linux**: On Ubuntu, run "sudo apt install python3".

- **Thank You**
  It was nice chatting with you! If you need more help, feel free to ask. Have a great day!


`

export async function POST(req) {
  const data = await req.json();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-405b",
        messages: [
          { role: 'assistant', content: systemPrompt },
          ...data,
        ],
        temperature: 0.5,
        top_p: 0.9,
        max_tokens: 150,
        stream: true
      })
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const text = decoder.decode(value, { stream: true });
            controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (err) {
          console.error('Error while processing completion:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(stream);

  } catch (error) {
    console.error('Error handling POST request:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}
