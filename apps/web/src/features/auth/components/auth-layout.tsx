import Link from "next/link";
import Image from "next/image";
import { Card } from "@operatio/ui/components/ui/card";

export function AuthLayout({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.8fr)]">
      <section className="relative hidden flex-col justify-between overflow-hidden border-r border-border bg-sidebar p-10 lg:flex xl:p-14">
        <Link
          href="/"
          className="flex w-fit items-center"
        >
          <Image src="/logo.svg" alt="Operatio" width={124} height={38} priority />
        </Link>
        <div className="max-w-lg">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.18em] text-brand">
            Uptime monitoring
          </p>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Know when your services need attention.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
            Monitor endpoints, review service history, and keep your team
            informed from one workspace.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Operational visibility for your services.
        </p>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 -right-28 size-[30rem] rounded-full border border-brand/10"
        />
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-[390px]">
          <Link
            href="/"
            className="mb-10 flex w-fit items-center lg:hidden"
          >
            <Image src="/logo.svg" alt="Operatio" width={124} height={38} priority />
          </Link>
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
          <Card className="mt-7 p-5 sm:p-6">{children}</Card>
        </div>
      </section>
    </main>
  );
}
