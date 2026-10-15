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
    tracking_type?: string;
    equipment?: string;
    muscle_group?: string;
    difficulty?: string;
    mechanics?: string;
  }[];
}

export interface DatabasePlan {
  id: string;
  name: string;
  schedule_type: string;
  goal_category: string;
  description?: string;
  is_standard_template: boolean;
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
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Deep Core / Hip Flexors",
        "difficulty": "Beginner",
        "mechanics": "Motor Control"
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
        "mechanics": "Flexion / Anti-Extension"
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
        "mechanics": "Rotational Dynamic"
      },
      {
        "name": "Kettlebell Suitcase Carry",
        "cue": "30m/side",
        "sets": 3,
        "reps": "30",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Obliques / Quadratus Lumborum",
        "difficulty": "Intermediate",
        "mechanics": "Loaded Carry / Anti-Lateral"
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
        "mechanics": "Anti-Extension"
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
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Shoulders / Scapula / Core",
        "difficulty": "Beginner",
        "mechanics": "Rotational Mobility"
      },
      {
        "name": "Kettlebell Russian Swing",
        "cue": "Explosive hip snap",
        "sets": 4,
        "reps": "15",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Posterior Chain / Glutes & Hips",
        "difficulty": "Beginner",
        "mechanics": "Ballistic / Hip Hinge"
      },
      {
        "name": "Kettlebell Goblet Squat",
        "cue": "Chest tall, elbows inside knees",
        "sets": 3,
        "reps": "10",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Quadriceps / Glutes / Core",
        "difficulty": "Beginner",
        "mechanics": "Knee-Dominant"
      },
      {
        "name": "Kettlebell Gorilla Row",
        "cue": "8 reps/arm",
        "sets": 3,
        "reps": "8",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Lats / Rhomboids / Core",
        "difficulty": "Intermediate",
        "mechanics": "Horizontal Pull"
      },
      {
        "name": "Kettlebell Farmer's Carry",
        "cue": "3 sets x 40m",
        "sets": 3,
        "reps": "40",
        "weight": "24kg",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Kettlebell",
        "muscle_group": "Forearms / Traps / Core Stability",
        "difficulty": "Beginner",
        "mechanics": "Loaded Carry"
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
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Ankle & Achilles",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
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
        "mechanics": "Eccentric"
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
        "mechanics": "Concentric"
      },
      {
        "name": "Single-Leg Balance (Pad)",
        "cue": "Proprioception",
        "sets": 3,
        "reps": "45s",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Ankle & Achilles",
        "difficulty": "Intermediate",
        "mechanics": "Isometric"
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
        "cue": "Mobility",
        "sets": 2,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
      },
      {
        "name": "McGill Curl-up",
        "cue": "Anterior Core",
        "sets": 3,
        "reps": "10s",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Beginner",
        "mechanics": "Isometric"
      },
      {
        "name": "Bird-Dog",
        "cue": "Posterior Core",
        "sets": 3,
        "reps": "10s",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Beginner",
        "mechanics": "Core Stability"
      },
      {
        "name": "Side Plank",
        "cue": "Lateral Core",
        "sets": 3,
        "reps": "10s",
        "weight": "Bodyweight",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Floor Mat",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Intermediate",
        "mechanics": "Isometric"
      },
      {
        "name": "Pallof Press",
        "cue": "Anti-rotation",
        "sets": 3,
        "reps": "12",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Resistance Band",
        "muscle_group": "Lower Back Pain",
        "difficulty": "Intermediate",
        "mechanics": "Isometric"
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
        "mechanics": "Concentric"
      },
      {
        "name": "Spanish Squat",
        "cue": "Tendon Analgesia",
        "sets": 4,
        "reps": "45s",
        "weight": "Moderate",
        "restSeconds": 45,
        "tracking_type": "time",
        "equipment": "Resistance Band",
        "muscle_group": "Knee Rehab",
        "difficulty": "Intermediate",
        "mechanics": "Isometric"
      },
      {
        "name": "Terminal Knee Extension (TKE)",
        "cue": "Tracking",
        "sets": 3,
        "reps": "15",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Resistance Band",
        "muscle_group": "Knee Rehab",
        "difficulty": "Beginner",
        "mechanics": "Isometric / Concentric"
      },
      {
        "name": "Peterson Step-Up",
        "cue": "Eccentric Load",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Plyo Box",
        "muscle_group": "Knee Rehab",
        "difficulty": "Intermediate",
        "mechanics": "Concentric"
      },
      {
        "name": "Nordic Hamstring Curl",
        "cue": "Posterior Chain",
        "sets": 3,
        "reps": "5",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Knee Rehab",
        "difficulty": "Advanced",
        "mechanics": "Eccentric"
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
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
      },
      {
        "name": "Scapular Wall Slides",
        "cue": "Activation",
        "sets": 3,
        "reps": "12",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Bodyweight",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Beginner",
        "mechanics": "Mobility"
      },
      {
        "name": "Banded External Rotation",
        "cue": "Strength",
        "sets": 3,
        "reps": "15",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Resistance Band",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Beginner",
        "mechanics": "Concentric / Eccentric"
      },
      {
        "name": "Y-T-W Raises",
        "cue": "Stability",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Intermediate",
        "mechanics": "Isotonic"
      },
      {
        "name": "Face Pulls",
        "cue": "Finisher",
        "sets": 3,
        "reps": "2s",
        "weight": "Moderate",
        "restSeconds": 45,
        "tracking_type": "reps",
        "equipment": "Resistance Band",
        "muscle_group": "Shoulder Rehab",
        "difficulty": "Intermediate",
        "mechanics": "Concentric"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Yoga",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
      },
      {
        "name": "Child's Pose",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Yoga",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
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
        "tracking_type": "reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Legs",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
      },
      {
        "name": "Bench Press",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Chest",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
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
        "mechanics": "Compound"
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
        "mechanics": "Compound"
      },
      {
        "name": "Plank",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Bodyweight",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Floor Mat",
        "muscle_group": "Core",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
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
        "mechanics": "Compound"
      },
      {
        "name": "Bicep Curl",
        "cue": "Maintain controlled form and posture.",
        "sets": 3,
        "reps": "10",
        "weight": "Moderate",
        "restSeconds": 60,
        "tracking_type": "reps",
        "equipment": "Dumbbell / Barbell",
        "muscle_group": "Arms",
        "difficulty": "Intermediate",
        "mechanics": "Compound"
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
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Beginner",
              "mechanics": "Mobility"
            },
            {
              "name": "Scapular Wall Slides",
              "cue": "Activation",
              "sets": 3,
              "reps": "12",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Beginner",
              "mechanics": "Mobility"
            },
            {
              "name": "Banded External Rotation",
              "cue": "Strength",
              "sets": 3,
              "reps": "15",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Resistance Band",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Beginner",
              "mechanics": "Concentric / Eccentric"
            },
            {
              "name": "Y-T-W Raises",
              "cue": "Stability",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Intermediate",
              "mechanics": "Isotonic"
            },
            {
              "name": "Face Pulls",
              "cue": "Finisher",
              "sets": 3,
              "reps": "2s",
              "weight": "Moderate",
              "restSeconds": 45,
              "tracking_type": "reps",
              "equipment": "Resistance Band",
              "muscle_group": "Shoulder Rehab",
              "difficulty": "Intermediate",
              "mechanics": "Concentric"
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
              "mechanics": "Concentric"
            },
            {
              "name": "Spanish Squat",
              "cue": "Tendon Analgesia",
              "sets": 4,
              "reps": "45s",
              "weight": "Moderate",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Resistance Band",
              "muscle_group": "Knee Rehab",
              "difficulty": "Intermediate",
              "mechanics": "Isometric"
            },
            {
              "name": "Terminal Knee Extension (TKE)",
              "cue": "Tracking",
              "sets": 3,
              "reps": "15",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Resistance Band",
              "muscle_group": "Knee Rehab",
              "difficulty": "Beginner",
              "mechanics": "Isometric / Concentric"
            },
            {
              "name": "Peterson Step-Up",
              "cue": "Eccentric Load",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Plyo Box",
              "muscle_group": "Knee Rehab",
              "difficulty": "Intermediate",
              "mechanics": "Concentric"
            },
            {
              "name": "Nordic Hamstring Curl",
              "cue": "Posterior Chain",
              "sets": 3,
              "reps": "5",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Knee Rehab",
              "difficulty": "Advanced",
              "mechanics": "Eccentric"
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
              "cue": "Mobility",
              "sets": 2,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Beginner",
              "mechanics": "Mobility"
            },
            {
              "name": "McGill Curl-up",
              "cue": "Anterior Core",
              "sets": 3,
              "reps": "10s",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Beginner",
              "mechanics": "Isometric"
            },
            {
              "name": "Bird-Dog",
              "cue": "Posterior Core",
              "sets": 3,
              "reps": "10s",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Beginner",
              "mechanics": "Core Stability"
            },
            {
              "name": "Side Plank",
              "cue": "Lateral Core",
              "sets": 3,
              "reps": "10s",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Intermediate",
              "mechanics": "Isometric"
            },
            {
              "name": "Pallof Press",
              "cue": "Anti-rotation",
              "sets": 3,
              "reps": "12",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Resistance Band",
              "muscle_group": "Lower Back Pain",
              "difficulty": "Intermediate",
              "mechanics": "Isometric"
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
              "tracking_type": "reps",
              "equipment": "Bodyweight",
              "muscle_group": "Ankle & Achilles",
              "difficulty": "Beginner",
              "mechanics": "Mobility"
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
              "mechanics": "Eccentric"
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
              "mechanics": "Concentric"
            },
            {
              "name": "Single-Leg Balance (Pad)",
              "cue": "Proprioception",
              "sets": 3,
              "reps": "45s",
              "weight": "Bodyweight",
              "restSeconds": 45,
              "tracking_type": "time",
              "equipment": "Floor Mat",
              "muscle_group": "Ankle & Achilles",
              "difficulty": "Intermediate",
              "mechanics": "Isometric"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
            },
            {
              "name": "Child's Pose",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
            },
            {
              "name": "Child's Pose",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Yoga",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "tracking_type": "reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Legs",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
            },
            {
              "name": "Bench Press",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Chest",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Bicep Curl",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Moderate",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Dumbbell / Barbell",
              "muscle_group": "Arms",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
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
              "mechanics": "Compound"
            },
            {
              "name": "Plank",
              "cue": "Maintain controlled form and posture.",
              "sets": 3,
              "reps": "10",
              "weight": "Bodyweight",
              "restSeconds": 60,
              "tracking_type": "reps",
              "equipment": "Floor Mat",
              "muscle_group": "Core",
              "difficulty": "Intermediate",
              "mechanics": "Compound"
            }
          ]
        }
      }
    ]
  }
];
