# Web Features Plus WebView

This module exports an augmented version of the `features` object exported from `web-features`.

```javascript
import { features } from "web-features-plus-webview";
```

The features object uses the same web feature IDs you can find in `web-features` or the [Web Status dashboard](https://webstatus.dev), but with an additional property added to all objects with `kind: "feature"`:

```javascript
webview_support: {
    all: boolean, // whether the feature is supported in all webviews
    android: boolean, // whether the feature is supported in android webviews
    ios: boolean, // whether the feature is supported in iOS webviews
    // Arrays of @mdn/browser-compat-data keys indicating which features are unsupported by the corresponding webview
    android_unsupported_compat_features?: array,
    ios_unsupported_compat_features?: array,
  }
```

## Installation

```bash
npm install web-features-plus-webview
```

## Building from source

To build the module from source, you need to have Node.js and npm installed.

1. Clone the repository:

```bash
git clone https://github.com/your-username/web-features-plus-webview.git
```

2. Install the dependencies:

```bash
npm install
```

3. Build the module:

```bash
npm run build
```

The built module will be in the `dist` directory.
