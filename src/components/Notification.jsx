import { useEffect } from 'react';
import './Notification.css';

const Notification = ({ message, type = 'info', onClose, duration = 3000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div className={`notification ${type}`}>
      <span className="message">{message}</span>
      <button className="close" onClick={onClose}>&times;</button>
    </div>
  );
};

export default Notification;