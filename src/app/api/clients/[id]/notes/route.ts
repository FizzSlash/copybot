import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔄 CLIENT NOTES API: Getting notes for client ID:', params.id);
    const dbService = new DatabaseService();
    const notes = await dbService.getClientNotes(params.id);

    console.log('✅ CLIENT NOTES API: Notes retrieved successfully:', notes.length);
    return NextResponse.json({
      data: notes,
      message: 'Client notes retrieved successfully'
    });

  } catch (error) {
    console.error('❌ CLIENT NOTES API: Error retrieving notes:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve client notes' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🚀 CLIENT NOTES API: Adding note for client ID:', params.id);
    const body = await request.json();
    console.log('📥 CLIENT NOTES API: Request body received:', body);

    // Validate required fields
    if (!body.note || !body.note.trim()) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    const note = await dbService.createClientNote({
      client_id: params.id,
      note: body.note.trim(),
      category: body.category || 'general'
    });

    console.log('✅ CLIENT NOTES API: Note created successfully');
    return NextResponse.json({
      data: note,
      message: 'Note added successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('❌ CLIENT NOTES API: Note creation error:', error);
    console.error('🔍 CLIENT NOTES API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred while adding the note' },
      { status: 500 }
    );
  }
}