import sys
import os
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pose_coach import config, measurements
from pose_coach.rehab.shoulder_flexion import ShoulderFlexionTracker
from pose_coach.rehab.types import FormFlag, RehabPhase
from pose_coach.types import Landmark, PoseObservation, Side


def _make_dummy_landmarks(
    # In 2D image coordinates, y=0 is top, y=1 is bottom
    # Shoulders at y=0.30, Hips at y=0.70 (torso length = 0.40)
    r_shoulder_xy=(0.60, 0.30),
    l_shoulder_xy=(0.40, 0.30),
    r_hip_xy=(0.60, 0.70),
    l_hip_xy=(0.40, 0.70),
    r_elbow_xy=(0.60, 0.50),
    r_wrist_xy=(0.60, 0.70),
    # In 3D metric world landmarks:
    r_shoulder_3d=(0.20, 1.40, 0.0),
    r_hip_3d=(0.20, 0.90, 0.0),
    r_elbow_3d=(0.20, 1.10, 0.0),
    r_wrist_3d=(0.20, 0.80, 0.0),
):
    landmarks_2d = []
    world_landmarks = []
    
    for i in range(33):
        x2, y2 = 0.5, 0.5
        x3, y3, z3 = 0.0, 0.0, 0.0
        
        if i == config.RIGHT_SHOULDER:
            x2, y2 = r_shoulder_xy
            x3, y3, z3 = r_shoulder_3d
        elif i == config.LEFT_SHOULDER:
            x2, y2 = l_shoulder_xy
            x3, y3, z3 = (-r_shoulder_3d[0], r_shoulder_3d[1], r_shoulder_3d[2])
        elif i == config.RIGHT_HIP:
            x2, y2 = r_hip_xy
            x3, y3, z3 = r_hip_3d
        elif i == config.LEFT_HIP:
            x2, y2 = l_hip_xy
            x3, y3, z3 = (-r_hip_3d[0], r_hip_3d[1], r_hip_3d[2])
        elif i == config.RIGHT_ELBOW:
            x2, y2 = r_elbow_xy
            x3, y3, z3 = r_elbow_3d
        elif i == config.RIGHT_WRIST:
            x2, y2 = r_wrist_xy
            x3, y3, z3 = r_wrist_3d
            
        landmarks_2d.append(Landmark(x=x2, y=y2, z=0.0, visibility=0.99))
        world_landmarks.append(Landmark(x=x3, y=y3, z=z3, visibility=0.99))
        
    return PoseObservation(landmarks_2d=landmarks_2d, world_landmarks=world_landmarks)


class TestShoulderFlexionKinematics(unittest.TestCase):
    def test_resting_arm_angle_is_near_zero(self):
        obs = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.10, 0.0))
        angle = measurements.shoulder_flexion_3d_deg(obs.world_landmarks, Side.RIGHT)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 0.0, delta=1.0)

    def test_horizontal_flexion_is_90_degrees(self):
        obs = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.40, 0.30))
        angle = measurements.shoulder_flexion_3d_deg(obs.world_landmarks, Side.RIGHT)
        self.assertIsNotNone(angle)
        self.assertAlmostEqual(angle, 90.0, delta=1.0)

    def test_elbow_bent_compensation(self):
        obs = _make_dummy_landmarks(
            r_shoulder_xy=(0.60, 0.30),
            r_elbow_xy=(0.60, 0.50),
            r_wrist_xy=(0.80, 0.50), # 90 degree bend
        )
        elbow_ang = measurements.elbow_extension_deg(obs.landmarks_2d, Side.RIGHT)
        self.assertIsNotNone(elbow_ang)
        self.assertAlmostEqual(elbow_ang, 90.0, delta=2.0)
        self.assertLess(elbow_ang, config.COMPENSATION_ELBOW_MIN_DEG)

    def test_shoulder_hike_ratio(self):
        # Right shoulder hiked (smaller y in image space: 0.25 vs left at 0.30)
        obs = _make_dummy_landmarks(
            r_shoulder_xy=(0.60, 0.25),
            l_shoulder_xy=(0.40, 0.30),
            r_hip_xy=(0.60, 0.70),
        )
        hike = measurements.shoulder_hike_ratio(obs.landmarks_2d, Side.RIGHT)
        self.assertIsNotNone(hike)
        self.assertGreater(hike, config.COMPENSATION_SHOULDER_HIKE_RATIO)


