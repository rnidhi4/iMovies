import Modal from './Modal';
import { getYouTubeEmbedUrl } from '../utils/format';

export default function TrailerModal({ url, title, onClose }) {
  const embedUrl = getYouTubeEmbedUrl(url);

  return (
    <Modal title={`${title} - Trailer`} onClose={onClose} size="modal-lg">
      {embedUrl ? (
        <div className="ratio ratio-16x9">
          <iframe
            src={embedUrl}
            title={`${title} trailer`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <p className="mb-0">
          This trailer cannot be played here.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">Watch it in a new tab</a>.
        </p>
      )}
    </Modal>
  );
}
