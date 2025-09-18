import { NextRequest, NextResponse } from 'next/server';
import { WebScrapingService } from '@/lib/scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, flow_type } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json(
        { error: 'Missing required field: url' },
        { status: 400 }
      );
    }

    // Check if Claude API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Claude API key not configured. Please add ANTHROPIC_API_KEY to your environment variables.' },
        { status: 503 }
      );
    }

    // Initialize scraping service
    const scrapingService = new WebScrapingService();

    // Test website accessibility first
    const isAccessible = await scrapingService.testWebsiteAccess(url);
    if (!isAccessible) {
      return NextResponse.json(
        { error: 'Website is not accessible. Please check the URL.' },
        { status: 400 }
      );
    }

    // Scrape website with Claude analysis
    const scrapingResult = flow_type 
      ? await scrapingService.scrapeForFlowType(url, flow_type)
      : await scrapingService.scrapeWebsiteWithClaude(url);

    return NextResponse.json({
      data: scrapingResult,
      message: 'Website scraped and analyzed successfully'
    });

  } catch (error) {
    console.error('Website scraping error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'Claude API key not configured or invalid' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Website scraping failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to test website accessibility
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');

    if (!url) {
      return NextResponse.json(
        { error: 'Missing url parameter' },
        { status: 400 }
      );
    }

    const scrapingService = new WebScrapingService();
    
    // Test accessibility and get basic metadata
    const [isAccessible, metadata] = await Promise.all([
      scrapingService.testWebsiteAccess(url),
      scrapingService.getWebsiteMetadata(url)
    ]);

    return NextResponse.json({
      data: {
        accessible: isAccessible,
        title: metadata.title,
        description: metadata.description,
        url: url
      },
      message: 'Website accessibility test completed'
    });

  } catch (error) {
    console.error('Website test error:', error);
    return NextResponse.json(
      { error: 'Failed to test website' },
      { status: 500 }
    );
  }
}