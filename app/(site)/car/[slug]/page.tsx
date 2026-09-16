import { notFound } from 'next/navigation';
import { pageMetadata } from '@/lib/seo/site';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';
import { getCalculatorByCategoryAndSlug, getCalculatorsByCategory } from '@/lib/calculators/registry';

export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCalculatorsByCategory('car').map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const definition = getCalculatorByCategoryAndSlug('car', (await params).slug);
  if (!definition) notFound();
  return pageMetadata(definition);
}

export default async function Page({ params }: Props) {
  const definition = getCalculatorByCategoryAndSlug('car', (await params).slug);
  if (!definition) notFound();
  return <CalculatorPage definition={definition}><CalculatorClient key={definition.slug} slug={definition.slug} /></CalculatorPage>;
}
