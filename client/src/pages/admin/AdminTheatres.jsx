import { useState } from 'react';
import { toast } from 'react-toastify';
import { FaEdit, FaPlus, FaTrash } from 'react-icons/fa';
import { deleteScreen, deleteTheatre, fetchAdminTheatres } from '../../api/adminApi';
import { getErrorMessage } from '../../api/http';
import useFetch from '../../hooks/useFetch';
import ConfirmModal from '../../components/ConfirmModal';
import EmptyState from '../../components/EmptyState';
import ErrorState from '../../components/ErrorState';
import Loader from '../../components/Loader';
import ScreenFormModal from '../../components/admin/ScreenFormModal';
import TheatreFormModal from '../../components/admin/TheatreFormModal';

export default function AdminTheatres() {
  const state = useFetch(fetchAdminTheatres, []);
  const [theatreForm, setTheatreForm] = useState(null); // null = closed, {} = add, theatre = edit
  const [screenFormFor, setScreenFormFor] = useState(null); // theatre that gets a new screen
  const [toDelete, setToDelete] = useState(null); // { type: 'theatre' | 'screen', item }
  const [busy, setBusy] = useState(false);

  const confirmDelete = async () => {
    setBusy(true);
    try {
      if (toDelete.type === 'theatre') await deleteTheatre(toDelete.item._id);
      else await deleteScreen(toDelete.item._id);
      toast.success(`${toDelete.type === 'theatre' ? 'Theatre' : 'Screen'} deleted.`);
      setToDelete(null);
      state.refetch(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
      setToDelete(null);
    } finally {
      setBusy(false);
    }
  };

  const refreshAfterSave = () => {
    setTheatreForm(null);
    setScreenFormFor(null);
    state.refetch(true);
  };

  let content;
  if (state.loading) content = <Loader label="Loading theatres..." />;
  else if (state.error) content = <ErrorState title="Could not load theatres" message={getErrorMessage(state.error)} onRetry={state.refetch} />;
  else if (state.data.length === 0) content = <EmptyState title="No theatres yet" message="Add a theatre, then add screens to it." />;
  else {
    content = state.data.map((theatre) => (
      <section className="im-card p-3 p-md-4 mb-3" key={theatre._id} aria-label={theatre.name}>
        <div className="d-flex flex-wrap justify-content-between gap-2">
          <div>
            <h2 className="h5 mb-0">{theatre.name}</h2>
            <p className="small text-muted-im mb-0">{theatre.address}, {theatre.city}</p>
          </div>
          <div className="d-flex gap-2 align-items-start">
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setScreenFormFor(theatre)}><FaPlus className="me-1" aria-hidden="true" />Add screen</button>
            <button type="button" className="btn btn-sm btn-outline-light" onClick={() => setTheatreForm(theatre)} aria-label={`Edit ${theatre.name}`}><FaEdit aria-hidden="true" /></button>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setToDelete({ type: 'theatre', item: theatre })} aria-label={`Delete ${theatre.name}`}><FaTrash aria-hidden="true" /></button>
          </div>
        </div>

        <ul className="list-group list-group-flush mt-3">
          {(theatre.screens || []).length === 0 && <li className="list-group-item bg-transparent text-muted-im small">No screens yet.</li>}
          {(theatre.screens || []).map((screen) => (
            <li className="list-group-item bg-transparent d-flex justify-content-between align-items-center gap-2" key={screen._id}>
              <span>
                <strong>{screen.name}</strong>{' '}
                <span className="small text-muted-im">
                  {screen.totalSeats} seats · {screen.layout.rows.length} rows ({screen.layout.rows.filter((row) => row.tier === 'PREMIUM').length} premium)
                </span>
              </span>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setToDelete({ type: 'screen', item: screen })} aria-label={`Delete ${screen.name} in ${theatre.name}`}><FaTrash aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      </section>
    ));
  }

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="h5 mb-0">Theatres and screens</h2>
        <button type="button" className="btn btn-primary" onClick={() => setTheatreForm({})}><FaPlus className="me-2" aria-hidden="true" />Add theatre</button>
      </div>

      {content}

      {theatreForm && (
        <TheatreFormModal theatre={theatreForm._id ? theatreForm : undefined} onClose={() => setTheatreForm(null)} onSaved={refreshAfterSave} />
      )}
      {screenFormFor && <ScreenFormModal theatre={screenFormFor} onClose={() => setScreenFormFor(null)} onSaved={refreshAfterSave} />}
      {toDelete && (
        <ConfirmModal
          title={`Delete ${toDelete.type}?`}
          message={`"${toDelete.item.name}" will be removed. The server will refuse if it still has ${toDelete.type === 'theatre' ? 'screens or shows' : 'shows'}.`}
          confirmLabel={`Delete ${toDelete.type}`}
          loading={busy}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  );
}
