/**
 * @module components/MockCourtUI
 *
 * Realistic mock court portal interface component.
 * Mimics common court website patterns so users can
 * practice navigation, filing, and case lookup in
 * a safe environment.
 */

import React from 'react';

export interface MockCourtUIProps {
  /** Jurisdiction to simulate */
  jurisdiction?: string;
  /** Callback when a filing action is completed */
  onFilingComplete?: () => void;
}

export const MockCourtUI: React.FC<MockCourtUIProps> = ({ jurisdiction, onFilingComplete }) => {
  // TODO: Implement mock court portal UI
  return (
    <div data-testid="mock-court-ui">
      <p>Mock Court Portal — {jurisdiction || 'Default'} Jurisdiction</p>
    </div>
  );
};

export default MockCourtUI;
