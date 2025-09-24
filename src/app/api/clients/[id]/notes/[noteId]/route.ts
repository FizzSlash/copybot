import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    console.log('🚀 NOTE UPDATE API: Updating note ID:', params.noteId);
    const body = await request.json();
    console.log('📥 NOTE UPDATE API: Request body received:', body);

    // Validate required fields
    if (!body.note || !body.note.trim()) {
      return NextResponse.json(
        { error: 'Note text is required' },
        { status: 400 }
      );
    }

    if (!body.category) {
      return NextResponse.json(
        { error: 'Note category is required' },
        { status: 400 }
      );
    }

    const dbService = new DatabaseService();
    const updatedNote = await dbService.updateClientNote(params.noteId, {
      note: body.note.trim(),
      category: body.category
    });

    console.log('✅ NOTE UPDATE API: Note updated successfully');
    return NextResponse.json({
      data: updatedNote,
      message: 'Note updated successfully'
    });

  } catch (error) {
    console.error('❌ NOTE UPDATE API: Note update error:', error);
    console.error('🔍 NOTE UPDATE API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred while updating the note' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    console.log('🗑️ NOTE DELETE API: Deleting note ID:', params.noteId);

    const dbService = new DatabaseService();
    await dbService.deleteClientNote(params.noteId);

    console.log('✅ NOTE DELETE API: Note deleted successfully');
    return NextResponse.json({
      message: 'Note deleted successfully'
    });

  } catch (error) {
    console.error('❌ NOTE DELETE API: Note deletion error:', error);
    console.error('🔍 NOTE DELETE API: Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      type: typeof error
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred while deleting the note' },
      { status: 500 }
    );
  }
}