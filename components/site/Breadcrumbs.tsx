export function Breadcrumbs({ items }: { items: ReadonlyArray<{ label: string; href?: string }> }) {
  return <nav className="breadcrumbs" aria-label="현재 위치"><ol>{items.map((item, index) => <li key={`${item.label}-${index}`}>{index === items.length - 1 ? <span aria-current="page">{item.label}</span> : <a href={item.href}>{item.label}</a>}</li>)}</ol></nav>;
}
