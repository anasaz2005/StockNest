import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from './api';

// Load data from an endpoint; returns { data, loading, error, reload }
export function useFetch(url, params) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { setData((await api.get(url, { params })).data); }
    catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, key]);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload };
}

export const Alert = ({ children, kind = 'error' }) => (children ? <div className={'alert ' + kind} role="alert">{children}</div> : null);

export function Modal({ title, onClose, children }) {
  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <div className="modal-head"><h3>{title}</h3><button className="ghost" onClick={onClose}>Close</button></div>
        {children}
      </div>
    </div>
  );
}

export const Field = ({ label, ...props }) => (
  <label className="field"><span>{label}</span><input {...props} /></label>
);

export const PageHead = ({ title, children }) => (
  <div className="pagehead"><h1>{title}</h1><div className="actions">{children}</div></div>
);

export const Empty = ({ children }) => <p className="empty">{children}</p>;
