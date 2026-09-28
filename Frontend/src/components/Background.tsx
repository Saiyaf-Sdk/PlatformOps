/** Fixed, animated backdrop: drifting aurora blobs + panning grid + film grain. */
export default function Background() {
  return (
    <div className="bg-stage" aria-hidden="true">
      <div className="bg-blob b1" />
      <div className="bg-blob b2" />
      <div className="bg-blob b3" />
      <div className="bg-grid" />
      <div className="bg-grain" />
    </div>
  );
}
