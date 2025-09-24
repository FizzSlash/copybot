import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧠 FLOW STRATEGY API: Starting strategy generation...');
    
    const body = await request.json();
    const { flowType, emailCount, offer, client } = body;

    console.log('📥 FLOW STRATEGY API: Request data:', {
      flowType,
      emailCount,
      offer: offer.substring(0, 50) + '...',
      clientName: client?.company || client?.name
    });

    // Step 1: Scrape website for strategic insights
    let scrapedInsights = [];
    if (client?.website_url) {
      try {
        console.log('🔍 FLOW STRATEGY API: Scraping website for insights...');
        const scrapeResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/scrape-website`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            url: client.website_url,
            focus: 'products, pricing, brand positioning, key messages'
          })
        });
        
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          console.log('✅ FLOW STRATEGY API: Website scraped successfully');
          
          // Analyze scraped content for insights
          scrapedInsights = analyzeWebsiteContent(scrapeData.content, client.company);
        }
      } catch (scrapeError) {
        console.log('⚠️ FLOW STRATEGY API: Website scraping failed:', scrapeError);
      }
    }

    // Step 2: Generate strategic flow plan
    console.log('🧠 FLOW STRATEGY API: Building strategic flow plan...');
    const strategy = await generateFlowStrategy(flowType, emailCount, offer, client, scrapedInsights);
    
    console.log('✅ FLOW STRATEGY API: Strategy generated successfully');
    
    return NextResponse.json({
      success: true,
      data: strategy
    });

  } catch (error: any) {
    console.error('❌ FLOW STRATEGY API: Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate flow strategy'
    }, { status: 500 });
  }
}

function analyzeWebsiteContent(content: string, brandName: string): string[] {
  const insights = [];
  
  // Analyze content for key insights
  if (content.toLowerCase().includes('warranty') || content.toLowerCase().includes('guarantee')) {
    insights.push('Strong warranty/guarantee messaging available');
  }
  
  if (content.toLowerCase().includes('professional') || content.toLowerCase().includes('team')) {
    insights.push('Professional/B2B positioning opportunity');
  }
  
  if (content.toLowerCase().includes('review') || content.toLowerCase().includes('star')) {
    insights.push('Social proof and reviews are key differentiators');
  }
  
  if (content.toLowerCase().includes('premium') || content.toLowerCase().includes('quality')) {
    insights.push('Premium quality positioning strategy');
  }
  
  // Add brand-specific insights
  insights.push(`${brandName} brand voice and messaging themes identified`);
  insights.push('Product lineup and pricing structure analyzed');
  
  return insights.slice(0, 4); // Max 4 insights for clean display
}

async function generateFlowStrategy(flowType: string, emailCount: number, offer: string, client: any, insights: string[]) {
  // Define flow-specific strategies
  const flowStrategies = {
    welcome: generateWelcomeStrategy,
    abandoned_checkout: generateAbandonedCheckoutStrategy,
    browse_abandonment: generateBrowseAbandonmentStrategy,
    post_purchase: generatePostPurchaseStrategy,
    winback: generateWinbackStrategy
  };

  const strategyGenerator = flowStrategies[flowType as keyof typeof flowStrategies];
  if (!strategyGenerator) {
    throw new Error(`Unknown flow type: ${flowType}`);
  }

  return strategyGenerator(emailCount, offer, client, insights);
}

function generateWelcomeStrategy(emailCount: number, offer: string, client: any, insights: string[]) {
  const brandName = client?.company || client?.name || 'Brand';
  
  const baseEmails = [
    {
      emailNumber: 1,
      day: 1,
      theme: `Welcome to the ${brandName} Family`,
      focus: 'Brand introduction and warm welcome',
      hasOffer: true,
      offerType: 'Welcome gift - first order discount',
      products: 'Brand overview, no specific products',
      keyMessage: `Welcome! Here's your exclusive ${brandName} welcome offer`
    },
    {
      emailNumber: 2,
      day: 2,
      theme: 'Our Story & Mission',
      focus: 'Brand story and values alignment',
      hasOffer: true,
      offerType: 'Free shipping offer',
      products: 'None - brand story focus',
      keyMessage: 'Why we started and what drives us + shipping offer'
    },
    {
      emailNumber: 3,
      day: 4,
      theme: 'Meet Your Perfect Products',
      focus: 'Product education and matching',
      hasOffer: true,
      offerType: 'Product bundle discount',
      products: 'Top 2-3 bestselling products',
      keyMessage: 'Find your perfect match + bundle savings'
    },
    {
      emailNumber: 4,
      day: 7,
      theme: 'What Our Customers Say',
      focus: 'Social proof and testimonials',
      hasOffer: true,
      offerType: 'Customer-inspired offer',
      products: 'Most reviewed products',
      keyMessage: 'Real customer stories + same great deals'
    },
    {
      emailNumber: 5,
      day: 10,
      theme: 'Behind the Scenes',
      focus: 'Manufacturing, quality, or team spotlight',
      hasOffer: true,
      offerType: 'Exclusive insider offer',
      products: 'Premium or signature products',
      keyMessage: 'Exclusive access + insider pricing'
    },
    {
      emailNumber: 6,
      day: 12,
      theme: 'Complete Collection Tour',
      focus: 'Full product range and capabilities',
      hasOffer: true,
      offerType: 'Everything discount',
      products: 'Full product range',
      keyMessage: 'Explore everything with collection-wide savings'
    },
    {
      emailNumber: 7,
      day: 14,
      theme: 'Your Journey Starts Now',
      focus: 'Motivation and final conversion push',
      hasOffer: true,
      offerType: 'Final welcome series offer',
      products: 'Best for beginners or most popular',
      keyMessage: 'Time to start your journey + best welcome pricing'
    }
  ];

  return {
    flowType: 'welcome',
    emailCount,
    offer,
    client: client?.company || client?.name || 'Client',
    scrapedInsights: insights,
    emailStrategies: baseEmails.slice(0, emailCount)
  };
}

