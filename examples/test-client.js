#!/usr/bin/env node

/**
 * Simple test client for the ITIS MCP server
 * This demonstrates how to use the server programmatically
 */

import { ITISClient, processVernacularNames } from '../dist/itis-client.js';

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
    
    // Test 7: Vernacular name search
    console.log('7. Searching by vernacular name "cougar"...');
    const vernacularResult = await client.searchByVernacularName('cougar', { rows: 3 });
    console.log(`   Found ${vernacularResult.response.numFound} results for "cougar"`);
    vernacularResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (TSN: ${doc.tsn})`);
      if (doc.vernacular && doc.vernacular.length > 0) {
        const commonNames = processVernacularNames(doc.vernacular);
        console.log(`     Common names: ${commonNames.join(', ')}`);
      }
    });
    console.log('');
    
    // Test 8: Custom SOLR query
    console.log('8. Custom SOLR query for tigers...');
    const tigerResult = await client.search({
      query: 'nameWInd:*tiger* AND kingdom:Animalia',
      rows: 3,
      sort: 'nameWInd asc'
    });
    console.log(`   Found ${tigerResult.response.numFound} tiger-related results`);
    tigerResult.response.docs.forEach(doc => {
      console.log(`   - ${doc.nameWInd} (TSN: ${doc.tsn})`);
    });
    
    // Test 9: Random species discovery
    console.log('9. Getting a random bird...');
    const randomBird = await client.getRandomSpecies({
      kingdom: 'Animalia',
      class: 'Aves',
      count: 1,
      requireVernacular: true
    });
    if (randomBird.response.docs.length > 0) {
      const bird = randomBird.response.docs[0];
      console.log(`   Random bird: ${bird.nameWInd} (TSN: ${bird.tsn})`);
      if (bird.vernacular && bird.vernacular.length > 0) {
        const commonNames = processVernacularNames(bird.vernacular);
        console.log(`   Common name: ${commonNames.length > 0 ? commonNames[0] : 'N/A'}`);
      }
    }
    console.log('');
    
    // Test 10: Random plants from rose family
    console.log('10. Getting random plants from Rosaceae (rose family)...');
    const randomPlants = await client.getRandomSpecies({
      kingdom: 'Plantae',
      family: 'Rosaceae',
      count: 2,
      requireVernacular: true
    });
    console.log(`   Found ${randomPlants.response.docs.length} random rose family plants:`);
    randomPlants.response.docs.forEach(plant => {
      console.log(`   - ${plant.nameWInd} (TSN: ${plant.tsn})`);
      if (plant.vernacular && plant.vernacular.length > 0) {
        const commonNames = processVernacularNames(plant.vernacular);
        console.log(`     Common name: ${commonNames.length > 0 ? commonNames[0] : 'N/A'}`);
      }
    });
    
    // Test 11: JSON Web Service - Geographic Divisions
    console.log('11. Getting geographic info for polar bear (TSN 180816)...');
    const geoInfo = await client.getGeographicDivisions('180816');
    if (geoInfo && geoInfo.geographicDivisions) {
      console.log(`   Found ${geoInfo.geographicDivisions.length} geographic divisions:`);
      geoInfo.geographicDivisions.forEach(geo => {
        console.log(`   - ${geo.geographicValue}`);
      });
    }
    console.log('');
    
    // Test 12: Smart Resolver
    console.log('12. Resolving common name "komodo dragon"...');
    const resolved = await client.resolveNameToTSN('komodo dragon');
    if (resolved) {
      console.log(`   Resolved to: ${resolved.name} (TSN: ${resolved.tsn})`);
    } else {
      console.log('   Could not resolve name.');
    }
    console.log('');

    // Test 13: Get Child Species
    console.log('13. Getting child species for Felidae (cat family)...');
    const cats = await client.getChildSpecies('Felidae', { rows: 3 });
    console.log(`   Found ${cats.response.numFound} species in Felidae. First 3:`);
    cats.response.docs.forEach(cat => {
      console.log(`   - ${cat.nameWInd} (TSN: ${cat.tsn})`);
    });

    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();
