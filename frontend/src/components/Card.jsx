import React from 'react';

const Card = ({ title, children, className = '', icon: Icon, badge, headerAction }) => {
  return (
    <div className={`racing-card ${className}`}>
      {(title || Icon || badge || headerAction) && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {Icon && (
              <div className="racing-gradient p-2 rounded-lg">
                <Icon className="w-5 h-5 text-white" />
              </div>
            )}
            {title && <h3 className="text-lg font-bold text-white">{title}</h3>}
            {badge && (
              <span className="px-3 py-1 text-xs font-bold bg-racing-red rounded-full text-white">
                {badge}
              </span>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="text-gray-300">{children}</div>
    </div>
  );
};

export default Card;
