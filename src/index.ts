#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { ITISClient } from './itis-client.js';

const server = new Server({
  name: 'itis-mcp',
  version: '1.0.0',
  capabilities: { tools: {} }
});

const itisClient = new ITISClient();

// Define the tools
const tools: Tool[] = [
  {
    name: 'search_itis',
    description: 'Search ITIS database using SOLR queries. Supports general search with flexible query parameters.',
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
    description: 'Search for organisms by their scientific name in ITIS database.',
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
    description: 'Search for organisms by their Taxonomic Serial Number (TSN) in ITIS database.',
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
    description: 'Search for organisms within a specific kingdom in ITIS database.',
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
    description: 'Search for organisms by their taxonomic rank in ITIS database.',
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
    description: 'Get the complete taxonomic hierarchy for a given TSN.',
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
    description: 'Search for organisms with autocomplete functionality using partial names.',
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
    name: 'explore_taxonomy',
    description: 'Explore taxonomic relationships by finding related organisms at different taxonomic levels.',
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
];

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
                  })),
                },
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

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ITIS MCP server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});
