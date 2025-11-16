# Offline Map Placeholder

## Instructions

Place an offline map image at: `frontend/public/offline_map.jpg`

### Option 1: Use a Simple Grid Image
Create a 512x512 or 1024x1024 image with:
- Gray background (#f3f4f6)
- Grid lines (every 50-100 pixels)
- Optional: "Offline Map" text in center

### Option 2: Use a Cached Map Tile
1. Take a screenshot of your map area
2. Save as `offline_map.jpg`
3. Place in `frontend/public/` directory

### Option 3: Generate Programmatically
You can create a simple SVG and convert to JPG:

```html
<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
  <rect width="1024" height="1024" fill="#f3f4f6"/>
  <!-- Grid lines -->
  <line x1="0" y1="0" x2="1024" y2="0" stroke="#d1d5db" stroke-width="2"/>
  <!-- Add more grid lines as needed -->
  <text x="512" y="512" text-anchor="middle" font-size="48" fill="#6b7280">Offline Map</text>
</svg>
```

### Quick Test Image
For testing, you can use any image file (even a 1x1 pixel) and rename it to `offline_map.jpg`. The map will show a placeholder if the image fails to load.

## Current Status
The Map component will automatically:
1. Show offline map when tiles fail to load
2. Show offline map when `prefer_offline_map` preference is enabled
3. Display markers on top of the offline map
4. Show "Offline map (cached view)" notification

