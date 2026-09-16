import { notFound } from 'next/navigation';
import { CalculatorPage } from '@/components/calculator/CalculatorPage';
import { CalculatorClient } from '@/components/calculator/CalculatorClient';
import { getCalculatorByCategoryAndSlug, getCalculatorsByCategory } from '@/lib/calculators/registry';

export const dynamicParams = false;
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getCalculatorsByCategory('finance').map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props) {
  const definition = getCalculatorByCategoryAndSlug('finance', (await params).slug);
  if (!definition) notFound();
  return { title: definition.title, description: definition.description };
}

export default async function Page({ params }: Props) {
  const definition = getCalculatorByCategoryAndSlug('finance', (await params).slug);
  if (!definition) notFound();
  return <CalculatorPage definition={definition}><CalculatorClient key={definition.slug} slug={definition.slug} /></CalculatorPage>;
}
