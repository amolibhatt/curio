import { BookOpen } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FBF9F6] p-6">
      <div className="text-center space-y-6 max-w-sm">
        <div className="mx-auto w-16 h-16 flex items-center justify-center bg-white rounded-full shadow-sm">
          <BookOpen className="w-8 h-8 text-black" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-serif text-[#1C1C1C]" data-testid="text-not-found">Page not found</h1>
        <p className="text-[#909090] font-serif italic">
          Nothing to see here.
        </p>
        <Link href="/">
          <span className="inline-block mt-4 text-xs font-bold tracking-widest uppercase text-[#909090] hover:text-black transition-colors cursor-pointer" data-testid="link-home">
            Back to Curio
          </span>
        </Link>
      </div>
    </div>
  );
}
