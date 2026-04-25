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

// Utility function to process vernacular names
export function processVernacularNames(vernacularArray: string[] = [], preferredLanguage: string = 'English'): string[] {
  if (!vernacularArray || vernacularArray.length === 0) return [];
  
  const processed: { name: string; language: string; preferred: boolean }[] = [];
  
  vernacularArray.forEach(vernacularString => {
    // Parse format: $name$language$preferred$id$date$
    const parts = vernacularString.split('$');
    if (parts.length >= 4) {
      const name = parts[1]?.trim();
      const language = parts[2]?.trim();
      const preferred = parts[3]?.trim() === 'Y';
      
      if (name && language) {
        processed.push({ name, language, preferred });
      }
    }
  });
  
  // Filter to preferred language first, then others as fallback
  const preferredLanguageNames = processed.filter(item => item.language === preferredLanguage);
  const otherLanguageNames = processed.filter(item => item.language !== preferredLanguage);
  
  // Sort within each language group: preferred names first, then alphabetical
  const sortByPreference = (a: any, b: any) => {
    if (a.preferred && !b.preferred) return -1;
    if (b.preferred && !a.preferred) return 1;
    return a.name.localeCompare(b.name);
  };
  
  preferredLanguageNames.sort(sortByPreference);
  otherLanguageNames.sort(sortByPreference);
  
  // Combine: preferred language first, then others
  const sortedProcessed = [...preferredLanguageNames, ...otherLanguageNames];
  
  // Remove duplicates and return just the names
  const uniqueNames = new Set<string>();
  return sortedProcessed
    .map(item => item.name)
    .filter(name => {
      const lowerName = name.toLowerCase();
      if (uniqueNames.has(lowerName)) return false;
      uniqueNames.add(lowerName);
      return true;
    });
}

export class ITISClient {
  private baseUrl = 'https://services.itis.gov/';
  public language: string = 'English';

  constructor(language?: string) {
    if (language) {
      this.language = language;
    }
  }

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

  async searchByVernacularName(vernacularName: string, options: Partial<ITISSearchOptions> = {}): Promise<ITISResponse> {
    // Replace spaces with asterisks for SOLR wildcard search in vernacular field
    const searchTerm = vernacularName.replace(/\s+/g, '*');
    return this.search({
      ...options,
      query: `vernacular:*${searchTerm}*`,
      sort: options.sort || 'nameWInd asc'
    });
  }

  async getRandomSpecies(options: {
    kingdom?: string;
    phylum?: string;
    class?: string;
    order?: string;
    family?: string;
    genus?: string;
    count?: number;
    requireVernacular?: boolean;
    vernacularLanguage?: string;
  } = {}): Promise<ITISResponse> {
    const { count = 1, requireVernacular = false, vernacularLanguage = 'English' } = options;
    
    // Build query with taxonomic filters
    const queryParts: string[] = ['rank:Species'];
    
    if (options.kingdom) queryParts.push(`kingdom:"${options.kingdom}"`);
    if (options.phylum) queryParts.push(`hierarchySoFarWRanks:*Phylum\\:${options.phylum}*`);
    if (options.class) queryParts.push(`hierarchySoFarWRanks:*Class\\:${options.class}*`);
    if (options.order) queryParts.push(`hierarchySoFarWRanks:*Order\\:${options.order}*`);
    if (options.family) queryParts.push(`hierarchySoFarWRanks:*Family\\:${options.family}*`);
    if (options.genus) queryParts.push(`unit1:"${options.genus}"`);
    
    // Only include species with vernacular names if requested
    if (requireVernacular) {
      if (vernacularLanguage) {
        queryParts.push(`vernacular:*${vernacularLanguage}*`);
      } else {
        queryParts.push('vernacular:[* TO *]');
      }
    }
    
    const query = queryParts.join(' AND ');
    
    // Strategy 1: Try to get taxonomic diversity using facets
    let facetResult;
    try {
      // Try using facets to understand taxonomic distribution (experimental)
      const facetUrl = `${this.baseUrl}?q=${encodeURIComponent(query)}&rows=0&facet=true&facet.field=rank&facet.limit=20&wt=json`;
      const facetResponse = await fetch(facetUrl);
      facetResult = await facetResponse.json();
    } catch (error) {
      // If facets fail, proceed without them
      facetResult = null;
    }
    
    // Get total count for random offset calculation
    const countResult = (facetResult as ITISResponse) || await this.search({
      query,
      rows: 0
    });
    
    const totalSpecies = countResult.response.numFound;
    if (totalSpecies === 0) {
      return countResult; // Return empty result if no species found
    }
    
    // Strategy 2: Use hierarchical sorting for better diversity
    const results: any[] = [];
    const existingTsns = new Set<string>();
    const maxAttempts = Math.min(count * 3, 15); // Slightly fewer attempts but more strategic
    
    // Try different sort orders to maximize diversity
    const sortOrders = [
      'hierarchicalSort asc',
      'hierarchicalSort desc', 
      'tsn asc',
      'updateDate desc',
      'nameWInd asc'
    ];
    
    for (let attempt = 0; attempt < maxAttempts && results.length < count; attempt++) {
      // Pick a random sort order to ensure diversity
      const sortOrder = sortOrders[attempt % sortOrders.length];
      
      // Use wider random distribution
      const segmentSize = Math.floor(totalSpecies / (count * 2));
      const randomSegment = Math.floor(Math.random() * Math.max(1, count * 2));
      const randomStart = randomSegment * segmentSize + Math.floor(Math.random() * Math.min(segmentSize, 100));
      const actualStart = Math.min(randomStart, totalSpecies - 5);
      
      try {
        const offsetResult = await this.search({
          query,
          start: actualStart,
          rows: Math.min(3, count - results.length + 1), // Smaller fetch size for more diversity
          sort: sortOrder
        });
        
        // Add unique results
        for (const doc of offsetResult.response.docs) {
          if (!existingTsns.has(doc.tsn) && results.length < count) {
            results.push(doc);
            existingTsns.add(doc.tsn);
          }
        }
      } catch (error) {
        // Skip this attempt and try another
        continue;
      }
    }
    
    // Final shuffle
    const finalResults = results.sort(() => Math.random() - 0.5);
    
    return {
      response: {
        numFound: totalSpecies,
        start: 0,
        docs: finalResults
      }
    };
  }

