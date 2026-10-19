// Auto-generated from Supabase Database (training_plans & worksessions)

export interface DatabaseWorksessionCard {
  id: string;
  type: 'workout' | 'rehab';
  category: string;
  title: string;
  filterTag: 'knee' | 'shoulder' | 'upper' | 'core';
  description?: string;
  metrics: {
    duration: string;
    sets: string;
    reps: string;
    load: string;
    loadColor?: string;
  };
  exercises: {
    name: string;
    cue?: string;
    sets: number;
    reps: string | number;
    weight: string;
    restSeconds: number;
    target_rest_seconds?: number;
    target_duration_seconds?: number;
    target_reps?: number;
    hold_seconds_per_rep?: number;
    reps_per_set?: number[];
    durations_per_set?: number[];
    tracking_type?: string;
    equipment?: string;
    muscle_group?: string;
    difficulty?: string;
    mechanics?: string;
    description?: string | null;
  }[];
}

export interface DatabasePlanPhase {
  id: string;
  phase_order: number;
  title: string;
  description?: string;
  required_sessions_to_pass?: number;
  max_allowed_pain_score?: number;
  worksessions: {
    dayName: string;
    worksessionId: string;
    worksessionName: string;
    modality?: string;
    exerciseCount: number;
    worksession?: DatabaseWorksessionCard | null;
  }[];
}

export interface DatabasePlan {
  id: string;
  name: string;
  schedule_type: string;
  goal_category: string;
  description?: string;
  is_standard_template: boolean;
  phases?: DatabasePlanPhase[];
  worksessions: {
    dayName: string;
    worksessionId: string;
    worksessionName: string;
    modality?: string;
    exerciseCount: number;
    worksession?: DatabaseWorksessionCard | null;
  }[];
}

