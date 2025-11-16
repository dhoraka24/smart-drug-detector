/*

  esp32_drug_detector_corrected.ino

  Corrected & improved version — English comments & full code.

  - MQ3 (GPIO34) and MQ135 (GPIO35) analog sensors

  - DHT22 (GPIO4) optional

  - GPS NEO-6M (RX2=16, TX2=17) optional

  - OLED SSD1306 I2C optional

  - LEDs: Green=14, Yellow=12, Red=13

  - Buzzer: 27

  - WiFi + HTTP POST telemetry with header x-api-key

*/



#include <Arduino.h>

#include <stdlib.h>        // for malloc/free

#include <WiFi.h>

#include <HTTPClient.h>

#include <ArduinoJson.h>

#include <TinyGPSPlus.h>

#include <Wire.h>

#include <Adafruit_GFX.h>

#include <Adafruit_SSD1306.h>



#if defined(ARDUINO_ARCH_ESP32)

  // ok

#else

  #error This sketch targets ESP32

#endif



/* ========== USER CONFIG ========== */

// WiFi

const char* WIFI_SSID = "Galaxy A23 5G FD99";

const char* WIFI_PASS = "12345678";



// Backend

// ⚠️ IMPORTANT: Replace with your actual backend IP address and port

// Example: "http://192.168.1.100:8000/api/v1/telemetry"

// Or if using HTTPS: "https://your-backend.example.com/api/v1/telem

const String BACKEND_URL = "http://10.249.151.102:8000/api/v1/telemetry";

const String DEVICE_ID = "esp32-drug-001";

// ⚠️ IMPORTANT: Replace with the DEVICE_API_KEY from your backend .env file

// This must match the DEVICE_API_KEY in backend/.env

const String DEVICE_API_KEY = "esp32-secure-key-2024";



// Feature flags

#define USE_DHT 1

#define USE_GPS 1

#define USE_OLED 1



// Timing & sampling

const int LOOP_DELAY_MS = 1500;

const unsigned long SEND_COOLDOWN_SECONDS = 300;

const int ADC_SAMPLE_COUNT = 11; 

const int CALIBRATION_SECONDS = 10;

const int SUSTAINED_REQUIRED = 3;



// Thresholds (adjust after testing)

const int MQ3_DELTA_WARNING = 60;

const int MQ3_DELTA_DANGER  = 150;

const int MQ135_CORROBORATE_THRESHOLD = 80;



/* ========== PIN ASSIGNMENTS ========== */

const int MQ3_PIN = 34;

const int MQ135_PIN = 35;



#if USE_DHT

  #include "DHT.h"

  #define DHTPIN 4

  #define DHTTYPE DHT22

  DHT dht(DHTPIN, DHTTYPE);

#endif



// LEDs and buzzer

const int LED_GREEN = 14;

const int LED_YELLOW = 12;

const int LED_RED = 13;

const int BUZZER_PIN = 27;



/* ========== OLED SETUP ========== */

#if USE_OLED

  #define SCREEN_WIDTH 128

  #define SCREEN_HEIGHT 64

  Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, -1);

  const uint8_t OLED_ADDR = 0x3C;

  bool oledAvailable = false;

#endif



/* ========== GPS OBJECT ========== */

#if USE_GPS

  HardwareSerial gpsSerial(2); 

  TinyGPSPlus gps;

#endif



/* ========== STATE ========== */

enum State { SAFE, WARNING, DANGER };

State currentState = SAFE;

State lastSentState = SAFE;



unsigned long lastSentTime = 0; // seconds

unsigned long bootMillis = 0;



/* ========== BASELINES ========== */

int baselineMQ3 = -1;

int baselineMQ135 = -1;



/* ========== FUNCTION PROTOTYPES ========== */

void connectWiFi();

int readAnalogMedian(int pin, int samples);

void applyOutputs(State s);

bool sendTelemetryAndAlert(int mq3, int mq135, float tempC, float hum, double lat, double lon, const String &alertMessage);

