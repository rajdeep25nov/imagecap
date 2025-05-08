export default function Footer() {
  return (
    <footer className="border-t">
      <div className="container mx-auto px-4 py-6 text-center text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ImageScribe. All rights reserved.</p>
      </div>
    </footer>
  );
}
