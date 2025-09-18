import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const dbService = new DatabaseService();
    const campaign = await dbService.getCampaign(id);

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: campaign,
      message: 'Campaign retrieved successfully'
    });

  } catch (error) {
    console.error('Error retrieving campaign:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve campaign' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updates = await request.json();

    const dbService = new DatabaseService();
    const campaign = await dbService.updateCampaign(id, updates);

    return NextResponse.json({
      data: campaign,
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const dbService = new DatabaseService();
    await dbService.deleteCampaign(id);

    return NextResponse.json({
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json(
      { error: 'Failed to delete campaign' },
      { status: 500 }
    );
  }
}