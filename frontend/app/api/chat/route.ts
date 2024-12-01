import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { message, csv_data } = await request.json();

    if (!message || !csv_data) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('Forwarding request to Python server...');

    const response = await fetch('http://localhost:5000/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csv_data: csv_data,
        user_prompt: message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python server error:', errorText);
      throw new Error(
        `Failed to get response from Python backend: ${errorText}`
      );
    }

    const result = await response.json();
    console.log('Received response from Python server');

    return NextResponse.json({ response: result.response });
  } catch (error) {
    console.error('Error in chat route:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process request',
      },
      { status: 500 }
    );
  }
}