String isoTimestampUTC();

void updateOLED(int mq3, int mq135, float tempC, float hum, State s, double lat, double lon);



/* ============================================================= */

/* ============================ SETUP ============================ */

/* ============================================================= */

void setup() {

  Serial.begin(115200);

  delay(100);



  Serial.println("=== ESP32 Drug Detector Booting ===");



  // ADC RANGE

  analogSetPinAttenuation(MQ3_PIN, ADC_11db);

  analogSetPinAttenuation(MQ135_PIN, ADC_11db);



  // Output pins

  pinMode(LED_GREEN, OUTPUT);

  pinMode(LED_YELLOW, OUTPUT);

  pinMode(LED_RED, OUTPUT);

  pinMode(BUZZER_PIN, OUTPUT);



  digitalWrite(LED_GREEN, LOW);

  digitalWrite(LED_YELLOW, LOW);

  digitalWrite(LED_RED, LOW);

  digitalWrite(BUZZER_PIN, LOW);



#if USE_DHT

  dht.begin();

#endif



#if USE_GPS

  gpsSerial.begin(9600, SERIAL_8N1, 16, 17);

#endif



#if USE_OLED

  if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDR)) {

    Serial.println("OLED init failed");

    oledAvailable = false;

  } else {

    oledAvailable = true;

    display.clearDisplay();

    display.setTextSize(1);

    display.setTextColor(SSD1306_WHITE);

    display.setCursor(0, 0);

    display.println("Smart Drug Detector");

    display.display();

    delay(500);

  }

#endif



  // *** CALIBRATION ***

  Serial.printf("Calibrating sensors for %d seconds...\n", CALIBRATION_SECONDS);

  long sumMq3 = 0, sumMq135 = 0;

  int sampleCount = 0;

  unsigned long start = millis();



  while (millis() - start < (CALIBRATION_SECONDS * 1000UL)) {

    int v3 = readAnalogMedian(MQ3_PIN, ADC_SAMPLE_COUNT);

    int v135 = readAnalogMedian(MQ135_PIN, ADC_SAMPLE_COUNT);



    sumMq3 += v3;

    sumMq135 += v135;

    sampleCount++;



    delay(300);

  }



  if (sampleCount > 0) {

    baselineMQ3 = sumMq3 / sampleCount;

    baselineMQ135 = sumMq135 / sampleCount;

  } else {

    baselineMQ3 = analogRead(MQ3_PIN);

    baselineMQ135 = analogRead(MQ135_PIN);

  }



  Serial.printf("Calibration done: MQ3=%d MQ135=%d\n", baselineMQ3, baselineMQ135);



  // WiFi + Time sync

  connectWiFi();

  configTime(0, 0, "pool.ntp.org", "time.nist.gov");



  bootMillis = millis();

}



/* ============================================================= */

/* ============================= LOOP ============================ */

/* ============================================================= */

