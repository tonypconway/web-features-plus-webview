import { FeatureData, FeatureMovedData, FeatureSplitData } from 'web-features/types';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const features = JSON.parse(fs.readFileSync(path.resolve(__dirname, './data.json'), 'utf-8'));

type WebviewSupportData = {
  all: string;
  android: string;
  android_unsupported_compat_features?: string[];
  ios: string;
  ios_unsupported_compat_features?: string[];
}

type ReleaseGap = {
  versions: number;
  time: number;
}

interface FeatureDataPlusWebview extends FeatureData {
  webview_support: WebviewSupportData;
  status: FeatureData['status'] & {
    by_compat_key: {
      [compatKey: string]: NonNullable<FeatureData['status']['by_compat_key']>[string] & {
        webview_support?: {
          android: string | boolean;
          ios: string | boolean;
          android_gap?: ReleaseGap;
          ios_gap?: ReleaseGap;
        }
      }
    }
  }
}

export { features, FeatureDataPlusWebview, FeatureMovedData, FeatureSplitData, WebviewSupportData, ReleaseGap };