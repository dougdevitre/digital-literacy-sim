/**
 * @module coach/ai-hints
 *
 * Generates contextual AI-powered hints when users get stuck.
 * Analyzes the current step, the user's history of attempts,
 * and common mistakes to provide targeted, helpful guidance
 * without giving away the answer.
 */

export async function generateHint(
  _stepId: string,
  _attemptCount: number
): Promise<string> {
  // TODO: Implement AI hint generation with progressive disclosure
  throw new Error('Not yet implemented');
}
