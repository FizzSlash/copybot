import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  try {
    console.log('📋 SAVED COPIES API: Fetching all saved copies...');
    
    // Read from file directly (avoid import issues)
    const COPIES_FILE = path.join(process.cwd(), 'data', 'saved-copies.json');
    
    if (!fs.existsSync(COPIES_FILE)) {
      console.log('📝 SAVED COPIES API: No saved copies file found');
      return NextResponse.json({
        success: true,
        data: []
      });
    }
    
    const existingData = fs.readFileSync(COPIES_FILE, 'utf8');
    const copies = JSON.parse(existingData);
    
    // Convert object to array and sort by creation date
    const copiesArray = Object.values(copies).sort((a: any, b: any) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    console.log('✅ SAVED COPIES API: Retrieved copies:', copiesArray.length);
    
    return NextResponse.json({
      success: true,
      data: copiesArray
    });

  } catch (error: any) {
    console.error('❌ SAVED COPIES API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to fetch saved copies'
    }, { status: 500 });
  }
}