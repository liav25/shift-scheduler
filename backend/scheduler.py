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
import json


class ShiftScheduler:
    """
    Queue-based shift scheduler that ensures fair distribution of shifts.
    """

    def __init__(
        self,
        schedule_start_datetime: str,
        schedule_end_datetime: str,
        guards: List[str],
        posts: List[str],
        unavailability: Dict[str, List[Dict[str, str]]],
        shift_lengths: Dict[str, float],
        night_time_range: Dict[str, str],
        max_consecutive_nights: int = 1,  # Maximum consecutive night shifts
        saved_state: Optional[Dict] = None,  # For continuing from previous state
        initial_queue_orders: Optional[
            Dict[str, List[str]]
        ] = None,  # Custom queue orders per post
    ):
        self.schedule_start = datetime.fromisoformat(schedule_start_datetime)
        self.schedule_end = datetime.fromisoformat(schedule_end_datetime)
        self.guards = guards
        self.posts = posts
        self.unavailability = self._parse_unavailability(unavailability)
        self.day_shift_hours = shift_lengths["day_shift_hours"]
        self.night_shift_hours = shift_lengths["night_shift_hours"]
        self.day_shift_duration = timedelta(hours=self.day_shift_hours)
        self.night_shift_duration = timedelta(hours=self.night_shift_hours)
        self.night_time_range = night_time_range
        self.max_consecutive_nights = max_consecutive_nights

        # Initialize or restore state
        if saved_state:
            self._restore_from_state(saved_state)
        else:
            # Initialize guard queues based on input order or custom orders
            self.guard_queues = self._initialize_guard_queues(initial_queue_orders)

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
            for post in self.posts:
                guard = self._find_best_guard(post, slot)

                if guard:
                    assignment = {
                        "guard_id": guard,
                        "post_id": post,
                        "shift_start_time": slot["start"].isoformat(),
                        "shift_end_time": slot["end"].isoformat(),
                    }
                    slot_assignments.append(assignment)
                    self._assign_shift(guard, post, slot)
                else:
                    # Could not find available guard for this post
                    failed_slots.append((slot, post))

            assignments.extend(slot_assignments)

        return assignments if assignments else None

    def _restore_from_state(self, saved_state: Dict):
        """Restore scheduler state from saved state."""
        # Restore guard queues
        self.guard_queues = {
            post: deque(saved_state["guard_queues"][post]) for post in self.posts
        }

        # Restore guard states with datetime conversion
        self.guard_states = {}
        for guard in self.guards:
            state = saved_state["guard_states"][guard].copy()
            # Convert last_shift_end back to datetime if it exists
            if state["last_shift_end"]:
                state["last_shift_end"] = datetime.fromisoformat(
                    state["last_shift_end"]
                )
            self.guard_states[guard] = state

    def get_scheduler_state(self) -> Dict:
        """Export current scheduler state for browser storage."""
        return {
            "guard_queues": {
                post: list(queue) for post, queue in self.guard_queues.items()
            },
            "guard_states": {
                guard: {
                    **state,
                    "last_shift_end": (
                        state["last_shift_end"].isoformat()
                        if state["last_shift_end"]
                        else None
                    ),
                }
                for guard, state in self.guard_states.items()
            },
            "schedule_metadata": {
                "last_scheduled_end": self.schedule_end.isoformat(),
                "posts": self.posts,
                "guards": self.guards,
                "guards_input_order": self.guards.copy(),  # Preserve original input order
                "current_queue_orders": self.get_current_queue_orders(),  # Current queue states
                "shift_lengths": {
                    "day_shift_hours": self.day_shift_hours,
                    "night_shift_hours": self.night_shift_hours,
                },
                "night_time_range": self.night_time_range,
                "max_consecutive_nights": self.max_consecutive_nights,
                "timestamp": datetime.now().isoformat(),
            },
        }

    def get_work_balance_summary(self) -> Dict:
        """Get a summary of work distribution among guards."""
        total_shifts = sum(
            state["total_shifts"] for state in self.guard_states.values()
        )
        total_hours = sum(state["total_hours"] for state in self.guard_states.values())

        return {
            "guard_stats": {
                guard: {
                    "total_shifts": state["total_shifts"],
                    "total_hours": round(state["total_hours"], 1),
                    "consecutive_nights": state["consecutive_nights"],
                    "last_shift_end": (
                        state["last_shift_end"].isoformat()
                        if state["last_shift_end"]
                        else None
                    ),
                }
                for guard, state in self.guard_states.items()
            },
            "overall_stats": {
                "total_shifts": total_shifts,
                "total_hours": round(total_hours, 1),
                "avg_shifts_per_guard": round(total_shifts / len(self.guards), 1),
                "avg_hours_per_guard": round(total_hours / len(self.guards), 1),
            },
        }

    @classmethod
    def continue_from_saved_state(
        cls,
        new_schedule_end_datetime: str,
        saved_state: Dict,
        new_unavailability: Optional[Dict[str, List[Dict[str, str]]]] = None,
        reset_queue_orders: bool = False,
    ):
        """
        Create a new scheduler instance that continues from a saved state.

        Args:
            new_schedule_end_datetime: When the new schedule period should end
            saved_state: Previously saved scheduler state
            new_unavailability: Additional unavailability for the new period
            reset_queue_orders: If True, reset queues to original input order instead of continuing from saved state
        """
        metadata = saved_state["schedule_metadata"]

        # Merge unavailability if provided
        unavailability = new_unavailability or {}

        # Determine initial queue orders
        initial_queue_orders = None
        if reset_queue_orders and "guards_input_order" in metadata:
            # Reset to original input order for all posts
            original_order = metadata["guards_input_order"]
            initial_queue_orders = {
                post: original_order.copy() for post in metadata["posts"]
            }

        return cls(
            schedule_start_datetime=metadata["last_scheduled_end"],
            schedule_end_datetime=new_schedule_end_datetime,
            guards=metadata["guards"],
            posts=metadata["posts"],
            unavailability=unavailability,
            shift_lengths={
                "day_shift_hours": metadata["shift_lengths"]["day_shift_hours"],
                "night_shift_hours": metadata["shift_lengths"]["night_shift_hours"],
            },
            night_time_range=metadata["night_time_range"],
            max_consecutive_nights=metadata["max_consecutive_nights"],
            saved_state=saved_state,
            initial_queue_orders=initial_queue_orders,
        )

    def _initialize_guard_queues(
        self, initial_queue_orders: Optional[Dict[str, List[str]]] = None
    ) -> Dict[str, deque]:
        """
        Initialize guard queues based on input order or custom orders.

        Args:
            initial_queue_orders: Optional dict mapping post_id -> list of guards in desired order
                                If None, uses the input order of guards for all posts

        Returns:
            Dict mapping post_id -> deque of guards in specified order
        """
        guard_queues = {}

        if initial_queue_orders:
            # Validate and use custom queue orders
            for post in self.posts:
                if post in initial_queue_orders:
                    custom_order = initial_queue_orders[post]

                    # Validate that all guards are included and no extras
                    if set(custom_order) != set(self.guards):
                        missing = set(self.guards) - set(custom_order)
                        extra = set(custom_order) - set(self.guards)
                        error_msg = f"Invalid queue order for post '{post}'"
                        if missing:
                            error_msg += f". Missing guards: {missing}"
                        if extra:
                            error_msg += f". Unknown guards: {extra}"
                        raise ValueError(error_msg)

                    guard_queues[post] = deque(custom_order)
                else:
                    # Use default input order if not specified for this post
                    guard_queues[post] = deque(self.guards.copy())
        else:
            # Use input order for all posts (default behavior)
            for post in self.posts:
                guard_queues[post] = deque(self.guards.copy())

        return guard_queues

    def get_current_queue_orders(self) -> Dict[str, List[str]]:
        """
        Get the current queue orders for all posts.

        Returns:
            Dict mapping post_id -> list of guards in current queue order
        """
        return {post: list(queue) for post, queue in self.guard_queues.items()}

    def set_queue_order(self, post: str, guard_order: List[str]):
        """
        Set the queue order for a specific post.

        Args:
            post: The post ID to update
            guard_order: List of guards in desired order

        Raises:
            ValueError: If guard_order doesn't contain exactly the same guards
        """
        if post not in self.posts:
            raise ValueError(f"Unknown post: {post}")

        if set(guard_order) != set(self.guards):
            missing = set(self.guards) - set(guard_order)
            extra = set(guard_order) - set(self.guards)
            error_msg = f"Invalid guard order for post '{post}'"
            if missing:
                error_msg += f". Missing guards: {missing}"
            if extra:
                error_msg += f". Unknown guards: {extra}"
            raise ValueError(error_msg)

        self.guard_queues[post] = deque(guard_order)

    def rotate_queue_to_guard(self, post: str, guard: str):
        """
        Rotate the queue for a specific post so that the specified guard is at the front.

        Args:
            post: The post ID
            guard: The guard to move to the front

        Raises:
            ValueError: If post or guard is invalid
        """
        if post not in self.posts:
            raise ValueError(f"Unknown post: {post}")

        if guard not in self.guards:
            raise ValueError(f"Unknown guard: {guard}")

        queue = self.guard_queues[post]
        while queue[0] != guard:
            queue.rotate(-1)