export const DATABASE_WORKSESSIONS: DatabaseWorksessionCard[] = [
  {
    "id": "b0000001-0000-4000-a000-000000000006",
    "type": "workout",
    "category": "Core",
    "title": "Worksession F: 360° Core & Anti-Rotation",
    "filterTag": "core",
    "description": "Delivers comprehensive midsection conditioning across sagittal, frontal, and transverse planes blending TRX and loaded carries.",
    "metrics": {
      "duration": "50 min",
      "sets": "15 Sets",
      "reps": "10",
      "load": "Moderate"
    },
    "exercises": [
      {
        "name": "Deadbug",
        "cue": "10 reps/side",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Deep Core / Hip Flexors",
        "difficulty": "Beginner",
        "mechanics": "Motor Control",
        "description": null
      },
      {
        "name": "TRX Pike",
        "cue": "Controlled inverted V",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "TRX",
        "muscle_group": "Lower Abs / Hip Flexors / Shoulders",
        "difficulty": "Intermediate",
        "mechanics": "Flexion / Anti-Extension",
        "description": null
      },
      {
        "name": "Russian Twist",
        "cue": "20 total reps",
        "sets": 3,
        "reps": "20",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Obliques / Transverse Abdominis",
        "difficulty": "Beginner",
        "mechanics": "Rotational Dynamic",
        "description": null
      },
      {
        "name": "Kettlebell Suitcase Carry",
        "cue": "30m/side",
        "sets": 3,
        "reps": "30",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Obliques / Quadratus Lumborum",
        "difficulty": "Intermediate",
        "mechanics": "Loaded Carry / Anti-Lateral",
        "description": null
      },
      {
        "name": "Hollow Body Hold",
        "cue": "30–45s hold",
        "sets": 3,
        "reps": "40s",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Rectus Abdominis / Transverse Abdominis",
        "difficulty": "Intermediate",
        "mechanics": "Anti-Extension",
        "description": null
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000005",
    "type": "workout",
    "category": "Kettlebell",
    "title": "Worksession E: Kettlebell Power & Hinge",
    "filterTag": "core",
    "description": "Focuses on explosive hip hinge power, posterior chain strengthening, and foundational loaded carrying.",
    "metrics": {
      "duration": "50 min",
      "sets": "15 Sets",
      "reps": "10",
      "load": "Heavy"
    },
    "exercises": [
      {
        "name": "Kettlebell Halo",
        "cue": "10 reps each direction",
        "sets": 2,
        "reps": "10",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Shoulders / Scapula / Core",
        "difficulty": "Beginner",
        "mechanics": "Rotational Mobility",
        "description": null
      },
      {
        "name": "Kettlebell Russian Swing",
        "cue": "Explosive hip snap",
        "sets": 4,
        "reps": "15",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Posterior Chain / Glutes & Hips",
        "difficulty": "Beginner",
        "mechanics": "Ballistic / Hip Hinge",
        "description": null
      },
      {
        "name": "Kettlebell Goblet Squat",
        "cue": "Chest tall, elbows inside knees",
        "sets": 3,
        "reps": "10",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Quadriceps / Glutes / Core",
        "difficulty": "Beginner",
        "mechanics": "Knee-Dominant",
        "description": null
      },
      {
        "name": "Kettlebell Gorilla Row",
        "cue": "8 reps/arm",
        "sets": 3,
        "reps": "8",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Lats / Rhomboids / Core",
        "difficulty": "Intermediate",
        "mechanics": "Horizontal Pull",
        "description": null
      },
      {
        "name": "Kettlebell Farmer's Carry",
        "cue": "3 sets x 40m",
        "sets": 3,
        "reps": "40",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Forearms / Traps / Core Stability",
        "difficulty": "Beginner",
        "mechanics": "Loaded Carry",
        "description": null
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000004",
    "type": "rehab",
    "category": "Plyometrics",
    "title": "Lower Leg & Achilles Resilience",
    "filterTag": "knee",
    "description": "Strengthens the calf-achilles complex, reinforces the anterior compartment, and trains ankle proprioception for dynamic stability.",
    "metrics": {
      "duration": "32 min",
      "sets": "10 Sets",
      "reps": "26",
      "load": "Tendon Load"
    },
    "exercises": [
      {
        "name": "Ankle Alphabet",
        "cue": "Mobility",
        "sets": 1,
        "reps": "26",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Bodyweight",
        "muscle_group": "Ankle & Achilles",
        "difficulty": "Beginner",
        "mechanics": "Mobility",
        "description": null
      },
      {
        "name": "Eccentric Heel Drops",
        "cue": "Tendon Load",
        "sets": 3,
        "reps": "15",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Plyo Box",
        "muscle_group": "Ankle & Achilles",
        "difficulty": "Beginner",
        "mechanics": "Eccentric",
        "description": null
      },
      {
        "name": "Tibialis Wall Raises",
        "cue": "Deceleration Prep",
        "sets": 3,
        "reps": "20",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Ankle & Achilles",
        "difficulty": "Beginner",
        "mechanics": "Concentric",
        "description": null
      },
      {
        "name": "Single-Leg Balance (Unstable Surface)",
        "cue": "Proprioception",
        "sets": 3,
        "reps": "45s",
        "weight": "Moderate",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Airex Pad / Towel",
        "muscle_group": "Ankle / Proprioception",
        "difficulty": "Intermediate",
        "mechanics": "Isometric",
        "description": "Target Musculature & Clinical Purpose:\nRestores neuromuscular proprioception. Ligament tears disrupt the ankle's spatial awareness; this drill forces the brain to rapidly communicate with the ankle stabilizers to maintain a center of gravity.\n\nSetup & Joint Positioning:\nStand barefoot on an Airex pad, folded towel, or thick yoga mat. Hands on hips, spine tall.\n\nBiomechanical Execution & Cues:\n• Lift the non-working leg to 90 degrees.\n• Maintain a micro-bend in the working knee (do not lock it out).\n• Fixate your eyes on a single point on the wall.\n• Internal & External Cues: \"Grip the floor with your toes like eagle talons.\"\n\nCommon Faults & Kinetotherapy Fixes:\nFlailing the arms or overarching the lower back to catch balance. Fix: If the user cannot hold strict form for 10 seconds, move to a flat, hard floor before progressing to the unstable pad.\n\nRehab / Loading Parameters:\n3 sets × 45 seconds per leg. Progression: Close eyes."
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000003",
    "type": "rehab",
    "category": "Yoga",
    "title": "Acute Lower Back McGill Protocol",
    "filterTag": "core",
    "description": "Stabilizes the lumbar spine using Dr. Stuart McGill's proven endurance trio without creating destructive spinal flexion or shear forces.",
    "metrics": {
      "duration": "50 min",
      "sets": "14 Sets",
      "reps": "10",
      "load": "Light"
    },
    "exercises": [
      {
        "name": "Cat-Cow Stretch",
        "cue": "Segmental mobility with rhythm (10 reps)",
        "sets": 2,
        "reps": "45s",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "target_duration_seconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Thoracic / Lumbar Spine",
        "difficulty": "Beginner",
        "mechanics": "Mobility",
        "description": "Target Musculature & Clinical Purpose:\nThoracic and lumbar spine mobility. This is a friction-reducing, joint-lubricating movement, not a stretching exercise to pull muscles. It maps out the pain-free boundaries of spinal flexion and extension.\n\nSetup & Joint Positioning:\nAssume a quadruped (all-fours) position. Hands directly under shoulders, knees directly under hips. Spine in a neutral baseline.\n\nBiomechanical Execution & Cues:\n• Flexion (Cat): Slowly tuck the chin to the chest, tuck the pelvis under, and round the mid-back toward the ceiling.\n• Extension (Cow): Slowly lift the head, push the chest forward, and allow the belly to drop toward the floor, slightly arching the lower back.\n• Internal & External Cues: \"Move smoothly like a segmented chain.\"\n\nCommon Faults & Kinetotherapy Fixes:\nPushing deeply into pain or holding the end ranges like a static stretch. Fix: Only move within the middle 70% of your available range of motion. Do not pause at the ends; keep it dynamic and rhythmic.\n\nRehab / Loading Parameters:\n2 sets × 10 full cycles (Tempo: 2-0-2-0)."
      },
      {
        "name": "McGill Curl-up",
        "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
        "sets": 3,
        "reps": "50s (5-3-1 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 50,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [5, 3, 1],
        "durations_per_set": [50, 30, 10],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Rectus Abdominis / Anterior Core",
        "difficulty": "Beginner",
        "mechanics": "Isometric",
        "description": "Target Musculature & Clinical Purpose:\nRectus abdominis endurance. Builds anterior core stiffness without the destructive spinal flexion and disc compression caused by traditional sit-ups.\n\nSetup & Joint Positioning:\nLie face up on the floor. Bend one knee to 90 degrees with the foot flat; keep the other leg completely straight. Slide both hands (palms down) under the small of your lower back to preserve the natural lumbar arch.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Brace the abdominal wall. Lift your head, neck, and the top of your shoulder blades as a single, rigid block just 1 to 2 inches off the floor.\n• Isometric Hold: Hold the hover for 10 seconds. Do not hold your breath; sip air rhythmically over the brace.\n• Eccentric / Loading: Lower smoothly back to the floor.\n• Internal & External Cues: \"Imagine your head and upper chest are resting on a bathroom scale, and you only want to make it read zero.\"\n\nCommon Faults & Kinetotherapy Fixes:\nFlattening the lower back into the floor and crushing the hands. Fix: The pressure on your hands should remain completely unchanged throughout the entire movement. If it gets heavier, you are flexing the lumbar spine.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds. Switch the bent/straight leg halfway through each set."
      },
      {
        "name": "Bird-Dog",
        "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
        "sets": 3,
        "reps": "50s (5-3-1 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 50,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [5, 3, 1],
        "durations_per_set": [50, 30, 10],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Erector Spinae / Multifidus / Gluteal",
        "difficulty": "Beginner",
        "mechanics": "Core Stability",
        "description": "Target Musculature & Clinical Purpose:\nErector spinae, multifidus, and gluteal endurance. Teaches the body to lock the spine in a neutral position while the arms and legs move independently (anti-extension and anti-rotation).\n\nSetup & Joint Positioning:\nQuadruped position. Hands under shoulders, knees under hips. Stiffen the core 360 degrees.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Simultaneously extend one arm straight forward and the opposite leg straight backward until they are parallel to the floor.\n• Isometric Hold: Hold the peak extension for 10 seconds. Keep the foot flexed and toes pointing straight down.\n• Eccentric / Loading: Return hand and knee to the floor with total control.\n• Internal & External Cues: \"Push the wall away with your heel\" and \"Balance a full glass of water on your lower back.\"\n\nCommon Faults & Kinetotherapy Fixes:\nLifting the leg too high, which arches the lower back, or rotating the pelvis open toward the ceiling. Fix: Only lift the heel to hip height. Point the toes of the extended leg strictly at the floor to internally rotate the hip and lock the pelvis square.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side."
      },
      {
        "name": "Side Plank",
        "cue": "Elevate hips, straight neutral spine (30s / side)",
        "sets": 3,
        "reps": "30s / side",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 30,
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Obliques / Quadratus Lumborum",
        "difficulty": "Intermediate",
        "mechanics": "Isometric",
        "description": "Target Musculature & Clinical Purpose:\nObliques and quadratus lumborum (QL). Creates lateral spinal stability, essential for carrying asymmetrical loads or preventing the spine from buckling sideways under fatigue.\n\nSetup & Joint Positioning:\nLie on your side. Place the bottom elbow directly under the shoulder. Stack the feet (or place the top foot directly in front of the bottom foot for a wider base). Place the free hand on the opposite shoulder.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Drive the hips up until the body forms a perfect, rigid straight line from the ankles through the knees, hips, and ears.\n• Isometric Hold: Hold for 10 seconds.\n• Eccentric / Loading: Hinge smoothly from the hips to lower back down.\n• Internal & External Cues: \"Make your body stiff like a steel beam.\"\n\nCommon Faults & Kinetotherapy Fixes:\nSagging the hips toward the floor or twisting the chest toward the ground. Fix: If the 10-second hold cannot be maintained without sagging, regress to performing the side plank from the knees instead of the feet.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side."
      },
      {
        "name": "Pallof Press",
        "cue": "Anti-rotation isometric hold (20s / side)",
        "sets": 3,
        "reps": "20s / side",
        "weight": "Moderate",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 20,
        "tracking_type": "duration",
        "equipment": "Resistance Band",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Intermediate",
        "mechanics": "Isometric",
        "description": null
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000002",
    "type": "rehab",
    "category": "Plyometrics",
    "title": "Jumper's Knee (Patellar Tendinopathy) Relief",
    "filterTag": "knee",
    "description": "Uses isometric loading for tendon analgesia followed by slow eccentrics and posterior chain engagement to restore jump landing tolerance.",
    "metrics": {
      "duration": "50 min",
      "sets": "15 Sets",
      "reps": "15",
      "load": "Tendon Load"
    },
    "exercises": [
      {
        "name": "Glute Bridge",
        "cue": "Warm-up",
        "sets": 2,
        "reps": "15",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Knee Rehab",
        "difficulty": "Beginner",
        "mechanics": "Concentric",
        "description": null
      },
      {
        "name": "Spanish Squat",
        "cue": "Tendon Analgesia",
        "sets": 4,
        "reps": "45s",
        "weight": "Moderate",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Heavy Resistance Band",
        "muscle_group": "Patellar Tendon / Quadriceps",
        "difficulty": "Intermediate",
        "mechanics": "Isometric",
        "description": "Target Musculature & Clinical Purpose:\nPatellar tendon analgesia and quadriceps isometric capacity. Heavy isometrics safely load the muscle-tendon unit, reducing tendon pain via cortical inhibition without joint friction.\n\nSetup & Joint Positioning:\nLoop a heavy resistance band around a rig or solid anchor point. Step inside the loop, placing the band directly behind both knees. Step backward until the band is under maximum tension. Stand with feet shoulder-width apart and a neutral spine.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Sit backward, allowing the band to support your center of mass.\n• Bottom Position: Stop at 70–90 degrees of knee flexion. The shins must remain perfectly vertical (perpendicular to the floor).\n• Isometric Hold: Brace the core and hold this position statically.\n• Internal & External Cues: \"Sit back into an invisible chair\" and \"Drive the floor straight down.\"\n\nCommon Faults & Kinetotherapy Fixes:\nKnees drifting forward over the toes, defeating the band's mechanical advantage. Fix: Shift the center of mass onto the heels and trust the band to support the body's weight.\n\nRehab / Loading Parameters:\n4 sets × 45-second holds (Tempo: Isometric). RPE 8."
      },
      {
        "name": "Terminal Knee Extension (TKE)",
        "cue": "Tracking",
        "sets": 3,
        "reps": "15",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Resistance Band",
        "muscle_group": "VMO / Quadriceps",
        "difficulty": "Beginner",
        "mechanics": "Isometric / Concentric",
        "description": "Target Musculature & Clinical Purpose:\nVMO activation and joint centration. A low-threshold movement that ensures proper patellar tracking before heavy loading phases.\n\nSetup & Joint Positioning:\nAnchor a light resistance band at knee height. Step inside, placing the band directly behind the working knee. Step backward to create tension.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Start with the working knee slightly bent and the heel lifted slightly off the floor.\n• Concentric / Drive: Contract the quadriceps to forcefully snap the knee straight, driving the heel flat into the floor against the band's resistance.\n• Bottom Position: Hold the locked-out position for 2 seconds, maximally contracting the quad.\n• Internal & External Cues: \"Crush a grape under your heel\" and \"Lock the joint solid.\"\n\nCommon Faults & Kinetotherapy Fixes:\nExtending the hips to pull the band back rather than isolating the knee. Fix: Keep the hips completely static; only the knee joint should articulate.\n\nRehab / Loading Parameters:\n3 sets × 15 reps per leg (Tempo: 1-2-2-0)."
      },
      {
        "name": "Peterson Step-Up",
        "cue": "Eccentric Load",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Step / Low Box",
        "muscle_group": "VMO / Patellar Tracking",
        "difficulty": "Intermediate",
        "mechanics": "Concentric / Eccentric",
        "description": "Target Musculature & Clinical Purpose:\nEccentric deceleration capacity and patellar tracking. Rebuilds the precise motor control required for soft, silent landings.\n\nSetup & Joint Positioning:\nStand sideways on the edge of a small 4- to 6-inch elevation (a weight plate or aerobic step). The working foot is flat on the box; the non-working foot hangs free.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Keeping the hips level, slowly bend the working knee to lower the non-working heel straight down to the floor over a 3-second count.\n• Bottom Position: Lightly tap the floor with the heel. Do not transfer weight to the floor.\n• Concentric / Drive: Drive through the working midfoot to return to the starting position.\n• Internal & External Cues: \"Tap glass lightly with your heel—don't break it.\"\n\nCommon Faults & Kinetotherapy Fixes:\nDropping too fast and bouncing off the floor, or dipping the pelvis on the non-working side. Fix: Lower the box height if the pelvis tilts, and strictly enforce the 3-second descent.\n\nRehab / Loading Parameters:\n3 sets × 10 reps per leg (Tempo: 3-0-1-0)."
      },
      {
        "name": "Nordic Hamstring Curl",
        "cue": "Posterior Chain",
        "sets": 3,
        "reps": "5",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat & Anchor/Partner",
        "muscle_group": "Hamstrings / ACL Synergist",
        "difficulty": "Advanced",
        "mechanics": "Eccentric",
        "description": "Target Musculature & Clinical Purpose:\nSupramaximal eccentric hamstring strength. The hamstrings are the primary muscular synergists to the ACL (they physically prevent the tibia from sliding forward). If the athlete had a hamstring autograft, this exercise is non-negotiable for rebuilding the donor site tissue.\n\nSetup & Joint Positioning:\nKneel on a soft pad. Have a partner firmly hold your ankles down, or anchor your heels under a heavy barbell/machine. Knees, hips, and shoulders must form a perfectly straight line.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Keeping the hips fully extended (locked out), slowly lower your chest toward the floor. Use your hamstrings to brake your descent for as long as possible.\n• The Catch: When your hamstrings give out, catch yourself softly with your hands in a push-up position.\n• Concentric / Drive: Give yourself a light push off the floor while contracting the hamstrings to return to the tall kneeling position.\n• Internal & External Cues: \"Fall like a falling tree, straight as a board\" and \"Fight the fall with your heels.\"\n\nCommon Faults & Kinetotherapy Fixes:\nHinging at the hips (sticking the butt out) to make the exercise easier. Fix: Squeeze the glutes as hard as possible before starting the descent to lock the pelvis in place.\n\nRehab / Loading Parameters:\n3 sets × 5 reps (Tempo: 4-0-X-0)."
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000001",
    "type": "rehab",
    "category": "Calisthenics",
    "title": "The Overhead Athlete's Shoulder Protocol",
    "filterTag": "shoulder",
    "description": "Restores scapular kinematics, thoracic mobility, and rotator cuff integrity following repetitive overhead striking or pressing.",
    "metrics": {
      "duration": "50 min",
      "sets": "14 Sets",
      "reps": "10",
      "load": "Light"
    },
    "exercises": [
      {
        "name": "Thread the Needle",
        "cue": "Warm-up",
        "sets": 2,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Beginner",
        "mechanics": "Mobility",
        "description": null
      },
      {
        "name": "Scapular Wall Slides",
        "cue": "Activation",
        "sets": 3,
        "reps": "12",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Wall",
        "muscle_group": "Serratus Anterior / Lower Trap",
        "difficulty": "Beginner",
        "mechanics": "Scapular Mobility",
        "description": "Target Musculature & Clinical Purpose:\nSerratus anterior and lower trapezius activation. This drill trains the scapula to properly upwardly rotate and posteriorly tilt, ensuring the acromion clears the rotator cuff during overhead movements.\n\nSetup & Joint Positioning:\nStand with your back, head, and glutes flush against a wall. Place your feet a few inches away from the wall. Bring your arms into a \"goalpost\" position (elbows bent at 90 degrees) with wrists and elbows touching the wall. Pull your ribcage down to brace the core.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Slide your forearms slowly upward along the wall in a \"V\" shape.\n• Top Position: Reach as high as possible without allowing the lower back to arch off the wall or the elbows to lose contact with the surface.\n• Eccentric / Loading: Pull the elbows actively back down into the starting goalpost position.\n• Internal & External Cues: \"Push the wall away as you slide up\" and \"Keep your ribs glued to the wall.\"\n\nCommon Faults & Kinetotherapy Fixes:\nShrugging the upper traps toward the ears or arching the lumbar spine to fake overhead mobility. Fix: Stop the upward slide the moment the lower back loses contact with the wall, even if the hands are barely above the head. Range of motion will improve over time.\n\nRehab / Loading Parameters:\n3 sets × 12 reps (Tempo: 2-1-2-1)."
      },
      {
        "name": "Banded External Rotation (Eccentric Focus)",
        "cue": "Strength",
        "sets": 3,
        "reps": "15",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Resistance Band & Towel",
        "muscle_group": "Infraspinatus / Teres Minor / Rotator Cuff",
        "difficulty": "Beginner",
        "mechanics": "Isolation / Eccentric",
        "description": "Target Musculature & Clinical Purpose:\nInfraspinatus and teres minor (the posterior rotator cuff). Rebuilds the tendon's capacity to decelerate the arm after a violent throw or strike.\n\nSetup & Joint Positioning:\nAnchor a light resistance band at waist height. Stand perpendicular to the anchor. Hold the band in the outside hand. Pin the working elbow to your ribs (place a rolled-up towel between the elbow and ribs to ensure joint centration). Elbow bent at exactly 90 degrees.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Rotate the forearm outward away from the stomach as far as comfortable.\n• Eccentric / Loading: Fight the band's pull, allowing the hand to return to the stomach over a painfully slow 4-second count.\n• Internal & External Cues: \"Keep the elbow glued\" and \"Act like a rusty door hinge closing slowly.\"\n\nCommon Faults & Kinetotherapy Fixes:\nLetting the elbow drift away from the torso, which turns the movement into a deltoid lateral raise. Fix: Squeeze the towel roll firmly against the ribs; if the towel drops, the rep does not count.\n\nRehab / Loading Parameters:\n3 sets × 12 reps per side (Tempo: 4-0-1-1)."
      },
      {
        "name": "Y-T-W Raises",
        "cue": "Stability",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Incline Bench / Light Dumbbells",
        "muscle_group": "Lower/Mid Traps / Rhomboids",
        "difficulty": "Beginner",
        "mechanics": "Scapular / Compound",
        "description": "Target Musculature & Clinical Purpose:\nComprehensive conditioning of the scapular stabilizers (lower traps, middle traps, and rhomboids) to counteract the forward-rounded posture typical in athletes.\n\nSetup & Joint Positioning:\nLie prone (face down) on an incline bench set to 30–45 degrees. Hold very light dumbbells (or no weight). Keep the neck neutral. Thumbs point up toward the ceiling for all movements.\n\nBiomechanical Execution & Cues:\n• The \"Y\": Raise straight arms up and forward at a 45-degree angle. Pause, then lower. (Targets lower traps).\n• The \"T\": Raise straight arms directly out to the sides. Pause, squeeze shoulder blades together, then lower. (Targets middle traps).\n• The \"W\": Bend elbows to 90 degrees. Pull the elbows and wrists up to the ceiling simultaneously, squeezing the shoulder blades hard. (Targets rhomboids and external rotators).\n• Internal & External Cues: \"Pinch a coin between your shoulder blades\" and \"Pull your shoulder blades down into your back pockets.\"\n\nCommon Faults & Kinetotherapy Fixes:\nUsing momentum to swing the weights up or shrugging the neck. Fix: Use bare hands instead of dumbbells until the mind-muscle connection is established in the middle back.\n\nRehab / Loading Parameters:\n3 sets × 10 reps of each letter (30 total movements per set). (Tempo: 2-1-2-0)."
      },
      {
        "name": "Face Pulls",
        "cue": "Finisher",
        "sets": 3,
        "reps": "2s",
        "weight": "Moderate",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Resistance Band",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Intermediate",
        "mechanics": "Concentric",
        "description": null
      }
    ]
  },
  {
    "id": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
    "type": "workout",
    "category": "Calisthenics",
    "title": "Yoga + Calisthenics ",
    "filterTag": "upper",
    "description": "",
    "metrics": {
      "duration": "24 min",
      "sets": "9 Sets",
      "reps": "10",
      "load": "Body"
    },
    "exercises": [
      {
        "name": "Pull-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Pull-up Bar",
        "muscle_group": "Back",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Push-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Dips",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Dip Station",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "5a2f76fd-37ab-457f-b7f5-a233efc889db",
    "type": "workout",
    "category": "Plyometrics",
    "title": "Yoga + Plyometrics",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "15 min",
      "sets": "0 Sets",
      "reps": "8-12",
      "load": "Heavy"
    },
    "exercises": []
  },
  {
    "id": "17b5f1ac-6de0-41a1-993c-64ae928e4bd3",
    "type": "workout",
    "category": "Plyometrics",
    "title": "TRX + Plyometrics ",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "15 min",
      "sets": "0 Sets",
      "reps": "8-12",
      "load": "Heavy"
    },
    "exercises": []
  },
  {
    "id": "f985e5f7-d92a-441b-8588-76765aa2ee51",
    "type": "workout",
    "category": "Yoga",
    "title": "Yoga session",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "15 min",
      "sets": "0 Sets",
      "reps": "8-12",
      "load": "Body"
    },
    "exercises": []
  },
  {
    "id": "b31e63af-33e0-4211-9eb6-842114e06ca0",
    "type": "workout",
    "category": "Cardio",
    "title": "Cardio day",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "15 min",
      "sets": "3 Sets",
      "reps": "10",
      "load": "Moderate"
    },
    "exercises": [
      {
        "name": "Cycling (Stationary)",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Stationary Bike",
        "muscle_group": "Cardio",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "9e7fd4f7-b92d-4e95-ab0f-8654e7247134",
    "type": "workout",
    "category": "Plyometrics",
    "title": "Plyometrics Day",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "42 min",
      "sets": "12 Sets",
      "reps": "10",
      "load": "Heavy"
    },
    "exercises": [
      {
        "name": "Lunge Jumps",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Legs",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Jump Squats",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Legs",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Clap Push-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Burpees",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Full Body",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "5ab8604f-76a7-48a6-935b-c970b5a79051",
    "type": "workout",
    "category": "Calisthenics",
    "title": "Calisthenics day",
    "filterTag": "upper",
    "description": "",
    "metrics": {
      "duration": "24 min",
      "sets": "9 Sets",
      "reps": "10",
      "load": "Body"
    },
    "exercises": [
      {
        "name": "Dips",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Dip Station",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Pull-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Pull-up Bar",
        "muscle_group": "Back",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Push-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "8f5ee664-b7cb-4bcf-887f-4240fddd76dc",
    "type": "workout",
    "category": "Yoga",
    "title": "Yoga day",
    "filterTag": "core",
    "description": "",
    "metrics": {
      "duration": "16 min",
      "sets": "6 Sets",
      "reps": "10",
      "load": "Body"
    },
    "exercises": [
      {
        "name": "Chaturanga",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Yoga",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Child's Pose",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Yoga",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "93c0a9ad-8b74-4a52-84cd-b7d58d8a1ded",
    "type": "workout",
    "category": "Yoga",
    "title": "chest day",
    "filterTag": "upper",
    "description": "",
    "metrics": {
      "duration": "24 min",
      "sets": "9 Sets",
      "reps": "10",
      "load": "Heavy"
    },
    "exercises": [
      {
        "name": "Barbell Squat",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Legs",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Bench Press",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Box Jumps",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Plyo Box",
        "muscle_group": "Legs",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
    "type": "workout",
    "category": "Plyometrics",
    "title": "legs day",
    "filterTag": "knee",
    "description": "",
    "metrics": {
      "duration": "16 min",
      "sets": "6 Sets",
      "reps": "10",
      "load": "Moderate"
    },
    "exercises": [
      {
        "name": "Clap Push-ups",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Plank",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Core",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
    "type": "workout",
    "category": "Weightlifting",
    "title": "biceps day",
    "filterTag": "upper",
    "description": "",
    "metrics": {
      "duration": "16 min",
      "sets": "6 Sets",
      "reps": "10",
      "load": "Moderate"
    },
    "exercises": [
      {
        "name": "Burpees",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Full Body",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      },
      {
        "name": "Bicep Curl",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "weight_reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Arms",
        "difficulty": "Intermediate",
        "mechanics": "Compound",
        "description": null
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000010",
    "type": "rehab",
    "category": "Clinical Rehab",
    "title": "Lower Back Resilience: Phase 1 Routine",
    "filterTag": "core",
    "description": "Establish foundational motor control, quiet acute pain triggers, and build baseline isometric stiffness through non-compressive postures.",
    "metrics": {
      "duration": "35 min",
      "sets": "13 Sets",
      "reps": "10",
      "load": "Light"
    },
    "exercises": [
      {
        "name": "Cat-Cow Stretch",
        "cue": "Segmental flexion & extension with rhythmic breathing",
        "sets": 2,
        "reps": "45s",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "target_duration_seconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Thoracic / Lumbar Spine",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
      },
      {
        "name": "Psoas March (Supine)",
        "cue": "10 reps/side. Maintain neutral lumbar posture",
        "sets": 2,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Deep Core / Hip Flexors",
        "difficulty": "Beginner",
        "mechanics": "Motor Control"
      },
      {
        "name": "McGill Curl-up",
        "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
        "sets": 3,
        "reps": "50s (5-3-1 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 50,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [5, 3, 1],
        "durations_per_set": [50, 30, 10],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Rectus Abdominis / Anterior Core",
        "difficulty": "Beginner",
        "mechanics": "Isometric"
      },
      {
        "name": "Bird-Dog",
        "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
        "sets": 3,
        "reps": "50s (5-3-1 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 50,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [5, 3, 1],
        "durations_per_set": [50, 30, 10],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Erector Spinae / Multifidus / Gluteal",
        "difficulty": "Beginner",
        "mechanics": "Core Stability"
      },
      {
        "name": "Side Plank (Short Lever/Knees)",
        "cue": "30s/side. Knees bent at 90°, elevate hips",
        "sets": 3,
        "reps": "30s / side",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 30,
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Obliques / Lateral Core",
        "difficulty": "Beginner",
        "mechanics": "Isometric"
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000011",
    "type": "rehab",
    "category": "Clinical Rehab",
    "title": "Lower Back Resilience: Phase 2 Routine",
    "filterTag": "core",
    "description": "Increase rotational core stiffness, lengthen lever arms, and challenge dynamic stability through transitions and anti-rotational forces.",
    "metrics": {
      "duration": "40 min",
      "sets": "14 Sets",
      "reps": "12",
      "load": "Light"
    },
    "exercises": [
      {
        "name": "Cat-Cow Stretch",
        "cue": "Warmup mobility through pain-free range",
        "sets": 2,
        "reps": "45s",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "target_duration_seconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Thoracic / Lumbar Spine",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
      },
      {
        "name": "Active Straight Leg Raise",
        "cue": "12 reps/side. Keep pelvis quiet on floor",
        "sets": 2,
        "reps": "12",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Posterior Chain / Hip Flexors",
        "difficulty": "Intermediate",
        "mechanics": "Motor Control"
      },
      {
        "name": "Bird-Dog Squares",
        "cue": "45s/side. Trace square without spine rotation",
        "sets": 3,
        "reps": "45s / side",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "target_rest_seconds": 60,
        "target_duration_seconds": 45,
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Deep Core / Posterior Oblique Sling",
        "difficulty": "Intermediate",
        "mechanics": "Dynamic Stability"
      },
      {
        "name": "Rolling Side Planks",
        "cue": "60s total. Smooth controlled rotation",
        "sets": 3,
        "reps": "60s total",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "target_rest_seconds": 60,
        "target_duration_seconds": 60,
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Lateral / Anterior Core",
        "difficulty": "Intermediate",
        "mechanics": "Dynamic Stability"
      },
      {
        "name": "Pallof Press (Isometric Hold)",
        "cue": "20s/side. Resist band rotational pull",
        "sets": 3,
        "reps": "20s / side",
        "weight": "Moderate",
        "restSeconds": 45,
        "target_rest_seconds": 45,
        "target_duration_seconds": 20,
        "tracking_type": "duration",
        "equipment": "Resistance Band",
        "muscle_group": "Deep Core / Anti-Rotation",
        "difficulty": "Intermediate",
        "mechanics": "Isometric"
      },
      {
        "name": "90/90 Diaphragmatic Breathing",
        "cue": "120s diaphragmatic breathing with ribs down",
        "sets": 1,
        "reps": "120s",
        "weight": "Bodyweight",
        "restSeconds": 0,
        "target_rest_seconds": 0,
        "target_duration_seconds": 120,
        "tracking_type": "duration",
        "equipment": "Floor Mat / Bench",
        "muscle_group": "Diaphragm / Pelvic Floor",
        "difficulty": "Beginner",
        "mechanics": "Respiratory Reset"
      }
    ]
  },
  {
    "id": "b0000001-0000-4000-a000-000000000012",
    "type": "rehab",
    "category": "Clinical Rehab",
    "title": "Lower Back Resilience: Phase 3 Routine",
    "filterTag": "core",
    "description": "Integrate loaded hip hinge mechanics, kettlebell resistance, and loaded carries to build long-term tissue capacity and real-world resilience.",
    "metrics": {
      "duration": "45 min",
      "sets": "15 Sets",
      "reps": "8-10",
      "load": "Moderate"
    },
    "exercises": [
      {
        "name": "McGill Curl-up (Warmup)",
        "cue": "Activation warmup hold 30s (3 reps × 10s)",
        "sets": 1,
        "reps": "30s (3 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "target_duration_seconds": 30,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [3],
        "durations_per_set": [30],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Rectus Abdominis / Anterior Core",
        "difficulty": "Beginner",
        "mechanics": "Isometric"
      },
      {
        "name": "Bird-Dog (Warmup)",
        "cue": "Activation warmup hold 30s / side (3 reps × 10s)",
        "sets": 1,
        "reps": "30s (3 reps × 10s)",
        "weight": "Bodyweight",
        "restSeconds": 30,
        "target_rest_seconds": 30,
        "target_duration_seconds": 30,
        "hold_seconds_per_rep": 10,
        "reps_per_set": [3],
        "durations_per_set": [30],
        "tracking_type": "duration",
        "equipment": "Floor Mat",
        "muscle_group": "Erector Spinae / Multifidus",
        "difficulty": "Beginner",
        "mechanics": "Core Stability"
      },
      {
        "name": "Kettlebell Romanian Deadlift (RDL)",
        "cue": "8 reps. Hinge deeply from hips, neutral spine",
        "sets": 4,
        "reps": "8",
        "weight": "24kg",
        "restSeconds": 90,
        "target_rest_seconds": 90,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Hamstrings / Glutes / Erectors",
        "difficulty": "Intermediate",
        "mechanics": "Hip Hinge"
      },
      {
        "name": "Kettlebell Goblet Squat",
        "cue": "10 reps. Vertical torso, deep hip crease",
        "sets": 3,
        "reps": "10",
        "weight": "20kg",
        "restSeconds": 90,
        "target_rest_seconds": 90,
        "tracking_type": "weight_reps",
        "equipment": "Kettlebell",
        "muscle_group": "Quadriceps / Glutes / Core",
        "difficulty": "Intermediate",
        "mechanics": "Squat"
      },
      {
        "name": "Suitcase Carries",
        "cue": "30m/side. Strict vertical posture without lateral lean",
        "sets": 3,
        "reps": "30m",
        "weight": "20kg",
        "restSeconds": 60,
        "target_rest_seconds": 60,
        "tracking_type": "distance",
        "equipment": "Kettlebell / Dumbbell",
        "muscle_group": "Quadratus Lumborum / Obliques / Grip",
        "difficulty": "Intermediate",
        "mechanics": "Loaded Carry"
      },
      {
        "name": "90/90 Diaphragmatic Breathing",
        "cue": "180s parasympathetic recovery breathing",
        "sets": 1,
        "reps": "180s",
        "weight": "Bodyweight",
        "restSeconds": 0,
        "target_rest_seconds": 0,
        "target_duration_seconds": 180,
        "tracking_type": "duration",
        "equipment": "Floor Mat / Bench",
        "muscle_group": "Diaphragm / Autonomic Nervous System",
        "difficulty": "Beginner",
        "mechanics": "Respiratory Reset"
      }
    ]
  }
];

export const DATABASE_PLANS: DatabasePlan[] = [
  {
    "id": "c0000001-0000-4000-a000-000000000001",
    "name": "Rehabilitation & Recovery Protocol",
    "schedule_type": "floating",
    "goal_category": "Rehab & Recovery",
    "description": "Comprehensive clinical recovery protocols targeting shoulder impingement, jumper's knee (patellar tendon), lower back resilience (McGill Big 3), and Achilles/ankle stability.",
    "is_standard_template": true,
    "worksessions": [
      {
        "dayName": "Day 1 - Shoulder Rehab",
        "worksessionId": "b0000001-0000-4000-a000-000000000001",
        "worksessionName": "The Overhead Athlete's Shoulder Protocol",
        "modality": "Calisthenics",
        "exerciseCount": 5,
        "worksession": {
          "id": "b0000001-0000-4000-a000-000000000001",
          "type": "rehab",
          "category": "Calisthenics",
          "title": "The Overhead Athlete's Shoulder Protocol",
          "filterTag": "shoulder",
          "description": "Restores scapular kinematics, thoracic mobility, and rotator cuff integrity following repetitive overhead striking or pressing.",
          "metrics": {
            "duration": "50 min",
            "sets": "14 Sets",
            "reps": "10",
            "load": "Light"
          },
          "exercises": [
            {
              "name": "Thread the Needle",
              "cue": "Warm-up",
              "sets": 2,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Beginner",
              "mechanics": "Mobility",
              "description": null
            },
            {
              "name": "Scapular Wall Slides",
              "cue": "Activation",
              "sets": 3,
              "reps": "12",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Wall",
              "muscle_group": "Serratus Anterior / Lower Trap",
              "difficulty": "Beginner",
              "mechanics": "Scapular Mobility",
              "description": "Target Musculature & Clinical Purpose:\nSerratus anterior and lower trapezius activation. This drill trains the scapula to properly upwardly rotate and posteriorly tilt, ensuring the acromion clears the rotator cuff during overhead movements.\n\nSetup & Joint Positioning:\nStand with your back, head, and glutes flush against a wall. Place your feet a few inches away from the wall. Bring your arms into a \"goalpost\" position (elbows bent at 90 degrees) with wrists and elbows touching the wall. Pull your ribcage down to brace the core.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Slide your forearms slowly upward along the wall in a \"V\" shape.\n• Top Position: Reach as high as possible without allowing the lower back to arch off the wall or the elbows to lose contact with the surface.\n• Eccentric / Loading: Pull the elbows actively back down into the starting goalpost position.\n• Internal & External Cues: \"Push the wall away as you slide up\" and \"Keep your ribs glued to the wall.\"\n\nCommon Faults & Kinetotherapy Fixes:\nShrugging the upper traps toward the ears or arching the lumbar spine to fake overhead mobility. Fix: Stop the upward slide the moment the lower back loses contact with the wall, even if the hands are barely above the head. Range of motion will improve over time.\n\nRehab / Loading Parameters:\n3 sets × 12 reps (Tempo: 2-1-2-1)."
            },
            {
              "name": "Banded External Rotation (Eccentric Focus)",
              "cue": "Strength",
              "sets": 3,
              "reps": "15",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Resistance Band & Towel",
              "muscle_group": "Infraspinatus / Teres Minor / Rotator Cuff",
              "difficulty": "Beginner",
              "mechanics": "Isolation / Eccentric",
              "description": "Target Musculature & Clinical Purpose:\nInfraspinatus and teres minor (the posterior rotator cuff). Rebuilds the tendon's capacity to decelerate the arm after a violent throw or strike.\n\nSetup & Joint Positioning:\nAnchor a light resistance band at waist height. Stand perpendicular to the anchor. Hold the band in the outside hand. Pin the working elbow to your ribs (place a rolled-up towel between the elbow and ribs to ensure joint centration). Elbow bent at exactly 90 degrees.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Rotate the forearm outward away from the stomach as far as comfortable.\n• Eccentric / Loading: Fight the band's pull, allowing the hand to return to the stomach over a painfully slow 4-second count.\n• Internal & External Cues: \"Keep the elbow glued\" and \"Act like a rusty door hinge closing slowly.\"\n\nCommon Faults & Kinetotherapy Fixes:\nLetting the elbow drift away from the torso, which turns the movement into a deltoid lateral raise. Fix: Squeeze the towel roll firmly against the ribs; if the towel drops, the rep does not count.\n\nRehab / Loading Parameters:\n3 sets × 12 reps per side (Tempo: 4-0-1-1)."
            },
            {
              "name": "Y-T-W Raises",
              "cue": "Stability",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Incline Bench / Light Dumbbells",
              "muscle_group": "Lower/Mid Traps / Rhomboids",
              "difficulty": "Beginner",
              "mechanics": "Scapular / Compound",
              "description": "Target Musculature & Clinical Purpose:\nComprehensive conditioning of the scapular stabilizers (lower traps, middle traps, and rhomboids) to counteract the forward-rounded posture typical in athletes.\n\nSetup & Joint Positioning:\nLie prone (face down) on an incline bench set to 30–45 degrees. Hold very light dumbbells (or no weight). Keep the neck neutral. Thumbs point up toward the ceiling for all movements.\n\nBiomechanical Execution & Cues:\n• The \"Y\": Raise straight arms up and forward at a 45-degree angle. Pause, then lower. (Targets lower traps).\n• The \"T\": Raise straight arms directly out to the sides. Pause, squeeze shoulder blades together, then lower. (Targets middle traps).\n• The \"W\": Bend elbows to 90 degrees. Pull the elbows and wrists up to the ceiling simultaneously, squeezing the shoulder blades hard. (Targets rhomboids and external rotators).\n• Internal & External Cues: \"Pinch a coin between your shoulder blades\" and \"Pull your shoulder blades down into your back pockets.\"\n\nCommon Faults & Kinetotherapy Fixes:\nUsing momentum to swing the weights up or shrugging the neck. Fix: Use bare hands instead of dumbbells until the mind-muscle connection is established in the middle back.\n\nRehab / Loading Parameters:\n3 sets × 10 reps of each letter (30 total movements per set). (Tempo: 2-1-2-0)."
            },
            {
              "name": "Face Pulls",
              "cue": "Finisher",
              "sets": 3,
              "reps": "2s",
              "weight": "Moderate",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Resistance Band",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Intermediate",
              "mechanics": "Concentric",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Day 2 - Jumper's Knee",
        "worksessionId": "b0000001-0000-4000-a000-000000000002",
        "worksessionName": "Jumper's Knee (Patellar Tendinopathy) Relief",
        "modality": "Plyometrics",
        "exerciseCount": 5,
        "worksession": {
          "id": "b0000001-0000-4000-a000-000000000002",
          "type": "rehab",
          "category": "Plyometrics",
          "title": "Jumper's Knee (Patellar Tendinopathy) Relief",
          "filterTag": "knee",
          "description": "Uses isometric loading for tendon analgesia followed by slow eccentrics and posterior chain engagement to restore jump landing tolerance.",
          "metrics": {
            "duration": "50 min",
            "sets": "15 Sets",
            "reps": "15",
            "load": "Tendon Load"
          },
          "exercises": [
            {
              "name": "Glute Bridge",
              "cue": "Warm-up",
              "sets": 2,
              "reps": "15",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Knee Rehab",
              "difficulty": "Beginner",
              "mechanics": "Concentric",
              "description": null
            },
            {
              "name": "Spanish Squat",
              "cue": "Tendon Analgesia",
              "sets": 4,
              "reps": "45s",
              "weight": "Moderate",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Heavy Resistance Band",
              "muscle_group": "Patellar Tendon / Quadriceps",
              "difficulty": "Intermediate",
              "mechanics": "Isometric",
              "description": "Target Musculature & Clinical Purpose:\nPatellar tendon analgesia and quadriceps isometric capacity. Heavy isometrics safely load the muscle-tendon unit, reducing tendon pain via cortical inhibition without joint friction.\n\nSetup & Joint Positioning:\nLoop a heavy resistance band around a rig or solid anchor point. Step inside the loop, placing the band directly behind both knees. Step backward until the band is under maximum tension. Stand with feet shoulder-width apart and a neutral spine.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Sit backward, allowing the band to support your center of mass.\n• Bottom Position: Stop at 70–90 degrees of knee flexion. The shins must remain perfectly vertical (perpendicular to the floor).\n• Isometric Hold: Brace the core and hold this position statically.\n• Internal & External Cues: \"Sit back into an invisible chair\" and \"Drive the floor straight down.\"\n\nCommon Faults & Kinetotherapy Fixes:\nKnees drifting forward over the toes, defeating the band's mechanical advantage. Fix: Shift the center of mass onto the heels and trust the band to support the body's weight.\n\nRehab / Loading Parameters:\n4 sets × 45-second holds (Tempo: Isometric). RPE 8."
            },
            {
              "name": "Terminal Knee Extension (TKE)",
              "cue": "Tracking",
              "sets": 3,
              "reps": "15",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Resistance Band",
              "muscle_group": "VMO / Quadriceps",
              "difficulty": "Beginner",
              "mechanics": "Isometric / Concentric",
              "description": "Target Musculature & Clinical Purpose:\nVMO activation and joint centration. A low-threshold movement that ensures proper patellar tracking before heavy loading phases.\n\nSetup & Joint Positioning:\nAnchor a light resistance band at knee height. Step inside, placing the band directly behind the working knee. Step backward to create tension.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Start with the working knee slightly bent and the heel lifted slightly off the floor.\n• Concentric / Drive: Contract the quadriceps to forcefully snap the knee straight, driving the heel flat into the floor against the band's resistance.\n• Bottom Position: Hold the locked-out position for 2 seconds, maximally contracting the quad.\n• Internal & External Cues: \"Crush a grape under your heel\" and \"Lock the joint solid.\"\n\nCommon Faults & Kinetotherapy Fixes:\nExtending the hips to pull the band back rather than isolating the knee. Fix: Keep the hips completely static; only the knee joint should articulate.\n\nRehab / Loading Parameters:\n3 sets × 15 reps per leg (Tempo: 1-2-2-0)."
            },
            {
              "name": "Peterson Step-Up",
              "cue": "Eccentric Load",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Step / Low Box",
              "muscle_group": "VMO / Patellar Tracking",
              "difficulty": "Intermediate",
              "mechanics": "Concentric / Eccentric",
              "description": "Target Musculature & Clinical Purpose:\nEccentric deceleration capacity and patellar tracking. Rebuilds the precise motor control required for soft, silent landings.\n\nSetup & Joint Positioning:\nStand sideways on the edge of a small 4- to 6-inch elevation (a weight plate or aerobic step). The working foot is flat on the box; the non-working foot hangs free.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Keeping the hips level, slowly bend the working knee to lower the non-working heel straight down to the floor over a 3-second count.\n• Bottom Position: Lightly tap the floor with the heel. Do not transfer weight to the floor.\n• Concentric / Drive: Drive through the working midfoot to return to the starting position.\n• Internal & External Cues: \"Tap glass lightly with your heel—don't break it.\"\n\nCommon Faults & Kinetotherapy Fixes:\nDropping too fast and bouncing off the floor, or dipping the pelvis on the non-working side. Fix: Lower the box height if the pelvis tilts, and strictly enforce the 3-second descent.\n\nRehab / Loading Parameters:\n3 sets × 10 reps per leg (Tempo: 3-0-1-0)."
            },
            {
              "name": "Nordic Hamstring Curl",
              "cue": "Posterior Chain",
              "sets": 3,
              "reps": "5",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat & Anchor/Partner",
              "muscle_group": "Hamstrings / ACL Synergist",
              "difficulty": "Advanced",
              "mechanics": "Eccentric",
              "description": "Target Musculature & Clinical Purpose:\nSupramaximal eccentric hamstring strength. The hamstrings are the primary muscular synergists to the ACL (they physically prevent the tibia from sliding forward). If the athlete had a hamstring autograft, this exercise is non-negotiable for rebuilding the donor site tissue.\n\nSetup & Joint Positioning:\nKneel on a soft pad. Have a partner firmly hold your ankles down, or anchor your heels under a heavy barbell/machine. Knees, hips, and shoulders must form a perfectly straight line.\n\nBiomechanical Execution & Cues:\n• Eccentric / Loading: Keeping the hips fully extended (locked out), slowly lower your chest toward the floor. Use your hamstrings to brake your descent for as long as possible.\n• The Catch: When your hamstrings give out, catch yourself softly with your hands in a push-up position.\n• Concentric / Drive: Give yourself a light push off the floor while contracting the hamstrings to return to the tall kneeling position.\n• Internal & External Cues: \"Fall like a falling tree, straight as a board\" and \"Fight the fall with your heels.\"\n\nCommon Faults & Kinetotherapy Fixes:\nHinging at the hips (sticking the butt out) to make the exercise easier. Fix: Squeeze the glutes as hard as possible before starting the descent to lock the pelvis in place.\n\nRehab / Loading Parameters:\n3 sets × 5 reps (Tempo: 4-0-X-0)."
            }
          ]
        }
      },
      {
        "dayName": "Day 3 - Lower Back McGill",
        "worksessionId": "b0000001-0000-4000-a000-000000000003",
        "worksessionName": "Acute Lower Back McGill Protocol",
        "modality": "Yoga",
        "exerciseCount": 5,
        "worksession": {
          "id": "b0000001-0000-4000-a000-000000000003",
          "type": "rehab",
          "category": "Yoga",
          "title": "Acute Lower Back McGill Protocol",
          "filterTag": "core",
          "description": "Stabilizes the lumbar spine using Dr. Stuart McGill's proven endurance trio without creating destructive spinal flexion or shear forces.",
          "metrics": {
            "duration": "50 min",
            "sets": "14 Sets",
            "reps": "10",
            "load": "Light"
          },
          "exercises": [
            {
              "name": "Cat-Cow Stretch",
              "cue": "Segmental mobility with rhythm (10 reps)",
              "sets": 2,
              "reps": "45s",
              "weight": "Bodyweight",
              "restSeconds": 30,
              "target_rest_seconds": 30,
              "target_duration_seconds": 45,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Thoracic / Lumbar Spine",
              "difficulty": "Beginner",
              "mechanics": "Mobility",
              "description": "Target Musculature & Clinical Purpose:\nThoracic and lumbar spine mobility. This is a friction-reducing, joint-lubricating movement, not a stretching exercise to pull muscles. It maps out the pain-free boundaries of spinal flexion and extension.\n\nSetup & Joint Positioning:\nAssume a quadruped (all-fours) position. Hands directly under shoulders, knees directly under hips. Spine in a neutral baseline.\n\nBiomechanical Execution & Cues:\n• Flexion (Cat): Slowly tuck the chin to the chest, tuck the pelvis under, and round the mid-back toward the ceiling.\n• Extension (Cow): Slowly lift the head, push the chest forward, and allow the belly to drop toward the floor, slightly arching the lower back.\n• Internal & External Cues: \"Move smoothly like a segmented chain.\"\n\nCommon Faults & Kinetotherapy Fixes:\nPushing deeply into pain or holding the end ranges like a static stretch. Fix: Only move within the middle 70% of your available range of motion. Do not pause at the ends; keep it dynamic and rhythmic.\n\nRehab / Loading Parameters:\n2 sets × 10 full cycles (Tempo: 2-0-2-0)."
            },
            {
              "name": "McGill Curl-up",
              "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
              "sets": 3,
              "reps": "50s (5-3-1 reps × 10s)",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "target_rest_seconds": 45,
              "target_duration_seconds": 50,
              "hold_seconds_per_rep": 10,
              "reps_per_set": [5, 3, 1],
              "durations_per_set": [50, 30, 10],
              "tracking_type": "duration",
              "equipment": "Floor Mat",
              "muscle_group": "Rectus Abdominis / Anterior Core",
              "difficulty": "Beginner",
              "mechanics": "Isometric",
              "description": "Target Musculature & Clinical Purpose:\nRectus abdominis endurance. Builds anterior core stiffness without the destructive spinal flexion and disc compression caused by traditional sit-ups.\n\nSetup & Joint Positioning:\nLie face up on the floor. Bend one knee to 90 degrees with the foot flat; keep the other leg completely straight. Slide both hands (palms down) under the small of your lower back to preserve the natural lumbar arch.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Brace the abdominal wall. Lift your head, neck, and the top of your shoulder blades as a single, rigid block just 1 to 2 inches off the floor.\n• Isometric Hold: Hold the hover for 10 seconds. Do not hold your breath; sip air rhythmically over the brace.\n• Eccentric / Loading: Lower smoothly back to the floor.\n• Internal & External Cues: \"Imagine your head and upper chest are resting on a bathroom scale, and you only want to make it read zero.\"\n\nCommon Faults & Kinetotherapy Fixes:\nFlattening the lower back into the floor and crushing the hands. Fix: The pressure on your hands should remain completely unchanged throughout the entire movement. If it gets heavier, you are flexing the lumbar spine.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds. Switch the bent/straight leg halfway through each set."
            },
            {
              "name": "Bird-Dog",
              "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
              "sets": 3,
              "reps": "50s (5-3-1 reps × 10s)",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "target_rest_seconds": 45,
              "target_duration_seconds": 50,
              "hold_seconds_per_rep": 10,
              "reps_per_set": [5, 3, 1],
              "durations_per_set": [50, 30, 10],
              "tracking_type": "duration",
              "equipment": "Floor Mat",
              "muscle_group": "Erector Spinae / Multifidus / Gluteal",
              "difficulty": "Beginner",
              "mechanics": "Core Stability",
              "description": "Target Musculature & Clinical Purpose:\nErector spinae, multifidus, and gluteal endurance. Teaches the body to lock the spine in a neutral position while the arms and legs move independently (anti-extension and anti-rotation).\n\nSetup & Joint Positioning:\nQuadruped position. Hands under shoulders, knees under hips. Stiffen the core 360 degrees.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Simultaneously extend one arm straight forward and the opposite leg straight backward until they are parallel to the floor.\n• Isometric Hold: Hold the peak extension for 10 seconds. Keep the foot flexed and toes pointing straight down.\n• Eccentric / Loading: Return hand and knee to the floor with total control.\n• Internal & External Cues: \"Push the wall away with your heel\" and \"Balance a full glass of water on your lower back.\"\n\nCommon Faults & Kinetotherapy Fixes:\nLifting the leg too high, which arches the lower back, or rotating the pelvis open toward the ceiling. Fix: Only lift the heel to hip height. Point the toes of the extended leg strictly at the floor to internally rotate the hip and lock the pelvis square.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side."
            },
            {
              "name": "Side Plank",
              "cue": "Elevate hips, straight neutral spine (30s / side)",
              "sets": 3,
              "reps": "30s / side",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "target_rest_seconds": 45,
              "target_duration_seconds": 30,
              "tracking_type": "duration",
              "equipment": "Floor Mat",
              "muscle_group": "Obliques / Quadratus Lumborum",
              "difficulty": "Intermediate",
              "mechanics": "Isometric",
              "description": "Target Musculature & Clinical Purpose:\nObliques and quadratus lumborum (QL). Creates lateral spinal stability, essential for carrying asymmetrical loads or preventing the spine from buckling sideways under fatigue.\n\nSetup & Joint Positioning:\nLie on your side. Place the bottom elbow directly under the shoulder. Stack the feet (or place the top foot directly in front of the bottom foot for a wider base). Place the free hand on the opposite shoulder.\n\nBiomechanical Execution & Cues:\n• Concentric / Drive: Drive the hips up until the body forms a perfect, rigid straight line from the ankles through the knees, hips, and ears.\n• Isometric Hold: Hold for 10 seconds.\n• Eccentric / Loading: Hinge smoothly from the hips to lower back down.\n• Internal & External Cues: \"Make your body stiff like a steel beam.\"\n\nCommon Faults & Kinetotherapy Fixes:\nSagging the hips toward the floor or twisting the chest toward the ground. Fix: If the 10-second hold cannot be maintained without sagging, regress to performing the side plank from the knees instead of the feet.\n\nRehab / Loading Parameters:\n3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side."
            },
            {
              "name": "Pallof Press",
              "cue": "Anti-rotation isometric hold (20s / side)",
              "sets": 3,
              "reps": "20s / side",
              "weight": "Moderate",
              "restSeconds": 45,
              "target_rest_seconds": 45,
              "target_duration_seconds": 20,
              "tracking_type": "duration",
              "equipment": "Resistance Band",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Intermediate",
              "mechanics": "Isometric",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Day 4 - Lower Leg & Achilles",
        "worksessionId": "b0000001-0000-4000-a000-000000000004",
        "worksessionName": "Lower Leg & Achilles Resilience",
        "modality": "Plyometrics",
        "exerciseCount": 4,
        "worksession": {
          "id": "b0000001-0000-4000-a000-000000000004",
          "type": "rehab",
          "category": "Plyometrics",
          "title": "Lower Leg & Achilles Resilience",
          "filterTag": "knee",
          "description": "Strengthens the calf-achilles complex, reinforces the anterior compartment, and trains ankle proprioception for dynamic stability.",
          "metrics": {
            "duration": "32 min",
            "sets": "10 Sets",
            "reps": "26",
            "load": "Tendon Load"
          },
          "exercises": [
            {
              "name": "Ankle Alphabet",
              "cue": "Mobility",
              "sets": 1,
              "reps": "26",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Bodyweight",
              "muscle_group": "Ankle & Achilles",
              "difficulty": "Beginner",
              "mechanics": "Mobility",
              "description": null
            },
            {
              "name": "Eccentric Heel Drops",
              "cue": "Tendon Load",
              "sets": 3,
              "reps": "15",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Plyo Box",
              "muscle_group": "Ankle & Achilles",
              "difficulty": "Beginner",
              "mechanics": "Eccentric",
              "description": null
            },
            {
              "name": "Tibialis Wall Raises",
              "cue": "Deceleration Prep",
              "sets": 3,
              "reps": "20",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Ankle & Achilles",
              "difficulty": "Beginner",
              "mechanics": "Concentric",
              "description": null
            },
            {
              "name": "Single-Leg Balance (Unstable Surface)",
              "cue": "Proprioception",
              "sets": 3,
              "reps": "45s",
              "weight": "Moderate",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Airex Pad / Towel",
              "muscle_group": "Ankle / Proprioception",
              "difficulty": "Intermediate",
              "mechanics": "Isometric",
              "description": "Target Musculature & Clinical Purpose:\nRestores neuromuscular proprioception. Ligament tears disrupt the ankle's spatial awareness; this drill forces the brain to rapidly communicate with the ankle stabilizers to maintain a center of gravity.\n\nSetup & Joint Positioning:\nStand barefoot on an Airex pad, folded towel, or thick yoga mat. Hands on hips, spine tall.\n\nBiomechanical Execution & Cues:\n• Lift the non-working leg to 90 degrees.\n• Maintain a micro-bend in the working knee (do not lock it out).\n• Fixate your eyes on a single point on the wall.\n• Internal & External Cues: \"Grip the floor with your toes like eagle talons.\"\n\nCommon Faults & Kinetotherapy Fixes:\nFlailing the arms or overarching the lower back to catch balance. Fix: If the user cannot hold strict form for 10 seconds, move to a flat, hard floor before progressing to the unstable pad.\n\nRehab / Loading Parameters:\n3 sets × 45 seconds per leg. Progression: Close eyes."
            }
          ]
        }
      }
    ]
  },
  {
    "id": "030a2291-64e1-496b-b4fc-4528a9639034",
    "name": "Back pain/knee recovery+core strength",
    "schedule_type": "floating",
    "goal_category": "General",
    "description": "",
    "is_standard_template": false,
    "worksessions": []
  },
  {
    "id": "5887623e-cfe2-4986-bcf1-24d896195671",
    "name": "Main workout plan",
    "schedule_type": "anchored",
    "goal_category": "Hypertrophy",
    "description": "",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Monday",
        "worksessionId": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
        "worksessionName": "Yoga + Calisthenics ",
        "modality": "Calisthenics",
        "exerciseCount": 3,
        "worksession": {
          "id": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
          "type": "workout",
          "category": "Calisthenics",
          "title": "Yoga + Calisthenics ",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "24 min",
            "sets": "9 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Pull-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Pull-up Bar",
              "muscle_group": "Back",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Dips",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dip Station",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Tuesday",
        "worksessionId": "17b5f1ac-6de0-41a1-993c-64ae928e4bd3",
        "worksessionName": "TRX + Plyometrics ",
        "modality": "Plyometrics",
        "exerciseCount": 0,
        "worksession": {
          "id": "17b5f1ac-6de0-41a1-993c-64ae928e4bd3",
          "type": "workout",
          "category": "Plyometrics",
          "title": "TRX + Plyometrics ",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "15 min",
            "sets": "0 Sets",
            "reps": "8-12",
            "load": "Heavy"
          },
          "exercises": []
        }
      },
      {
        "dayName": "Wednesday",
        "worksessionId": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
        "worksessionName": "Yoga + Calisthenics ",
        "modality": "Calisthenics",
        "exerciseCount": 3,
        "worksession": {
          "id": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
          "type": "workout",
          "category": "Calisthenics",
          "title": "Yoga + Calisthenics ",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "24 min",
            "sets": "9 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Pull-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Pull-up Bar",
              "muscle_group": "Back",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Dips",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dip Station",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Saturday",
        "worksessionId": "5a2f76fd-37ab-457f-b7f5-a233efc889db",
        "worksessionName": "Yoga + Plyometrics",
        "modality": "Plyometrics",
        "exerciseCount": 0,
        "worksession": {
          "id": "5a2f76fd-37ab-457f-b7f5-a233efc889db",
          "type": "workout",
          "category": "Plyometrics",
          "title": "Yoga + Plyometrics",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "15 min",
            "sets": "0 Sets",
            "reps": "8-12",
            "load": "Heavy"
          },
          "exercises": []
        }
      },
      {
        "dayName": "Thursday",
        "worksessionId": "17b5f1ac-6de0-41a1-993c-64ae928e4bd3",
        "worksessionName": "TRX + Plyometrics ",
        "modality": "Plyometrics",
        "exerciseCount": 0,
        "worksession": {
          "id": "17b5f1ac-6de0-41a1-993c-64ae928e4bd3",
          "type": "workout",
          "category": "Plyometrics",
          "title": "TRX + Plyometrics ",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "15 min",
            "sets": "0 Sets",
            "reps": "8-12",
            "load": "Heavy"
          },
          "exercises": []
        }
      },
      {
        "dayName": "Friday",
        "worksessionId": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
        "worksessionName": "Yoga + Calisthenics ",
        "modality": "Calisthenics",
        "exerciseCount": 3,
        "worksession": {
          "id": "e1e55960-28e9-4273-997b-7f5f98cbf18b",
          "type": "workout",
          "category": "Calisthenics",
          "title": "Yoga + Calisthenics ",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "24 min",
            "sets": "9 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Pull-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Pull-up Bar",
              "muscle_group": "Back",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Dips",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dip Station",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "01af7364-368d-4c3e-833b-92600dd0a80f",
    "name": "Foundation muscle growth",
    "schedule_type": "anchored",
    "goal_category": "Hypertrophy",
    "description": "A 4-day split (upper/lower body) designed to maximize muscle size through proven set-and-rep protocols focusing on multi-joint compound movements",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Monday",
        "worksessionId": "b31e63af-33e0-4211-9eb6-842114e06ca0",
        "worksessionName": "Cardio day",
        "modality": "Cardio",
        "exerciseCount": 1,
        "worksession": {
          "id": "b31e63af-33e0-4211-9eb6-842114e06ca0",
          "type": "workout",
          "category": "Cardio",
          "title": "Cardio day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "15 min",
            "sets": "3 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Cycling (Stationary)",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Stationary Bike",
              "muscle_group": "Cardio",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Wednesday",
        "worksessionId": "9e7fd4f7-b92d-4e95-ab0f-8654e7247134",
        "worksessionName": "Plyometrics Day",
        "modality": "Plyometrics",
        "exerciseCount": 4,
        "worksession": {
          "id": "9e7fd4f7-b92d-4e95-ab0f-8654e7247134",
          "type": "workout",
          "category": "Plyometrics",
          "title": "Plyometrics Day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "42 min",
            "sets": "12 Sets",
            "reps": "10",
            "load": "Heavy"
          },
          "exercises": [
            {
              "name": "Lunge Jumps",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Jump Squats",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Clap Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Burpees",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Full Body",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Friday",
        "worksessionId": "8f5ee664-b7cb-4bcf-887f-4240fddd76dc",
        "worksessionName": "Yoga day",
        "modality": "Yoga",
        "exerciseCount": 2,
        "worksession": {
          "id": "8f5ee664-b7cb-4bcf-887f-4240fddd76dc",
          "type": "workout",
          "category": "Yoga",
          "title": "Yoga day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Chaturanga",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Child's Pose",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "89ec0188-ae74-4c2c-9264-0a5d34b3f868",
    "name": "Recovery + Strength Plan",
    "schedule_type": "floating",
    "goal_category": "General",
    "description": "",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Worksession 1",
        "worksessionId": "8f5ee664-b7cb-4bcf-887f-4240fddd76dc",
        "worksessionName": "Yoga day",
        "modality": "Yoga",
        "exerciseCount": 2,
        "worksession": {
          "id": "8f5ee664-b7cb-4bcf-887f-4240fddd76dc",
          "type": "workout",
          "category": "Yoga",
          "title": "Yoga day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Chaturanga",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Child's Pose",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Worksession 2",
        "worksessionId": "b31e63af-33e0-4211-9eb6-842114e06ca0",
        "worksessionName": "Cardio day",
        "modality": "Cardio",
        "exerciseCount": 1,
        "worksession": {
          "id": "b31e63af-33e0-4211-9eb6-842114e06ca0",
          "type": "workout",
          "category": "Cardio",
          "title": "Cardio day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "15 min",
            "sets": "3 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Cycling (Stationary)",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Stationary Bike",
              "muscle_group": "Cardio",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Worksession 3",
        "worksessionId": "9e7fd4f7-b92d-4e95-ab0f-8654e7247134",
        "worksessionName": "Plyometrics Day",
        "modality": "Plyometrics",
        "exerciseCount": 4,
        "worksession": {
          "id": "9e7fd4f7-b92d-4e95-ab0f-8654e7247134",
          "type": "workout",
          "category": "Plyometrics",
          "title": "Plyometrics Day",
          "filterTag": "core",
          "description": "",
          "metrics": {
            "duration": "42 min",
            "sets": "12 Sets",
            "reps": "10",
            "load": "Heavy"
          },
          "exercises": [
            {
              "name": "Lunge Jumps",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Jump Squats",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Clap Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Burpees",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Full Body",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Worksession 4",
        "worksessionId": "5ab8604f-76a7-48a6-935b-c970b5a79051",
        "worksessionName": "Calisthenics day",
        "modality": "Calisthenics",
        "exerciseCount": 3,
        "worksession": {
          "id": "5ab8604f-76a7-48a6-935b-c970b5a79051",
          "type": "workout",
          "category": "Calisthenics",
          "title": "Calisthenics day",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "24 min",
            "sets": "9 Sets",
            "reps": "10",
            "load": "Body"
          },
          "exercises": [
            {
              "name": "Dips",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dip Station",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Pull-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Pull-up Bar",
              "muscle_group": "Back",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "45e50726-f86e-41d2-b280-f9f21d5e27cc",
    "name": "fixed plan",
    "schedule_type": "anchored",
    "goal_category": "General",
    "description": "",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Tuesday",
        "worksessionId": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
        "worksessionName": "biceps day",
        "modality": "Weightlifting",
        "exerciseCount": 2,
        "worksession": {
          "id": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
          "type": "workout",
          "category": "Weightlifting",
          "title": "biceps day",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Burpees",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Full Body",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Monday",
        "worksessionId": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
        "worksessionName": "legs day",
        "modality": "Plyometrics",
        "exerciseCount": 2,
        "worksession": {
          "id": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
          "type": "workout",
          "category": "Plyometrics",
          "title": "legs day",
          "filterTag": "knee",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Clap Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Friday",
        "worksessionId": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
        "worksessionName": "legs day",
        "modality": "Plyometrics",
        "exerciseCount": 2,
        "worksession": {
          "id": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
          "type": "workout",
          "category": "Plyometrics",
          "title": "legs day",
          "filterTag": "knee",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Clap Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "b0d46a42-f48a-462a-b7c6-da5063c7d5c7",
    "name": "strong 2",
    "schedule_type": "floating",
    "goal_category": "General",
    "description": "",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Day 1",
        "worksessionId": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
        "worksessionName": "biceps day",
        "modality": "Weightlifting",
        "exerciseCount": 2,
        "worksession": {
          "id": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
          "type": "workout",
          "category": "Weightlifting",
          "title": "biceps day",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Burpees",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Full Body",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "b6f574a9-bc93-4d26-8f40-636b21eba662",
    "name": "Get stronger ",
    "schedule_type": "floating",
    "goal_category": "General",
    "description": "",
    "is_standard_template": false,
    "worksessions": [
      {
        "dayName": "Day 1",
        "worksessionId": "93c0a9ad-8b74-4a52-84cd-b7d58d8a1ded",
        "worksessionName": "chest day",
        "modality": "Yoga",
        "exerciseCount": 3,
        "worksession": {
          "id": "93c0a9ad-8b74-4a52-84cd-b7d58d8a1ded",
          "type": "workout",
          "category": "Yoga",
          "title": "chest day",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "24 min",
            "sets": "9 Sets",
            "reps": "10",
            "load": "Heavy"
          },
          "exercises": [
            {
              "name": "Barbell Squat",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Bench Press",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Box Jumps",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Plyo Box",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Worksession 2",
        "worksessionId": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
        "worksessionName": "biceps day",
        "modality": "Weightlifting",
        "exerciseCount": 2,
        "worksession": {
          "id": "aa3611da-6bb9-49a7-aee7-178cd3e2c058",
          "type": "workout",
          "category": "Weightlifting",
          "title": "biceps day",
          "filterTag": "upper",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Burpees",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Full Body",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "weight_reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      },
      {
        "dayName": "Worksession 3",
        "worksessionId": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
        "worksessionName": "legs day",
        "modality": "Plyometrics",
        "exerciseCount": 2,
        "worksession": {
          "id": "01e3189c-0f07-4d06-b06b-b4b22925dc9b",
          "type": "workout",
          "category": "Plyometrics",
          "title": "legs day",
          "filterTag": "knee",
          "description": "",
          "metrics": {
            "duration": "16 min",
            "sets": "6 Sets",
            "reps": "10",
            "load": "Moderate"
          },
          "exercises": [
            {
              "name": "Clap Push-ups",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound",
              "description": null
            }
          ]
        }
      }
    ]
  },
  {
    "id": "d4eee31a-0be4-4807-ab1c-57ba7466bd06",
    "name": "Lower Back & Lumbar Spine Resilience (Postural Syndrome)",
    "schedule_type": "criteria_progression",
    "goal_category": "Clinical Rehab (lumbar_spine)",
    "description": "A progressive, three-phase clinical protocol designed to decompress the lumbar spine, overcome sitting-induced gluteal amnesia, and build a 360-degree corset of anti-extension core endurance.",
    "is_standard_template": true,
    "phases": [
      {
        "id": "phase-lb-1",
        "phase_order": 1,
        "title": "Motor Control & Baseline Endurance",
        "description": "Establish foundational motor control, quiet acute pain triggers, and build baseline isometric stiffness through non-compressive postures.",
        "required_sessions_to_pass": 8,
        "max_allowed_pain_score": 4,
        "worksessions": [
          {
            "dayName": "Day 1 - Baseline Endurance",
            "worksessionId": "b0000001-0000-4000-a000-000000000010",
            "worksessionName": "Lower Back Resilience: Phase 1 Routine",
            "modality": "Clinical Rehab",
            "exerciseCount": 5,
            "worksession": {
              "id": "b0000001-0000-4000-a000-000000000010",
              "type": "rehab",
              "category": "Clinical Rehab",
              "title": "Lower Back Resilience: Phase 1 Routine",
              "filterTag": "core",
              "description": "Establish foundational motor control, quiet acute pain triggers, and build baseline isometric stiffness through non-compressive postures.",
              "metrics": {
                "duration": "35 min",
                "sets": "13 Sets",
                "reps": "10",
                "load": "Light"
              },
              "exercises": [
                {
                  "name": "Cat-Cow Stretch",
                  "cue": "Segmental flexion & extension with rhythmic breathing",
                  "sets": 2,
                  "reps": "45s",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "target_duration_seconds": 45,
                  "tracking_type": "time",
                  "equipment": "Floor Mat",
                  "muscle_group": "Thoracic / Lumbar Spine",
                  "difficulty": "Beginner",
                  "mechanics": "Mobility"
                },
                {
                  "name": "Psoas March (Supine)",
                  "cue": "10 reps/side. Maintain neutral lumbar posture",
                  "sets": 2,
                  "reps": "10",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "tracking_type": "reps",
                  "equipment": "Floor Mat",
                  "muscle_group": "Deep Core / Hip Flexors",
                  "difficulty": "Beginner",
                  "mechanics": "Motor Control"
                },
                {
                  "name": "McGill Curl-up",
                  "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
                  "sets": 3,
                  "reps": "50s (5-3-1 reps × 10s)",
                  "weight": "Bodyweight",
                  "restSeconds": 45,
                  "target_rest_seconds": 45,
                  "target_duration_seconds": 50,
                  "hold_seconds_per_rep": 10,
                  "reps_per_set": [5, 3, 1],
                  "durations_per_set": [50, 30, 10],
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Rectus Abdominis / Anterior Core",
                  "difficulty": "Beginner",
                  "mechanics": "Isometric"
                },
                {
                  "name": "Bird-Dog",
                  "cue": "Descending hold: Set 1 (50s=5 reps), Set 2 (30s=3 reps), Set 3 (10s=1 rep)",
                  "sets": 3,
                  "reps": "50s (5-3-1 reps × 10s)",
                  "weight": "Bodyweight",
                  "restSeconds": 45,
                  "target_rest_seconds": 45,
                  "target_duration_seconds": 50,
                  "hold_seconds_per_rep": 10,
                  "reps_per_set": [5, 3, 1],
                  "durations_per_set": [50, 30, 10],
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Erector Spinae / Multifidus / Gluteal",
                  "difficulty": "Beginner",
                  "mechanics": "Core Stability"
                },
                {
                  "name": "Side Plank (Short Lever/Knees)",
                  "cue": "30s/side. Knees bent at 90°, elevate hips",
                  "sets": 3,
                  "reps": "30s / side",
                  "weight": "Bodyweight",
                  "restSeconds": 45,
                  "target_rest_seconds": 45,
                  "target_duration_seconds": 30,
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Obliques / Lateral Core",
                  "difficulty": "Beginner",
                  "mechanics": "Isometric"
                }
              ]
            }
          }
        ]
      },
      {
        "id": "phase-lb-2",
        "phase_order": 2,
        "title": "Leverage & Anti-Rotation",
        "description": "Increase rotational core stiffness, lengthen lever arms, and challenge dynamic stability through transitions and anti-rotational forces.",
        "required_sessions_to_pass": 10,
        "max_allowed_pain_score": 3,
        "worksessions": [
          {
            "dayName": "Day 1 - Leverage & Stability",
            "worksessionId": "b0000001-0000-4000-a000-000000000011",
            "worksessionName": "Lower Back Resilience: Phase 2 Routine",
            "modality": "Clinical Rehab",
            "exerciseCount": 6,
            "worksession": {
              "id": "b0000001-0000-4000-a000-000000000011",
              "type": "rehab",
              "category": "Clinical Rehab",
              "title": "Lower Back Resilience: Phase 2 Routine",
              "filterTag": "core",
              "description": "Increase rotational core stiffness, lengthen lever arms, and challenge dynamic stability through transitions and anti-rotational forces.",
              "metrics": {
                "duration": "40 min",
                "sets": "14 Sets",
                "reps": "12",
                "load": "Light"
              },
              "exercises": [
                {
                  "name": "Cat-Cow Stretch",
                  "cue": "Warmup mobility through pain-free range",
                  "sets": 2,
                  "reps": "45s",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "target_duration_seconds": 45,
                  "tracking_type": "time",
                  "equipment": "Floor Mat",
                  "muscle_group": "Thoracic / Lumbar Spine",
                  "difficulty": "Beginner",
                  "mechanics": "Mobility"
                },
                {
                  "name": "Active Straight Leg Raise",
                  "cue": "12 reps/side. Keep pelvis quiet on floor",
                  "sets": 2,
                  "reps": "12",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "tracking_type": "reps",
                  "equipment": "Floor Mat",
                  "muscle_group": "Posterior Chain / Hip Flexors",
                  "difficulty": "Intermediate",
                  "mechanics": "Motor Control"
                },
                {
                  "name": "Bird-Dog Squares",
                  "cue": "45s/side. Trace square without spine rotation",
                  "sets": 3,
                  "reps": "45s / side",
                  "weight": "Bodyweight",
                  "restSeconds": 60,
                  "target_rest_seconds": 60,
                  "target_duration_seconds": 45,
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Deep Core / Posterior Oblique Sling",
                  "difficulty": "Intermediate",
                  "mechanics": "Dynamic Stability"
                },
                {
                  "name": "Rolling Side Planks",
                  "cue": "60s total. Smooth controlled rotation",
                  "sets": 3,
                  "reps": "60s total",
                  "weight": "Bodyweight",
                  "restSeconds": 60,
                  "target_rest_seconds": 60,
                  "target_duration_seconds": 60,
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Lateral / Anterior Core",
                  "difficulty": "Intermediate",
                  "mechanics": "Dynamic Stability"
                },
                {
                  "name": "Pallof Press (Isometric Hold)",
                  "cue": "20s/side. Resist band rotational pull",
                  "sets": 3,
                  "reps": "20s / side",
                  "weight": "Moderate",
                  "restSeconds": 45,
                  "target_rest_seconds": 45,
                  "target_duration_seconds": 20,
                  "tracking_type": "duration",
                  "equipment": "Resistance Band",
                  "muscle_group": "Deep Core / Anti-Rotation",
                  "difficulty": "Intermediate",
                  "mechanics": "Isometric"
                },
                {
                  "name": "90/90 Diaphragmatic Breathing",
                  "cue": "120s diaphragmatic breathing with ribs down",
                  "sets": 1,
                  "reps": "120s",
                  "weight": "Bodyweight",
                  "restSeconds": 0,
                  "target_rest_seconds": 0,
                  "target_duration_seconds": 120,
                  "tracking_type": "duration",
                  "equipment": "Floor Mat / Bench",
                  "muscle_group": "Diaphragm / Pelvic Floor",
                  "difficulty": "Beginner",
                  "mechanics": "Respiratory Reset"
                }
              ]
            }
          }
        ]
      },
      {
        "id": "phase-lb-3",
        "phase_order": 3,
        "title": "Load Integration & Functional Hinging",
        "description": "Integrate loaded hip hinge mechanics, kettlebell resistance, and loaded carries to build long-term tissue capacity and real-world resilience.",
        "required_sessions_to_pass": 12,
        "max_allowed_pain_score": 3,
        "worksessions": [
          {
            "dayName": "Day 1 - Load Integration",
            "worksessionId": "b0000001-0000-4000-a000-000000000012",
            "worksessionName": "Lower Back Resilience: Phase 3 Routine",
            "modality": "Clinical Rehab",
            "exerciseCount": 6,
            "worksession": {
              "id": "b0000001-0000-4000-a000-000000000012",
              "type": "rehab",
              "category": "Clinical Rehab",
              "title": "Lower Back Resilience: Phase 3 Routine",
              "filterTag": "core",
              "description": "Integrate loaded hip hinge mechanics, kettlebell resistance, and loaded carries to build long-term tissue capacity and real-world resilience.",
              "metrics": {
                "duration": "45 min",
                "sets": "15 Sets",
                "reps": "8-10",
                "load": "Moderate"
              },
              "exercises": [
                {
                  "name": "McGill Curl-up (Warmup)",
                  "cue": "Activation warmup hold 30s (3 reps × 10s)",
                  "sets": 1,
                  "reps": "30s (3 reps × 10s)",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "target_duration_seconds": 30,
                  "hold_seconds_per_rep": 10,
                  "reps_per_set": [3],
                  "durations_per_set": [30],
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Rectus Abdominis / Anterior Core",
                  "difficulty": "Beginner",
                  "mechanics": "Isometric"
                },
                {
                  "name": "Bird-Dog (Warmup)",
                  "cue": "Activation warmup hold 30s / side (3 reps × 10s)",
                  "sets": 1,
                  "reps": "30s (3 reps × 10s)",
                  "weight": "Bodyweight",
                  "restSeconds": 30,
                  "target_rest_seconds": 30,
                  "target_duration_seconds": 30,
                  "hold_seconds_per_rep": 10,
                  "reps_per_set": [3],
                  "durations_per_set": [30],
                  "tracking_type": "duration",
                  "equipment": "Floor Mat",
                  "muscle_group": "Erector Spinae / Multifidus",
                  "difficulty": "Beginner",
                  "mechanics": "Core Stability"
                },
                {
                  "name": "Kettlebell Romanian Deadlift (RDL)",
                  "cue": "8 reps. Hinge deeply from hips, neutral spine",
                  "sets": 4,
                  "reps": "8",
                  "weight": "24kg",
                  "restSeconds": 90,
                  "target_rest_seconds": 90,
                  "tracking_type": "weight_reps",
                  "equipment": "Kettlebell",
                  "muscle_group": "Hamstrings / Glutes / Erectors",
                  "difficulty": "Intermediate",
                  "mechanics": "Hip Hinge"
                },
                {
                  "name": "Kettlebell Goblet Squat",
                  "cue": "10 reps. Vertical torso, deep hip crease",
                  "sets": 3,
                  "reps": "10",
                  "weight": "20kg",
                  "restSeconds": 90,
                  "target_rest_seconds": 90,
                  "tracking_type": "weight_reps",
                  "equipment": "Kettlebell",
                  "muscle_group": "Quadriceps / Glutes / Core",
                  "difficulty": "Intermediate",
                  "mechanics": "Squat"
                },
                {
                  "name": "Suitcase Carries",
                  "cue": "30m/side. Strict vertical posture without lateral lean",
                  "sets": 3,
                  "reps": "30m",
                  "weight": "20kg",
                  "restSeconds": 60,
                  "target_rest_seconds": 60,
                  "tracking_type": "distance",
                  "equipment": "Kettlebell / Dumbbell",
                  "muscle_group": "Quadratus Lumborum / Obliques / Grip",
                  "difficulty": "Intermediate",
                  "mechanics": "Loaded Carry"
                },
                {
                  "name": "90/90 Diaphragmatic Breathing",
                  "cue": "180s parasympathetic recovery breathing",
                  "sets": 1,
                  "reps": "180s",
                  "weight": "Bodyweight",
                  "restSeconds": 0,
                  "target_rest_seconds": 0,
                  "target_duration_seconds": 180,
                  "tracking_type": "duration",
                  "equipment": "Floor Mat / Bench",
                  "muscle_group": "Diaphragm / Autonomic Nervous System",
                  "difficulty": "Beginner",
                  "mechanics": "Respiratory Reset"
                }
              ]
            }
          }
        ]
      }
    ],
    "worksessions": [
      {
        "dayName": "Phase 1: Baseline Endurance",
        "worksessionId": "b0000001-0000-4000-a000-000000000010",
        "worksessionName": "Lower Back Resilience: Phase 1 Routine",
        "modality": "Clinical Rehab",
        "exerciseCount": 5
      },
      {
        "dayName": "Phase 2: Leverage & Anti-Rotation",
        "worksessionId": "b0000001-0000-4000-a000-000000000011",
        "worksessionName": "Lower Back Resilience: Phase 2 Routine",
        "modality": "Clinical Rehab",
        "exerciseCount": 6
      },
      {
        "dayName": "Phase 3: Load Integration",
        "worksessionId": "b0000001-0000-4000-a000-000000000012",
        "worksessionName": "Lower Back Resilience: Phase 3 Routine",
        "modality": "Clinical Rehab",
        "exerciseCount": 6
      }
    ]
  }
];
