import { calculators } from '../content/calculators.ts';
import { validateCalculatorCatalog } from '../lib/calculators/catalog.ts';

const errors = validateCalculatorCatalog(calculators);
errors.forEach((error) => console.error(error));
if (errors.length) process.exitCode = 1;
else console.log('Catalog OK: 9 calculators, each with 2+ examples, sources, limitations and valid related routes.');
