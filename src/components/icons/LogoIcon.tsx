import type { SVGProps } from 'react';
import { Captions } from 'lucide-react';

export function LogoIcon(props: SVGProps<SVGSVGElement>) {
  return <Captions className="h-8 w-8 text-primary" {...props} />;
}
