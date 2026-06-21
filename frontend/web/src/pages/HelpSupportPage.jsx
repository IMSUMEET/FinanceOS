import { useState } from "react";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";
import HelpSupportAside from "../components/help/HelpSupportAside";
import SupportAttachments from "../components/help/SupportAttachments";
import { submitSupportRequest } from "../services/support";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { Mail, MessageSquare, Send, User } from "lucide-react";

function HelpSupportPage() {
  useDocumentTitle("Help & Support");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setAttachmentError("");
    setBusy(true);
    try {
      await submitSupportRequest({ name, email, subject, message, attachments });
      setSent(true);
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      setAttachments([]);
    } catch (err) {
      setError(err?.message || "Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function pickSubject(topic) {
    setSubject(topic);
    setSent(false);
  }

  function handleAttachmentsChange(next, err) {
    setAttachments(next);
    setAttachmentError(err || "");
    if (err) setError("");
  }

  return (
    <section className="mx-auto max-w-6xl pt-2">
      <Card padding="none" className="overflow-hidden">
        <div className="grid lg:min-h-[640px] lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col border-b border-ink-200/70 p-6 dark:border-ink-700/80 md:p-8 lg:border-b-0 lg:p-10">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-300">
              Help &amp; support
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink-900 dark:text-ink-50">
              How can we help?
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-600 dark:text-ink-300">
              Send us a message about imports, bugs, or feature ideas. Attach screenshots or files
              if helpful — we&apos;ll reply to your email.
            </p>

            <div className="mt-8 flex-1">
              {sent ? (
                <div className="rounded-xl2 bg-emerald-50 px-5 py-6 text-sm font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
                  Thanks — your message was sent. We&apos;ll get back to you soon.
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      icon={User}
                      placeholder="Your name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                    <Input
                      icon={Mail}
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Input
                    placeholder="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                  <div>
                    <label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-500 dark:text-ink-400">
                      <MessageSquare size={14} />
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={8}
                      placeholder="Describe your issue or question…"
                      className="w-full rounded-xl2 border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:ring-2 focus:ring-brand-200 dark:border-ink-600 dark:bg-ink-800/75 dark:text-ink-50 dark:placeholder:text-ink-400 dark:focus:border-brand-500 dark:focus:ring-brand-900/40"
                    />
                  </div>
                  <SupportAttachments
                    attachments={attachments}
                    onChange={handleAttachmentsChange}
                    disabled={busy}
                  />
                  {attachmentError ? (
                    <p className="rounded-xl2 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                      {attachmentError}
                    </p>
                  ) : null}
                  {error ? (
                    <p className="rounded-xl2 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" variant="primary" icon={Send} disabled={busy}>
                    {busy ? "Sending…" : "Send message"}
                  </Button>
                </form>
              )}
            </div>
          </div>

          <HelpSupportAside onPickSubject={pickSubject} />
        </div>
      </Card>
    </section>
  );
}

export default HelpSupportPage;
