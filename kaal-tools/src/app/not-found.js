import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4">
        <h2 className="text-2xl font-semibold text-red-600">Product Not Found</h2>
        <p className="text-gray-600">
          Sorry, we couldn&apos;t find the product you&apos;re looking for.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-[var(--maincolor)] text-white rounded-lg hover:opacity-90 transition-all"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
