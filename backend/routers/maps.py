"""
Maps routes
Handles map-related endpoints including offline tile information

Environment Variables:
- None required

Usage:
- GET /api/v1/maps/offline-info - Returns whether server has cached tiles available

Future Extension:
- This endpoint can be extended to check for cached map tiles
- Return tile availability status and cache expiration
"""

from fastapi import APIRouter

router = APIRouter(prefix="/api/v1/maps", tags=["maps"])


@router.get("/offline-info")
async def get_offline_info():
    """
    Returns whether server has cached tiles available
    
    For now, returns cached: false as placeholder.
    Future: Check for cached tiles and return availability status.
    
    Response:
    {
        "cached": false,
        "tiles_available": false,
        "cache_expires_at": null
    }
    """
    # TODO: Implement cache checking logic
    # For now, return false (no cached tiles available)
    return {
        "cached": False,
        "tiles_available": False,
        "cache_expires_at": None
    }

