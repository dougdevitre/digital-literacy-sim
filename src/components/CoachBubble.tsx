/**
 * @module components/CoachBubble
 *
 * AI coach chat bubble component. Displays contextual
 * hints, encouragement, and guidance in a friendly,
 * non-intrusive overlay. Adapts tone and complexity
 * to the user's skill level.
 */

import React from 'react';

export interface CoachBubbleProps {
  /** Message to display */
  message: string;
  /** Type of coach message */
  type?: 'hint' | 'encouragement' | 'instruction';
  /** Whether to show the bubble */
  visible?: boolean;
}

export const CoachBubble: React.FC<CoachBubbleProps> = ({ message, type = 'hint', visible = true }) => {
  // TODO: Implement coach bubble with animations and positioning
  if (!visible) return null;
  return (
    <div data-testid="coach-bubble" data-type={type}>
      <p>{message}</p>
    </div>
  );
};

export default CoachBubble;
