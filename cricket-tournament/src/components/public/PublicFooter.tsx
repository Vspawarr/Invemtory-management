export default function PublicFooter({ contactNumber }: { contactNumber?: string }) {
  return (
    <footer className="mt-auto bg-navy-950 text-white/70">
      <div className="mx-auto max-w-5xl px-4 py-8 text-sm">
        <p className="text-base font-bold text-white">Shivsankalp Yuva Pratishthan</p>
        <p>Open Double Wicket Cricket Tournament &middot; Chapaner (Tekadi), Maharashtra</p>
        {contactNumber && (
          <p className="mt-2">
            Registration contact:{' '}
            <a href={`tel:${contactNumber}`} className="font-semibold text-gold-400">
              {contactNumber}
            </a>
          </p>
        )}
        <p className="mt-4 text-xs text-white/40">
          Organizers&apos; decision on all tournament matters is final.
        </p>
      </div>
    </footer>
  );
}
