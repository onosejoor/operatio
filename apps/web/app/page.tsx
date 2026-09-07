import { Button } from "@operatio/ui/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-background">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-32 px-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900  mb-6">Operatio</h1>
          <p className="text-xl text-gray-600 400 mb-8">
            Multi-tenant uptime monitoring platform
          </p>
          <div className="flex flex-col gap-4 text-center">
            <a
              href="/status"
              className="inline-block px-8 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              View Status Pages
            </a>
            <p className="text-sm text-gray-500 ">
              Access public status pages at /status/[slug]
            </p>
            <Button variant="destructive" size="lg">
              Click me
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
