import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function POST(request: NextRequest) {
  try {
    const { url, focus } = await request.json();
    
    console.log(`🔍 SCRAPER API: Scraping ${url} for ${focus}...`);
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Fetch the webpage with multiple user agents
    let response;
    const userAgents = [
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (compatible; CopyBot/1.0; +https://copybot.ai)'
    ];
    
    for (const userAgent of userAgents) {
      try {
        response = await fetch(url, {
          headers: {
            'User-Agent': userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache'
          }
        });
        
        if (response.ok) break;
      } catch (fetchError) {
        console.log(`Failed with user agent: ${userAgent.substring(0, 50)}...`);
        continue;
      }
    }

    if (!response) {
      throw new Error('Failed to fetch URL with all attempted user agents');
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract key content based on focus
    let extractedContent = '';

    // Enhanced content extraction for different website types
    const contentSelectors = [
      // Headers and titles
      'h1, h2, h3, h4',
      // Main content areas
      'main, [role="main"], .main, #main',
      // Product/service descriptions
      '[class*="product"], [class*="service"], [class*="feature"]',
      // About/description content
      '[class*="about"], [class*="description"], [class*="content"]',
      // Navigation and menu items (for service understanding)
      'nav a, .menu a, .navigation a',
      // Paragraphs and text content
      'p',
      // Lists of features/benefits
      'ul li, ol li',
      // Footer content (often has key info)
      'footer'
    ];

    console.log('🔍 SCRAPER: Trying enhanced content extraction...');
    
    contentSelectors.forEach(selector => {
      try {
        $(selector).each((_, element) => {
          const text = $(element).text().trim();
          if (text && text.length > 5 && text.length < 1000) {
            // Remove excessive whitespace and filter out navigation/menu noise
            const cleanText = text.replace(/\s+/g, ' ').trim();
            if (!cleanText.match(/^(Home|About|Contact|Menu|Login|Cart|Search)$/i)) {
              extractedContent += cleanText + '\n';
            }
          }
        });
      } catch (selectorError) {
        console.log(`Selector ${selector} failed, continuing...`);
      }
    });
    
    // If still no content, try getting the page title and meta description
    if (extractedContent.length < 100) {
      const title = $('title').text().trim();
      const description = $('meta[name="description"]').attr('content') || '';
      
      if (title) extractedContent += `Page Title: ${title}\n`;
      if (description) extractedContent += `Description: ${description}\n`;
      
      // Try getting any text content from the body
      const bodyText = $('body').text().trim().substring(0, 1000);
      if (bodyText) extractedContent += bodyText;
    }

    // Clean up the content
    extractedContent = extractedContent
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()
      .substring(0, 3000); // Limit to 3000 chars to avoid overwhelming the AI

    console.log(`✅ SCRAPER API: Extracted ${extractedContent.length} characters of content`);

    // Step 2: Use Claude to analyze the content for brand insights
    console.log('🔍 SCRAPER API: Checking Claude analysis conditions:', {
      focus: focus,
      expectedFocus: 'brand analysis',
      focusMatch: focus === 'brand analysis',
      contentLength: extractedContent.length,
      hasContent: extractedContent.length > 100
    });
    
    if (focus === 'brand analysis' && extractedContent.length > 100) {
      try {
        console.log('🧠 SCRAPER API: Analyzing content with Claude for brand insights...');
        console.log('🧠 SCRAPER API: Content to analyze:', extractedContent.substring(0, 300) + '...');
        
        const analysisPrompt = `Analyze this website content and extract key brand information for marketing purposes:

WEBSITE CONTENT:
${extractedContent.substring(0, 2000)}

Extract the following brand information in JSON format:

{
  "brand_name": "Company/brand name",
  "target_audience": "Who is their target customer (demographics, psychographics)",
  "brand_voice": "How does the brand communicate (professional, casual, friendly, etc.)",
  "brand_personality": ["Professional", "Trustworthy", etc.],
  "key_messaging": "Main value propositions and key messages",
  "product_categories": "What products/services they offer",
  "pricing_strategy": "Pricing approach (premium, budget, etc.)",
  "unique_value_props": "What makes them different from competitors",
  "tone_examples": "Examples of their brand voice from the content",
  "content_preferences": "Content style and approach they use"
}

Respond with ONLY valid JSON.`;

        const { Anthropic } = await import('@anthropic-ai/sdk');
        const anthropic = new Anthropic({
          apiKey: process.env.ANTHROPIC_API_KEY,
        });

        const claudeResponse = await anthropic.messages.create({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 2000,
          temperature: 0.3,
          messages: [{
            role: "user",
            content: analysisPrompt
          }]
        });

        const rawAnalysis = claudeResponse.content[0].type === 'text' ? claudeResponse.content[0].text : '';
        
        let brandAnalysis = null;
        try {
          brandAnalysis = JSON.parse(rawAnalysis);
          console.log('✅ SCRAPER API: Brand analysis completed successfully');
        } catch (parseError) {
          console.log('⚠️ SCRAPER API: Failed to parse Claude analysis, returning raw content only');
        }

        return NextResponse.json({
          success: true,
          content: extractedContent.substring(0, 500) + '...', // Truncate content to prevent size issues
          brandAnalysis: brandAnalysis,
          url: url,
          timestamp: new Date().toISOString()
        });

      } catch (claudeError) {
        console.error('❌ SCRAPER API: Claude analysis error:', claudeError);
        console.log('⚠️ SCRAPER API: Claude analysis failed, returning raw content only');
      }
    } else {
      console.log('📝 SCRAPER API: Skipping Claude analysis - conditions not met');
    }

    // Return minimal response to avoid truncation
    return NextResponse.json({
      success: true,
      content: extractedContent.substring(0, 500) + '...', // Truncate content to prevent response size issues
      url: url,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ SCRAPER API: Error:', error.message);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      content: null
    }, { status: 500 });
  }
}