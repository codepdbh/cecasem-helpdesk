import logo from '../../logo.png';

export function BrandLogo({ className = '' }: { className?: string }) {
  return <img src={logo} alt="CECASEM" className={`object-contain ${className}`} />;
}

