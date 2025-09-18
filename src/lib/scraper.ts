import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface WebsiteScrapingResult {
  url: string;
  title: string;
  content: string;
  brand_voice_analysis: string;
  key_messaging: string[];
  product_info: string;
  tone_examples: string[];
}

export class WebScrapingService {
  
  async scrapeWebsiteWithClaude(url: string, scrapingFocus?: string): Promise<WebsiteScrapingResult> {
    try {
      // Step 1: Get raw website content
      const rawContent = await this.fetchWebsiteContent(url);
      
      // Step 2: Use Claude to analyze and extract information
      const analysis = await this.analyzeWithClaude(url, rawContent, scrapingFocus);
      
      return {
        url,
        title: analysis.title || 'Website',
        content: rawContent.substring(0, 5000), // Store first 5k chars
        brand_voice_analysis: analysis.brand_voice || '',
        key_messaging: analysis.key_messaging || [],
        product_info: analysis.product_info || '',
        tone_examples: analysis.tone_examples || []
      };

    } catch (error) {
      console.error('Website scraping failed:', error);
      throw new Error(`Failed to scrape website: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async fetchWebsiteContent(url: string): Promise<string> {
    try {
      // Ensure URL has protocol
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CopyBot/1.0; +https://copybot.com)'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, and other non-content elements
      $('script, style, nav, footer, .menu, .navigation').remove();
      
      // Extract text content
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      
      return textContent;

    } catch (error) {
      console.error('Failed to fetch website content:', error);
      throw new Error('Unable to access website. Please check the URL.');
    }
  }

  private async analyzeWithClaude(url: string, content: string, focus?: string): Promise<any> {
    try {
      const prompt = this.buildAnalysisPrompt(url, content, focus);

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        temperature: 0.3,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Parse Claude's analysis
      return this.parseClaudeAnalysis(responseText);

    } catch (error) {
      console.error('Claude analysis failed:', error);
      throw new Error('AI analysis failed. Please try again.');
    }
  }

  private buildAnalysisPrompt(url: string, content: string, focus?: string): string {
    const focusInstruction = focus ? `\n\nSPECIAL FOCUS: ${focus}` : '';
    
    return `You are an expert marketing analyst. Analyze this website content and extract key information for email copywriting.

WEBSITE: ${url}

CONTENT TO ANALYZE:
${content.substring(0, 4000)}

${focusInstruction}

Please analyze and provide information in JSON format:

{
  "title": "Website/company name",
  "brand_voice": "Description of the brand voice and tone (2-3 sentences)",
  "key_messaging": ["Key message 1", "Key message 2", "Key message 3"],
  "product_info": "Summary of main products/services offered",
  "tone_examples": ["Example 1: actual copy from site", "Example 2: actual copy from site"],
  "target_audience": "Who this brand targets",
  "unique_value_props": ["Value prop 1", "Value prop 2"],
  "brand_personality": ["Professional", "Friendly", "etc"],
  "competitors_mentioned": ["Any competitors referenced"],
  "pain_points_addressed": ["Problem 1 they solve", "Problem 2 they solve"]
}

Focus on:
1. How the brand communicates (tone, style, voice)
2. What makes them unique
3. Their target audience
4. Key benefits and value propositions
5. Actual copy examples that show their writing style

Only include information that's clearly present on the website. If something isn't clear, omit it from the JSON.`;
  }

  private parseClaudeAnalysis(response: string): any {
    try {
      // Try to extract JSON from Claude's response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if no JSON found
      return this.fallbackParseAnalysis(response);
      
    } catch (error) {
      console.error('Failed to parse Claude analysis:', error);
      return this.fallbackParseAnalysis(response);
    }
  }

  private fallbackParseAnalysis(response: string): any {
    // Extract key information using regex patterns
    const titleMatch = response.match(/title[:\s]*["\']?([^"\'\n]+)["\']?/i);
    const brandVoiceMatch = response.match(/brand[_\s]voice[:\s]*["\']?([^"\'\n]+)["\']?/i);
    
    return {
      title: titleMatch ? titleMatch[1].trim() : 'Unknown',
      brand_voice: brandVoiceMatch ? brandVoiceMatch[1].trim() : 'Professional and engaging',
      key_messaging: ['Value-focused messaging', 'Customer-centric approach'],
      product_info: 'Products and services offered',
      tone_examples: ['Professional communication style'],
      target_audience: 'Target market',
      unique_value_props: ['Quality focus', 'Customer service'],
      brand_personality: ['Professional'],
      competitors_mentioned: [],
      pain_points_addressed: ['Customer needs']
    };
  }

  // Enhanced scraping for specific flow types (like your Make.com automation)
  async scrapeForFlowType(url: string, flowType: string): Promise<WebsiteScrapingResult> {
    let focusInstructions = '';

    switch (flowType) {
      case 'welcome':
        focusInstructions = 'Focus on about us page, company story, brand values, and onboarding messaging. Look for welcome/intro content.';
        break;
      case 'abandoned_cart':
        focusInstructions = 'Focus on product pages, pricing, shipping info, return policies, and checkout process. Look for urgency and incentive messaging.';
        break;
      case 'browse_abandonment':
        focusInstructions = 'Focus on product collections, categories, bestsellers, and product benefit messaging.';
        break;
      case 'post_purchase':
        focusInstructions = 'Focus on customer support, product education, usage guides, and community/loyalty content.';
        break;
      default:
        focusInstructions = 'General website analysis focusing on brand voice and key messaging.';
    }

    return this.scrapeWebsiteWithClaude(url, focusInstructions);
  }

  // Test website accessibility
  async testWebsiteAccess(url: string): Promise<boolean> {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await axios.head(url, { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get website metadata (title, description)
  async getWebsiteMetadata(url: string): Promise<{ title: string; description: string }> {
    try {
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      const response = await axios.get(url, { timeout: 5000 });
      const $ = cheerio.load(response.data);
      
      const title = $('title').text() || $('h1').first().text() || 'Website';
      const description = $('meta[name="description"]').attr('content') || 
                         $('meta[property="og:description"]').attr('content') || 
                         '';

      return { title, description };
    } catch (error) {
      return { title: 'Website', description: '' };
    }
  }
}