import { WifiOff } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-center">
      <div className="w-16 h-16 rounded-full bg-surface-muted flex items-center justify-center mb-6">
        <WifiOff className="w-8 h-8 text-text-secondary" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">You are offline</h1>
      <p className="text-text-secondary max-w-md mb-8">
        It looks like you've lost your connection. DORMDESK requires an active internet connection to load this page. 
        Your pending requests are saved securely on your device and will sync automatically when your connection returns.
      </p>
      <Link href="/" className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
        Try Again
      </Link>
    </div>
  );
}
