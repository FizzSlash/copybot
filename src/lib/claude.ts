import Anthropic from '@anthropic-ai/sdk';
import type { 
  CopyGenerationRequest, 
  CopyGenerationResponse, 
  Client, 
  Campaign, 
  ClientNote, 
  ScrapedContent 
} from '@/types';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface CopyContext {
  client: Client;
  campaign: Campaign;
  clientNotes: ClientNote[];
  scrapedContent: ScrapedContent[];
}

export class ClaudeService {
  private buildContextPrompt(context: CopyContext, request: CopyGenerationRequest): string {
    const { client, campaign, clientNotes, scrapedContent } = context;
    
    let prompt = `You are an expert email copywriter for an email marketing agency. Generate high-converting email copy based on the provided context.

## CLIENT INFORMATION
Name: ${client.name}
Company: ${client.company || 'N/A'}
Website: ${client.website_url || 'N/A'}

## BRAND QUESTIONNAIRE
${client.brand_questionnaire ? this.formatBrandQuestionnaire(client.brand_questionnaire) : 'No brand questionnaire available.'}

## CAMPAIGN DETAILS
Campaign: ${campaign.name}
Type: ${campaign.type}
Brief: ${campaign.brief || 'No brief provided'}
Campaign Context: ${campaign.campaign_context || 'No additional context'}

## CLIENT INSIGHTS & NOTES
${clientNotes.length > 0 ? clientNotes.map(note => `- [${note.category}] ${note.note}`).join('\n') : 'No client notes available.'}

## WEBSITE CONTENT & RESEARCH
${scrapedContent.length > 0 ? scrapedContent.map(content => `
### ${content.content_type.toUpperCase()}: ${content.url}
${content.title ? `Title: ${content.title}` : ''}
${content.content.substring(0, 1000)}${content.content.length > 1000 ? '...' : ''}
`).join('\n') : 'No website content available.'}

## COPY REQUIREMENTS
Copy Type: ${request.copy_type}
Tone: ${request.tone || 'professional but engaging'}
Length: ${request.length || 'medium'}
${request.focus ? `Primary Focus: ${request.focus}` : ''}
${request.additional_context ? `Additional Context: ${request.additional_context}` : ''}

## TASK
Generate email copy that:
1. Aligns with the brand voice and personality
2. Addresses the target audience effectively
3. Incorporates key messaging and value propositions
4. Uses appropriate tone and length
5. Follows email marketing best practices

Please provide:
1. 3-5 subject line options (varied approaches)
2. Preview text (40-90 characters)
3. Complete email body
4. 2 alternative versions with different angles

Format your response as JSON with this structure:
{
  "subject_lines": ["subject1", "subject2", "subject3"],
  "preview_text": "preview text here",
  "email_body": "complete email body here",
  "alternative_versions": [
    {
      "subject_line": "alternative subject",
      "email_body": "alternative body"
    },
    {
      "subject_line": "alternative subject 2", 
      "email_body": "alternative body 2"
    }
  ]
}`;

    return prompt;
  }

  private formatBrandQuestionnaire(questionnaire: any): string {
    if (!questionnaire) return 'No brand questionnaire available.';
    
    const q = questionnaire as any;
    return `
Target Audience: ${q.target_audience || 'N/A'}
Brand Voice: ${q.brand_voice || 'N/A'}
Brand Personality: ${Array.isArray(q.brand_personality) ? q.brand_personality.join(', ') : 'N/A'}
Key Messaging: ${q.key_messaging || 'N/A'}
Competitors: ${Array.isArray(q.competitors) ? q.competitors.join(', ') : 'N/A'}
Pain Points: ${Array.isArray(q.pain_points) ? q.pain_points.join(', ') : 'N/A'}
Unique Value Props: ${Array.isArray(q.unique_value_props) ? q.unique_value_props.join(', ') : 'N/A'}
Content Preferences: ${q.content_preferences || 'N/A'}
Tone Examples: ${q.tone_examples || 'N/A'}`;
  }

