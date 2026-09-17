import { notFound } from 'next/navigation';
import { CategoryPage } from '@/components/content/CategoryPage';
import { calculatorCategories, getCategoryBySlug } from '@/lib/calculators/categories';
import { getCalculatorsByCategory } from '@/lib/calculators/registry';
import { pageMetadata } from '@/lib/seo/site';

export const dynamicParams = false;
type Props = { params: Promise<{ category: string }> };

export function generateStaticParams() {
  return calculatorCategories.map(({ slug }) => ({ category: slug }));
}

export async function generateMetadata({ params }: Props) {
  const category = getCategoryBySlug((await params).category);
  if (!category) notFound();
  return pageMetadata({ title: `${category.label} 계산기`, description: category.description, route: category.route });
}

export default async function Page({ params }: Props) {
  const category = getCategoryBySlug((await params).category);
  if (!category) notFound();
  return <CategoryPage category={category} calculators={getCalculatorsByCategory(category.slug)} />;
}
