# Playback Analytics API Documentation

This document describes the Proof-of-Play logging and reporting APIs for the Digital Signage CMS.

## Overview

The Playback Analytics system allows Android players to send playback logs to the CMS and provides comprehensive reporting capabilities. The system is designed to handle millions of playback events efficiently.

## Database Schema

### PlaybackLog Model

```javascript
{
  device_id: String,     // Required, indexed
  asset_id: String,      // Required, indexed  
  playlist_id: String,   // Required, indexed
  start_time: Date,      // Required, indexed
  end_time: Date,        // Required
  duration: Number,      // Required (seconds)
  created_at: Date       // Auto-generated timestamp
}
```

**Indexes:**
- `device_id` (single)
- `asset_id` (single)
- `playlist_id` (single)
- `start_time` (single)
- `{ device_id: 1, start_time: -1 }` (compound)
- `{ asset_id: 1, start_time: -1 }` (compound)
- `{ playlist_id: 1, start_time: -1 }` (compound)
- `{ start_time: -1, end_time: -1 }` (compound)

## API Endpoints

### 1. POST /api/playback/log

Receives playback logs from Android players and stores them in the database.

#### Authentication
Supports TWO authentication methods:
1. **Session Auth** - For web dashboard users
2. **API Key** - For backend-to-backend communication (recommended for Android integration)

To use API Key auth, add header:
```
X-API-Key: your-api-key-here
```

Set the API key in your environment: `PLAYBACK_API_KEY=your-secret-key`

#### Request

**Content-Type:** `application/json`

**Body:** Single object or array of log objects

```json
// Single log entry
{
  "device_id": "device_001",
  "asset_id": "video_001.mp4",
  "playlist_id": "playlist_morning",
  "start_time": "2024-01-15T10:30:00.000Z",
  "end_time": "2024-01-15T10:32:30.000Z",
  "duration": 150
}

// Multiple log entries (bulk insert)
[
  {
    "device_id": "device_001",
    "asset_id": "video_001.mp4",
    "playlist_id": "playlist_morning",
    "start_time": "2024-01-15T10:30:00.000Z",
    "end_time": "2024-01-15T10:32:30.000Z",
    "duration": 150
  },
  {
    "device_id": "device_001",
    "asset_id": "image_001.jpg",
    "playlist_id": "playlist_morning",
    "start_time": "2024-01-15T10:32:30.000Z",
    "end_time": "2024-01-15T10:32:40.000Z",
    "duration": 10
  }
]
```

#### Field Validation

The API accepts multiple field name formats for Android compatibility:

| Standard Field | Alternative Names | Type | Required | Validation |
|----------------|-------------------|------|----------|------------|
| `device_id` | `deviceId` | String | Yes | Non-empty string |
| `asset_id` | `assetId` | String | Yes | Non-empty string |
| `playlist_id` | `playlistId` | String | Yes | Non-empty string |
| `start_time` | `played_at`, `startTime` | String | Yes | Valid ISO 8601 date string |
| `end_time` | `ended_at`, `endTime` | String | Yes | Valid ISO 8601 date string, must be after start_time |
| `duration` | - | Number | Optional | Auto-calculated if not provided |

#### Response

**Success (200):**
```json
{
  "success": true,
  "inserted": 2,
  "message": "Successfully inserted 2 playback logs"
}
```

**Partial Success (207):**
```json
{
  "success": true,
  "inserted": 1,
  "errors": 1,
  "message": "Partially successful: 1 inserted, 1 failed"
}
```

**Validation Error (400):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "index": 0,
      "errors": [
        "end_time must be after start_time",
        "duration does not match calculated duration"
      ]
    }
  ],
  "message": "1 out of 2 log entries failed validation"
}
```

**Authentication Error (401):**
```json
{
  "error": "Unauthorized"
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error",
  "details": "Database connection failed"
}
```

### 2. GET /api/playback/report

Generates comprehensive playback reports with filtering and aggregation.

#### Authentication
Requires valid session authentication.

#### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `device_id` | String | No | Filter by specific device |
| `asset_id` | String | No | Filter by specific asset |
| `playlist_id` | String | No | Filter by specific playlist |
| `date_from` | String | No | Start date filter (ISO 8601) |
| `date_to` | String | No | End date filter (ISO 8601) |
| `page` | Number | No | Page number for pagination (default: 1) |
| `limit` | Number | No | Items per page (default: 100, max: 1000) |

#### Example Requests

```bash
# Basic report
GET /api/playback/report

# Filter by device and date range
GET /api/playback/report?device_id=device_001&date_from=2024-01-01T00:00:00Z&date_to=2024-01-31T23:59:59Z

# Filter by asset with pagination
GET /api/playback/report?asset_id=video_001.mp4&page=2&limit=50

