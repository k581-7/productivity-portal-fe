import './LoadingSpinner.css';
import logoWhite from '../../assets/PP_white.png';

const LoadingSpinner = () => (
  <div className="loading-spinner-container">
    <div className="loading-spinner">
      <img src={logoWhite} alt="Loading" className="spinner-logo" />
    </div>
  </div>
);

export default LoadingSpinner;