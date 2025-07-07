#!/usr/bin/env node

/**
 * Simple test client for the ITIS MCP server
 * This demonstrates how to use the server programmatically
 */

import { ITISClient } from '../dist/itis-client.js';

async function runTests() {
  const client = new ITISClient();
  
  console.log('🧪 Testing ITIS MCP Client\n');
  
  try {
    // Test 1: Search for humans
    console.log('1. Searching for "Homo sapiens"...');
    const humanResult = await client.searchByScientificName('Homo sapiens');
    console.log(`   Found ${humanResult.response.numFound} results`);
    if (humanResult.response.docs.length > 0) {
      const human = humanResult.response.docs[0];
      console.log(`   TSN: ${human.tsn}, Name: ${human.nameWInd}`);
    }
    console.log('');
    
    // Test 2: Search by kingdom
    console.log('2. Searching for animals (first 5 results)...');
    const animalResult = await client.searchByKingdom('Animalia', { rows: 5 });
    console.log(`   Found ${animalResult.response.numFound} total animals`);
    animalResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (TSN: ${doc.tsn})`);
    });
    console.log('');
    
    // Test 3: Autocomplete search
    console.log('3. Autocomplete search for "Quer"...');
    const autocompleteResult = await client.searchWithAutocomplete('Quer', { rows: 5 });
    console.log(`   Found ${autocompleteResult.response.numFound} suggestions`);
    autocompleteResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (${doc.kingdom})`);
    });
    console.log('');
    
    // Test 4: Get hierarchy for a specific TSN
    console.log('4. Getting hierarchy for TSN 180092 (Homo sapiens)...');
    const hierarchyResult = await client.getHierarchy('180092');
    if (hierarchyResult.response.docs.length > 0) {
      const doc = hierarchyResult.response.docs[0];
      console.log(`   Kingdom: ${doc.kingdom || 'N/A'}`);
      console.log(`   Phylum: ${doc.phylum || 'N/A'}`);
      console.log(`   Class: ${doc.class || 'N/A'}`);
      console.log(`   Order: ${doc.order || 'N/A'}`);
      console.log(`   Family: ${doc.family || 'N/A'}`);
      console.log(`   Genus: ${doc.genus || 'N/A'}`);
      console.log(`   Species: ${doc.species || 'N/A'}`);
    }
    console.log('');
    
    // Test 5: Search by rank
    console.log('5. Searching for species (first 3 results)...');
    const speciesResult = await client.searchByTaxonomicRank('Species', { rows: 3 });
    console.log(`   Found ${speciesResult.response.numFound} total species`);
    speciesResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (${doc.kingdom})`);
    });
    console.log('');
    
    // Test 6: Get statistics
    console.log('6. Getting database statistics...');
    const statsResult = await client.getStatistics();
    console.log(`   Total records in ITIS: ${statsResult.response.numFound.toLocaleString()}`);
    console.log('');
    
    // Test 7: Custom SOLR query
    console.log('7. Custom SOLR query for tigers...');
    const tigerResult = await client.search({
      query: 'nameWInd:*tiger* AND kingdom:Animalia',
      rows: 3,
      sort: 'nameWInd asc'
    });
    console.log(`   Found ${tigerResult.response.numFound} tiger-related results`);
    tigerResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (TSN: ${doc.tsn})`);
    });
    
    console.log('\\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
