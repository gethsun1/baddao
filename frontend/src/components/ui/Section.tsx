import React, { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

type SectionProps = HTMLAttributes<HTMLElement>;

const Section = forwardRef<HTMLElement, SectionProps>(({ className, children, ...props }, ref) => {
  return (
    <section ref={ref} className={cn("py-20 md:py-32 relative", className)} {...props}>
      {children}
    </section>
  );
});
Section.displayName = 'Section';

export { Section };
