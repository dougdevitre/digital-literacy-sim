/**
 * @module types
 *
 * Core type definitions for the Digital Literacy Simulator.
 * Includes interfaces for skill assessments, learning paths,
 * simulation scenarios, progress records, and achievements.
 */

export interface SkillLevel {
  category: string;
  score: number;
  maxScore: number;
  proficiency: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningPath {
  id: string;
  userId: string;
  modules: LearningModule[];
  currentModuleIndex: number;
  completedAt?: Date;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  steps: SimulationStep[];
}

export interface SimulationStep {
  id: string;
  instruction: string;
  expectedAction: string;
  hints: string[];
  completed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  earnedAt?: Date;
  icon: string;
}