class TestShoulderFlexionTracker(unittest.TestCase):
    def test_full_5s_hold_clean_rep_cycle(self):
        tracker = ShoulderFlexionTracker(side=Side.RIGHT, target_reps=10)
        obs_rest = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.10, 0.0))
        obs_90 = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.40, 0.30))
        
        # 1. Resting at t=0.0 to 1.0
        for i in range(10):
            t = i * 0.1
            rep, state = tracker.process(obs_rest, t)
            self.assertIsNone(rep)
            self.assertEqual(state.phase, RehabPhase.RESTING)

        # 2. Smooth concentric ascent from t=1.0 to t=6.5 (5.5s ascent)
        for i in range(1, 81):
            t = 1.0 + i * 0.1
            frac = min(1.0, i / 80.0)
            y3 = 1.40 - 0.30 * (1.0 - frac)
            z3 = 0.30 * frac
            obs_step = _make_dummy_landmarks(r_elbow_3d=(0.20, y3, z3))
            rep, state = tracker.process(obs_step, t)
            
        self.assertEqual(state.phase, RehabPhase.HOLDING)
        self.assertTrue(state.is_target_zone)
        
        # 3. Hold at 90° for 5.0s
        t = 7.0
        while True:
            t += 0.1
            rep, state = tracker.process(obs_90, t)
            if state.phase == RehabPhase.DESCENDING:
                break
            self.assertEqual(state.phase, RehabPhase.HOLDING)

        # 4. Smooth eccentric descent over 5.5s
        rep = None
        for i in range(1, 81):
            t += 0.1
            frac = min(1.0, i / 80.0)
            y3 = 1.40 - 0.30 * frac
            z3 = 0.30 * (1.0 - frac)
            obs_step = _make_dummy_landmarks(r_elbow_3d=(0.20, y3, z3))
            r, state = tracker.process(obs_step, t)
            if r is not None:
                rep = r
                
        # 5. Verify clean rep
        self.assertIsNotNone(rep)
        self.assertEqual(rep.rep_index, 1)
        self.assertEqual(tracker.rep_count, 1)
        self.assertTrue(rep.is_clean, f"Expected clean rep, got flags: {rep.form_flags}")
        self.assertEqual(len(rep.form_flags), 0)
        self.assertAlmostEqual(rep.hold_duration_s, 5.0, delta=0.3)

    def test_rushed_concentric_adds_flag(self):
        tracker = ShoulderFlexionTracker(side=Side.RIGHT, target_reps=10)
        obs_rest = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.10, 0.0))
        obs_90 = _make_dummy_landmarks(r_elbow_3d=(0.20, 1.40, 0.30))
        
        # Rest
        for i in range(5):
            tracker.process(obs_rest, i * 0.1)
        
        # Fast raise in 1.0s (t=0.5 to 1.5, < 3.0s threshold)
        for i in range(1, 11):
            t = 0.5 + i * 0.1
            frac = min(1.0, i / 10.0)
            y3 = 1.40 - 0.30 * (1.0 - frac)
            z3 = 0.30 * frac
            obs_step = _make_dummy_landmarks(r_elbow_3d=(0.20, y3, z3))
            tracker.process(obs_step, t)
            
        # Hold 5s
        t = 1.5
        while True:
            t += 0.1
            _, state = tracker.process(obs_90, t)
            if state.phase == RehabPhase.DESCENDING:
                break
            
        # Lower over 5s
        rep = None
        for i in range(1, 81):
            t += 0.1
            frac = min(1.0, i / 80.0)
            y3 = 1.40 - 0.30 * frac
            z3 = 0.30 * (1.0 - frac)
            obs_step = _make_dummy_landmarks(r_elbow_3d=(0.20, y3, z3))
            r, _ = tracker.process(obs_step, t)
            if r:
                rep = r
        
        self.assertIsNotNone(rep)
        self.assertFalse(rep.is_clean)
        self.assertIn(FormFlag.RUSHED_CONCENTRIC.value, rep.form_flags)


if __name__ == "__main__":
    unittest.main()
