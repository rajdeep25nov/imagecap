import Link from 'next/link';
import { LogoIcon } from '@/components/icons/LogoIcon';

export default function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <LogoIcon />
          <h1 className="text-2xl font-bold text-foreground">ImageScribe</h1>
        </Link>
        {/* Future navigation items can go here */}
      </div>
    </header>
  );
}
