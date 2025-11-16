"""
Reset rate limiting for login attempts
Run this if you're locked out due to too many login attempts
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.auth import login_attempts

def reset_rate_limit():
    """Clear all rate limit entries"""
    login_attempts.clear()
    print("=" * 60)
    print("Rate limit cleared successfully!")
    print("=" * 60)
    print("You can now try logging in again.")
    print("=" * 60)

if __name__ == "__main__":
    reset_rate_limit()

