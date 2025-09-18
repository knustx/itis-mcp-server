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
    description: 'Compare the taxonomic relationships between multiple species to understand their connections',
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
  },
  {
    name: 'random_creature_discovery',
    description: 'Intelligently discover random creatures based on free-form descriptions or terms',
    arguments: [
      {
        name: 'creature_type',
        description: 'Free-form description of creatures to discover (e.g., "big cats", "birds of prey", "sea turtles", "poisonous plants", "deep sea fish")',
        required: true
      },
      {
        name: 'count',
        description: 'Number of creatures to discover (default: 3)',
        required: false
      },
      {
        name: 'focus_area',
        description: 'Optional additional focus or constraint (e.g., "tropical", "endangered", "large species")',
        required: false
      }
    ]
  },
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

1. First, try search_by_scientific_name to find the organism. If not found, try search_by_vernacular_name in case it's a common name
2. Use get_hierarchy to retrieve the complete taxonomic hierarchy from Kingdom to Species
3. Use explore_taxonomy with level 'siblings' to find other species in the same genus (results will include vernacular names where available)
4. Use explore_taxonomy with level 'family' to find other species in the same family (results will include vernacular names where available)
5. Present the information in a structured format showing:
   - Basic organism details (TSN, scientific name, rank, common names)
   - Complete taxonomic hierarchy
   - Related species at genus level (with common names where available)
   - Related species at family level (with common names where available)
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
                text: `I need to verify the taxonomic accuracy of these names: ${namesToVerify}. Please:

1. For each name, first try search_by_scientific_name. If not found, try search_by_vernacular_name in case it's a common name
2. For valid names, use get_hierarchy to confirm current taxonomic classification
3. Use autocomplete_search with partial names to find potential alternatives for invalid names
4. For each name, determine:
   - Validity status (valid/invalid/uncertain)
   - Current accepted classification
   - TSN (Taxonomic Serial Number)
   - Common names (vernacular names) where available
   - Potential synonyms or alternatives
5. Present results as:
   - Summary table of verification results
   - Detailed findings for each name (including common names)
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

      case 'random_creature_discovery': {
        const creatureType = args?.creature_type || 'any';
        const count = args?.count || '3';
        const focusArea = args?.focus_area || '';
        
        return {
          messages: [
            {
              role: 'user',
              content: {
                type: 'text',
                text: `I want to discover ${count} random creatures related to "${creatureType}"${focusArea ? ` with focus on "${focusArea}"` : ''}. Please help me find these creatures intelligently:

**Step 1: Understand the Request**
First, interpret what "${creatureType}" means:
- If it's a general term like "big cat", "bird of prey", "sea turtle", etc., use search_by_vernacular_name or search_itis to find relevant species and identify their taxonomic characteristics
- If it's already a taxonomic term like "Mammalia" or "Carnivora", use that directly
- If it's a specific species name, find related species in the same taxonomic group

**Step 2: Determine Search Strategy**
Based on your understanding, decide the best approach:
- Use search_by_vernacular_name if the term is likely a common name
- Use search_itis with appropriate queries to find taxonomic patterns
- Use autocomplete_search if you need to explore partial matches

**Step 3: Extract Taxonomic Context**
From your search results, identify:
- What kingdom, phylum, class, order, family, or genus these creatures belong to
- What taxonomic filters would capture similar creatures

**Step 4: Get Random Species**
Use get_random_species with the taxonomic filters you discovered:
- Set appropriate kingdom, class, order, family, or genus filters based on Step 3
- Set count to ${count}
- Set requireVernacular to true for better results

**Step 5: Present Results**
For each creature discovered, provide:
- Scientific name and common names
- Brief description of what makes this species interesting
- How it relates to the original "${creatureType}" request
- Habitat and distribution information if available
- Fun facts or unique characteristics
- Taxonomic classification context

**Example Process:**
If user asks for "big cats":
1. Search for "big cat" to understand it refers to large felids
2. Discover these are typically in family Felidae, subfamily Pantherinae
3. Use get_random_species with family="Felidae" and appropriate size/genus filters
4. Present results explaining how each species fits the "big cat" concept

Make this an intelligent, educational discovery process that adapts to any creature type request!`
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
