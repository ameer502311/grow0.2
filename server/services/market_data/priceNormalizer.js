/**
 * Gold & Precious Metals Price Normalizer & Unit Validator Engine
 */

export function normalize_gold_price(
  arg1,
  raw_unit_arg,
  raw_currency_arg,
  purity_arg,
  provider_arg
) {
  let raw_price, raw_unit, raw_currency, purity, provider, usd_inr_rate, event_timestamp;

  if (typeof arg1 === 'object' && arg1 !== null) {
    ({
      raw_price,
      raw_unit,
      raw_currency = 'INR',
      purity = '24K',
      provider = 'Verified Gold API',
      usd_inr_rate = 83.72,
      event_timestamp = new Date().toISOString()
    } = arg1);
  } else {
    raw_price = arg1;
    raw_unit = raw_unit_arg;
    raw_currency = raw_currency_arg || 'INR';
    purity = purity_arg || '24K';
    provider = provider_arg || 'Verified Gold API';
    usd_inr_rate = 83.72;
    event_timestamp = new Date().toISOString();
  }

  // 1. Validation Guards
  if (typeof raw_price !== 'number' || isNaN(raw_price) || raw_price <= 0) {
    return {
      price: 0,
      currency: raw_currency || 'INR',
      unit: 'gram',
      purity,
      source_unit: raw_unit || 'unknown',
      conversion_applied: false,
      conversion_formula: 'none',
      source: provider,
      data_status: 'invalid_price',
      price_per_gram: 0,
      price_per_8g: 0,
      price_per_10g: 0,
      event_timestamp,
      fetched_timestamp: new Date().toISOString()
    };
  }

  const validCurrencies = ['INR', 'USD'];
  if (!validCurrencies.includes((raw_currency || '').toUpperCase())) {
    return {
      price: 0,
      currency: raw_currency || 'INR',
      unit: 'gram',
      purity,
      source_unit: raw_unit || 'unknown',
      conversion_applied: false,
      conversion_formula: 'none',
      source: provider,
      data_status: 'invalid_currency',
      price_per_gram: 0,
      price_per_8g: 0,
      price_per_10g: 0,
      event_timestamp,
      fetched_timestamp: new Date().toISOString()
    };
  }

  const knownUnits = ['gram', 'g', 'gm', '10 grams', '10g', '8 grams', '8g', 'sovereign', 'kilogram', 'kg', 'troy_ounce', 'troy ounce', 'oz'];
  const normalizedUnit = (raw_unit || '').toLowerCase().trim();
  if (!knownUnits.includes(normalizedUnit)) {
    return {
      price: 0,
      currency: raw_currency,
      unit: 'gram',
      purity,
      source_unit: raw_unit || 'unknown',
      conversion_applied: false,
      conversion_formula: 'none',
      source: provider,
      data_status: 'invalid_unit',
      price_per_gram: 0,
      price_per_8g: 0,
      price_per_10g: 0,
      event_timestamp,
      fetched_timestamp: new Date().toISOString()
    };
  }

  // 2. Currency Conversion (USD/XAU -> INR)
  let priceInINR = raw_price;
  let currencyConversionApplied = false;
  if (raw_currency === 'USD') {
    priceInINR = raw_price * usd_inr_rate;
    currencyConversionApplied = true;
  }

  // 3. Exact Unit Conversion Formula
  const TROY_OZ_GRAMS = 31.1034768;
  let pricePerGram24K = 0;
  let conversionFormula = '';

  if (normalizedUnit === 'troy_ounce' || normalizedUnit === 'oz') {
    pricePerGram24K = priceInINR / TROY_OZ_GRAMS;
    conversionFormula = `${raw_currency} ${raw_price}/oz * ${usd_inr_rate} (USD/INR) / ${TROY_OZ_GRAMS}g`;
  } else if (normalizedUnit === 'gram' || normalizedUnit === 'g' || normalizedUnit === 'gm') {
    pricePerGram24K = priceInINR;
    conversionFormula = `Direct per-gram input`;
  } else if (normalizedUnit === '10 grams' || normalizedUnit === '10g') {
    pricePerGram24K = priceInINR / 10;
    conversionFormula = `${raw_price} / 10`;
  } else if (normalizedUnit === '8 grams' || normalizedUnit === '8g' || normalizedUnit === 'sovereign') {
    pricePerGram24K = priceInINR / 8;
    conversionFormula = `${raw_price} / 8`;
  } else if (normalizedUnit === 'kilogram' || normalizedUnit === 'kg') {
    pricePerGram24K = priceInINR / 1000;
    conversionFormula = `${raw_price} / 1000`;
  }

  // 4. Purity Ratio Mapping
  // 24K = 999/999.9 (1.00 ratio)
  // 22K = 916/916.7 (22/24 ratio)
  // 18K = 750 (18/24 ratio)
  let purityMultiplier = 1.0;
  let isPurityEstimate = false;

  const pur = (purity || '24K').toUpperCase();
  if (pur === '22K' || pur === '916') {
    purityMultiplier = 22 / 24;
    isPurityEstimate = true;
  } else if (pur === '18K' || pur === '750') {
    purityMultiplier = 18 / 24;
    isPurityEstimate = true;
  }

  const finalGramPrice = Math.round(pricePerGram24K * purityMultiplier);
  const final8gPrice = Math.round(finalGramPrice * 8);
  const final10gPrice = Math.round(finalGramPrice * 10);
  const finalKgPrice = Math.round(finalGramPrice * 1000);

  const now = new Date().toISOString();

  return {
    success: true,
    price: finalGramPrice,
    price_per_gram: finalGramPrice,
    price_per_8g: final8gPrice,
    price_per_10g: final10gPrice,
    price_per_kg: finalKgPrice,
    currency: 'INR',
    unit: 'gram',
    purity: pur,
    is_purity_estimate: isPurityEstimate,
    source_unit: raw_unit,
    raw_provider_price: raw_price,
    raw_provider_unit: raw_unit,
    raw_provider_currency: raw_currency,
    conversion_applied: currencyConversionApplied || normalizedUnit !== 'gram',
    conversion_formula: conversionFormula,
    source: provider,
    data_status: 'live',
    event_timestamp: event_timestamp,
    fetched_timestamp: now,
    notice: "National reference price shown. Local jewellery rates & GST may differ."
  };
}
