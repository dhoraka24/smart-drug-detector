import os
import json
from openai import OpenAI
from typing import Dict, Any, List, Optional
from datetime import datetime

# Initialize OpenAI clientfu;;image.pngimage.png
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))
MODEL = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")


def build_openai_prompt(
    device_id: str,
    timestamp: str,
    mq3: int,
    mq135: int,
    temp_c: Optional[float],
    humidity_pct: Optional[float],
    lat: Optional[float],
    lon: Optional[float],
    recent_history: List[Dict[str, Any]]
) -> tuple[str, str]:
    """
    Build OpenAI prompt following exact template.
    Returns (system_prompt, user_prompt)
    """
    system_prompt = """You are a safety assistant focused only on detecting **drug-related vapors** (alcohol / narcotic solvents) using MQ3 sensor. Output JSON only."""

    # Format recent_history as JSON list
    history_json = json.dumps(recent_history, default=str)
    
    user_prompt = f"""Telemetry:
- device_id: {device_id}
- timestamp: {timestamp}
- mq3: {mq3}
- mq135: {mq135}
- temp_c: {temp_c}
- humidity_pct: {humidity_pct}
- lat: {lat}
- lon: {lon}
- recent_history: {history_json}

Rules:
1. Decide severity: "SAFE", "WARNING", or "HIGH" following the thresholds above.
2. If SAFE return {{"severity":"SAFE","short_message":"Air is within safe limits.","explanation":"","recommended_action":"","confidence":"high"}}.
3. If WARNING or HIGH produce JSON with keys:
   - severity
   - short_message (max 40 words)
   - explanation (1-2 sentences)
   - recommended_action (short)
   - confidence (high|medium|low)
4. If single abrupt spike with no supporting trend, set confidence "low" and recommend "re-check sensor".
5. Consider MQ135: if MQ135 is high but MQ3 low, mention "other pollutants" in explanation but keep severity following MQ3 rules.
6. Return JSON ONLY, no extra text."""

    return system_prompt, user_prompt


def call_openai(
    device_id: str,
    timestamp: str,
    mq3: int,
    mq135: int,
    temp_c: Optional[float],
    humidity_pct: Optional[float],
    lat: Optional[float],
    lon: Optional[float],
    recent_history: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Call OpenAI API with deterministic settings.
    Returns parsed JSON response or None on error.
    """
    if not client.api_key:
        return None
    
    try:
        system_prompt, user_prompt = build_openai_prompt(
            device_id, timestamp, mq3, mq135, temp_c, humidity_pct, lat, lon, recent_history
        )
        
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.0,
            max_tokens=300
        )
        
        content = response.choices[0].message.content.strip()
        
        # Try to parse JSON from response
        # Remove markdown code blocks if present
        if content.startswith("```"):
            lines = content.split("\n")
            content = "\n".join(lines[1:-1]) if len(lines) > 2 else content
        
        # Parse JSON
        return json.loads(content)
        
    except json.JSONDecodeError as e:
        print(f"OpenAI response JSON parse error: {e}")
        print(f"Response content: {content[:200]}")
        return None
    except Exception as e:
        print(f"OpenAI API error: {e}")
        return None


def get_fallback_alert(severity: str = "WARNING", mq3: int = 0, mq135: int = 0) -> Dict[str, Any]:
    """Return fallback alert when OpenAI fails"""
    # Generate appropriate message based on severity and sensor readings
    if severity == "HIGH":
        short_msg = f"High drug vapor levels detected (MQ3: {mq3}, MQ135: {mq135})"
        explanation = f"Sensor readings indicate elevated drug vapor concentrations. MQ3 reading: {mq3}, MQ135 reading: {mq135}. Immediate attention required."
        action = "Evacuate area and contact authorities immediately"
    elif severity == "WARNING":
        short_msg = f"Possible drug vapor detected (MQ3: {mq3}, MQ135: {mq135})"
        explanation = f"Sensor readings suggest possible drug vapor presence. MQ3 reading: {mq3}, MQ135 reading: {mq135}. Manual verification recommended."
        action = "Investigate area and verify sensor readings"
    else:
        short_msg = "Air quality within normal limits"
        explanation = "Sensor readings are within safe parameters."
        action = "Continue monitoring"
    
    return {
        "severity": severity,
        "short_message": short_msg,
        "explanation": explanation,
        "recommended_action": action,
        "confidence": "medium"
    }

