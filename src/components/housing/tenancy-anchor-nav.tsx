import { useState, useEffect } from 'react';

interface Section {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface TenancyAnchorNavProps {
  sections: Section[];
}

export function TenancyAnchorNav({ sections }: TenancyAnchorNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? '');

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveId(section.id);
            }
          });
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [sections]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="sticky top-20 w-[110px] shrink-0 border-l pl-3 text-sm">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        导航
      </div>
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => scrollTo(section.id)}
          className={`flex w-full items-center gap-1.5 rounded-sm px-2 py-1.5 text-left text-xs transition-colors ${
            activeId === section.id
              ? 'border-l-2 border-primary pl-1.5 font-semibold text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <span>{section.icon}</span>
          <span>{section.label}</span>
          {section.count !== undefined && (
            <span className="ml-auto text-[10px] text-muted-foreground">
              {section.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
