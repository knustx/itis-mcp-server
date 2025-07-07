import fetch from 'node-fetch';

export interface ITISSearchOptions {
  query?: string;
  start?: number;
  rows?: number;
  sort?: string;
  fields?: string[];
  filters?: Record<string, string>;
}

export interface ITISResponse {
  response: {
    numFound: number;
    start: number;
    docs: any[];
  };
  facet_counts?: any;
  highlighting?: any;
}

export interface ITISRecord {
  tsn: string;
  nameWInd: string;
  scientificName: string;
  kingdom: string;
  phylum?: string;
  class?: string;
  order?: string;
  family?: string;
  genus?: string;
  species?: string;
  author?: string;
  rank?: string;
  usage?: string;
  unacceptReason?: string;
  credibilityRating?: string;
  completeness?: string;
  currency?: string;
  phyloSort?: string;
  initialTimeStamp?: string;
  lastChangeTimeStamp?: string;
}

export class ITISClient {
  private baseUrl = 'https://services.itis.gov/';

  async search(options: ITISSearchOptions = {}): Promise<ITISResponse> {
    const params = new URLSearchParams();
    
    // Default parameters
    params.append('wt', 'json');
    params.append('indent', 'true');
    
    // Query parameter
    if (options.query) {
      params.append('q', options.query);
    } else {
      params.append('q', '*:*');
    }
    
    // Pagination
    if (options.start !== undefined) {
      params.append('start', options.start.toString());
    }
    if (options.rows !== undefined) {
      params.append('rows', options.rows.toString());
    } else {
      params.append('rows', '10'); // Default to 10 rows
    }
    
    // Sorting
    if (options.sort) {
      params.append('sort', options.sort);
    }
    
    // Field selection
    if (options.fields && options.fields.length > 0) {
      params.append('fl', options.fields.join(','));
    }
    
    // Filters
    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        params.append('fq', `${key}:${value}`);
      });
    }
    
    const url = `${this.baseUrl}?${params.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json() as ITISResponse;
      return data;
    } catch (error) {
      throw new Error(`Failed to fetch ITIS data: ${error}`);
    }
  }

  async searchByScientificName(name: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    return this.search({
      ...options,
      query: `nameWInd:"${name}"`,
    });
  }

  async searchByTSN(tsn: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    return this.search({
      ...options,
      query: `tsn:${tsn}`,
    });
  }

  async searchByKingdom(kingdom: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    return this.search({
      ...options,
      filters: {
        ...options.filters,
        kingdom: `"${kingdom}"`
      }
    });
  }

  async searchByTaxonomicRank(rank: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    return this.search({
      ...options,
      filters: {
        ...options.filters,
        rank: `"${rank}"`
      }
    });
  }

  async getHierarchy(tsn: string): Promise<ITISResponse> {
    return this.search({
      query: `tsn:${tsn}`,
      fields: ['tsn', 'nameWInd', 'kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species', 'rank', 'phyloSort']
    });
  }

  async searchWithAutocomplete(partialName: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    return this.search({
      ...options,
      query: `nameWInd:${partialName}*`,
      sort: 'nameWInd asc'
    });
  }

  async getStatistics(): Promise<ITISResponse> {
    return this.search({
      query: '*:*',
      rows: 0,
      fields: ['tsn']
    });
  }
}
