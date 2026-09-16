import React from 'react';
import { Link } from 'react-router-dom';

type Props = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
};

export function MotionLink({ to, children, className, onClick, ...rest }: Props) {
  return (
    <Link
      to={to}
      className={className}
      onClick={onClick}
      {...rest}
    >
      {children}
    </Link>
  );
}