void loop() {



#if USE_GPS

  while (gpsSerial.available() > 0) {

    gps.encode(gpsSerial.read());

  }

#endif



  int mq3 = readAnalogMedian(MQ3_PIN, ADC_SAMPLE_COUNT);

  int mq135 = readAnalogMedian(MQ135_PIN, ADC_SAMPLE_COUNT);



  float tempC = -999, hum = -999;

#if USE_DHT

  float t = dht.readTemperature();

  float h = dht.readHumidity();

  if (!isnan(t)) tempC = t;

  if (!isnan(h)) hum = h;

#endif



  double lat = 0.0, lon = 0.0;

  bool gpsValid = false;

#if USE_GPS

  if (gps.location.isValid()) {

    lat = gps.location.lat();

    lon = gps.location.lng();

    gpsValid = true;

  }

#endif



  int deltaMQ3 = mq3 - baselineMQ3;

  int deltaMQ135 = mq135 - baselineMQ135;



  Serial.printf("MQ3=%d Δ=%d | MQ135=%d Δ=%d\n",

                mq3, deltaMQ3, mq135, deltaMQ135);



  // Evaluate state

  State evaluated = SAFE;



  if (deltaMQ3 >= MQ3_DELTA_DANGER &&

      deltaMQ135 >= MQ135_CORROBORATE_THRESHOLD) {

    evaluated = DANGER;

  } else if (deltaMQ3 >= MQ3_DELTA_WARNING) {

    evaluated = WARNING;

  }



  // Sustained logic

  static State lastEval = SAFE;

  static int sustain = 0;



  if (evaluated == lastEval) sustain++;

  else {

    lastEval = evaluated;

    sustain = 1;

  }



  if (sustain >= SUSTAINED_REQUIRED) {

    currentState = evaluated;

  }



  applyOutputs(currentState);



#if USE_OLED

  if (oledAvailable)

    updateOLED(mq3, mq135, tempC, hum, currentState,

               gpsValid ? lat : 0.0, gpsValid ? lon : 0.0);

#endif



  // Telemetry

  unsigned long nowSec = millis() / 1000;

  bool cooldown = (nowSec - lastSentTime) >= SEND_COOLDOWN_SECONDS;

  // Send data every 30 seconds for testing (even in SAFE state)

  bool periodicSend = (nowSec - lastSentTime) >= 30;



  if (currentState == WARNING || currentState == DANGER) {

    String msg = (currentState == DANGER)

                 ? "DANGER: Strong drug vapors detected"

                 : "WARNING: Possible chemical vapors";



    if (currentState != lastSentState || cooldown) {

      Serial.println("State changed or cooldown expired - sending alert data");

      if (sendTelemetryAndAlert(mq3, mq135, tempC, hum, lat, lon, msg)) {

        lastSentState = currentState;

        lastSentTime = nowSec;

      }

    }

  } else if (currentState == SAFE && periodicSend) {

    // Send periodic telemetry even in SAFE state (every 30 seconds)

    Serial.println("Periodic send (SAFE state) - sending telemetry");

    String msg = "SAFE: Normal readings";

    if (sendTelemetryAndAlert(mq3, mq135, tempC, hum, lat, lon, msg)) {

      lastSentTime = nowSec;

    }

  }



  delay(LOOP_DELAY_MS);

}



/* ============================================================= */

/* ======================== FUNCTIONS ============================ */

/* ============================================================= */



void connectWiFi() {

  if (WiFi.status() == WL_CONNECTED) return;



  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.println("Connecting to WiFi...");



  int waitCount = 0;

  while (WiFi.status() != WL_CONNECTED && waitCount < 25) {

    delay(500);

    Serial.print(".");

    waitCount++;

  }



  Serial.println();

  if (WiFi.status() == WL_CONNECTED) {

    Serial.println("WiFi connected!");

    Serial.print("IP: ");

    Serial.println(WiFi.localIP());

  } else {

    Serial.println("WiFi failed.");

  }

}



int readAnalogMedian(int pin, int samples) {

  if (samples < 1) samples = 1;



  // Allocate array of ints properly

  int *vals = (int*) malloc(samples * sizeof(int));

  if (!vals) {

    // If allocation failed, fall back to single read

    return analogRead(pin);

  }



  for (int i = 0; i < samples; i++) {

    vals[i] = analogRead(pin);

    delay(2);

  }



  // Insertion sort (small sample sizes are fine)

  for (int i = 1; i < samples; i++) {

    int key = vals[i];

    int j = i - 1;

    while (j >= 0 && vals[j] > key) {

      vals[j + 1] = vals[j];

      j--;

    }

    vals[j + 1] = key;

  }



  int median = vals[samples / 2];

  free(vals);

  return median;

}



