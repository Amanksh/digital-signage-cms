import Link from "next/link";
import { ArrowRight, Layers, Monitor, PlayCircle } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="container flex h-16 mx-auto items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            {/* <Monitor className="h-5 w-5" />
            <span>Orion LED</span> */}
            <Image src={"/logo.png"} width={80} height={50} alt="Orion LED" />
          </div>
          <nav className="hidden gap-6 md:flex">
            <Link href="#features" className="text-sm font-medium">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium">
              Pricing
            </Link>
            <Link href="#about" className="text-sm font-medium">
              About
            </Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="container grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-start gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl lg:text-5xl">
              Manage your digital displays <br className="hidden sm:inline" />
              with ease and flexibility
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Create, schedule, and manage content for your digital signage
              network. Upload images, videos, and HTML content, create
              playlists, and preview your displays in real-time.
            </p>
          </div>
          <div className="flex gap-4">
            <Link href="/signup">
              <Button size="lg">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </Link>
          </div>
        </section>
        <section id="features" className="container py-12 md:py-24">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold leading-tight tracking-tighter md:text-4xl">
              Features
            </h2>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Everything you need to manage your digital signage network
            </p>
          </div>
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Asset Management</h3>
              <p className="text-muted-foreground">
                Upload and manage images, videos, and HTML content for your
                displays
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <PlayCircle className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Playlist Creation</h3>
              <p className="text-muted-foreground">
                Create playlists with custom intervals and scheduling options
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
              <div className="rounded-full bg-primary/10 p-3">
                <Monitor className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold">Real-time Preview</h3>
              <p className="text-muted-foreground">
                Preview your displays in real-time before publishing
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} DigitalBoard. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline"
            >
              Privacy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
