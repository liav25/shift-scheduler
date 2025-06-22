#!/usr/bin/env python3
"""
Test State Management Implementation

This script demonstrates how to use the enhanced scheduler with state management.
"""

from datetime import datetime, timedelta
import json
from scheduler import ShiftScheduler


def test_basic_scheduling_with_state():
    """Test basic scheduling and state management."""
    print("🧪 Testing Basic Scheduling with State Management\n")

    # Define test parameters
    start_time = datetime.now().replace(hour=6, minute=0, second=0, microsecond=0)
    end_time = start_time + timedelta(days=2)

    guards = ["Alice", "Bob", "Charlie", "David"]
    posts = ["Main Gate", "East Wing"]

    unavailability = {
        "Alice": [
            {
                "start": (start_time + timedelta(hours=12)).isoformat(),
                "end": (start_time + timedelta(hours=18)).isoformat(),
            }
        ]
    }

    shift_lengths = {"day_shift_hours": 8, "night_shift_hours": 12}

    night_time_range = {"start": "22:00", "end": "06:00"}

    # Create initial scheduler
    print("📅 Creating initial 2-day schedule...")
    scheduler = ShiftScheduler(
        schedule_start_datetime=start_time.isoformat(),
        schedule_end_datetime=end_time.isoformat(),
        guards=guards,
        posts=posts,
        unavailability=unavailability,
        shift_lengths=shift_lengths,
        night_time_range=night_time_range,
        max_consecutive_nights=1,
    )

    # Solve initial schedule
    assignments = scheduler.solve()
    print(f"✅ Generated {len(assignments)} shift assignments")

    # Get and save state
    scheduler_state = scheduler.get_scheduler_state()
    print("\n💾 Saving scheduler state...")

    # Simulate saving to file (you'd use localStorage in browser)
    with open("test_scheduler_state.json", "w") as f:
        json.dump(scheduler_state, f, indent=2)

    print("📊 Work balance after initial schedule:")
    work_balance = scheduler.get_work_balance_summary()
    print_work_balance(work_balance)

    return scheduler_state, assignments


def test_continue_from_state():
    """Test continuing schedule from saved state."""
    print("\n🔄 Testing Schedule Continuation from Saved State\n")

    # Load saved state
    print("📂 Loading saved state...")
    with open("test_scheduler_state.json", "r") as f:
        saved_state = json.load(f)

    # Define continuation parameters
    last_end = datetime.fromisoformat(
        saved_state["schedule_metadata"]["last_scheduled_end"]
    )
    new_end = last_end + timedelta(days=1)  # Add one more day

    print(
        f"📅 Continuing schedule from {last_end.strftime('%Y-%m-%d %H:%M')} to {new_end.strftime('%Y-%m-%d %H:%M')}"
    )

    # Create scheduler for continuation
    scheduler = ShiftScheduler.continue_from_saved_state(
        new_schedule_end_datetime=new_end.isoformat(),
        saved_state=saved_state,
        new_unavailability={
            "Bob": [
                {
                    "start": (last_end + timedelta(hours=4)).isoformat(),
                    "end": (last_end + timedelta(hours=10)).isoformat(),
                }
            ]
        },
    )

    # Solve continuation
    new_assignments = scheduler.solve()
    print(f"✅ Generated {len(new_assignments)} additional shift assignments")

    # Get updated state
    updated_state = scheduler.get_scheduler_state()

    print("\n📊 Work balance after continuation:")
    work_balance = scheduler.get_work_balance_summary()
    print_work_balance(work_balance)

    return updated_state, new_assignments


def print_work_balance(work_balance):
    """Pretty print work balance information."""
    overall = work_balance["overall_stats"]
    guard_stats = work_balance["guard_stats"]

    print(f"   📈 Total Shifts: {overall['total_shifts']}")
    print(f"   ⏰ Total Hours: {overall['total_hours']}")
    print(f"   📊 Avg Shifts/Guard: {overall['avg_shifts_per_guard']}")
    print(f"   ⌚ Avg Hours/Guard: {overall['avg_hours_per_guard']}")
    print("\n   👮 Individual Guard Stats:")

    for guard, stats in guard_stats.items():
        print(
            f"      {guard}: {stats['total_shifts']} shifts, {stats['total_hours']} hours, {stats['consecutive_nights']} consecutive nights"
        )


def test_state_compatibility():
    """Test state compatibility checks."""
    print("\n🔍 Testing State Compatibility\n")

    # Load saved state
    with open("test_scheduler_state.json", "r") as f:
        saved_state = json.load(f)

    metadata = saved_state["schedule_metadata"]

    print("🔎 Checking compatibility...")
    print(f"   Saved Guards: {metadata['guards']}")
    print(f"   Saved Posts: {metadata['posts']}")
    print(f"   Last Scheduled: {metadata['last_scheduled_end']}")
    print(f"   Timestamp: {metadata['timestamp']}")

    # Test with different guard sets
    test_guards = ["Alice", "Bob", "Charlie", "David"]  # Same
    test_posts = ["Main Gate", "East Wing"]  # Same

    guards_match = set(metadata["guards"]) == set(test_guards)
    posts_match = set(metadata["posts"]) == set(test_posts)

    print(f"   ✅ Guards compatible: {guards_match}")
    print(f"   ✅ Posts compatible: {posts_match}")

    # Test with incompatible parameters
    incompatible_guards = ["Alice", "Bob", "Eve"]  # Different
    guards_incompatible = set(metadata["guards"]) == set(incompatible_guards)
    print(f"   ❌ Incompatible guards test: {not guards_incompatible}")


def print_sample_assignments(assignments, title="Sample Assignments", limit=5):
    """Print a few sample assignments."""
    print(f"\n📋 {title} (showing first {limit}):")
    for i, assignment in enumerate(assignments[:limit]):
        start = datetime.fromisoformat(assignment["shift_start_time"])
        end = datetime.fromisoformat(assignment["shift_end_time"])
        print(
            f"   {i+1}. {assignment['guard_id']} @ {assignment['post_id']}: {start.strftime('%m/%d %H:%M')} - {end.strftime('%m/%d %H:%M')}"
        )

    if len(assignments) > limit:
        print(f"   ... and {len(assignments) - limit} more assignments")


def main():
    """Run all state management tests."""
    print("🚀 Shift Scheduler State Management Test Suite")
    print("=" * 60)

    try:
        # Test 1: Basic scheduling with state saving
        initial_state, initial_assignments = test_basic_scheduling_with_state()
        print_sample_assignments(initial_assignments, "Initial Schedule")

        # Test 2: Continue from saved state
        continued_state, continued_assignments = test_continue_from_state()
        print_sample_assignments(continued_assignments, "Continued Schedule")

        # Test 3: State compatibility
        test_state_compatibility()

        print("\n" + "=" * 60)
        print("✅ All tests completed successfully!")
        print("\n💡 Key Features Demonstrated:")
        print("   • Save scheduler state after creating schedule")
        print("   • Load and continue from saved state")
        print("   • Maintain work balance across sessions")
        print("   • Add new unavailability for continuation")
        print("   • Check state compatibility")

        print("\n🌐 For browser integration:")
        print("   • Replace file I/O with localStorage")
        print("   • Use the provided JavaScript state manager")
        print("   • Connect to the Flask API endpoints")

    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback

        traceback.print_exc()

    finally:
        # Cleanup
        try:
            import os

            os.remove("test_scheduler_state.json")
            print("\n🧹 Cleaned up test files")
        except:
            pass


if __name__ == "__main__":
    main()
