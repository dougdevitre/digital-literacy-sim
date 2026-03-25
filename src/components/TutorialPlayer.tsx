/**
 * @module components/TutorialPlayer
 *
 * Step-by-step tutorial playback component. Renders
 * instructions, highlights target UI elements, and
 * validates user actions in real time. Supports pause,
 * rewind, and skip functionality.
 */

import React from 'react';

export interface TutorialPlayerProps {
  /** Tutorial module to play */
  moduleId: string;
  /** Callback when tutorial is completed */
  onComplete?: () => void;
}

export const TutorialPlayer: React.FC<TutorialPlayerProps> = ({ moduleId, onComplete }) => {
  // TODO: Implement step-by-step tutorial player
  return (
    <div data-testid="tutorial-player">
      <p>Tutorial Player — Module: {moduleId}</p>
    </div>
  );
};

export default TutorialPlayer;
