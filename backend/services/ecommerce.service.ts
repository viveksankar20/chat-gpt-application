import { logger } from './logger.service';

export interface ProductResult {
  title: string;
  link: string;
  price: string;
  source: string;
  rating?: string;
  reviews?: string;
  imageUrl?: string;
}

export class EcommerceService {
  private static API_KEY = process.env.SERPER_API_KEY;

  static async searchProducts(query: string): Promise<ProductResult[]> {
    if (!this.API_KEY) {
      throw new Error('SERPER_API_KEY is not configured');
    }

    try {
      const response = await fetch('https://google.serper.dev/shopping', {
        method: 'POST',
        headers: {
          'X-API-KEY': this.API_KEY!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          q: query,
          gl: 'in', // Target India specifically
          num: 40  // Get more results to ensure we find Amazon/Flipkart
        })
      });

      if (!response.ok) {
        throw new Error(`Serper API error: ${response.statusText}`);
      }

      const data: { shopping?: Array<Record<string, unknown>> } = await response.json();
      const shoppingResults = data.shopping || [];

      // Map and filter results
      const results: ProductResult[] = shoppingResults.map((item) => {
        let source = typeof item.source === 'string' ? item.source : 'Other';
        const sourceName = source.toLowerCase();
        
        if (sourceName.includes('amazon')) source = 'Amazon';
        else if (sourceName.includes('flipkart')) source = 'Flipkart';

        return {
          title: typeof item.title === 'string' ? item.title : 'Untitled product',
          link: typeof item.link === 'string' ? item.link : '#',
          price: typeof item.price === 'string' ? item.price : 'Price not listed',
          source: source,
          rating: item.rating != null ? String(item.rating) : 'N/A',
          reviews: item.ratingCount != null ? String(item.ratingCount) : '0',
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined
        };
      });

      // Return natural relevance from Google Serper to mix all stores
      return results;
    } catch (error) {
      logger.error('Error in Ecommerce search:', { error });
      throw error;
    }
  }

  private static async fetchFromSource(query: string, site: string): Promise<ProductResult[]> {
    // This method is now deprecated in favor of the unified searchProducts
    return [];
  }
}
