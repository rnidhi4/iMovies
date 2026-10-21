import React , { useEffect, useState } from 'react';
import { POSTER_FALLBACK } from '../utils/constants';

// Shows the poster, or the built-in fallback image if the URL is empty or fails to load.
export default function PosterImage({ src, alt, className = '', ...rest }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <img
      src={!src || failed ? POSTER_FALLBACK : src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