  async generateEmailCopy(
    request: CopyGenerationRequest,
    context: CopyContext
  ): Promise<CopyGenerationResponse> {
    try {
      const prompt = this.buildContextPrompt(context, request);

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      
      // Try to parse JSON response
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsedResponse = JSON.parse(jsonMatch[0]);
          return {
            subject_lines: parsedResponse.subject_lines || ['Generated Subject Line'],
            preview_text: parsedResponse.preview_text || 'Check this out...',
            email_body: parsedResponse.email_body || responseText,
            alternative_versions: parsedResponse.alternative_versions || []
          };
        }
      } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
      }

      // Fallback: extract content manually
      return this.fallbackParseResponse(responseText);

    } catch (error) {
      console.error('Claude API error:', error);
      throw new Error('Failed to generate email copy. Please try again.');
    }
  }

  private fallbackParseResponse(responseText: string): CopyGenerationResponse {
    // Simple fallback parsing logic
    const lines = responseText.split('\n');
    let subjectLines: string[] = [];
    let previewText = 'Check this out...';
    let emailBody = responseText;

    // Try to extract subject lines
    const subjectSection = responseText.match(/subject.*?lines?[:\-\s]*(.*?)(?:\n|$)/gi);
    if (subjectSection) {
      subjectLines = subjectSection.map(s => s.replace(/^subject.*?lines?[:\-\s]*/i, '').trim())
        .filter(s => s.length > 0)
        .slice(0, 5);
    }

    if (subjectLines.length === 0) {
      subjectLines = ['Exciting Update Inside!'];
    }

    // Try to extract preview text
    const previewMatch = responseText.match(/preview.*?text[:\-\s]*(.*?)(?:\n|$)/i);
    if (previewMatch && previewMatch[1]) {
      previewText = previewMatch[1].trim();
    }

    return {
      subject_lines: subjectLines,
      preview_text: previewText,
      email_body: emailBody,
      alternative_versions: []
    };
  }

  async generateSubjectLineVariations(
    originalSubject: string,
    context: CopyContext,
    count: number = 5
  ): Promise<string[]> {
    try {
      const prompt = `You are an expert email copywriter. Generate ${count} alternative subject lines for this email campaign.

Original Subject Line: "${originalSubject}"

Context:
- Client: ${context.client.name}
- Campaign: ${context.campaign.name}
- Brand Voice: ${context.client.brand_questionnaire ? JSON.stringify(context.client.brand_questionnaire).substring(0, 200) : 'Professional'}

Generate ${count} subject line variations that:
1. Maintain the same core message
2. Use different emotional hooks
3. Vary in length and style
4. Test different approaches (urgency, curiosity, benefit-focused, etc.)

Return only the subject lines, one per line.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        temperature: 0.8,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      const subjectLines = responseText.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, count);

      return subjectLines.length > 0 ? subjectLines : [originalSubject];

    } catch (error) {
      console.error('Failed to generate subject line variations:', error);
      return [originalSubject];
    }
  }

  async optimizeEmailCopy(
    originalCopy: string,
    feedback: string,
    context: CopyContext
  ): Promise<string> {
    try {
      const prompt = `You are an expert email copywriter. Optimize this email copy based on the provided feedback.

Original Email Copy:
${originalCopy}

Feedback:
${feedback}

Context:
- Client: ${context.client.name}
- Campaign: ${context.campaign.name}
- Brand Guidelines: ${context.client.brand_questionnaire ? JSON.stringify(context.client.brand_questionnaire).substring(0, 300) : 'Follow professional standards'}

Please rewrite the email copy addressing the feedback while maintaining:
1. Brand voice and tone
2. Core message and value proposition
3. Email marketing best practices
4. Appropriate length and formatting

Return only the optimized email copy.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      return message.content[0].type === 'text' ? message.content[0].text : originalCopy;

    } catch (error) {
      console.error('Failed to optimize email copy:', error);
      return originalCopy;
    }
  }
}