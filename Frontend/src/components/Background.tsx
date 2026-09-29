import Aurora from './Aurora';

/** Fixed backdrop: WebGL aurora + dot matrix + vignette + static grain. */
export default function Background() {
  return (
    <div className="bg-stage" aria-hidden="true">
      <Aurora />
      <div className="bg-dots" />
      <div className="bg-vignette" />
      <div className="bg-grain" />
    </div>
  );
}
