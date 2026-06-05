// AlterU watermark. Drop-in replacement for the legacy aigram.svg slot.
// Memory rule: alteru.svg is natively white, NO `filter: invert()`.
export default function Watermark() {
  return (
    <div className="da-watermark" aria-hidden="true">
      <img src="/the-daily-arcana/alteru.svg" alt="" draggable={false} />
    </div>
  );
}
