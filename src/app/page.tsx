import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ImageScribeClient from '@/components/ImageScribeClient';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 flex flex-col items-center">
        <ImageScribeClient />
      </main>
      <Footer />
    </div>
  );
}
