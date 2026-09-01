import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-3xl font-bold">PayPilot</h1>
      <p className="text-gray-300">
        Split shared expenses, track who owes whom, and let the AI agent settle
        debts through your in-app demo wallet.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-500"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded border border-gray-600 px-4 py-2 font-medium hover:bg-gray-800"
        >
          Register
        </Link>
      </div>
    </main>
  );
}
