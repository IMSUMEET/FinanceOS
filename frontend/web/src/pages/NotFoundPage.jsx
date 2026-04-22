import { Link } from "react-router-dom";
import { Compass, Home } from "lucide-react";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import useDocumentTitle from "../hooks/useDocumentTitle";

function NotFoundPage() {
  useDocumentTitle("Page not found");
  return (
    <section className="flex min-h-[60vh] items-center justify-center pt-2">
      <Card className="max-w-lg text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
          <Compass size={28} />
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-wider text-ink-500 dark:text-ink-400">
          Lost in transit
        </p>
        <h1 className="mt-2 text-3xl font-black text-ink-900 dark:text-ink-50">
          We couldn&apos;t find that page
        </h1>
        <p className="mt-3 text-sm text-ink-500 dark:text-ink-400">
          The link you followed may be broken, or the page may have been moved. Head back to your
          dashboard to keep exploring your spend.
        </p>
        <div className="mt-6 flex justify-center">
          <Link to="/">
            <Button icon={Home}>Take me home</Button>
          </Link>
        </div>
      </Card>
    </section>
  );
}

export default NotFoundPage;
