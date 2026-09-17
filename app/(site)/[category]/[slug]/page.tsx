import { notFound } from 'next/navigation';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { getCategoryBySlug } from '@/lib/calculators/categories';
import { calculatorDefinitions } from '@/lib/calculators/definitions';
import { getCalculatorByCategoryAndSlug } from '@/lib/calculators/registry';
import { pageMetadata } from '@/lib/seo/site';

export const dynamicParams = false;
type Props = { params: Promise<{ category: string; slug: string }> };

export function generateStaticParams() {
  return calculatorDefinitions.map(({ category, slug }) => ({ category, slug }));
}

async function getDefinition(params: Props['params']) {
  const { category, slug } = await params;
  const registeredCategory = getCategoryBySlug(category);
  if (!registeredCategory) notFound();
  const definition = getCalculatorByCategoryAndSlug(registeredCategory.slug, slug);
  if (!definition) notFound();
  return definition;
}

export async function generateMetadata({ params }: Props) {
  return pageMetadata(await getDefinition(params));
}

export default async function Page({ params }: Props) {
  const definition = await getDefinition(params);
  return <CalculatorPage definition={definition}><CalculatorClient key={definition.slug} slug={definition.slug} /></CalculatorPage>;
}
