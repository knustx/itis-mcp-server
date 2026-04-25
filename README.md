# ITIS MCP Server

A Model Context Protocol (MCP) server for interacting with the ITIS (Integrated Taxonomic Information System) database via their SOLR API.

## Overview

This MCP server provides access to the ITIS database, which contains taxonomic information for hundreds of thousands of species. It uses the ITIS SOLR API to perform searches and retrieve taxonomic data.

## Features

- **Natural Language Answers**: Use specialized tools and prompts to answer everyday questions like "where do polar bears live?" or "what's related to the elephant?"
- **Search by Scientific Name**: Find organisms by their scientific names
- **Search by Vernacular/Common Names**: Find organisms by their common names (e.g., "human", "dog", "oak tree")
- **Search by TSN**: Look up organisms by their Taxonomic Serial Number
- **Search by Kingdom**: Find organisms within specific kingdoms
- **Search by Taxonomic Rank**: Search for organisms of specific ranks
- **Autocomplete Search**: Get suggestions for partial scientific names
- **Hierarchical Data**: Retrieve complete taxonomic hierarchies
- **Geographic Information**: See where species are found
- **General SOLR Search**: Perform flexible searches with custom SOLR queries
- **Random Species Discovery**: Get random species from any taxonomic group with flexible filtering
- **Statistics**: Get database statistics

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

### Natural Language Questions

This server includes special prompts and tools to easily answer common layperson questions:

- **"Tell me about the Komodo Dragon"** -> Uses the `species_profile` prompt and `get_full_species_profile` tool
- **"Where do polar bears live?"** -> Uses the `where_does_it_live` prompt and `get_geographic_info` tool
- **"What are the relatives of the Elephant?"** -> Uses the `animal_relatives` prompt and `find_relatives` tool
- **"What species are in the cat family?"** -> Uses the `whats_in_this_group` prompt and `get_children` tool
- **"How are dogs and wolves related?"** -> Uses the `compare_animals` prompt

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

#### 2. `search_by_scientific_name`
Search for organisms by scientific name.

#### 3. `search_by_common_name`
Search for organisms by their everyday common names (e.g., "dog", "elephant"). This is usually what lay users want when they ask about an animal or plant.

#### 4. `search_by_tsn`
Search by Taxonomic Serial Number.  

#### 5. `search_by_kingdom`
Search within a specific kingdom.

#### 6. `search_by_rank`
Search by taxonomic rank.

#### 7. `get_hierarchy`
Get taxonomic hierarchy for a TSN.

#### 8. `autocomplete_search`
Autocomplete search for partial names.

#### 9. `get_random_species`
Get random species with optional taxonomic filters.

#### 10. `find_relatives`
Show relatives of a specific animal or plant. Accepts common or scientific names.

#### 11. `get_children`
Find all species contained within a larger taxonomic group (e.g., "Felidae").

#### 12. `get_geographic_info`
Find out where an organism lives (geographic divisions). Accepts common or scientific names.

#### 13. `get_full_species_profile`
Get a comprehensive profile including hierarchy, geography, and synonyms in one go.

#### 14. `explore_taxonomy`
Explore taxonomic relationships by finding related organisms at different taxonomic levels.

#### 15. `get_statistics`
Get database statistics.

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
