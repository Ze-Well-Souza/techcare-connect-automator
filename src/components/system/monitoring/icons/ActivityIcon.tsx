
import React from 'react';

interface ActivityIconProps {
  className?: string;
}

export const ActivityIcon: React.FC<ActivityIconProps> = ({ className }) => {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>;
};

export default ActivityIcon;
