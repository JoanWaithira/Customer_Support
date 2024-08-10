import { NextResponse } from "next/server";

const systemPrompt = "Generate a system prompt for customer support spots for Headstarter AI, a platform to do CS interviews for CS graduates.";

export async function POST(req) {
    const data = await req.json();

    try {
        const response = await fetch('https://api.openrouter.ai/v1/chat/completions', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, // Ensure this is set correctly
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    ...data,
                ],
                model: 'meta-llama/llama-3.1-8b-instruct:fre', // Verify model name with the API provider
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
