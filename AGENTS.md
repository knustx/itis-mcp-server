# AGENTS.md

This file provides guidance to AI coding assistants (like Cline, Windsurf, Copilot) when working with code in this repository.

## Project Overview

This is an ITIS (Integrated Taxonomic Information System) MCP Server built with TypeScript and Node.js. It provides access to the ITIS database through a Model Context Protocol (MCP) interface, allowing MCP-compatible clients to search taxonomic information for over 970,000 species.

## Common Commands

### Development Commands
```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build

# Run in development mode (with hot reload)
npm run dev

# Run the built server
npm start

# Test the client functionality
node examples/test-client.js
```

### Testing the Server
The test client requires the project to be built first:
```bash
npm run build
node examples/test-client.js
```

## Architecture and Structure

### Core Components

**`src/index.ts`** - Main server entry point
- Sets up the MCP server using `@modelcontextprotocol/sdk`
- Uses stdio transport for communication
- Orchestrates tool and prompt handlers

**`src/itis-client.ts`** - ITIS API client
- Handles all communication with the ITIS SOLR API at `https://services.itis.gov/`
- Provides typed interfaces for ITIS responses
- Implements specialized search methods (by name, TSN, kingdom, rank, etc.)
- Uses `node-fetch` for HTTP requests

**`src/tools.ts`** - MCP tool definitions and handlers
- Defines 11 tools for different types of taxonomic searches and random discovery
- Maps MCP tool calls to ITISClient methods
- Handles parameter validation and response formatting
- Returns JSON-formatted results
- Includes vernacular (common name) search capabilities
- Features flexible random species discovery with taxonomic filtering

**`src/prompts.ts`** - MCP prompt handlers (referenced but not examined in detail)

### Data Flow
1. MCP client sends request via stdio
2. Server routes to appropriate tool handler in `tools.ts`
3. Tool handler calls corresponding method in `ITISClient`
4. ITISClient formats SOLR query and sends HTTP request to ITIS API
5. Response flows back through the chain, formatted as JSON

### Available MCP Tools
- `search_itis` - General SOLR search with flexible parameters
- `search_by_scientific_name` - Search by exact scientific name
- `search_by_common_name` - Search by common/vernacular names (user-friendly)
- `search_by_vernacular_name` - Search by common/vernacular names (legacy alias)
- `search_by_tsn` - Search by Taxonomic Serial Number
- `search_by_kingdom` - Search within specific kingdoms (Animalia, Plantae, etc.)
- `search_by_rank` - Search by taxonomic rank (Species, Genus, Family, etc.)
- `get_hierarchy` - Get complete taxonomic hierarchy for a TSN
- `autocomplete_search` - Partial name autocomplete
- `get_statistics` - Database statistics
- `explore_taxonomy` - Find related organisms at different taxonomic levels (includes vernacular names)
- `get_random_species` - Get random species with flexible taxonomic filters
- `find_relatives` - Find relatives of any organism by common or scientific name (e.g. "Elephant")
- `get_children` - Find all species contained within a larger taxonomic group (e.g. "Felidae")
- `get_geographic_info` - Find out where an organism lives (geographic divisions)
- `get_full_species_profile` - Get a comprehensive profile (hierarchy, geography, synonyms) for any organism

## Key Technologies and Dependencies

- **TypeScript 5.3+** with ES2022 target and ESNext modules
- **Node.js 18+** required (specified in package.json engines)
- **@modelcontextprotocol/sdk** for MCP server implementation
- **node-fetch** for HTTP requests to ITIS API
- **tsx** for development with TypeScript execution

## MCP Client Configuration

The server communicates via stdin/stdout. Example configuration for MCP clients:

**Claude Desktop (`claude_desktop_config.json`)**:
```json
{
  "mcpServers": {
    "itis": {
      "command": "npx",
      "args": ["-y", "path/to/itis-mcp"]
    }
  }
}
```

## External API Details

- **ITIS SOLR Endpoint**: `https://services.itis.gov/`
- No API key required (public database)
- Uses SOLR query syntax for flexible searches
- Returns paginated results with metadata

## Build System

- TypeScript compilation to `dist/` directory
- Source maps and declarations generated
- ES modules with Node.js resolution
- Main executable: `dist/index.js` with shebang for direct execution

## Development Notes

- The project uses ES modules (`"type": "module"` in package.json)
- All imports use `.js` extensions for compiled compatibility
- Error handling includes network errors and malformed API responses
- Pagination support with `start` and `rows` parameters
- SOLR field filtering and sorting capabilities