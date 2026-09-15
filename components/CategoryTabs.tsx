import Link from 'next/link';
import { CATEGORIES } from '@/lib/sources';

export function CategoryTabs({ active }: { active: string }) {
  return (
    <nav className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="mx-auto max-w-5xl px-2 overflow-x-auto">
        <ul className="flex gap-1 whitespace-nowrap">
          {CATEGORIES.map((c) => {
            const href = c.slug === 'top' ? '/' : `/category/${c.slug}`;
            const isActive = c.slug === active;
            return (
              <li key={c.slug}>
                <Link
                  href={href}
                  className={
                    'inline-block px-3 py-2.5 text-sm no-underline border-b-2 ' +
                    (isActive
                      ? 'border-yahoo-red text-yahoo-red font-semibold'
                      : 'border-transparent text-gray-700 hover:text-yahoo-red')
                  }
                >
                  {c.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
