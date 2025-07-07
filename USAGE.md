# ITIS MCP Server - Usage Guide

## Overview

The ITIS MCP Server provides access to the Integrated Taxonomic Information System (ITIS) database through a Model Context Protocol (MCP) interface. ITIS contains taxonomic information for over 970,000 species.

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Test the client:**
   ```bash
   node examples/test-client.js
   ```

4. **Run the MCP server:**
   ```bash
   npm start
   ```

## Available Tools

### 1. General Search (`search_itis`)
Perform flexible SOLR queries against the ITIS database.

**Example usage:**
- Search for all tigers: `query: "nameWInd:*tiger* AND kingdom:Animalia"`
- Search with pagination: `query: "*:*", start: 10, rows: 5`
- Sort results: `query: "kingdom:Plantae", sort: "nameWInd asc"`

### 2. Scientific Name Search (`search_by_scientific_name`)
Find organisms by their exact scientific name.

**Example:** Search for "Homo sapiens" returns detailed information about humans.

### 3. TSN Search (`search_by_tsn`)
Look up organisms by their Taxonomic Serial Number.

**Example:** TSN "180092" returns information about Homo sapiens.

### 4. Kingdom Search (`search_by_kingdom`)
Find organisms within specific kingdoms.

**Available kingdoms:** Animalia, Plantae, Fungi, Bacteria, Archaea, Protozoa, Chromista

### 5. Rank Search (`search_by_rank`)
Search by taxonomic rank.

**Available ranks:** Species, Genus, Family, Order, Class, Phylum, Kingdom

### 6. Hierarchy (`get_hierarchy`)
Get complete taxonomic hierarchy for a given TSN.

**Example:** Shows the full classification from Kingdom to Species.

### 7. Autocomplete (`autocomplete_search`)
Get suggestions for partial scientific names.

**Example:** "Quer" returns Quercus (oak trees) and related names.

### 8. Statistics (`get_statistics`)
Get basic database statistics.

**Returns:** Total number of records in the ITIS database.

### 9. Taxonomy Explorer (`explore_taxonomy`)
Explore related organisms at different taxonomic levels.

**Levels:**
- `siblings`: Other species in the same genus
- `family`: Other species in the same family  
- `order`: Other species in the same order
- `class`: Other species in the same class

## Example Queries

### Find All Cats in the Felidae Family
```json
{
  "tool": "search_itis",
  "arguments": {
    "query": "hierarchySoFarWRanks:*Family:Felidae* AND rank:Species",
    "rows": 20,
    "sort": "nameWInd asc"
  }
}
```

### Explore Human Relatives (Primates)
```json
{
  "tool": "explore_taxonomy",
  "arguments": {
    "scientificName": "Homo sapiens",
    "level": "order",
    "rows": 15
  }
}
```

### Search for Endangered Species with "Tiger" in Name
```json
{
  "tool": "search_itis",
  "arguments": {
    "query": "nameWInd:*tiger* AND kingdom:Animalia",
    "rows": 10
  }
}
```

### Find All Oak Tree Species
```json
{
  "tool": "search_by_scientific_name",
  "arguments": {
    "name": "Quercus",
    "rows": 20
  }
}
```

## Field Reference

### Common ITIS Fields
- `tsn`: Taxonomic Serial Number (unique ID)
- `nameWInd`: Scientific name with indicators
- `nameWOInd`: Scientific name without indicators
- `kingdom`: Kingdom classification
- `unit1`: Genus name
- `unit2`: Species name
- `rank`: Taxonomic rank
- `usage`: Whether the name is valid or invalid
- `taxonAuthor`: Author who first described the species
- `hierarchySoFar`: Complete taxonomic hierarchy
- `parentTSN`: TSN of parent taxon

### Hierarchy Information
- `hierarchySoFarWRanks`: Hierarchy with rank labels
- `hierarchyTSN`: TSNs for each level in hierarchy
- `phyloSort`: Phylogenetic sort order

## Advanced Usage

### Complex SOLR Queries
```
nameWInd:*bear* AND kingdom:Animalia AND rank:Species
tsn:[100000 TO 200000]
kingdom:Plantae AND (rank:Genus OR rank:Species)
```

### Pagination
Use `start` and `rows` parameters for large result sets:
```json
{
  "start": 50,
  "rows": 25
}
```

### Field Selection
Request specific fields only:
```json
{
  "fields": ["tsn", "nameWInd", "kingdom", "rank"]
}
```

## Integration with MCP Clients

Use the provided `mcp-config.json` to integrate with MCP-compatible clients:

```json
{
  "mcpServers": {
    "itis": {
      "command": "node",
      "args": ["C:\\path\\to\\itis-mcp\\dist\\index.js"],
      "description": "ITIS taxonomic database access"
    }
  }
}
```

## Data Source

This server accesses the official ITIS database via their SOLR API at `https://services.itis.gov/`. The database is maintained by the Integrated Taxonomic Information System partnership and is freely accessible.

## Limitations

- Read-only access (no data modification)
- Rate limiting may apply to the ITIS API
- Some historical or deprecated names may not be current
- Geographic distribution data is limited

## Support

For issues with the MCP server, check the error messages returned by the tools. For questions about ITIS data itself, refer to the [official ITIS documentation](https://www.itis.gov/).