void applyOutputs(State s) {

  if (s == SAFE) {

    digitalWrite(LED_GREEN, HIGH);

    digitalWrite(LED_YELLOW, LOW);

    digitalWrite(LED_RED, LOW);

    digitalWrite(BUZZER_PIN, LOW);

  }

  else if (s == WARNING) {

    digitalWrite(LED_GREEN, LOW);

    digitalWrite(LED_YELLOW, HIGH);

    digitalWrite(LED_RED, LOW);

    digitalWrite(BUZZER_PIN, LOW);

  }

  else { // DANGER

    digitalWrite(LED_GREEN, LOW);

    digitalWrite(LED_YELLOW, LOW);

    digitalWrite(LED_RED, HIGH);



    // Simple buzzer pattern

    digitalWrite(BUZZER_PIN, HIGH); delay(200);

    digitalWrite(BUZZER_PIN, LOW);  delay(100);

    digitalWrite(BUZZER_PIN, HIGH); delay(200);

    digitalWrite(BUZZER_PIN, LOW);

  }

}



bool sendTelemetryAndAlert(int mq3, int mq135, float tempC, float hum,

                           double lat, double lon, const String &msg) {

  if (WiFi.status() != WL_CONNECTED) {

    Serial.println("WiFi not connected! Reconnecting...");

    connectWiFi();

    if (WiFi.status() != WL_CONNECTED) {

      Serial.println("ERROR: WiFi connection failed!");

      return false;

    }

  }



  StaticJsonDocument<512> doc;

  doc["device_id"] = DEVICE_ID;

  doc["timestamp"] = isoTimestampUTC();



  JsonObject s = doc.createNestedObject("sensors");

  s["mq3"] = mq3;

  s["mq135"] = mq135;

  s["temp_c"] = tempC;

  s["humidity"] = hum;



  JsonObject g = doc.createNestedObject("gps");

  g["lat"] = lat;

  g["lon"] = lon;



  doc["alert_message"] = msg;



  String payload;

  serializeJson(doc, payload);



  Serial.println("=== Sending Telemetry ===");

  Serial.print("HTTP POST: ");

  Serial.println(BACKEND_URL);

  Serial.print("Payload size: ");

  Serial.println(payload.length());



  HTTPClient http;

  http.setTimeout(10000); // 10 second timeout

  http.begin(BACKEND_URL);

  http.addHeader("Content-Type", "application/json");

  http.addHeader("x-api-key", DEVICE_API_KEY);



  int code = http.POST(payload);

  String response = http.getString();

  http.end();



  Serial.print("HTTP Response code: ");

  Serial.println(code);



  if (code >= 200 && code < 300) {

    Serial.println("Data sent successfully!");

    Serial.print("Response: ");

    Serial.println(response);

    return true;

  } else {

    Serial.print("ERROR: HTTP request failed! Code: ");

    Serial.println(code);

    Serial.print("Response: ");

    Serial.println(response);

    Serial.print("WiFi Status: ");

    Serial.println(WiFi.status());

    Serial.print("WiFi IP: ");

    Serial.println(WiFi.localIP());

    return false;

  }

}



String isoTimestampUTC() {

  time_t now;

  time(&now);

  struct tm info;

  gmtime_r(&now, &info);

  char buffer[32];

  strftime(buffer, sizeof(buffer), "%Y-%m-%dT%H:%M:%SZ", &info);

  return String(buffer);

}



void updateOLED(int mq3, int mq135, float tempC, float hum,

                State s, double lat, double lon) {



#if USE_OLED

  if (!oledAvailable) return;



  display.clearDisplay();

  display.setTextSize(1);

  display.setCursor(0, 0);

  display.println("Smart Drug Detector");



  display.setCursor(0, 12);

  display.printf("MQ3: %d", mq3);



  display.setCursor(64, 12);

  display.printf("MQ135: %d", mq135);



  display.setCursor(0, 26);

  display.printf("T:%.1f H:%.0f", tempC, hum);



  display.setCursor(0, 40);

  display.print("State: ");

  if (s == SAFE) display.println("SAFE");

  else if (s == WARNING) display.println("WARN");

  else display.println("DANGER");



  display.setCursor(0, 52);

  display.printf("GPS: %.5f, %.5f", lat, lon);



  display.display();

#endif

}
