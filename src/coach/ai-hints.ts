/**
 * @module coach/ai-hints
 *
 * Generates contextual AI-powered hints when users get stuck.
 * Analyzes the current step, the user's history of attempts,
 * and common mistakes to provide targeted, helpful guidance
 * without giving away the answer.
 */

import type { SkillLevel } from '../types';

/** Difficulty levels that affect hint specificity and pacing. */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/** Configuration for the AI Coach. */
export interface AICoachConfig {
  /** Current difficulty level */
  difficultyLevel?: DifficultyLevel;
  /** Maximum hints to give per step before revealing the answer */
  maxHintsPerStep?: number;
  /** Enable encouragement messages between hints */
  enableEncouragement?: boolean;
  /** Streak threshold for difficulty increase */
  streakThresholdUp?: number;
  /** Failure threshold for difficulty decrease */
  failureThresholdDown?: number;
}

/** A structured hint with metadata. */
export interface Hint {
  text: string;
  level: 'gentle' | 'specific' | 'detailed' | 'answer';
  stepId: string;
  attemptNumber: number;
}

/** Encouragement message tied to a trigger. */
export interface Encouragement {
  message: string;
  trigger: 'first-correct' | 'streak' | 'recovery' | 'milestone' | 'struggling';
}

/**
 * AICoach provides adaptive hints, encouragement, and difficulty
 * adjustment to guide users through simulation scenarios.
 */
export class AICoach {
  private config: Required<AICoachConfig>;
  private hintHistory: Map<string, Hint[]> = new Map();
  private consecutiveCorrect: number = 0;
  private consecutiveIncorrect: number = 0;
  private currentDifficulty: DifficultyLevel;

  constructor(config: AICoachConfig = {}) {
    this.config = {
      difficultyLevel: config.difficultyLevel ?? 'beginner',
      maxHintsPerStep: config.maxHintsPerStep ?? 4,
      enableEncouragement: config.enableEncouragement ?? true,
      streakThresholdUp: config.streakThresholdUp ?? 3,
      failureThresholdDown: config.failureThresholdDown ?? 3,
    };
    this.currentDifficulty = this.config.difficultyLevel;
  }

  /**
   * Get a contextual hint for the current step.
   * Hints become progressively more specific with each attempt.
   *
   * @param stepId - The ID of the current simulation step
   * @param attemptNumber - How many times the user has attempted this step
   * @returns The hint text
   */
  async getHint(stepId: string, attemptNumber: number): Promise<string> {
    const level = this.determineHintLevel(attemptNumber);

    const hint: Hint = {
      text: await this.generateHintText(stepId, level),
      level,
      stepId,
      attemptNumber,
    };

    // Track hint history
    const history = this.hintHistory.get(stepId) ?? [];
    history.push(hint);
    this.hintHistory.set(stepId, history);

    return hint.text;
  }

  /**
   * Adjust difficulty based on user performance.
   * Call after each step completion or failure.
   *
   * @param wasCorrect - Whether the user's latest action was correct
   * @returns The updated difficulty level
   */
  adjustDifficulty(wasCorrect: boolean): DifficultyLevel {
    if (wasCorrect) {
      this.consecutiveCorrect++;
      this.consecutiveIncorrect = 0;

      if (this.consecutiveCorrect >= this.config.streakThresholdUp) {
        this.currentDifficulty = this.promoteDifficulty(this.currentDifficulty);
        this.consecutiveCorrect = 0;
      }
    } else {
      this.consecutiveIncorrect++;
      this.consecutiveCorrect = 0;

      if (this.consecutiveIncorrect >= this.config.failureThresholdDown) {
        this.currentDifficulty = this.demoteDifficulty(this.currentDifficulty);
        this.consecutiveIncorrect = 0;
      }
    }

    return this.currentDifficulty;
  }

  /**
   * Get an encouragement message based on the user's current state.
   *
   * @param trigger - What triggered the encouragement
   * @returns Encouragement message
   */
  encourage(trigger: Encouragement['trigger']): string {
    if (!this.config.enableEncouragement) return '';

    const messages: Record<Encouragement['trigger'], string[]> = {
      'first-correct': [
        'Great job! You got it right on the first try.',
        'Perfect! You clearly understand this step.',
      ],
      'streak': [
        'You are on a roll! Keep it up.',
        'Impressive streak! Your skills are really improving.',
      ],
      'recovery': [
        'You figured it out! Making mistakes is part of learning.',
        'Persistence pays off. Well done!',
      ],
      'milestone': [
        'You have completed a major milestone. Congratulations!',
        'Look how far you have come! You should be proud.',
      ],
      'struggling': [
        'Take your time. There is no rush, and every attempt teaches you something.',
        'This is a tricky step. Many people find it challenging at first.',
        'Remember, this is practice. It is okay to need a few tries.',
      ],
    };

    const options = messages[trigger];
    return options[Math.floor(Math.random() * options.length)];
  }

  /** Get the current difficulty level. */
  getDifficulty(): DifficultyLevel {
    return this.currentDifficulty;
  }

  /** Get the current correct streak count. */
  getStreak(): number {
    return this.consecutiveCorrect;
  }

  /** Reset coach state for a new scenario. */
  reset(): void {
    this.hintHistory.clear();
    this.consecutiveCorrect = 0;
    this.consecutiveIncorrect = 0;
    this.currentDifficulty = this.config.difficultyLevel;
  }

  /**
   * Determine what level of hint to give based on attempt count.
   */
  private determineHintLevel(attemptNumber: number): Hint['level'] {
    if (attemptNumber <= 1) return 'gentle';
    if (attemptNumber <= 2) return 'specific';
    if (attemptNumber <= this.config.maxHintsPerStep - 1) return 'detailed';
    return 'answer';
  }

  /**
   * Generate hint text for a step at a given specificity level.
   * In production this would call an LLM; here we use templates.
   */
  private async generateHintText(
    stepId: string,
    level: Hint['level'],
  ): Promise<string> {
    const templates: Record<Hint['level'], string> = {
      gentle: `Look carefully at the form field and think about what information it is asking for.`,
      specific: `This field needs a specific type of input. Check the placeholder text and help description for clues.`,
      detailed: `Read the help text below the field. It explains exactly what format and information is expected.`,
      answer: `Here is what you need to do: follow the instructions in the help text and fill in the required information.`,
    };

    // Adjust verbosity based on difficulty
    const prefix =
      this.currentDifficulty === 'beginner'
        ? 'No worries! '
        : this.currentDifficulty === 'intermediate'
          ? ''
          : 'Quick hint: ';

    return prefix + templates[level];
  }

  /** Move difficulty up one level. */
  private promoteDifficulty(current: DifficultyLevel): DifficultyLevel {
    if (current === 'beginner') return 'intermediate';
    if (current === 'intermediate') return 'advanced';
    return 'advanced';
  }

  /** Move difficulty down one level. */
  private demoteDifficulty(current: DifficultyLevel): DifficultyLevel {
    if (current === 'advanced') return 'intermediate';
    if (current === 'intermediate') return 'beginner';
    return 'beginner';
  }
}

/** Backwards-compatible function export. */
export async function generateHint(
  stepId: string,
  attemptCount: number,
): Promise<string> {
  const coach = new AICoach();
  return coach.getHint(stepId, attemptCount);
}
