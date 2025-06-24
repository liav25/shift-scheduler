#!/usr/bin/env python3
"""
Queue-based Shift Scheduling Algorithm

A fair and intuitive scheduling algorithm that uses a rotating queue system.
Guards are assigned shifts in order and moved to the back of the queue,
ensuring fair distribution and preventing consecutive shifts.
"""

from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from collections import deque


class QueueScheduler:
    """
    Queue-based shift scheduler that ensures fair distribution of shifts.
    """

    def __init__(
        self,
        schedule_start_datetime: str,
        schedule_end_datetime: str,
        guards: List[str],
        posts: Dict[
            str, Dict
        ],  # Changed from List[str] to Dict[str, Dict] for post configurations
        unavailability: Dict[str, List[Dict[str, str]]],
        shift_lengths: Dict[str, float],
        night_time_range: Dict[str, str],
        max_consecutive_nights: int = 1,  # Maximum consecutive night shifts
    ):
        self.schedule_start = datetime.fromisoformat(schedule_start_datetime)
        self.schedule_end = datetime.fromisoformat(schedule_end_datetime)
        self.guards = guards
        self.posts = posts  # Dict of post_name -> post_config
        self.post_names = list(posts.keys())  # List of post names for iteration
        self.unavailability = self._parse_unavailability(unavailability)
        self.day_shift_hours = shift_lengths["day_shift_hours"]
        self.night_shift_hours = shift_lengths["night_shift_hours"]
        self.day_shift_duration = timedelta(hours=self.day_shift_hours)
        self.night_shift_duration = timedelta(hours=self.night_shift_hours)
        self.night_time_range = night_time_range
        self.max_consecutive_nights = max_consecutive_nights

        # Initialize guard queues (one per post)
        self.guard_queues = {
            post_name: deque(guards.copy()) for post_name in self.post_names
        }

        # Track guard states
        self.guard_states = {
            guard: {
                "last_shift_end": None,
                "consecutive_nights": 0,
                "total_shifts": 0,
                "total_hours": 0.0,
                "unavailable_until": None,
            }
            for guard in guards
        }

        # Generate time slots
        self.time_slots = self._generate_time_slots()

    def _parse_unavailability(
        self, unavailability: Dict
    ) -> Dict[str, List[Tuple[datetime, datetime]]]:
        """Parse unavailability windows into datetime tuples."""
        parsed = {}
        for guard, windows in unavailability.items():
            parsed[guard] = []
            for window in windows:
                start = datetime.fromisoformat(window["start"])
                end = datetime.fromisoformat(window["end"])
                parsed[guard].append((start, end))
        return parsed

    def _generate_time_slots(self) -> List[Dict]:
        """Generate all time slots that need to be filled."""
        slots = []
        current = self.schedule_start

        while current < self.schedule_end:
            # Determine if this is a night shift
            is_night = self._is_night_shift(current)
            duration = (
                self.night_shift_duration if is_night else self.day_shift_duration
            )

            # Ensure shift doesn't go too far past schedule end
            shift_end = current + duration
            if current < self.schedule_end:  # Start time is within schedule
                slot = {
                    "start": current,
                    "end": shift_end,
                    "is_night": is_night,
                    "duration_hours": duration.total_seconds() / 3600,
                }
                slots.append(slot)

            # Move to next shift start time
            # Use the shift duration as increment to avoid overlaps
            current += duration

        return slots

    def _is_night_shift(self, shift_start: datetime) -> bool:
        """Determine if a shift starting at this time is a night shift."""
        # Parse night time range
        night_start_hour, night_start_min = map(
            int, self.night_time_range["start"].split(":")
        )
        night_end_hour, night_end_min = map(
            int, self.night_time_range["end"].split(":")
        )

        hour = shift_start.hour
        minute = shift_start.minute

        # Check if shift start time is in night range
        if night_start_hour > night_end_hour:  # Crosses midnight
            return (
                hour > night_start_hour
                or hour < night_end_hour
                or (hour == night_start_hour and minute >= night_start_min)
                or (hour == night_end_hour and minute < night_end_min)
            )
        else:  # Same day
            return (
                (night_start_hour < hour < night_end_hour)
                or (hour == night_start_hour and minute >= night_start_min)
                or (hour == night_end_hour and minute < night_end_min)
            )

    def _is_guard_available(
        self, guard: str, shift_start: datetime, shift_end: datetime
    ) -> bool:
        """Check if guard is available for the shift."""
        state = self.guard_states[guard]

        # Check if guard is in unavailability period
        if guard in self.unavailability:
            for unavail_start, unavail_end in self.unavailability[guard]:
                if not (shift_end <= unavail_start or shift_start >= unavail_end):
                    return False

        return True

    def _is_post_required_at_time(self, post_config: Dict, time: datetime) -> bool:
        """Check if a post is required at the given time based on its configuration."""
        if post_config.get("is_24_7", True):
            return True

        required_start = post_config.get("required_hours_start")
        required_end = post_config.get("required_hours_end")

        if not required_start or not required_end:
            return False

        try:
            # Format time as HH:MM for comparison
            time_str = time.strftime("%H:%M")

            # Parse time components
            time_hour, time_min = map(int, time_str.split(":"))
            start_hour, start_min = map(int, required_start.split(":"))
            end_hour, end_min = map(int, required_end.split(":"))

            # Convert to minutes for easier comparison
            time_minutes = time_hour * 60 + time_min
            start_minutes = start_hour * 60 + start_min
            end_minutes = end_hour * 60 + end_min

            # Handle overnight ranges (e.g., 22:00 - 06:00)
            if start_minutes > end_minutes:
                return time_minutes >= start_minutes or time_minutes < end_minutes
            else:
                return start_minutes <= time_minutes < end_minutes

        except (ValueError, AttributeError):
            return False

    def _calculate_penalty(self, guard: str, slot: Dict) -> float:
        """Calculate penalty score for assigning this guard to this slot."""
        penalty = 0.0
        state = self.guard_states[guard]

        # Penalty for consecutive night shifts
        if (
            slot["is_night"]
            and state["consecutive_nights"] >= self.max_consecutive_nights
        ):
            penalty += 100.0  # High penalty for too many consecutive nights

        # Small penalty for guards who have worked more shifts (for balance)
        avg_shifts = sum(s["total_shifts"] for s in self.guard_states.values()) / len(
            self.guards
        )
        if state["total_shifts"] > avg_shifts:
            penalty += (state["total_shifts"] - avg_shifts) * 5.0

        return penalty

    def _find_best_guard(self, post: str, slot: Dict) -> Optional[str]:
        """Find the best available guard for this post and slot."""
        queue = self.guard_queues[post]
        best_guard = None
        best_penalty = float("inf")
        checked_guards = 0

        # Check guards in queue order, but consider penalties
        original_queue = list(queue)

        for _ in range(len(queue)):
            guard = queue[0]  # Check front of queue
            queue.rotate(-1)  # Move to back for next check
            checked_guards += 1

            if self._is_guard_available(guard, slot["start"], slot["end"]):
                penalty = self._calculate_penalty(guard, slot)

                if penalty < best_penalty:
                    best_guard = guard
                    best_penalty = penalty

                # If we found a guard with no penalty, use them immediately
                if penalty == 0:
                    break

            # Don't check all guards if we have a reasonable option
            if checked_guards >= min(len(queue), 5) and best_guard:
                break

        # Reset queue to original position if no guard found
        if best_guard is None:
            self.guard_queues[post] = deque(original_queue)
            return None

        # Move the selected guard to the front and then assign
        while queue[0] != best_guard:
            queue.rotate(-1)

        # Remove the assigned guard and put them at the back
        assigned_guard = queue.popleft()
        queue.append(assigned_guard)

        return assigned_guard

    def _assign_shift(self, guard: str, post: str, slot: Dict):
        """Assign a shift to a guard and update their state."""
        state = self.guard_states[guard]

        # Update guard state
        state["last_shift_end"] = slot["end"]
        state["total_shifts"] += 1
        state["total_hours"] += slot["duration_hours"]

        # Update consecutive nights counter
        if slot["is_night"]:
            state["consecutive_nights"] += 1
        else:
            state["consecutive_nights"] = 0  # Reset if not a night shift

    def solve(self) -> Optional[List[Dict]]:
        """
        Solve the scheduling problem using queue-based approach.

        Returns:
            List of shift assignments or None if no solution possible
        """
        assignments = []
        failed_slots = []

        for slot in self.time_slots:
            slot_assignments = []

            # Try to assign a guard to each post for this time slot
            for post_name in self.post_names:
                post_config = self.posts[post_name]

                # Check if this post is required at this time
                if self._is_post_required_at_time(post_config, slot["start"]):
                    guard = self._find_best_guard(post_name, slot)

                    if guard:
                        assignment = {
                            "guard_id": guard,
                            "post_id": post_name,
                            "shift_start_time": slot["start"].isoformat(),
                            "shift_end_time": slot["end"].isoformat(),
                        }
                        slot_assignments.append(assignment)
                        self._assign_shift(guard, post_name, slot)
                    else:
                        # Could not find available guard for this post
                        failed_slots.append((slot, post_name))

            assignments.extend(slot_assignments)

        return assignments if assignments else None
