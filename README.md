# ITIS MCP Server

A Model Context Protocol (MCP) server for interacting with the ITIS (Integrated Taxonomic Information System) database via their SOLR API.

## Overview

This MCP server provides access to the ITIS database, which contains taxonomic information for hundreds of thousands of species. It uses the ITIS SOLR API to perform searches and retrieve taxonomic data.

## Features

- **Search by Scientific Name**: Find organisms by their scientific names
- **Search by Vernacular/Common Names**: Find organisms by their common names (e.g., "human", "dog", "oak tree")
- **Search by TSN**: Look up organisms by their Taxonomic Serial Number
- **Search by Kingdom**: Find organisms within specific kingdoms
- **Search by Taxonomic Rank**: Search for organisms of specific ranks
- **Autocomplete Search**: Get suggestions for partial scientific names
- **Hierarchical Data**: Retrieve complete taxonomic hierarchies
- **General SOLR Search**: Perform flexible searches with custom SOLR queries
- **Random Species Discovery**: Get random species from any taxonomic group with flexible filtering
- **Statistics**: Get database statistics

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the project:
   ```bash
   npm run build
   ```

## Usage

### As an MCP Server

The server communicates via stdin/stdout and can be used with MCP-compatible clients.

To run the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

### MCP Client Configuration

After building the project, add this configuration to your MCP client:

**Claude Desktop** (`claude_desktop_config.json`):
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

**Cursor/Other MCP Clients**:
```json
{
  "command": "npx",
  "args": ["-y", "path/to/itis-mcp"]
}
```

### Available Tools

#### 1. `search_itis`
General SOLR search with flexible parameters.

**Parameters:**
- `query` (string): SOLR query string (e.g., "nameWInd:Homo*", "kingdom:Plantae")
- `start` (number): Starting index for pagination
- `rows` (number): Number of results to return
- `sort` (string): Sort order
- `fields` (array): Specific fields to return
- `filters` (object): Additional filters

#### 2. `search_by_scientific_name`
Search for organisms by scientific name.

**Parameters:**
- `name` (string, required): Scientific name to search for
- `rows` (number): Number of results to return
- `start` (number): Starting index for pagination

#### 3. `search_by_tsn`
Search by Taxonomic Serial Number.  

**Parameters:**
- `tsn` (string, required): TSN to search for

#### 4. `search_by_kingdom`
Search within a specific kingdom.

**Parameters:**
- `kingdom` (string, required): Kingdom name (e.g., "Animalia", "Plantae")
- `rows` (number): Number of results to return
- `start` (number): Starting index for pagination

#### 5. `search_by_rank`
Search by taxonomic rank.

**Parameters:**
- `rank` (string, required): Taxonomic rank (e.g., "Species", "Genus", "Family")
- `rows` (number): Number of results to return
- `start` (number): Starting index for pagination

#### 6. `get_hierarchy`
Get taxonomic hierarchy for a TSN.

**Parameters:**
- `tsn` (string, required): TSN to get hierarchy for

#### 7. `search_by_vernacular_name`
Search for organisms by their common/vernacular names.

**Parameters:**
- `vernacularName` (string, required): Common/vernacular name to search for
- `rows` (number): Number of results to return
- `start` (number): Starting index for pagination

#### 8. `autocomplete_search`
Autocomplete search for partial names.

**Parameters:**
- `partialName` (string, required): Partial scientific name
- `rows` (number): Number of results to return

#### 9. `get_random_species`
Get random species with optional taxonomic filters.

**Parameters:**
- `kingdom` (string): Kingdom filter (e.g., "Animalia", "Plantae")
- `class` (string): Class filter (e.g., "Mammalia", "Aves")
- `family` (string): Family filter
- `count` (number): Number of species to return (max: 10)
- `requireVernacular` (boolean): Only return species with common names

**Note:** This tool is designed to work with the `random_creature_discovery` prompt, which intelligently interprets free-form requests like "big cats" or "sea birds" and determines the appropriate taxonomic filters.

#### 10. `get_statistics`
Get database statistics.

**Parameters:** None

## Example Queries

Here are some example queries you can use:

### Search for Humans by Scientific Name
```json
{
  "tool": "search_by_scientific_name",
  "arguments": {
    "name": "Homo sapiens"
  }
}
```

### Search for Cougars by Common Name
```json
{
  "tool": "search_by_vernacular_name",
  "arguments": {
    "vernacularName": "cougar"
  }
}
```

### Search for Plants
```json
{
  "tool": "search_by_kingdom",
  "arguments": {
    "kingdom": "Plantae",
    "rows": 5
  }
}
```

### Autocomplete for Oak Trees
```json
{
  "tool": "autocomplete_search",
  "arguments": {
    "partialName": "Quercus"
  }
}
```

### Get Random Birds
```json
{
  "tool": "get_random_species",
  "arguments": {
    "kingdom": "Animalia",
    "class": "Aves",
    "count": 3,
    "requireVernacular": true
  }
}
```

### Get Random Mammals from Carnivora
```json
{
  "tool": "get_random_species",
  "arguments": {
    "kingdom": "Animalia",
    "class": "Mammalia",
    "order": "Carnivora",
    "count": 2,
    "requireVernacular": true
  }
}
```

### Intelligent Creature Discovery
```json
{
  "prompt": "random_creature_discovery",
  "arguments": {
    "creature_type": "big cats",
    "count": 3
  }
}
```

### Discover Sea Birds
```json
{
  "prompt": "random_creature_discovery",
  "arguments": {
    "creature_type": "sea birds",
    "count": 2,
    "focus_area": "diving birds"
  }
}
```

### Get Random Plants
```json
{
  "tool": "get_random_species",
  "arguments": {
    "kingdom": "Plantae",
    "count": 2,
    "requireVernacular": true
  }
}
```

### Custom SOLR Query
```json
{
  "tool": "search_itis",
  "arguments": {
    "query": "nameWInd:*tiger* AND kingdom:Animalia",
    "rows": 10,
    "sort": "nameWInd asc"
  }
}
```

## ITIS Database Fields

The ITIS database contains many fields. Here are the most commonly used ones:

- `tsn`: Taxonomic Serial Number (unique identifier)
- `nameWInd`: Scientific name with indicators
- `kingdom`: Kingdom name
- `phylum`: Phylum name
- `class`: Class name
- `order`: Order name
- `family`: Family name
- `genus`: Genus name
- `species`: Species name
- `author`: Author citation
- `rank`: Taxonomic rank
- `usage`: Usage status (valid, invalid, etc.)
- `credibilityRating`: Data quality rating
- `phyloSort`: Phylogenetic sort order

## SOLR Query Examples

The ITIS SOLR API supports various query types:

- **Exact match**: `nameWInd:"Homo sapiens"`
- **Wildcard**: `nameWInd:Homo*`
- **Range**: `tsn:[1 TO 1000]`
- **Boolean**: `kingdom:Animalia AND rank:Species`
- **Phrase**: `nameWInd:"oak tree"`

## Configuration

The server uses the official ITIS SOLR endpoint:
`https://services.itis.gov/`

No API key is required as the ITIS database is publicly accessible.

## Error Handling

The server includes comprehensive error handling:
- Network errors are caught and reported
- Invalid queries return helpful error messages
- Malformed responses are handled gracefully

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License

## References

- [ITIS Website](https://www.itis.gov/)
- [ITIS SOLR Documentation](https://www.itis.gov/solr_documentation.html)
- [Model Context Protocol](https://modelcontextprotocol.io/)
