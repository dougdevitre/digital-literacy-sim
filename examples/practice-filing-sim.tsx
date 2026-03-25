/**
 * Example: Practice Filing Simulation Component
 *
 * Demonstrates a mock court filing simulation that walks
 * users through filing a small claims case with adaptive
 * AI coaching and progress tracking.
 */

import React, { useState, useCallback } from 'react';
import { ScenarioEngine } from '../src/simulation/scenario-engine';
import { AICoach } from '../src/coach/ai-hints';
import type { SimulationStep, SkillLevel } from '../src/types';

/** Props for the practice filing simulation. */
interface PracticeFilingSimProps {
  /** User's current skill level for adaptive difficulty */
  userSkillLevel: SkillLevel;
  /** Callback when the simulation is completed */
  onComplete?: (score: number) => void;
}

/** A simulated form field in the mock court portal. */
interface MockFormField {
  id: string;
  label: string;
  type: 'text' | 'select' | 'date' | 'textarea';
  placeholder: string;
  helpText: string;
  required: boolean;
}

/** Mock filing form fields for a small claims case. */
const SMALL_CLAIMS_FIELDS: MockFormField[] = [
  {
    id: 'plaintiff-name',
    label: 'Your Full Legal Name (Plaintiff)',
    type: 'text',
    placeholder: 'e.g., Jane Marie Smith',
    helpText: 'Enter your name exactly as it appears on your government ID.',
    required: true,
  },
  {
    id: 'defendant-name',
    label: 'Defendant Full Name',
    type: 'text',
    placeholder: 'e.g., ABC Repairs LLC',
    helpText: 'The person or business you are filing against.',
    required: true,
  },
  {
    id: 'claim-amount',
    label: 'Amount Claimed ($)',
    type: 'text',
    placeholder: 'e.g., 3500.00',
    helpText: 'The dollar amount you are seeking. Small claims limit varies by state.',
    required: true,
  },
  {
    id: 'incident-date',
    label: 'Date of Incident',
    type: 'date',
    placeholder: 'MM/DD/YYYY',
    helpText: 'When the dispute or damage occurred.',
    required: true,
  },
  {
    id: 'description',
    label: 'Brief Description of Claim',
    type: 'textarea',
    placeholder: 'Describe what happened and why you are owed money...',
    helpText: 'Keep it factual and concise. You will have a chance to present details at the hearing.',
    required: true,
  },
];

/**
 * PracticeFilingSim renders a mock court filing portal where users
 * can practice filling out forms with AI coaching support.
 */
const PracticeFilingSim: React.FC<PracticeFilingSimProps> = ({
  userSkillLevel,
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [hint, setHint] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [completed, setCompleted] = useState(false);

  // Initialize the scenario engine and AI coach
  const engine = new ScenarioEngine();
  const coach = new AICoach({ difficultyLevel: userSkillLevel.proficiency });

  const currentField = SMALL_CLAIMS_FIELDS[currentStep];

  const handleFieldChange = useCallback(
    (fieldId: string, value: string) => {
      setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    },
    [],
  );

  const handleNext = useCallback(async () => {
    const value = formValues[currentField.id];

    // Validate the current field
    if (currentField.required && (!value || value.trim() === '')) {
      const newHint = await coach.getHint(
        `fill-${currentField.id}`,
        attempts + 1,
      );
      setHint(newHint);
      setAttempts((a) => a + 1);
      return;
    }

    // Clear hint and advance
    setHint(null);
    setAttempts(0);

    if (currentStep < SMALL_CLAIMS_FIELDS.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setCompleted(true);
      const score = calculateScore(formValues);
      onComplete?.(score);
    }
  }, [currentStep, formValues, currentField, attempts, coach, onComplete]);

  const handleGetHelp = useCallback(async () => {
    const newHint = await coach.getHint(
      `help-${currentField.id}`,
      0,
    );
    setHint(newHint);
  }, [currentField, coach]);

  if (completed) {
    return (
      <div className="sim-complete" role="status">
        <h2>Filing Practice Complete</h2>
        <p>You have successfully practiced filling out a small claims form.</p>
        <p>Score: {calculateScore(formValues)}%</p>
        <button onClick={() => { setCompleted(false); setCurrentStep(0); setFormValues({}); }}>
          Practice Again
        </button>
      </div>
    );
  }

  return (
    <div className="practice-filing-sim" role="form" aria-label="Small Claims Filing Practice">
      {/* Progress indicator */}
      <div className="sim-progress" role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={SMALL_CLAIMS_FIELDS.length}
      >
        <span>Step {currentStep + 1} of {SMALL_CLAIMS_FIELDS.length}</span>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${((currentStep + 1) / SMALL_CLAIMS_FIELDS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current field */}
      <div className="sim-field">
        <label htmlFor={currentField.id}>
          {currentField.label}
          {currentField.required && <span className="required" aria-label="required"> *</span>}
        </label>

        {currentField.type === 'textarea' ? (
          <textarea
            id={currentField.id}
            placeholder={currentField.placeholder}
            value={formValues[currentField.id] ?? ''}
            onChange={(e) => handleFieldChange(currentField.id, e.target.value)}
            rows={4}
            aria-describedby={`${currentField.id}-help`}
          />
        ) : (
          <input
            id={currentField.id}
            type={currentField.type === 'date' ? 'date' : 'text'}
            placeholder={currentField.placeholder}
            value={formValues[currentField.id] ?? ''}
            onChange={(e) => handleFieldChange(currentField.id, e.target.value)}
            aria-describedby={`${currentField.id}-help`}
          />
        )}

        <p id={`${currentField.id}-help`} className="help-text">
          {currentField.helpText}
        </p>
      </div>

      {/* AI Coach hint bubble */}
      {hint && (
        <div className="coach-bubble" role="alert" aria-live="polite">
          <strong>Coach:</strong> {hint}
        </div>
      )}

      {/* Actions */}
      <div className="sim-actions">
        <button onClick={handleGetHelp} className="btn-secondary">
          I need help
        </button>
        <button onClick={handleNext} className="btn-primary">
          {currentStep < SMALL_CLAIMS_FIELDS.length - 1 ? 'Next' : 'Submit Filing'}
        </button>
      </div>
    </div>
  );
};

/** Calculate a simple completion score based on filled fields. */
function calculateScore(values: Record<string, string>): number {
  const filled = SMALL_CLAIMS_FIELDS.filter(
    (f) => values[f.id] && values[f.id].trim().length > 0,
  ).length;
  return Math.round((filled / SMALL_CLAIMS_FIELDS.length) * 100);
}

export default PracticeFilingSim;
