# NashfyPitStop Backend API

Python FastAPI backend using FastF1 library for F1 data.

## Features

- **Race Schedule**: Get F1 race schedules for any year
- **Race Results**: Get race results and standings
- **Driver Standings**: Championship standings
- **Constructor Standings**: Team championship standings
- **Telemetry**: Lap-by-lap telemetry data
- **Lap Times**: Detailed lap time data
- **Next Race**: Get next upcoming race with countdown

## Setup

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (recommended):
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

### Running the Server

Start the FastAPI server:

```bash
python app.py
```

Or using uvicorn directly:

```bash
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **Alternative Docs**: http://localhost:8000/redoc (ReDoc)

## API Endpoints

### Health Check
```
GET /
```
Returns API status.

### Race Schedule
```
GET /api/race-schedule?year=2025&include_sessions=false
```
Get race schedule for a year.

**Parameters:**
- `year` (int): F1 season year (default: 2025)
- `include_sessions` (bool): Include practice/qualifying times (default: false)

### Race Results
```
GET /api/race-results?year=2025&round=1&latest=false
```
Get race results.

**Parameters:**
- `year` (int): F1 season year (default: 2025)
- `round` (int, optional): Specific race round
- `latest` (bool): Get latest completed race (default: false)

### Driver Standings
```
GET /api/driver-standings?year=2025&after_round=null
```
Get driver championship standings.

**Parameters:**
- `year` (int): F1 season year (default: 2025)
- `after_round` (int, optional): Standings after specific round

### Constructor Standings
```
GET /api/constructor-standings?year=2025&after_round=null
```
Get constructor championship standings.

### Telemetry
```
GET /api/telemetry?year=2025&round=1&session=R&driver=VER
```
Get telemetry data for a session.

**Parameters:**
- `year` (int): F1 season year
- `round` (int): Race round number
- `session` (str): Session type (FP1, FP2, FP3, Q, R)
- `driver` (str, optional): Driver abbreviation

### Lap Times
```
GET /api/lap-times?year=2025&round=1&session=R&driver=VER
```
Get lap times for a session.

### Next Race
```
GET /api/next-race
```
Get next upcoming race with countdown information.

## Caching

FastF1 uses local caching to improve performance. Cache is stored in `./cache` directory.

## Error Handling

All endpoints return JSON responses with:
- `success`: Boolean indicating success
- `error`: Error message (if failed)
- Data fields (if successful)

## CORS

CORS is configured to allow requests from:
- `http://localhost:8000`
- `http://localhost:3000`
- `http://127.0.0.1:8000`
- `http://127.0.0.1:3000`
- `file://` (for local file access)
- `*` (all origins - for development only)

**Note:** Restrict CORS origins in production!

## Development

### Project Structure
```
backend/
├── app.py                 # FastAPI application
├── requirements.txt        # Python dependencies
├── services/
│   └── fastf1_service.py  # FastF1 service layer
└── cache/                 # FastF1 cache (auto-created)
```

### Testing

Test the API using the interactive docs:
1. Start the server
2. Visit http://localhost:8000/docs
3. Try the endpoints directly from the browser

Or use curl:
```bash
curl http://localhost:8000/api/race-schedule?year=2025
```

## Troubleshooting

### FastF1 Cache Issues
If you encounter cache issues, delete the `cache/` directory and restart the server.

### Port Already in Use
If port 8000 is in use, change it in `app.py`:
```python
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Slow First Request
FastF1 may be slow on first request as it downloads data. Subsequent requests will be faster due to caching.

## Production Deployment

For production:
1. Set up proper CORS origins
2. Use a production ASGI server (e.g., Gunicorn with Uvicorn workers)
3. Set up environment variables for configuration
4. Enable HTTPS
5. Set up monitoring and logging

Example production command:
```bash
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

