# How to Update College Location

## Quick Update

Edit `backend/scripts/generate_fake_data.py` and change these lines:

```python
COLLEGE_LAT = 13.0827  # Your college latitude
COLLEGE_LON = 80.2707  # Your college longitude
```

## Finding Your College Coordinates

### Method 1: Google Maps
1. Open [Google Maps](https://www.google.com/maps)
2. Search for "College of Engineering" or your college name
3. Right-click on the exact location
4. Click on the coordinates that appear (e.g., "13.0827, 80.2707")
5. Copy the latitude and longitude

### Method 2: Mobile App
1. Open Google Maps app
2. Long-press on your college location
3. Coordinates will appear at the bottom
4. Note down latitude and longitude

### Method 3: Online Tools
- Use [LatLong.net](https://www.latlong.net/) to search for your college
- Or use [GPS Coordinates](https://www.gps-coordinates.net/)

## Example Locations

### Common College Locations in Tamil Nadu:
- **Anna University, Chennai**: 13.0115, 80.2356
- **PSG College, Coimbatore**: 11.0168, 77.0069
- **NIT Trichy**: 10.7600, 78.8150
- **IIT Madras**: 12.9915, 80.2337

## After Updating

1. Save the file
2. Run the script again:
   ```bash
   python backend/scripts/generate_fake_data.py
   ```
3. New data will be created at your college location
4. Check the map page to see markers at your college

## Note

The script creates fake data points within ~100 meters of the specified coordinates to simulate multiple sensors across the campus.