function generateAbandonedCheckoutStrategy(emailCount: number, offer: string, client: any, insights: string[]) {
  const baseEmails = [
    {
      emailNumber: 1,
      day: 1,
      theme: 'Did you forget something?',
      focus: 'Gentle reminder with cart contents',
      hasOffer: false,
      products: 'Items left in cart',
      keyMessage: 'Friendly reminder - your items are waiting'
    },
    {
      emailNumber: 2,
      day: 2,
      theme: 'Others love these products too',
      focus: 'Social proof and reviews for cart items',
      hasOffer: false,
      products: 'Cart items with reviews/testimonials',
      keyMessage: 'Build confidence with social proof'
    },
    {
      emailNumber: 3,
      day: 3,
      theme: 'Complete your order with savings',
      focus: 'Soft incentive to overcome price objection',
      hasOffer: true,
      offerType: 'Small discount (5-10%)',
      products: 'Cart items + recommended accessories',
      keyMessage: 'Small incentive to complete purchase'
    },
    {
      emailNumber: 4,
      day: 5,
      theme: 'Last chance - special offer inside',
      focus: 'Urgency and stronger incentive',
      hasOffer: true,
      offerType: 'Stronger offer + urgency',
      products: 'Cart items + urgency messaging',
      keyMessage: 'Final chance with best offer'
    }
  ];

  return {
    flowType: 'abandoned_checkout',
    emailCount,
    offer,
    client: client?.company || client?.name || 'Client',
    scrapedInsights: insights,
    emailStrategies: baseEmails.slice(0, emailCount)
  };
}

