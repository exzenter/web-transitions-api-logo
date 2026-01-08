# Web Transitions API Logo Demo

A seamless page transition demo using the **View Transitions API** where clicking a logo on a startpage causes it to expand and fill the screen, then shrink to its new position on the destination page.

![Demo](https://raw.githubusercontent.com/exzenter/web-transitions-api-logo/main/preview.gif)

## ✨ Features

- **Smooth Page Transitions** - No black flash between pages using the View Transitions API
- **Expand & Shrink Animation** - Logo grows to cover the screen, then shrinks to hero position
- **Vector-Sharp Scaling** - SVGs remain crisp at any scale with proper CSS optimizations
- **Customizable Per-Logo** - Control scale, X/Y offset for each logo via data attributes
- **Debug Panel** - Press `D` to open real-time controls for tweaking transitions
- **Pure HTML/CSS/JS** - No framework dependencies

## 🚀 Quick Start

1. Clone the repository
2. Open `index.html` in a modern browser (Chrome 111+, Edge 111+, or Safari 18+)
3. Click any logo to see the transition

## 🎛️ Debug Controls

Press **`D`** on your keyboard to toggle the debug panel where you can:

- Select which logo to adjust
- Change the **Scale** multiplier (how large the logo grows)
- Adjust **Offset X/Y** to position which part of the logo covers the screen
- **Preview** the animation without navigating
- **Copy Attributes** to clipboard for use in your HTML

## 📝 Custom Logo Settings

Add data attributes to customize each logo's transition:

```html
<a href="service.html" 
   class="service-link" 
   data-service="myservice" 
   data-color="#FF0000"
   data-scale="25"
   data-offset-x="-30"
   data-offset-y="10">
```

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data-scale` | 15 | Scale multiplier (15 = 1500%) |
| `data-offset-x` | 0 | Horizontal offset % (-100 to 100) |
| `data-offset-y` | 0 | Vertical offset % (-100 to 100) |

## 🔧 How It Works

1. **Click Detection** - `transition.js` intercepts link clicks
2. **Phase 1: Expand** - Logo animates from its position to fill the viewport
3. **Navigation** - Transition data is stored in `sessionStorage`
4. **Page Load** - View Transitions API prevents the flash between pages
5. **Phase 2: Shrink** - New page picks up the expanded logo and shrinks it to hero position

## 📂 File Structure

```
├── index.html          # Startpage with service logos
├── spotify.html        # Example service page
├── youtube.html        # Example service page
├── github.html         # Example service page
├── discord.html        # Example service page
├── figma.html          # Example service page
├── notion.html         # Example service page
├── styles.css          # Styling + View Transitions CSS
├── transition.js       # Transition logic + debug panel
└── README.md
```

## 🌐 Browser Support

Requires View Transitions API support:
- ✅ Chrome 111+
- ✅ Edge 111+
- ✅ Safari 18+
- ❌ Firefox (fallback: standard navigation)

## 📄 License

MIT
