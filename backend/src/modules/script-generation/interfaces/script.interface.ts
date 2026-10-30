export interface ScriptSceneVisual {
  headline: string;
  subheadline: string;
  tag?: string;
  bullets?: string[];
}

export interface ScriptScene {
  sceneIndex: number;
  title: string;
  narration: string;
  durationSeconds: number;
  visual: ScriptSceneVisual;
  supportingFacts: string[];
}

export interface GeneratedScript {
  candidateId: string;
  candidateName: string;
  headline: string;
  fullNarration: string;
  estimatedDurationSeconds: number;
  scenes: ScriptScene[];
  generatedAt: string;
  isTemplateFallback: boolean;
  connectionsCount?: string;
  companies?: string[];
  profilePictureUrl?: string;
}
