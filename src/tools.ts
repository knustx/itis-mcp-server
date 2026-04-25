import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { ITISClient, processVernacularNames } from './itis-client.js';

// Define the tools
export const tools: Tool[] = [
  {
    name: 'search_itis',
    description: 'General search for the ITIS database using SOLR queries. Use this for complex or specific queries that other tools cannot handle.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'SOLR query string (e.g., "nameWInd:Homo*", "kingdom:Plantae", or "*:*" for all)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10, max: 100)',
        },
        sort: {
          type: 'string',
          description: 'Sort order (e.g., "nameWInd asc", "tsn desc")',
        },
        fields: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific fields to return (default: all available fields)',
        },
        filters: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Additional filters as key-value pairs (e.g., {"kingdom": "Animalia", "rank": "Species"})',
        },
      },
    },
  },
  {
    name: 'search_by_scientific_name',
    description: 'Find organisms by their exact scientific name (e.g., "Homo sapiens", "Quercus"). Use this when the user asks about a specific scientific name.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Scientific name to search for (e.g., "Homo sapiens", "Quercus")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'search_by_tsn',
    description: 'Find organisms by their Taxonomic Serial Number (TSN) in the ITIS database. Use this when you already have a TSN.',
    inputSchema: {
      type: 'object',
      properties: {
        tsn: {
          type: 'string',
          description: 'Taxonomic Serial Number (TSN) to search for',
        },
      },
      required: ['tsn'],
    },
  },
  {
    name: 'search_by_kingdom',
    description: 'Find all organisms belonging to a major kingdom of life. Use this when someone asks about \'all animals\', \'all plants\', \'all fungi\', etc. Kingdoms include: Animalia (animals), Plantae (plants), Fungi (mushrooms/molds), Bacteria, Chromista (algae), Protozoa, and Archaea.',
    inputSchema: {
      type: 'object',
      properties: {
        kingdom: {
          type: 'string',
          description: 'Kingdom name (e.g., "Animalia", "Plantae", "Fungi", "Bacteria")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
      },
      required: ['kingdom'],
    },
  },
  {
    name: 'search_by_rank',
    description: 'Search for organisms by their taxonomic rank (e.g., Species, Genus, Family, Order, Class, Phylum, Kingdom).',
    inputSchema: {
      type: 'object',
      properties: {
        rank: {
          type: 'string',
          description: 'Taxonomic rank (e.g., "Species", "Genus", "Family", "Order", "Class", "Phylum", "Kingdom")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
      },
      required: ['rank'],
    },
  },
  {
    name: 'get_hierarchy',
    description: 'Get the complete taxonomic hierarchy (from Kingdom down to Species) for a given TSN.',
    inputSchema: {
      type: 'object',
      properties: {
        tsn: {
          type: 'string',
          description: 'Taxonomic Serial Number (TSN) to get hierarchy for',
        },
      },
      required: ['tsn'],
    },
  },
  {
    name: 'autocomplete_search',
    description: 'Search for organisms with partial names. Useful if you are unsure of the spelling.',
    inputSchema: {
      type: 'object',
      properties: {
        partialName: {
          type: 'string',
          description: 'Partial scientific name for autocomplete (e.g., "Homo", "Quer")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
      },
      required: ['partialName'],
    },
  },
  {
    name: 'get_statistics',
    description: 'Get basic statistics about the ITIS database (total number of records).',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_by_common_name',
    description: 'Find organisms by their everyday common names (e.g., "dog", "elephant", "oak tree", "komodo dragon"). This is usually what lay users want when they ask about an animal or plant.',
    inputSchema: {
      type: 'object',
      properties: {
        commonName: {
          type: 'string',
          description: 'Common/vernacular name to search for (e.g., "human", "dog", "oak tree")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
      },
      required: ['commonName'],
    },
  },
  {
    name: 'search_by_vernacular_name',
    description: 'Legacy alias for search_by_common_name.',
    inputSchema: {
      type: 'object',
      properties: {
        vernacularName: {
          type: 'string',
          description: 'Common/vernacular name to search for (e.g., "human", "dog", "oak tree")',
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
        start: {
          type: 'number',
          description: 'Starting index for pagination (default: 0)',
        },
      },
      required: ['vernacularName'],
    },
  },
  {
    name: 'explore_taxonomy',
    description: 'Explore taxonomic relationships by finding related organisms at different taxonomic levels (siblings, family, order, class).',
    inputSchema: {
      type: 'object',
      properties: {
        scientificName: {
          type: 'string',
          description: 'Scientific name to explore (e.g., "Homo sapiens")',
        },
        level: {
          type: 'string',
          description: 'Taxonomic level to explore: "siblings" (same genus), "family" (same family), "order" (same order), "class" (same class)',
          enum: ['siblings', 'family', 'order', 'class']
        },
        rows: {
          type: 'number',
          description: 'Number of results to return (default: 10)',
        },
      },
      required: ['scientificName', 'level'],
    },
  },
  {
    name: 'get_random_species',
    description: 'Get random species from ITIS database with optional taxonomic filters. Useful for "tell me about a random bird" requests.',
    inputSchema: {
      type: 'object',
      properties: {
        kingdom: {
          type: 'string',
          description: 'Kingdom filter (e.g., "Animalia", "Plantae", "Fungi")',
        },
        phylum: {
          type: 'string',
          description: 'Phylum filter (e.g., "Chordata", "Arthropoda")',
        },
        class: {
          type: 'string',
          description: 'Class filter (e.g., "Mammalia", "Aves", "Reptilia")',
        },
        order: {
          type: 'string',
          description: 'Order filter (e.g., "Carnivora", "Primates")',
        },
        family: {
          type: 'string',
          description: 'Family filter (e.g., "Felidae", "Canidae")',
        },
        genus: {
          type: 'string',
          description: 'Genus filter (e.g., "Panthera", "Canis")',
        },
        count: {
          type: 'number',
          description: 'Number of random species to return (default: 1, max: 10)',
        },
        requireVernacular: {
          type: 'boolean',
          description: 'Only return species that have common names (default: false)',
        },
        vernacularLanguage: {
          type: 'string',
          description: 'Language for vernacular names (default: "English"). Other options: "French", "Spanish", etc.',
        },
      },
    },
  },
  {
    name: 'find_relatives',
    description: 'Show me relatives of a specific animal or plant. You can pass in a common name (like "Elephant") or scientific name, and it will return related species at your chosen taxonomic depth (genus, family, order, class).',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Common or scientific name of the organism (e.g., "Elephant", "Tiger", "Homo sapiens")',
        },
        level: {
          type: 'string',
          description: 'How distant of relatives? "siblings" (same genus), "family" (same family), "order" (same order), "class" (same class)',
          enum: ['siblings', 'family', 'order', 'class']
        },
        rows: {
          type: 'number',
          description: 'Number of relatives to return (default: 10)',
        },
      },
      required: ['name', 'level'],
    },
  },
  {
    name: 'get_children',
    description: 'What species are in the cat family? Pass in a higher taxonomic group name (like "Felidae", "Primates", "Canidae") and this returns the child species contained within it.',
    inputSchema: {
      type: 'object',
      properties: {
        taxonomicGroup: {
          type: 'string',
          description: 'Higher taxonomic group name (e.g., "Felidae", "Primates", "Ursidae")',
        },
        rows: {
          type: 'number',
          description: 'Number of species to return (default: 20)',
        },
      },
      required: ['taxonomicGroup'],
    },
  },
  {
    name: 'get_geographic_info',
    description: 'Where does it live? Get geographic divisions and jurisdictions where a species is found. Accepts common or scientific names.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Common or scientific name of the organism (e.g., "Polar Bear", "Puma concolor")',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_full_species_profile',
    description: 'Tell me everything about the Komodo Dragon! Gets a comprehensive profile including hierarchy, geography, common names, and synonyms in one go.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Common or scientific name of the organism (e.g., "Komodo Dragon", "Varanus komodoensis")',
        },
      },
      required: ['name'],
    },
  },
];

