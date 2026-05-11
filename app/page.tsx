import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full px-6 text-center">
        <h1 className="text-3xl font-bold mb-4">BuildVerify 360</h1>
        <p className="text-gray-600 mb-8">Construction Inspection & Verification Platform</p>
        
        <div className="space-y-3">
          <Link
            href="/projects/demo/steps/10"
            className="block px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-900 transition-colors"
          >
            Open Demo Project
          </Link>
          
          <p className="text-xs text-gray-500">
            Access the Step 10: Rough Framing inspection module
          </p>
        </div>
      </div>
    </main>
  );
}