  async getStatistics(): Promise<ITISResponse> {
    return this.search({
      query: '*:*',
      rows: 0,
      fields: ['tsn']
    });
  }

  // --- JSON Web Services Methods ---
  
  private jsonWsUrl = 'https://www.itis.gov/ITISWebService/jsonservice/';

  private async fetchJsonWs(endpoint: string, params: Record<string, string>): Promise<any> {
    const urlParams = new URLSearchParams(params);
    const url = `${this.jsonWsUrl}${endpoint}?${urlParams.toString()}`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to fetch from ITIS JSON Web Service: ${error}`);
    }
  }

  async getGeographicDivisions(tsn: string): Promise<any> {
    return this.fetchJsonWs('getGeographicDivisionsFromTSN', { tsn });
  }

  async getCommonNames(tsn: string): Promise<any> {
    return this.fetchJsonWs('getCommonNamesFromTSN', { tsn });
  }

  async getFullHierarchyFromTSN(tsn: string): Promise<any> {
    return this.fetchJsonWs('getFullHierarchyFromTSN', { tsn });
  }

  async getSynonyms(tsn: string): Promise<any> {
    return this.fetchJsonWs('getSynonymNamesFromTSN', { tsn });
  }

  async getFullRecord(tsn: string): Promise<any> {
    return this.fetchJsonWs('getFullRecordFromTSN', { tsn });
  }

  /**
   * Smart resolver that tries to find an organism by common name first, 
   * then falls back to scientific name.
   */
  async resolveNameToTSN(name: string): Promise<{tsn: string, name: string, record: any} | null> {
    // Try vernacular first (often what lay users type)
    const vernacularResult = await this.searchByVernacularName(name, { rows: 1 });
    if (vernacularResult.response.numFound > 0) {
      const doc = vernacularResult.response.docs[0];
      return { tsn: doc.tsn, name: doc.nameWInd, record: doc };
    }

    // Try scientific name exact match
    const scientificResult = await this.searchByScientificName(name, { rows: 1 });
    if (scientificResult.response.numFound > 0) {
      const doc = scientificResult.response.docs[0];
      return { tsn: doc.tsn, name: doc.nameWInd, record: doc };
    }

    // Try autocomplete/partial match as last resort
    const partialResult = await this.searchWithAutocomplete(name, { rows: 1 });
    if (partialResult.response.numFound > 0) {
      const doc = partialResult.response.docs[0];
      return { tsn: doc.tsn, name: doc.nameWInd, record: doc };
    }

    return null;
  }

  /**
   * Finds all child species of a given higher taxonomic group
   */
  async getChildSpecies(taxonomicGroup: string, options: { rows?: number, start?: number } = {}): Promise<ITISResponse> {
    // First, resolve the group name to ensure we have exactly what it is
    const groupResult = await this.searchByScientificName(taxonomicGroup);
    
    if (groupResult.response.numFound === 0) {
      // Try treating it as a vernacular name
      const vernacularGroup = await this.searchByVernacularName(taxonomicGroup, { rows: 1 });
      if (vernacularGroup.response.numFound === 0) {
        throw new Error(`Could not find taxonomic group: ${taxonomicGroup}`);
      }
      
      const doc = vernacularGroup.response.docs[0];
      // We found a species or something by common name, but we need a higher group
      // This might be tricky if they typed "cats" and it resolved to the domestic cat
      // We'll just search using hierarchySoFarWRanks for whatever rank this is
      return this.search({
        query: `hierarchySoFarWRanks:*${doc.rank}\\:${doc.nameWInd}* AND rank:Species`,
        rows: options.rows || 20,
        start: options.start || 0,
        sort: 'nameWInd asc'
      });
    }

    const groupDoc = groupResult.response.docs[0];
    const groupRank = groupDoc.rank;
    const groupScientificName = groupDoc.nameWInd;

    return this.search({
      query: `hierarchySoFarWRanks:*${groupRank}\\:${groupScientificName}* AND rank:Species`,
      rows: options.rows || 20,
      start: options.start || 0,
      sort: 'nameWInd asc'
    });
  }
}
