import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET() {
  try {
    const dbService = new DatabaseService();
    
    // Test basic connection by trying to fetch clients
    await dbService.getClients();
    
    return NextResponse.json({
      status: 'connected',
      message: 'Supabase connection successful'
    });

  } catch (error) {
    console.error('Supabase connection test failed:', error);
    return NextResponse.json(
      { 
        status: 'error',
        message: 'Supabase connection failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}