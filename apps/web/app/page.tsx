export default function Home() {
  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-gray-50 dark:bg-black">
      <main className="flex flex-1 w-full max-w-4xl flex-col items-center justify-center py-32 px-16">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
            Operatio
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Multi-tenant uptime monitoring platform
          </p>
          <div className="flex flex-col gap-4 text-center">
            <a
              href="/status"
              className="inline-block px-8 py-3 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors font-medium"
            >
              View Status Pages
            </a>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Access public status pages at /status/[slug]
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
