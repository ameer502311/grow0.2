import { normalize_gold_price } from '../services/market_data/priceNormalizer.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('🧪 RUNNING GOLD PRICE NORMALIZER UNIT TESTS...\n');

// 1. Per gram input
const test1 = normalize_gold_price(11540, 'gram', 'INR', '24K', 'TestProvider');
assert(test1.price === 11540 && test1.price_per_gram === 11540 && test1.price_per_10g === 115400 && test1.price_per_8g === 92320, '1. Per gram input normalized correctly');

// 2. Per 10 grams input
const test2 = normalize_gold_price(115400, '10 grams', 'INR', '24K', 'TestProvider');
assert(test2.price_per_gram === 11540 && test2.price_per_10g === 115400 && test2.price_per_8g === 92320, '2. Per 10 grams input normalized correctly');

// 3. Per 8 grams input
const test3 = normalize_gold_price(92320, '8 grams', 'INR', '24K', 'TestProvider');
assert(test3.price_per_gram === 11540 && test3.price_per_10g === 115400 && test3.price_per_8g === 92320, '3. Per 8 grams input normalized correctly');

// 4. Per kilogram input
const test4 = normalize_gold_price(11540000, 'kilogram', 'INR', '24K', 'TestProvider');
assert(test4.price_per_gram === 11540 && test4.price_per_10g === 115400, '4. Per kilogram input normalized correctly');

// 5. Unknown unit
const test5 = normalize_gold_price(1000, 'unobtanium_unit', 'INR', '24K', 'TestProvider');
assert(test5.data_status === 'invalid_unit' && test5.price === 0, '5. Unknown unit rejected safely');

// 6. Invalid currency
const test6 = normalize_gold_price(1000, 'gram', 'XYZ_FAKE', '24K', 'TestProvider');
assert(test6.data_status === 'invalid_currency' && test6.price === 0, '6. Invalid currency rejected safely');

// 7. Null price
const test7 = normalize_gold_price(null, 'gram', 'INR', '24K', 'TestProvider');
assert(test7.data_status === 'invalid_price' && test7.price === 0, '7. Null price rejected safely');

// 8. Negative price
const test8 = normalize_gold_price(-5000, 'gram', 'INR', '24K', 'TestProvider');
assert(test8.data_status === 'invalid_price' && test8.price === 0, '8. Negative price rejected safely');

// 9. Duplicate conversion prevention (verifies exact conversion_applied flag and consistent math)
const test9 = normalize_gold_price(11540, 'gram', 'INR', '24K', 'TestProvider');
assert(test9.conversion_applied === false && test9.price_per_gram === 11540 && test9.price_per_10g === 115400, '9. Single conversion applied, no duplicate scaling');

console.log(`\n📊 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL UNIT TESTS PASSED SUCCESSFULLY!');
}
