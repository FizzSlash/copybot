import { NextResponse } from 'next/server';

export async function GET() {
  console.log('🧪 BASIC TEST: API endpoint hit successfully');
  
  return NextResponse.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      hasClaudeKey: !!process.env.ANTHROPIC_API_KEY
    }
  });
}

export async function POST(request: Request) {
  console.log('🧪 BASIC TEST: POST endpoint hit');
  
  try {
    const body = await request.json();
    console.log('🧪 BASIC TEST: Request body:', body);
    
    return NextResponse.json({
      message: 'POST request successful!',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('🧪 BASIC TEST: Error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}