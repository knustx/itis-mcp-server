import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  Prompt,
} from '@modelcontextprotocol/sdk/types.js';

// Define the prompts
export const prompts: Prompt[] = [
  {
    name: 'complete_taxonomy_profile',
    description: 'Build a complete taxonomic profile for any organism including hierarchy, related species, and classification details',
    arguments: [
      {
        name: 'organism_name',
        description: 'Scientific name of the organism to profile',
        required: true
      }
    ]
  },
  {
    name: 'compare_species_relationships',
    description: 'Compare the taxonomic relationships between multiple species to understand their evolutionary connections',
    arguments: [
      {
        name: 'species_list',
        description: 'Comma-separated list of scientific names to compare',
        required: true
      }
    ]
  },
  {
    name: 'biodiversity_survey',
    description: 'Conduct a biodiversity survey of a specific taxonomic group to understand species diversity and distribution',
    arguments: [
      {
        name: 'taxonomic_group',
        description: 'The taxonomic group to survey (kingdom, phylum, class, order, family, or genus)',
        required: true
      },
      {
        name: 'group_name',
        description: 'Name of the specific taxonomic group',
        required: true
      },
      {
        name: 'sample_size',
        description: 'Number of species to include in detailed analysis (default: 20)',
        required: false
      }
    ]
  },
  {
    name: 'taxonomic_verification_audit',
    description: 'Verify and audit a list of scientific names for taxonomic accuracy and current classification status',
    arguments: [
      {
        name: 'names_to_verify',
        description: 'Comma-separated list of scientific names to verify',
        required: true
      }
    ]
  },
  {
    name: 'taxonomy_teaching_module',
    description: 'Create educational content demonstrating taxonomic principles using real organism examples',
    arguments: [
      {
        name: 'education_level',
        description: 'Target education level: elementary, middle_school, high_school, undergraduate, graduate',
        required: true
      },
      {
        name: 'concept_focus',
        description: 'Specific concept to teach: hierarchy, classification, binomial_nomenclature, evolution, biodiversity',
        required: true
      }
    ]
  }
];

export function setupPromptHandlers(server: Server) {
  // List available prompts
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts,
    };
  });

  // Handle prompt requests
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case 'complete_taxonomy_profile': {
        const organismName = args?.organism_name || 'Homo sapiens';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to build a complete taxonomic profile for ${organismName}. Please:

1. First, use search_by_scientific_name to find the organism and get its TSN and basic information
2. Use get_hierarchy to retrieve the complete taxonomic hierarchy from Kingdom to Species
3. Use explore_taxonomy with level 'siblings' to find other species in the same genus
4. Use explore_taxonomy with level 'family' to find other species in the same family
5. Present the information in a structured format showing:
   - Basic organism details (TSN, scientific name, rank)
   - Complete taxonomic hierarchy
   - Related species at genus level
   - Related species at family level
   - Summary of taxonomic relationships

Format the response as a comprehensive taxonomic report.`
              }
            }
          ]
        };
      }

      case 'compare_species_relationships': {
        const speciesList = args?.species_list || 'Homo sapiens, Pan troglodytes';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to compare the taxonomic relationships between these species: ${speciesList}. Please:

1. For each species in the list, use search_by_scientific_name to get basic taxonomic information
2. For each species, use get_hierarchy to get the complete taxonomic classification
3. Analyze the hierarchies to identify:
   - Shared taxonomic levels (where they diverge in classification)
   - Common ancestors at different taxonomic ranks
   - Degree of relatedness
4. Present a comparative analysis showing:
   - Side-by-side taxonomic classifications
   - Evolutionary relationships and divergence points
   - Shared taxonomic groups
   - Summary of how closely related these species are

Format as a comparative taxonomic analysis with clear relationship mappings.`
              }
            }
          ]
        };
      }

      case 'biodiversity_survey': {
        const taxonomicGroup = args?.taxonomic_group || 'kingdom';
        const groupName = args?.group_name || 'Animalia';
        const sampleSize = args?.sample_size || '20';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to conduct a biodiversity survey of ${taxonomicGroup} ${groupName}. Please:

1. Use the appropriate search tool (search_by_kingdom, search_by_rank, or search_itis with filters) to get an overview of species in this group
2. Get statistics on total number of species using get_statistics or targeted searches
3. Sample ${sampleSize} representative species and for each:
   - Get detailed taxonomic information
   - Retrieve hierarchical classification
4. Analyze patterns in the data:
   - Diversity at different taxonomic levels
   - Representative families/genera
   - Distribution across higher taxonomic groups
5. Present findings as:
   - Executive summary of biodiversity
   - Statistical overview
   - Representative species profiles
   - Taxonomic diversity analysis
   - Conservation implications if relevant

Format as a scientific biodiversity assessment report.`
              }
            }
          ]
        };
      }

      case 'taxonomic_verification_audit': {
        const namesToVerify = args?.names_to_verify || 'Homo sapiens, Tyrannosaurus rex';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to verify the taxonomic accuracy of these scientific names: ${namesToVerify}. Please:

1. For each name, use search_by_scientific_name to check if it exists in ITIS
2. For valid names, use get_hierarchy to confirm current taxonomic classification
3. Use autocomplete_search with partial names to find potential alternatives for invalid names
4. For each name, determine:
   - Validity status (valid/invalid/uncertain)
   - Current accepted classification
   - TSN (Taxonomic Serial Number)
   - Potential synonyms or alternatives
5. Present results as:
   - Summary table of verification results
   - Detailed findings for each name
   - Recommendations for invalid names
   - Standard reference format for valid names

Format as a taxonomic verification report with clear recommendations.`
              }
            }
          ]
        };
      }

      case 'taxonomy_teaching_module': {
        const educationLevel = args?.education_level || 'high_school';
        const conceptFocus = args?.concept_focus || 'hierarchy';
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I need to create educational content about ${conceptFocus} for ${educationLevel} students. Please:

1. Select appropriate example organisms based on education level (familiar species for lower levels, diverse examples for higher levels)
2. Use search_by_scientific_name and get_hierarchy to get complete taxonomic information for examples
3. Use explore_taxonomy to find related species that illustrate key concepts
4. For ${conceptFocus}, develop:
   - Clear explanations with real examples
   - Progressive complexity appropriate to level
   - Interactive elements using the data
   - Assessment questions
5. Present as:
   - Structured lesson plan
   - Example organism profiles
   - Activities and exercises
   - Assessment materials
   - Extension activities

Format as a complete educational module with engaging, level-appropriate content.`
              }
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown prompt: ${name}`);
    }
  });
} 