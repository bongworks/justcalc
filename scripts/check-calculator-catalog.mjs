import { calculators } from '../content/calculators.ts';
import { validateCalculatorCatalog } from '../lib/calculators/catalog.ts';
import { calculatorCategories } from '../lib/calculators/categories.ts';

const categorySlugs = new Set(calculatorCategories.map(({ slug }) => slug));
const errors = validateCalculatorCatalog(calculators, categorySlugs);
errors.forEach((error) => console.error(error));
if (errors.length) process.exitCode = 1;
else console.log(`Catalog OK: ${calculators.length} calculators, each with 2+ examples, sources, limitations and valid related routes.`);
