export default function PageHeader({ title, description }) {
  return (
    <div className="mb-6 flex flex-col gap-1 sm:mb-8">
      <h1 className="text-xl font-semibold tracking-[-0.02em] text-brand-heading sm:text-2xl">{title}</h1>
      {description ? (
        <p className="text-sm text-brand-muted">{description}</p>
      ) : null}
    </div>
  );
}
