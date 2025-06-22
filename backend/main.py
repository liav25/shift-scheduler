from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Optional
from datetime import datetime
import sys
import os
import uvicorn

# Import the scheduler directly (now in same directory)
from queue_scheduler import QueueScheduler

app = FastAPI(
    title="Shift Scheduler API",
    description="Intelligent shift scheduling with queue-based fairness algorithm",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Mount static files for frontend (Railway deployment)
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Enable CORS for frontend
cors_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Railway automatically provides production URLs
    os.environ.get("FRONTEND_URL", ""),
]

# Filter out empty strings
cors_origins = [origin for origin in cors_origins if origin]

# For Railway deployment, allow all origins in production if FRONTEND_URL not set
if os.environ.get("RAILWAY_ENVIRONMENT") == "production" and not os.environ.get(
    "FRONTEND_URL"
):
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models for request/response
class UnavailabilityWindow(BaseModel):
    start: str = Field(..., description="Start datetime in ISO 8601 format")
    end: str = Field(..., description="End datetime in ISO 8601 format")

    @validator("start", "end")
    def validate_datetime_format(cls, v):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
            return v
        except ValueError:
            raise ValueError("Invalid datetime format. Use ISO 8601 format.")


class ShiftLengths(BaseModel):
    day_shift_hours: float = Field(
        ..., ge=1, le=24, description="Day shift duration in hours"
    )
    night_shift_hours: float = Field(
        ..., ge=1, le=24, description="Night shift duration in hours"
    )


class NightTimeRange(BaseModel):
    start: str = Field(..., description="Night shift start time (HH:MM)")
    end: str = Field(..., description="Night shift end time (HH:MM)")

    @validator("start", "end")
    def validate_time_format(cls, v):
        try:
            hour, minute = v.split(":")
            hour, minute = int(hour), int(minute)
            if not (0 <= hour <= 23 and 0 <= minute <= 59):
                raise ValueError()
            return v
        except (ValueError, AttributeError):
            raise ValueError("Invalid time format. Use HH:MM format.")


