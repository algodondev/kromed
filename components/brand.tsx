export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brandmark">
      <div className="dot" aria-hidden="true" />
      <div className="txt">
        <strong>Kromed</strong>
        {!compact ? <span>Operacion clinica en un solo sistema</span> : null}
      </div>
    </div>
  );
}