export function setupToolHandlers(server: Server, itisClient: ITISClient) {
  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools,
    };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'search_itis': {
          const result = await itisClient.search(args as any);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_scientific_name': {
          const { name, rows, start } = args as any;
          const result = await itisClient.searchByScientificName(name, { rows, start });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  searchTerm: name,
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_tsn': {
          const { tsn } = args as any;
          const result = await itisClient.searchByTSN(tsn);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tsn,
                  totalResults: result.response.numFound,
                  results: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_kingdom': {
          const { kingdom, rows, start } = args as any;
          const result = await itisClient.searchByKingdom(kingdom, { rows, start });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  kingdom,
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_rank': {
          const { rank, rows, start } = args as any;
          const result = await itisClient.searchByTaxonomicRank(rank, { rows, start });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  rank,
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'get_hierarchy': {
          const { tsn } = args as any;
          const result = await itisClient.getHierarchy(tsn);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  tsn,
                  hierarchy: result.response.docs,
                }, null, 2),
              },
            ],
          };
        }

        case 'autocomplete_search': {
          const { partialName, rows } = args as any;
          const result = await itisClient.searchWithAutocomplete(partialName, { rows });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  partialName,
                  totalResults: result.response.numFound,
                  suggestions: result.response.docs.map((doc: any) => ({
                    tsn: doc.tsn,
                    name: doc.nameWInd,
                    kingdom: doc.kingdom,
                    rank: doc.rank,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case 'get_statistics': {
          const result = await itisClient.getStatistics();
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  totalRecords: result.response.numFound,
                  lastUpdated: new Date().toISOString(),
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_vernacular_name': {
          const { vernacularName, rows, start } = args as any;
          const result = await itisClient.searchByVernacularName(vernacularName, { rows, start });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  searchTerm: vernacularName,
                  searchType: 'vernacular/common name',
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs.map((doc: any) => ({
                    tsn: doc.tsn,
                    scientificName: doc.nameWInd,
                    kingdom: doc.kingdom,
                    rank: doc.rank,
                    commonNames: processVernacularNames(doc.vernacular, itisClient.language),
                    usage: doc.usage,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case 'explore_taxonomy': {
          const { scientificName, level, rows } = args as any;
          
          // First, get the target organism's details
          const targetResult = await itisClient.searchByScientificName(scientificName);
          if (targetResult.response.numFound === 0) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: `No organism found with scientific name: ${scientificName}`,
                  }, null, 2),
                },
              ],
            };
          }
          
          const target = targetResult.response.docs[0];
          let searchQuery = '';
          let description = '';
          
          switch (level) {
            case 'siblings':
              if (target.unit1) {
                searchQuery = `unit1:"${target.unit1}" AND rank:Species`;
                description = `Other species in genus ${target.unit1}`;
              }
              break;
            case 'family':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const hierarchy = target.hierarchySoFarWRanks[0];
                const familyMatch = hierarchy.match(/Family:([^$]+)/);
                if (familyMatch) {
                  const family = familyMatch[1];
                  searchQuery = `hierarchySoFarWRanks:*Family\\:${family}* AND rank:Species`;
                  description = `Other species in family ${family}`;
                }
              }
              break;
            case 'order':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const hierarchy = target.hierarchySoFarWRanks[0];
                const orderMatch = hierarchy.match(/Order:([^$]+)/);
                if (orderMatch) {
                  const order = orderMatch[1];
                  searchQuery = `hierarchySoFarWRanks:*Order\\:${order}* AND rank:Species`;
                  description = `Other species in order ${order}`;
                }
              }
              break;
            case 'class':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const hierarchy = target.hierarchySoFarWRanks[0];
                const classMatch = hierarchy.match(/Class:([^$]+)/);
                if (classMatch) {
                  const cls = classMatch[1];
                  searchQuery = `hierarchySoFarWRanks:*Class\\:${cls}* AND rank:Species`;
                  description = `Other species in class ${cls}`;
                }
              }
              break;
          }
          
          if (!searchQuery) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    error: `Unable to find taxonomic information for level: ${level}`,
                    target: target,
                  }, null, 2),
                },
              ],
            };
          }
          
          const relatedResult = await itisClient.search({
            query: searchQuery,
            rows: rows || 10,
            sort: 'nameWInd asc'
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  target: {
                    name: target.nameWInd,
                    tsn: target.tsn,
                    rank: target.rank,
                  },
                  exploration: {
                    level: level,
                    description: description,
                    totalResults: relatedResult.response.numFound,
                    results: relatedResult.response.docs.map((doc: any) => ({
                      tsn: doc.tsn,
                      name: doc.nameWInd,
                      kingdom: doc.kingdom,
                      rank: doc.rank,
                      commonNames: processVernacularNames(doc.vernacular, itisClient.language),
                      usage: doc.usage,
                    })),
                  },
                }, null, 2),
              },
            ],
          };
        }

        case 'get_random_species': {
          const args = request.params.arguments as any;
          const { count = 1, requireVernacular = false, vernacularLanguage = 'English', ...filters } = args;
          
          // Limit count to reasonable maximum
          const limitedCount = Math.min(count, 10);
          
          const result = await itisClient.getRandomSpecies({
            ...filters,
            count: limitedCount,
            requireVernacular,
            vernacularLanguage
          });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  searchType: 'random species',
                  filters: filters,
                  requireVernacular,
                  vernacularLanguage,
                  totalPossible: result.response.numFound,
                  results: result.response.docs.map((doc: any) => ({
                    tsn: doc.tsn,
                    scientificName: doc.nameWInd,
                    kingdom: doc.kingdom,
                    rank: doc.rank,
                    commonNames: processVernacularNames(doc.vernacular, vernacularLanguage),
                    hierarchy: doc.hierarchySoFarWRanks?.[0] || '',
                    usage: doc.usage,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case 'search_by_common_name': {
          const { commonName, rows, start } = args as any;
          const result = await itisClient.searchByVernacularName(commonName, { rows, start });
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  searchTerm: commonName,
                  searchType: 'common name',
                  totalResults: result.response.numFound,
                  start: result.response.start,
                  results: result.response.docs.map((doc: any) => ({
                    tsn: doc.tsn,
                    scientificName: doc.nameWInd,
                    kingdom: doc.kingdom,
                    rank: doc.rank,
                    commonNames: processVernacularNames(doc.vernacular, itisClient.language),
                    usage: doc.usage,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case 'find_relatives': {
          const { name, level, rows } = args as any;
          const resolved = await itisClient.resolveNameToTSN(name);
          
          if (!resolved) {
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({ error: `Could not find organism: ${name}` }, null, 2),
                },
              ],
            };
          }

          // Now use explore_taxonomy logic but with the resolved scientific name
          const exploreArgs = { scientificName: resolved.name, level, rows };
          // Call the explore_taxonomy case handler essentially by making a recursive-like call 
          // or just repeating the logic here. Given it's a switch, we'll implement the query.
          const target = resolved.record;
          let searchQuery = '';
          let description = '';
          
          switch (level) {
            case 'siblings':
              if (target.unit1) {
                searchQuery = `unit1:"${target.unit1}" AND rank:Species`;
                description = `Other species in genus ${target.unit1}`;
              }
              break;
            case 'family':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const familyMatch = target.hierarchySoFarWRanks[0].match(/Family:([^$]+)/);
                if (familyMatch) {
                  searchQuery = `hierarchySoFarWRanks:*Family\\:${familyMatch[1]}* AND rank:Species`;
                  description = `Other species in family ${familyMatch[1]}`;
                }
              }
              break;
            case 'order':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const orderMatch = target.hierarchySoFarWRanks[0].match(/Order:([^$]+)/);
                if (orderMatch) {
                  searchQuery = `hierarchySoFarWRanks:*Order\\:${orderMatch[1]}* AND rank:Species`;
                  description = `Other species in order ${orderMatch[1]}`;
                }
              }
              break;
            case 'class':
              if (target.hierarchySoFarWRanks && target.hierarchySoFarWRanks[0]) {
                const classMatch = target.hierarchySoFarWRanks[0].match(/Class:([^$]+)/);
                if (classMatch) {
                  searchQuery = `hierarchySoFarWRanks:*Class\\:${classMatch[1]}* AND rank:Species`;
                  description = `Other species in class ${classMatch[1]}`;
                }
              }
              break;
          }

          if (!searchQuery) {
            return {
              content: [{ type: 'text', text: JSON.stringify({ error: `Unable to find taxonomic information for level: ${level}`, target: resolved.name }, null, 2) }]
            };
          }

          const relatedResult = await itisClient.search({ query: searchQuery, rows: rows || 10, sort: 'nameWInd asc' });
          
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  target: { name: target.nameWInd, tsn: target.tsn, commonNames: processVernacularNames(target.vernacular, itisClient.language) },
                  exploration: {
                    level,
                    description,
                    totalResults: relatedResult.response.numFound,
                    results: relatedResult.response.docs.map((doc: any) => ({
                      tsn: doc.tsn,
                      name: doc.nameWInd,
                      commonNames: processVernacularNames(doc.vernacular, itisClient.language),
                    })),
                  },
                }, null, 2),
              },
            ],
          };
        }

        case 'get_children': {
          const { taxonomicGroup, rows } = args as any;
          try {
            const result = await itisClient.getChildSpecies(taxonomicGroup, { rows });
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify({
                    group: taxonomicGroup,
                    totalSpecies: result.response.numFound,
                    results: result.response.docs.map((doc: any) => ({
                      tsn: doc.tsn,
                      scientificName: doc.nameWInd,
                      commonNames: processVernacularNames(doc.vernacular, itisClient.language)
                    }))
                  }, null, 2),
                },
              ],
            };
          } catch (e: any) {
             return {
              content: [{ type: 'text', text: JSON.stringify({ error: e.message }, null, 2) }]
            };
          }
        }

        case 'get_geographic_info': {
          const { name } = args as any;
          const resolved = await itisClient.resolveNameToTSN(name);
          if (!resolved) {
            return { content: [{ type: 'text', text: JSON.stringify({ error: `Could not find organism: ${name}` }, null, 2) }] };
          }
          const geoInfo = await itisClient.getGeographicDivisions(resolved.tsn);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  name: resolved.name,
                  tsn: resolved.tsn,
                  geographicDivisions: geoInfo.geographicDivisions || []
                }, null, 2),
              },
            ],
          };
        }

        case 'get_full_species_profile': {
          const { name } = args as any;
          const resolved = await itisClient.resolveNameToTSN(name);
          if (!resolved) {
            return { content: [{ type: 'text', text: JSON.stringify({ error: `Could not find organism: ${name}` }, null, 2) }] };
          }
          
          const tsn = resolved.tsn;
          const [geo, synonyms, fullHierarchy] = await Promise.all([
            itisClient.getGeographicDivisions(tsn),
            itisClient.getSynonyms(tsn),
            itisClient.getFullHierarchyFromTSN(tsn)
          ]);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  scientificName: resolved.name,
                  tsn: tsn,
                  rank: resolved.record.rank,
                  commonNames: processVernacularNames(resolved.record.vernacular, itisClient.language),
                  hierarchy: fullHierarchy.hierarchyList || [],
                  geographicDivisions: geo.geographicDivisions || [],
                  synonyms: synonyms.synonyms || [],
                  solrRecord: resolved.record
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });
} 