class ScheduleRequest(BaseModel):
    schedule_start_datetime: str = Field(
        ..., description="Schedule start datetime in ISO 8601"
    )
    schedule_end_datetime: str = Field(
        ..., description="Schedule end datetime in ISO 8601"
    )
    guards: List[str] = Field(..., min_items=1, description="List of guard names")
    posts: List[str] = Field(..., min_items=1, description="List of post names")
    unavailability: Dict[str, List[UnavailabilityWindow]] = Field(
        default={}, description="Guard unavailability periods"
    )
    shift_lengths: ShiftLengths = Field(..., description="Shift duration configuration")
    night_time_range: NightTimeRange = Field(..., description="Night shift time range")

    max_consecutive_nights: Optional[int] = Field(
        1, ge=1, description="Maximum consecutive night shifts"
    )

    @validator("schedule_start_datetime", "schedule_end_datetime")
    def validate_schedule_datetime(cls, v):
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
            return v
        except ValueError:
            raise ValueError("Invalid datetime format for schedule period.")

    @validator("guards")
    def validate_unique_guards(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Guard names must be unique.")
        return [guard.strip() for guard in v if guard.strip()]

    @validator("posts")
    def validate_unique_posts(cls, v):
        if len(v) != len(set(v)):
            raise ValueError("Post names must be unique.")
        return [post.strip() for post in v if post.strip()]


class ShiftAssignment(BaseModel):
    guard_id: str
    post_id: str
    shift_start_time: str
    shift_end_time: str


class ScheduleResponse(BaseModel):
    success: bool
    assignments: Optional[List[ShiftAssignment]] = None
    error: Optional[str] = None
    metadata: Optional[Dict] = None


class TimeValidationResponse(BaseModel):
    valid: bool
    closest_time: Optional[str] = None
    message: Optional[str] = None


# API Endpoints
@app.get("/api", tags=["Health"])
async def root():
    """Health check endpoint"""
    return {
        "message": "Shift Scheduler API is running",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
    }


@app.post("/schedule", response_model=ScheduleResponse, tags=["Scheduling"])
async def create_schedule(request: ScheduleRequest):
    """
    Generate an optimal shift schedule based on provided parameters.

    Uses a queue-based fairness algorithm to ensure equitable shift distribution
    while respecting all constraints including guard availability, rest periods,
    and consecutive shift limits.
    """
    try:
        # Validate schedule period
        start_dt = datetime.fromisoformat(
            request.schedule_start_datetime.replace("Z", "+00:00")
        )
        end_dt = datetime.fromisoformat(
            request.schedule_end_datetime.replace("Z", "+00:00")
        )

        if end_dt <= start_dt:
            return ScheduleResponse(
                success=False, error="Schedule end time must be after start time"
            )

        # Convert Pydantic models to dictionary format expected by scheduler
        unavailability_dict = {}
        for guard, windows in request.unavailability.items():
            if guard in request.guards:  # Only include unavailability for valid guards
                unavailability_dict[guard] = [
                    {"start": window.start, "end": window.end} for window in windows
                ]

        # Create scheduler instance
        scheduler = QueueScheduler(
            schedule_start_datetime=request.schedule_start_datetime,
            schedule_end_datetime=request.schedule_end_datetime,
            guards=request.guards,
            posts=request.posts,
            unavailability=unavailability_dict,
            shift_lengths={
                "day_shift_hours": request.shift_lengths.day_shift_hours,
                "night_shift_hours": request.shift_lengths.night_shift_hours,
            },
            night_time_range={
                "start": request.night_time_range.start,
                "end": request.night_time_range.end,
            },
            max_consecutive_nights=request.max_consecutive_nights,
        )

        # Solve the scheduling problem
        assignments = scheduler.solve()

        if assignments is None:
            return ScheduleResponse(
                success=False,
                error="Could not generate a complete schedule with the given constraints. Try relaxing some constraints or adding more guards.",
            )

        # Convert to response format
        shift_assignments = [
            ShiftAssignment(**assignment) for assignment in assignments
        ]

        # Generate metadata
        metadata = {
            "total_assignments": len(shift_assignments),
            "unique_guards": len(set(a.guard_id for a in shift_assignments)),
            "unique_posts": len(set(a.post_id for a in shift_assignments)),
            "schedule_duration_hours": (end_dt - start_dt).total_seconds() / 3600,
            "generated_at": datetime.now().isoformat(),
        }

        return ScheduleResponse(
            success=True, assignments=shift_assignments, metadata=metadata
        )

    except ValueError as e:
        return ScheduleResponse(success=False, error=f"Validation error: {str(e)}")
    except Exception as e:
        return ScheduleResponse(
            success=False, error=f"Unexpected error generating schedule: {str(e)}"
        )


@app.get(
    "/validate-time/{time_str}",
    response_model=TimeValidationResponse,
    tags=["Validation"],
)
async def validate_time(time_str: str):
    """
    Validate that time string has minutes as 00 or 30.
    Provides closest valid time if invalid.
    """
    try:
        # Parse time (assuming format HH:MM)
        if ":" not in time_str:
            return TimeValidationResponse(
                valid=False, message="Invalid time format. Use HH:MM format"
            )

        hour_str, minute_str = time_str.split(":")

        try:
            hour = int(hour_str)
            minute = int(minute_str)
        except ValueError:
            return TimeValidationResponse(
                valid=False,
                message="Invalid time format. Use HH:MM format with numbers",
            )

        # Validate hour and minute ranges
        if not (0 <= hour <= 23):
            return TimeValidationResponse(
                valid=False, message="Hour must be between 00 and 23"
            )

        if not (0 <= minute <= 59):
            return TimeValidationResponse(
                valid=False, message="Minute must be between 00 and 59"
            )

        if minute not in [0, 30]:
            # Find closest valid time
            if minute < 15:
                closest_minute = 0
                closest_hour = hour
            elif minute < 45:
                closest_minute = 30
                closest_hour = hour
            else:
                closest_minute = 0
                closest_hour = (hour + 1) % 24

            closest_time = f"{closest_hour:02d}:{closest_minute:02d}"
            return TimeValidationResponse(
                valid=False,
                closest_time=closest_time,
                message="Minutes must be 00 or 30",
            )

        return TimeValidationResponse(valid=True)

    except Exception as e:
        return TimeValidationResponse(
            valid=False, message=f"Error validating time: {str(e)}"
        )


@app.get("/algorithm-info", tags=["Information"])
async def get_algorithm_info():
    """Get information about the scheduling algorithm"""
    return {
        "algorithm": "Queue-based Fair Scheduling",
        "description": "Ensures fair distribution of shifts using rotating queues",
        "features": [
            "Fair shift distribution",
            "Respects guard unavailability",
            "Limits consecutive night shifts",
            "Prevents back-to-back shifts",
            "Optimizes for balanced workload",
        ],
        "constraints": [
            "Guard availability windows",
            "Maximum consecutive night shifts",
            "Post coverage requirements",
        ],
    }


# Serve frontend for all non-API routes (Railway deployment)
@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    """Serve the frontend app for all non-API routes"""
    static_dir = os.path.join(os.path.dirname(__file__), "static")
    index_file = os.path.join(static_dir, "index.html")

    # If it's a request for a static file, try to serve it
    if "." in full_path:
        file_path = os.path.join(static_dir, full_path)
        if os.path.exists(file_path):
            return FileResponse(file_path)

    # Otherwise serve index.html for SPA routing
    if os.path.exists(index_file):
        return FileResponse(index_file)

    # Fallback
    return {"message": "Frontend not built. Run 'npm run build' first."}


if __name__ == "__main__":
    import os

    # Get port from environment variable (Railway sets this)
    port = int(os.environ.get("PORT", 8000))

    print("🚀 Starting Shift Scheduler Backend...")
    print(f"📡 Backend will be available at: http://0.0.0.0:{port}")
    print(f"📖 API Documentation: http://0.0.0.0:{port}/docs")

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=port,
        log_level="info",
        reload=False,  # Set to True for development
    )
