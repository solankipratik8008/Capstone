# Required Image Assets

Please add the following image files to this directory before running the app:

## App Icons

### icon.png
- **Size**: 1024x1024 pixels
- **Purpose**: Main app icon
- **Requirements**: Square, no transparency for iOS

### adaptive-icon.png
- **Size**: 1024x1024 pixels
- **Purpose**: Android adaptive icon foreground
- **Requirements**: Safe zone is inner 72% of icon

### favicon.png
- **Size**: 48x48 pixels
- **Purpose**: Web favicon
- **Format**: PNG with transparency

## Splash Screen

### splash.png
- **Size**: 1284x2778 pixels (recommended)
- **Purpose**: App splash/loading screen
- **Background**: Will use #4A90D9 as configured in app.json

## Placeholder Images

### parking-placeholder.png
- **Size**: 800x600 pixels (recommended)
- **Purpose**: Default image for parking spots without photos
- **Content**: Simple graphic representing a parking space

---

## Quick Setup (Development)

For quick development, you can create simple colored rectangles:

1. Use any image editor (Photoshop, GIMP, Figma)
2. Create squares/rectangles with the app's primary color (#4A90D9)
3. Add simple icons or text if desired
4. Export as PNG

## Online Tools

- [Expo Icon Builder](https://buildicon.netlify.app/)
- [App Icon Generator](https://appicon.co/)
- [Placeholder.com](https://placeholder.com/)

## Production Recommendations

For production release:
1. Design professional icons following platform guidelines
2. Use vector tools (Figma, Sketch, Illustrator) for scalability
3. Test icons on various device sizes
4. Consider dark mode variants
5. Follow [Apple HIG](https://developer.apple.com/design/human-interface-guidelines/app-icons) and [Material Design](https://material.io/design/iconography/product-icons.html) guidelines
