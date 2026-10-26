/**
 * Garment analysis provider boundary (prompt §7.1). Background removal, person segmentation and
 * garment parsing are DIFFERENT capabilities and are reported separately. No model ships until the
 * Phase 0 POC passes license + quality + device checks (docs/VISION_POC.md).
 */
import type { GarmentCategory } from '@/domain/categories';

export interface AnalysisCapabilities {
  providerId: string;
  platforms: ('ios' | 'android')[];
  inputs: ('singleItem' | 'outfitPhoto')[];
  backgroundRemoval: boolean;
  personSegmentation: boolean;
  /** Garment classes the model really outputs (empty = no garment parsing). */
  garmentParsingClasses: GarmentCategory[];
  offline: boolean;
  modelVersion: string | null;
  licenseId: string | null;
  recommendedInputLongSide: number | null;
  maxConcurrentJobs: number;
}

export interface SingleItemInput {
  uri: string;
  width: number;
  height: number;
}

export interface SingleItemAnalysis {
  cutoutUri: string | null;
  maskUri: string | null;
  /** Only when the model provides a confidence; never synthesized. */
  suggestedCategory: { value: GarmentCategory; confidence: number | null } | null;
}

export type AnalysisJobStatus = 'queued' | 'running' | 'partial' | 'completed' | 'cancelled' | 'failed';

export interface GarmentCandidate {
  jobId: string;
  candidateId: string;
  cropUri: string;
  maskUri: string | null;
  suggestedCategory: GarmentCategory | null;
  confidence: number | null;
  reviewStatus: 'unreviewed' | 'accepted' | 'rejected';
}

export interface GarmentAnalysisProvider {
  getCapabilities(): Promise<AnalysisCapabilities>;
  analyzeSingleItem(input: SingleItemInput): Promise<SingleItemAnalysis>;
  parseOutfit?(input: SingleItemInput): Promise<GarmentCandidate[]>;
  dispose?(): Promise<void>;
}

/** Default provider: manual flow. Says honestly that nothing is analyzed automatically. */
export const manualProvider: GarmentAnalysisProvider = {
  async getCapabilities() {
    return {
      providerId: 'manual',
      platforms: ['ios', 'android'],
      inputs: ['singleItem'],
      backgroundRemoval: false,
      personSegmentation: false,
      garmentParsingClasses: [],
      offline: true,
      modelVersion: null,
      licenseId: null,
      recommendedInputLongSide: null,
      maxConcurrentJobs: 1,
    };
  },
  async analyzeSingleItem() {
    return { cutoutUri: null, maskUri: null, suggestedCategory: null };
  },
};
