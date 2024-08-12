import { NextResponse } from "next/server";

const systemPrompt = `You are an AI-powered customer support assistant for Headstarter AI, a platform that provides AI-driven interviews for aspiring software engineers.
1. Provide concise, accurate answers. Limit responses to one or two sentences.
2. Headstarter AI offers AI-powered interviews for software engineering positions.
3. Our platform helps candidates practice and prepare for real job interviews.
4. We cover a wide range of topics including algorithms, data structures, system design, and behavioral questions.
5. Users can access our services through our website or mobile app.
6. If asked about technical issues, guide users to our troubleshooting page or suggest contacting our technical support team.
7. Always maintain user privacy and do not share personal information.
8. If you are unsure about any information, it's okay to say you do not know and offer to connect the user with a human representative.

Your goal is to provide accurate information, assist with common inquiries, and ensure a positive experience for all Headstarter AI users.`;

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
