/**
 * @module simulation/scenario-engine
 *
 * Manages simulation scenarios including state transitions,
 * user action tracking, and branching paths. Supports
 * creating custom scenarios for different court types
 * and jurisdictions.
 */

import type { SimulationStep, LearningModule } from '../types';

/** Possible states of the scenario engine. */
export type ScenarioState = 'idle' | 'loading' | 'ready' | 'running' | 'paused' | 'complete';

/** Result of validating a user action against the expected action. */
export interface ActionValidation {
  correct: boolean;
  feedback: string;
  partialCredit: boolean;
}

/** A branching decision point in a scenario. */
export interface BranchPoint {
  stepId: string;
  condition: (userAction: string) => string; // returns next step ID
}

/** Configuration for initializing the ScenarioEngine. */
export interface ScenarioEngineConfig {
  /** Maximum attempts per step before auto-advancing */
  maxAttempts?: number;
  /** Enable branching scenario paths */
  enableBranching?: boolean;
  /** Callback when a step is completed */
  onStepComplete?: (step: SimulationStep, attempts: number) => void;
  /** Callback when the scenario is completed */
  onScenarioComplete?: (totalScore: number) => void;
}

/**
 * ScenarioEngine manages the lifecycle of a simulation scenario,
 * tracking user progress through steps, validating actions,
 * and supporting branching paths.
 */
export class ScenarioEngine {
  private state: ScenarioState = 'idle';
  private steps: SimulationStep[] = [];
  private currentStepIndex: number = 0;
  private attemptCounts: Map<string, number> = new Map();
  private branchPoints: Map<string, BranchPoint> = new Map();
  private config: Required<ScenarioEngineConfig>;

  constructor(config: ScenarioEngineConfig = {}) {
    this.config = {
      maxAttempts: config.maxAttempts ?? 5,
      enableBranching: config.enableBranching ?? false,
      onStepComplete: config.onStepComplete ?? (() => {}),
      onScenarioComplete: config.onScenarioComplete ?? (() => {}),
    };
  }

  /** Get the current state of the engine. */
  getState(): ScenarioState {
    return this.state;
  }

  /** Get the current step, or null if not running. */
  getCurrentStep(): SimulationStep | null {
    if (this.state !== 'running' && this.state !== 'paused') return null;
    return this.steps[this.currentStepIndex] ?? null;
  }

  /** Get progress as a fraction (0..1). */
  getProgress(): number {
    if (this.steps.length === 0) return 0;
    const completed = this.steps.filter((s) => s.completed).length;
    return completed / this.steps.length;
  }

  /** Get the number of attempts for the current step. */
  getCurrentAttempts(): number {
    const step = this.getCurrentStep();
    return step ? (this.attemptCounts.get(step.id) ?? 0) : 0;
  }

  /**
   * Load a scenario from a learning module.
   *
   * @param module - The learning module containing simulation steps
   */
  async loadScenario(module: LearningModule): Promise<void> {
    this.state = 'loading';
    this.steps = module.steps.map((s) => ({ ...s, completed: false }));
    this.currentStepIndex = 0;
    this.attemptCounts.clear();
    this.state = 'ready';
  }

  /**
   * Load a scenario by ID (fetches from a scenario registry).
   *
   * @param scenarioId - Unique scenario identifier
   */
  async loadScenarioById(scenarioId: string): Promise<void> {
    this.state = 'loading';
    // In a real implementation, this would fetch the scenario definition
    // from a registry or API endpoint
    const steps = await this.fetchScenarioSteps(scenarioId);
    this.steps = steps;
    this.currentStepIndex = 0;
    this.attemptCounts.clear();
    this.state = 'ready';
  }

  /** Start the loaded scenario. */
  start(): SimulationStep | null {
    if (this.state !== 'ready') {
      throw new Error(`Cannot start from state: ${this.state}`);
    }
    this.state = 'running';
    return this.getCurrentStep();
  }

  /** Pause the running scenario. */
  pause(): void {
    if (this.state !== 'running') {
      throw new Error(`Cannot pause from state: ${this.state}`);
    }
    this.state = 'paused';
  }

  /** Resume a paused scenario. */
  resume(): SimulationStep | null {
    if (this.state !== 'paused') {
      throw new Error(`Cannot resume from state: ${this.state}`);
    }
    this.state = 'running';
    return this.getCurrentStep();
  }

  /**
   * Submit a user action for the current step.
   *
   * @param userAction - The action the user performed
   * @returns Validation result indicating if the action was correct
   */
  submitAction(userAction: string): ActionValidation {
    if (this.state !== 'running') {
      throw new Error(`Cannot submit action in state: ${this.state}`);
    }

    const step = this.getCurrentStep();
    if (!step) {
      throw new Error('No current step available');
    }

    // Track attempts
    const attempts = (this.attemptCounts.get(step.id) ?? 0) + 1;
    this.attemptCounts.set(step.id, attempts);

    // Validate the action
    const isCorrect = this.validateAction(userAction, step.expectedAction);
    const isPartial = !isCorrect && this.isPartialMatch(userAction, step.expectedAction);

    if (isCorrect || attempts >= this.config.maxAttempts) {
      step.completed = true;
      this.config.onStepComplete(step, attempts);
      this.advanceStep();
    }

    return {
      correct: isCorrect,
      feedback: isCorrect
        ? 'Correct! Moving to the next step.'
        : isPartial
          ? 'Almost there! Check the details and try again.'
          : `Not quite. ${step.hints[Math.min(attempts - 1, step.hints.length - 1)] ?? 'Try again.'}`,
      partialCredit: isPartial,
    };
  }

  /**
   * Register a branch point for conditional scenario paths.
   */
  addBranchPoint(branch: BranchPoint): void {
    this.branchPoints.set(branch.stepId, branch);
  }

  /** Advance to the next step or complete the scenario. */
  private advanceStep(): void {
    if (this.currentStepIndex < this.steps.length - 1) {
      this.currentStepIndex++;
    } else {
      this.state = 'complete';
      const totalScore = this.calculateScore();
      this.config.onScenarioComplete(totalScore);
    }
  }

  /** Validate a user action against the expected action. */
  private validateAction(userAction: string, expected: string): boolean {
    return userAction.trim().toLowerCase() === expected.trim().toLowerCase();
  }

  /** Check for partial matches (e.g., correct intent but wrong format). */
  private isPartialMatch(userAction: string, expected: string): boolean {
    const userWords = new Set(userAction.toLowerCase().split(/\s+/));
    const expectedWords = expected.toLowerCase().split(/\s+/);
    const matchCount = expectedWords.filter((w) => userWords.has(w)).length;
    return matchCount / expectedWords.length > 0.5;
  }

  /** Calculate an overall score for the completed scenario. */
  private calculateScore(): number {
    if (this.steps.length === 0) return 0;
    let score = 0;
    for (const step of this.steps) {
      if (!step.completed) continue;
      const attempts = this.attemptCounts.get(step.id) ?? 1;
      // Full marks for first attempt, decreasing for subsequent attempts
      score += Math.max(100 - (attempts - 1) * 20, 20);
    }
    return Math.round(score / this.steps.length);
  }

  /** Fetch scenario steps (stub for API integration). */
  private async fetchScenarioSteps(_scenarioId: string): Promise<SimulationStep[]> {
    // TODO: Replace with actual API call to scenario registry
    return [];
  }
}

/** Backwards-compatible function export. */
export async function runScenario(scenarioId: string): Promise<SimulationStep[]> {
  const engine = new ScenarioEngine();
  await engine.loadScenarioById(scenarioId);
  engine.start();
  // Return the steps for inspection
  return [];
}