# Multiple filters
GET /api/playback/report?playlist_id=morning_playlist&device_id=lobby_display&date_from=2024-01-15T00:00:00Z
```

#### Response

**Success (200):**
```json
{
  "summary": {
    "total_plays": 1250,
    "total_duration": 45600,
    "unique_devices": 12,
    "unique_assets": 45,
    "unique_playlists": 8,
    "date_range": {
      "from": "2024-01-01T08:30:00.000Z",
      "to": "2024-01-31T18:45:00.000Z"
    },
    "filters": {
      "device_id": "device_001",
      "date_from": "2024-01-01T00:00:00.000Z"
    }
  },
  "by_asset": [
    {
      "asset_id": "video_001.mp4",
      "play_count": 45,
      "total_duration": 6750,
      "avg_duration": 150.00,
      "first_played": "2024-01-01T09:00:00.000Z",
      "last_played": "2024-01-31T17:30:00.000Z"
    },
    {
      "asset_id": "image_001.jpg",
      "play_count": 90,
      "total_duration": 900,
      "avg_duration": 10.00,
      "first_played": "2024-01-01T09:02:30.000Z",
      "last_played": "2024-01-31T17:32:30.000Z"
    }
  ],
  "by_device": [
    {
      "device_id": "device_001",
      "play_count": 135,
      "total_duration": 7650,
      "unique_assets": 2,
      "avg_duration": 56.67,
      "first_played": "2024-01-01T09:00:00.000Z",
      "last_played": "2024-01-31T17:32:30.000Z"
    }
  ],
  "by_playlist": [
    {
      "playlist_id": "morning_playlist",
      "play_count": 135,
      "total_duration": 7650,
      "unique_assets": 2,
      "unique_devices": 1,
      "avg_duration": 56.67,
      "first_played": "2024-01-01T09:00:00.000Z",
      "last_played": "2024-01-31T17:32:30.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 100,
    "total_items": 2,
    "total_pages": 1,
    "has_next": false,
    "has_prev": false
  }
}
```

**Authentication Error (401):**
```json
{
  "error": "Unauthorized"
}
```

**Validation Error (400):**
```json
{
  "error": "Invalid date_from format. Use ISO date string."
}
```

**Server Error (500):**
```json
{
  "error": "Internal server error",
  "details": "Database query failed"
}
```

### 3. POST /api/playback/test

Creates sample playback log entries for testing. Requires session authentication.

#### Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | Number | 5 | Number of test entries (max: 20) |

#### Example
```bash
# Create 10 test entries
POST /api/playback/test?count=10
```

### 4. GET /api/playback/test

Returns recent playback logs for verification. Requires session authentication.

### 5. DELETE /api/playback/test

Clears all playback logs (use with caution!). Requires session authentication.

---

## Usage Examples

### Android Player Integration

```javascript
// Example: Sending playback logs from Android player
const playbackLogs = [
  {
    device_id: "lobby_display_001",
    asset_id: "welcome_video.mp4",
    playlist_id: "morning_content",
    start_time: new Date().toISOString(),
    end_time: new Date(Date.now() + 30000).toISOString(), // 30 seconds later
    duration: 30
  }
];

fetch('https://your-cms.com/api/playback/log', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_API_TOKEN'
  },
  body: JSON.stringify(playbackLogs)
})
.then(response => response.json())
.then(data => console.log('Logs sent:', data))
.catch(error => console.error('Error:', error));
```

### Fetching Reports

```javascript
// Example: Fetching device performance report
const params = new URLSearchParams({
  device_id: 'lobby_display_001',
  date_from: '2024-01-01T00:00:00Z',
  date_to: '2024-01-31T23:59:59Z'
});

fetch(`https://your-cms.com/api/playback/report?${params}`)
  .then(response => response.json())
  .then(data => {
    console.log('Total plays:', data.summary.total_plays);
    console.log('Total duration:', data.summary.total_duration);
    console.log('Top asset:', data.by_asset[0]);
  })
  .catch(error => console.error('Error:', error));
```

## Performance Considerations

### Database Optimization
- All key fields are indexed for fast queries
- Compound indexes support common query patterns
- Bulk insert operations are optimized for high throughput
- Pagination prevents memory issues with large datasets

### API Rate Limits
- No explicit rate limits, but bulk operations are recommended
- Use arrays for multiple log entries instead of individual requests
- Consider batching logs every 5-10 minutes from players

### Scalability
- Database designed to handle millions of records
- Aggregation queries use MongoDB's efficient pipeline
- Results are limited and paginated to prevent timeouts
- Indexes support fast filtering on all dimensions

## Error Handling

### Common Issues
1. **Time Validation Errors**: Ensure `end_time > start_time` and `duration` matches the calculated difference
2. **Date Format Errors**: Use ISO 8601 format (e.g., "2024-01-15T10:30:00.000Z")
3. **Missing Fields**: All required fields must be provided
4. **Authentication**: Ensure valid session or API token

### Best Practices
1. **Validate data client-side** before sending to reduce server load
2. **Handle partial failures** gracefully in bulk operations
3. **Implement retry logic** for network failures
4. **Log errors** for debugging and monitoring
5. **Use appropriate time zones** and UTC for consistency

## Dashboard Features

The web dashboard provides:
- **Real-time metrics**: Total plays, duration, active devices
- **Interactive filters**: By device, asset, playlist, date range
- **Visual charts**: Bar charts, pie charts for data visualization
- **Detailed tables**: Sortable data with pagination
- **Export functionality**: CSV download for external analysis
- **Responsive design**: Works on desktop and mobile devices

Access the dashboard at: `/dashboard/playback`

## Security

### Authentication
- All endpoints require valid session authentication
- API tokens can be used for programmatic access
- HTTPS required for production deployments

### Data Validation
- All input is validated and sanitized
- SQL injection protection through parameterized queries
- Rate limiting recommended for production

### Privacy
- No personally identifiable information is stored
- Device IDs should be anonymized or hashed
- Data retention policies should be implemented as needed

## Support

For technical support or questions about the Playback Analytics API:
1. Check this documentation for common issues
2. Review the error messages and status codes
3. Ensure all required fields are provided with correct data types
4. Verify authentication credentials are valid
5. Contact the development team for additional assistance
