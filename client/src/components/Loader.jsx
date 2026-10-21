export default function Loader({ fullPage = false, label = 'Loading...' }) {
  return (
    <div
      className={`d-flex flex-column align-items-center justify-content-center gap-2 ${fullPage ? 'py-5 my-5' : 'py-4'}`}
      role="status"
    >
      <div className="spinner-border text-danger" aria-hidden="true" />
      <span className="text-muted-im">{label}</span>
    </div>
  );
}