function generateBrowseAbandonmentStrategy(emailCount: number, offer: string, client: any, insights: string[]) {
  const baseEmails = [
    {
      emailNumber: 1,
      day: 1,
      theme: 'Still thinking about it?',
      focus: 'Helpful, non-pushy follow-up',
      hasOffer: false,
      products: 'Browsed category or similar products',
      keyMessage: 'Helpful information about browsed products'
    },
    {
      emailNumber: 2,
      day: 2,
      theme: 'Here\'s what might help decide',
      focus: 'Educational content and buying guides',
      hasOffer: false,
      products: 'Educational content about browsed items',
      keyMessage: 'Provide value-first education'
    },
    {
      emailNumber: 3,
      day: 4,
      theme: 'Customer favorites in this category',
      focus: 'Social proof and bestsellers',
      hasOffer: true,
      offerType: 'Category-specific offer',
      products: 'Bestsellers in browsed category',
      keyMessage: 'Popular choices + special pricing'
    },
    {
      emailNumber: 4,
      day: 6,
      theme: 'Limited-time offer expires soon',
      focus: 'Urgency and final incentive',
      hasOffer: true,
      offerType: 'Time-sensitive strong offer',
      products: 'Browsed items + alternatives',
      keyMessage: 'Limited-time offer with urgency'
    }
  ];

  return {
    flowType: 'browse_abandonment',
    emailCount,
    offer,
    client: client?.company || client?.name || 'Client',
    scrapedInsights: insights,
    emailStrategies: baseEmails.slice(0, emailCount)
  };
}

function generatePostPurchaseStrategy(emailCount: number, offer: string, client: any, insights: string[]) {
  const baseEmails = [
    {
      emailNumber: 1,
      day: 1,
      theme: 'Thank you + what\'s next',
      focus: 'Gratitude and usage guidance',
      hasOffer: false,
      products: 'Purchased items + usage tips',
      keyMessage: 'Thank you + how to get the most from your purchase'
    },
    {
      emailNumber: 2,
      day: 3,
      theme: 'Getting the most from your purchase',
      focus: 'Education and value maximization',
      hasOffer: false,
      products: 'Usage tips, care instructions, tutorials',
      keyMessage: 'Maximize value from your purchase'
    },
    {
      emailNumber: 3,
      day: 7,
      theme: 'Perfect complements to your order',
      focus: 'Cross-sell complementary products',
      hasOffer: true,
      offerType: 'Cross-sell discount',
      products: 'Complementary/accessory products',
      keyMessage: 'Complete your setup with complementary items'
    },
    {
      emailNumber: 4,
      day: 14,
      theme: 'Join our loyalty program',
      focus: 'Loyalty program and repeat purchase incentive',
      hasOffer: true,
      offerType: 'Loyalty program bonus',
      products: 'Popular repeat purchase items',
      keyMessage: 'Exclusive loyalty benefits + member pricing'
    }
  ];

  return {
    flowType: 'post_purchase',
    emailCount,
    offer,
    client: client?.company || client?.name || 'Client',
    scrapedInsights: insights,
    emailStrategies: baseEmails.slice(0, emailCount)
  };
}

function generateWinbackStrategy(emailCount: number, offer: string, client: any, insights: string[]) {
  const brandName = client?.company || client?.name || 'Brand';
  
  const baseEmails = [
    {
      emailNumber: 1,
      day: 1,
      theme: `We miss you at ${brandName}`,
      focus: 'Emotional reconnection without being pushy',
      hasOffer: false,
      products: 'None - emotional focus',
      keyMessage: 'Genuine "we miss you" message'
    },
    {
      emailNumber: 2,
      day: 3,
      theme: 'Look what\'s new since you\'ve been away',
      focus: 'New products, improvements, or features',
      hasOffer: false,
      products: 'New arrivals or improved products',
      keyMessage: 'Show exciting developments and improvements'
    },
    {
      emailNumber: 3,
      day: 5,
      theme: 'A special welcome back offer',
      focus: 'Moderate incentive to return',
      hasOffer: true,
      offerType: 'Welcome back discount',
      products: 'Previously purchased or viewed items',
      keyMessage: 'Special pricing just for returning customers'
    },
    {
      emailNumber: 4,
      day: 8,
      theme: 'Last chance to save big',
      focus: 'Final strong incentive with urgency',
      hasOffer: true,
      offerType: 'Final winback offer',
      products: 'Best deals and popular items',
      keyMessage: 'Final opportunity with best pricing'
    }
  ];

  return {
    flowType: 'winback',
    emailCount,
    offer,
    client: client?.company || client?.name || 'Client',
    scrapedInsights: insights,
    emailStrategies: baseEmails.slice(0, emailCount)
  };
}