import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const copyId = params.id;
    console.log('🔍 COPY API: Fetching copy data for ID:', copyId);
    
    const dbService = new DatabaseService();
    const copyData = await dbService.getSavedCopy(copyId);
    
    if (!copyData) {
      return NextResponse.json({ error: 'Copy not found' }, { status: 404 });
    }
    
    console.log('✅ COPY API: Copy data retrieved successfully');
    
    return NextResponse.json(copyData);

  } catch (error: any) {
    console.error('❌ COPY API: Error fetching copy:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to fetch copy'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const copyId = params.id;
    const updates = await request.json();
    
    console.log('📝 COPY API: Updating copy data for ID:', copyId);
    
    // Use CopyStorage directly to update the file
    const { CopyStorage } = await import('@/lib/copy-storage');
    const updatedCopy = await CopyStorage.updateCopy(copyId, updates);
    
    console.log('✅ COPY API: Copy updated successfully');
    
    return NextResponse.json(updatedCopy);

  } catch (error: any) {
    console.error('❌ COPY API: Error updating copy:', error);
    
    return NextResponse.json({
      error: error.message || 'Failed to update copy'
    }, { status: 500 });
  }
}