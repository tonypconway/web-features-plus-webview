import { features } from 'web-features-plus-webview'
import { mkConfig, generateCsv } from "export-to-csv";
import { writeFileSync } from 'fs'

const csvConfig = mkConfig({ useKeysAsHeaders: true });

const featureStatuses = {
  high: "2 - widely",
  low: "1 - newly"
}

const dataOut = Object.entries(features)
  .filter(([id, feature]) => feature.kind === 'feature')
  .map(([id, feature]) => {
    return {
      id,
      baseline: feature.status.baseline ? featureStatuses[feature.status.baseline] : "0 - limited",
      webview_all: feature.webview_support.all,
      webview_android: feature.webview_support.android,
      webview_ios: feature.webview_support.ios,
      webview_android_unsupported_compat_features: feature.webview_support.android_unsupported_compat_features ? feature.webview_support.android_unsupported_compat_features.join(", ") : "",
      webview_ios_unsupported_compat_features: feature.webview_support.ios_unsupported_compat_features ? feature.webview_support.ios_unsupported_compat_features.join(", ") : ""
    }
  })

console.log(dataOut);

const csv = generateCsv(csvConfig)(dataOut);

writeFileSync('./output.csv', csv, { encoding: 'utf8' })