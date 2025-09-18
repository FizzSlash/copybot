import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 CLIENT DETAIL API: Getting client ID:', params.id);
    const dbService = new DatabaseService();
    const client = await dbService.getClient(params.id);

    if (!client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    console.log('✅ CLIENT DETAIL API: Client retrieved successfully');
    return NextResponse.json({
      data: client,
      message: 'Client retrieved successfully'
    });

  } catch (error) {
    console.error('❌ CLIENT DETAIL API: Error retrieving client:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve client' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 CLIENT UPDATE API: Starting client update for ID:', params.id);
    const body = await request.json();
    console.log('📥 CLIENT UPDATE API: Request body received:', body);

    const dbService = new DatabaseService();
    const updatedClient = await dbService.updateClient(params.id, body);

    console.log('✅ CLIENT UPDATE API: Client updated successfully');
    return NextResponse.json({
      data: updatedClient,
      message: 'Client updated successfully'
    });

  } catch (error) {
    console.error('❌ CLIENT UPDATE API: Client update error:', error);
    console.error('🔍 CLIENT UPDATE API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred during client update' },
      { status: 500 }
    );
  }
}