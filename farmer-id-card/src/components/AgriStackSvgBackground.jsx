import React from 'react';

/**
 * AgriStackSvgBackground: Renders the authentic, exact background image
 * extracted directly from the official AgriStack Farmer ID Card sample.
 * Provides pixel-perfect fidelity for both Front and Back sides.
 */
export const AgriStackSvgBackground = ({ side = 'front' }) => {
  const imgSrc = side === 'front' ? '/agristack_card_front_exact.jpg' : '/agristack_card_back_exact.jpg';

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none select-none rounded-[16px] overflow-hidden"
      style={{
        boxShadow: 'inset 0 0 0 1px rgba(30, 94, 46, 0.25)'
      }}
    >
      <img
        src={imgSrc}
        alt={`AgriStack ${side} background`}
        className="w-full h-full object-cover select-none"
        style={{
          display: 'block',
          width: '100%',
          height: '100%'
        }}
      />
    </div>
  );
};
