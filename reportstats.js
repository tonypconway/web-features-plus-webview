import { features } from 'web-features-plus-webview'
import { writeFileSync } from 'node:fs'

// writeFileSync("./output.json", JSON.stringify(features, null, 2), { encoding: 'utf8' });

// console.log(Object.entries(features).find(([id, feature]) => feature.webview_support?.android === false && feature.webview_support?.ios === false))


let outputMessage = ""

const allFeatures = Object.entries(features).filter(([id, feature]) => feature.kind === 'feature');

const allWebviewUnsupportedFeatures = allFeatures.filter(([id, feature]) =>
  feature.webview_support.all === false
)
const androidWebviewUnsupportedFeatures = allFeatures.filter(([id, feature]) =>
  feature.webview_support.android === false
)
const iosWebviewUnsupportedFeatures = allFeatures.filter(([id, feature]) =>
  feature.webview_support.ios === false
)


outputMessage += `Total features:                 ${allFeatures.length}\n`
outputMessage += `All webview unsupported:        ${allWebviewUnsupportedFeatures.length}\n`
outputMessage += `Android webview unsupported:    ${androidWebviewUnsupportedFeatures.length}\n`
outputMessage += `iOS webview unsupported:        ${iosWebviewUnsupportedFeatures.length}\n\n`

const widelyFeatures = allFeatures.filter(([id, feature]) =>
  feature.status.baseline === "high"
);
const widelyWebviewUnsupportedFeatures = widelyFeatures.filter(([id, feature]) =>
  feature.webview_support.all === false
)
const widelyAndroidWebviewUnsupportedFeatures = widelyFeatures.filter(([id, feature]) =>
  feature.webview_support.android === false
)
const widelyIosWebviewUnsupportedFeatures = widelyFeatures.filter(([id, feature]) =>
  feature.webview_support.ios === false
)

outputMessage += `Total Widely features:          ${widelyFeatures.length}\n`
outputMessage += `All webview unsupported:        ${widelyWebviewUnsupportedFeatures.length}\n`
outputMessage += `Android webview unsupported:    ${widelyAndroidWebviewUnsupportedFeatures.length}\n`
outputMessage += `iOS webview unsupported:        ${widelyIosWebviewUnsupportedFeatures.length}\n\n`

const newlyFeatures = allFeatures.filter(([id, feature]) =>
  feature.status.baseline === "low"
);
const newlyWebviewUnsupportedFeatures = newlyFeatures.filter(([id, feature]) =>
  feature.webview_support.all === false
)
const newlyAndroidWebviewUnsupportedFeatures = newlyFeatures.filter(([id, feature]) =>
  feature.webview_support.android === false
)
const newlyIosWebviewUnsupportedFeatures = newlyFeatures.filter(([id, feature]) =>
  feature.webview_support.ios === false
)

outputMessage += `Total newly features:          ${newlyFeatures.length}\n`
outputMessage += `All webview unsupported:       ${newlyWebviewUnsupportedFeatures.length}\n`
outputMessage += `Android webview unsupported:   ${newlyAndroidWebviewUnsupportedFeatures.length}\n`
outputMessage += `iOS webview unsupported:       ${newlyIosWebviewUnsupportedFeatures.length}\n\n`

console.log(outputMessage);