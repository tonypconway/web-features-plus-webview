import bcd from '@mdn/browser-compat-data' with { type: "json"};
import { features as webFeatures } from 'web-features';
import { FeatureData, FeatureMovedData, FeatureSplitData } from 'web-features/types';

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

const resolveBcdKey = (keyString: string): any =>
  keyString.split(".").reduce((acc: any, key) => acc?.[key], bcd);

const getWebViewSupportVersion = (supportData: any): string | false => {
  return supportData?.partial_implementation === true ? false : supportData?.version_added;
}

const isFeatureSupported = (supportData: any): boolean => {
  if (!supportData) return false;
  const version = supportData.version_added;
  return supportData.partial_implementation !== true && !!version && version !== 'preview';
};

const calculateReleaseGap = (
  mainBrowser: 'chrome_android' | 'safari_ios',
  webviewBrowser: 'webview_android' | 'webview_ios',
  mainVersion: string | boolean | null,
  webviewVersion: string | boolean | null
): ReleaseGap | undefined => {
  if (typeof mainVersion !== 'string' || typeof webviewVersion !== 'string' || mainVersion === 'preview' || webviewVersion === 'preview') {
    return undefined;
  }

  const browsers = bcd.browsers as any;
  const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

  const mainVersionSanitized = mainVersion.split('-')[0];
  const webviewVersionSanitized = webviewVersion.split('-')[0];

  const mainReleaseData = browsers[mainBrowser].releases;
  const webviewReleaseData = browsers[webviewBrowser].releases;

  const mainRelease = mainReleaseData[mainVersionSanitized];
  const webviewRelease = webviewReleaseData[webviewVersionSanitized];

  if (!mainRelease?.release_date || !webviewRelease?.release_date) {
    return undefined;
  }

  const mainDate = new Date(mainRelease.release_date);
  const webviewDate = new Date(webviewRelease.release_date);
  const timeDiff = webviewDate.getTime() - mainDate.getTime();
  const dayDiff = Math.round(timeDiff / (1000 * 60 * 60 * 24));

  const allVersions = Object.keys(mainReleaseData).sort((a, b) => collator.compare(a, b));
  const mainIndex = allVersions.indexOf(mainVersionSanitized);
  const webviewIndex = allVersions.indexOf(webviewVersionSanitized);

  if (mainIndex === -1 || webviewIndex === -1) {
    return undefined;
  }

  const versionsDiff = Math.abs(webviewIndex - mainIndex);
  if (versionsDiff > 0 || dayDiff !== 0) {
    return {
      versions: versionsDiff,
      time: dayDiff
    };
  }

  return undefined;
};

const addWebviewSupport = (feature: FeatureData): FeatureDataPlusWebview => {
  const webview_support: WebviewSupportData = {
    all: "supported",
    android: "supported",
    ios: "supported",
  };

  const compatKeys = feature.status.by_compat_key ?? {};

  const compatKeysBaseline = Object.entries(compatKeys)
    .filter(([, bcdKeyData]) => bcdKeyData.baseline)
    .map(([bcdKey]) => bcdKey);

  for (const bcdKey in compatKeys) {
    const bcdKeyFullData = resolveBcdKey(bcdKey);
    if (!bcdKeyFullData?.__compat?.support) continue;

    const support = bcdKeyFullData.__compat.support;

    // Augment webview_support object
    compatKeys[bcdKey].webview_support = {
      android: getWebViewSupportVersion(support.webview_android),
      ios: getWebViewSupportVersion(support.webview_ios),
      android_gap: calculateReleaseGap(
        'chrome_android',
        'webview_android',
        support.chrome_android?.version_added,
        support.webview_android?.version_added
      ),
      ios_gap: calculateReleaseGap(
        'safari_ios',
        'webview_ios',
        support.safari_ios?.version_added,
        support.webview_ios?.version_added
      ),
    };

    // Check for support discrepancies
    if (isFeatureSupported(support.chrome_android) && !isFeatureSupported(support.webview_android)) {
      webview_support.android = "partial";
      (webview_support.android_unsupported_compat_features ??= []).push(bcdKey);
    }
    if (isFeatureSupported(support.safari_ios) && !isFeatureSupported(support.webview_ios)) {
      webview_support.ios = "partial";
      (webview_support.ios_unsupported_compat_features ??= []).push(bcdKey);
    }
  }

  // Determine overall support status
  if (webview_support.android === "partial" || webview_support.ios === "partial") {
    webview_support.all = "partial";
  }

  const androidUnsupportedBaseline = webview_support.android_unsupported_compat_features?.filter(key => compatKeysBaseline.includes(key)) ?? [];
  if (compatKeysBaseline.length > 0 && androidUnsupportedBaseline.length === compatKeysBaseline.length) {
    webview_support.android = 'unsupported';
  }

  const iosUnsupportedBaseline = webview_support.ios_unsupported_compat_features?.filter(key => compatKeysBaseline.includes(key)) ?? [];
  if (compatKeysBaseline.length > 0 && iosUnsupportedBaseline.length === compatKeysBaseline.length) {
    webview_support.ios = 'unsupported';
  }

  if (webview_support.android === "unsupported" && webview_support.ios === "unsupported") {
    webview_support.all = "unsupported";
  }

  return {
    ...feature,
    webview_support,
    status: {
      ...feature.status,
      by_compat_key: compatKeys,
    },
  };
};

function getWebFeatureWithWebview(feature_id: string): FeatureDataPlusWebview {
  let feature = webFeatures[feature_id];
  if (feature.kind === "moved") {
    const movedFeature = feature as { kind: "moved"; redirect_target: string };
    feature = webFeatures[movedFeature.redirect_target];
  }
  if (feature.kind !== "feature") {
    throw new Error(`Feature with id "${feature_id}" is not of kind "feature".`);
  }

  return addWebviewSupport(feature);
}

function getAllFeaturesWithWebview(): { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } {
  const output: { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } = {};
  Object.entries(webFeatures).forEach(([id, feature]) => {
    if (feature.kind === "feature") {
      let featureWithWebview = getWebFeatureWithWebview(id);
      output[id] = featureWithWebview;
    } else {
      output[id] = feature;
    }
  })
  return output
}

const features: { [key: string]: FeatureDataPlusWebview | FeatureMovedData | FeatureSplitData } = getAllFeaturesWithWebview();

export { features };