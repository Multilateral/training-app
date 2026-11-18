const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nfzuvugwamzjsxngptta.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5menV2dWd3YW16anN4bmdwdHRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTUzMjgzMywiZXhwIjoyMDk3MTA4ODMzfQ.oLlKiuNhh2Rnas1mFh_WbWytNPsjySYKINQp_jY7VlE';

const supabase = createClient(supabaseUrl, serviceRoleKey);

const FOAM_ROLLER_EXERCISES = [
  {
    id: 'e0000004-0000-4000-a000-000000000001',
    name: 'Foam Roller Thoracic Spine Extension',
    category: 'Recovery',
    muscle_group: 'Thoracic Spine / Rhomboids / Trapezius',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    tracking_type: 'reps',
    instructions: 'Place roller perpendicular under mid-back. Support head with hands, interlace fingers. Inhale, gently extend upper spine backward over the roller. Exhale and return to neutral without arching lower back.',
    description: `Target Musculature & Clinical Purpose:
Restores thoracic extension and mobilizes hypomobile spinal segments (T4–T10) while preserving lumbopelvic stability. Counteracts excessive forward thoracic kyphosis from prolonged desk work, improving overhead arm reach and reducing cervical-thoracic junction shear.

Setup & Joint Positioning:
Sit on the floor with knees bent and feet flat. Place the foam roller perpendicular to your spine at the mid-back level (below shoulder blades). Interlace fingers behind your head to fully support the cervical spine; keep elbows tucked slightly forward.

Biomechanical Execution & Cues:
• Loading / Extension: Inhale deeply, gently arch your thoracic spine over the roller while keeping hips and lower back grounded.
• Peak Stretch: Hold 2 seconds at the end-range of extension. Do not allow the rib cage to flare or lumbar spine to hyperextend.
• Reset / Flexion: Exhale as you gently flex back to the starting neutral position. Shift the roller 1-2 inches higher or lower and repeat across 3-4 segments.
• Internal & External Cues: "Pivot only through your ribs and chest" and "Keep your belly button pulled firmly down."

Common Faults & Kinetotherapy Fixes:
Cranking the neck forward or arching the lumbar spine. Fix: Keep neck in neutral alignment with hands cradling occiput, and keep glutes firmly pinned to the floor.

Rehab / Loading Parameters:
2–3 sets × 8–10 gentle extension pulses per segment (Tempo: 2-2-1-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 40,
    default_reps: 10,
    seconds_per_rep: 4.0
  },
  {
    id: 'e0000004-0000-4000-a000-000000000002',
    name: 'Foam Roller Upper Back & Rhomboids Roll',
    category: 'Recovery',
    muscle_group: 'Rhomboids / Mid-Trapezius / Posterior Deltoids',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Position roller across upper back, cross arms over chest to spread shoulder blades (hug yourself). Lift hips slightly and roll smoothly between the mid-back and upper traps.',
    description: `Target Musculature & Clinical Purpose:
Decompresses fascial density in the rhomboid major/minor, mid-trapezius, and posterior periscapular muscles. Spreading the scapulae exposes the interscapular muscular beds for effective myofascial release.

Setup & Joint Positioning:
Place foam roller beneath shoulder blades. Cross arms over chest tightly (self-hug) to abduct and protract the scapulae away from the spine. Lift hips slightly off floor to regulate bodyweight pressure.

Biomechanical Execution & Cues:
• Roll slowly from mid-thoracic spine up toward base of neck/upper shoulder girdle over 45 seconds.
• Pause for 15–20 seconds on focal trigger points or taut muscular bands.
• Maintain continuous, rhythmic diaphragmatic breathing.
• Internal & External Cues: "Hug yourself tightly to widen the back" and "Melt heavy weight into the foam roller."

Common Faults & Kinetotherapy Fixes:
Rolling down into the low back (lumbar spine). Fix: Never roll past the 12th rib (lower boundary of ribcage) to protect unsupported lumbar vertebrae.

Rehab / Loading Parameters:
2 sets × 45 seconds slow rolling.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000003',
    name: 'Foam Roller Latissimus Dorsi & Teres Major Release',
    category: 'Recovery',
    muscle_group: 'Latissimus Dorsi / Teres Major / Serratus Anterior',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie on your side with roller positioned just below the armpit. Extend bottom arm overhead with thumb up. Roll slowly down the side of your ribcage, pausing on tender trigger points.',
    description: `Target Musculature & Clinical Purpose:
Releases myofascial tightness in the latissimus dorsi and teres major. Chronic lat stiffness restricts overhead shoulder flexion and forces hyperextension of the lumbar spine during pressing and pulling.

Setup & Joint Positioning:
Side-lying position with the foam roller perpendicular to your torso placed right below the axilla (armpit). Extend the bottom arm straight overhead with the thumb pointed upward (external shoulder rotation). Bend knees to 90 degrees for pelvic stability.

Biomechanical Execution & Cues:
• Roll downward along the lateral ribcage and outer border of the scapula for 2–4 inches.
• When a tender nodule is identified, sustain localized pressure for 20–30 seconds.
• Incorporate active mobilizations: oscillate the extended arm forward and backward slowly while maintaining pressure.
• Internal & External Cues: "Thumb pointing straight up" and "Breathe deeply into the side ribs."

Common Faults & Kinetotherapy Fixes:
Rolling directly over the shoulder joint or neck. Fix: Keep the roller strictly between mid-ribcage and the lower axillary border; do not place roller on the humeral head.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000004',
    name: 'Foam Roller Pectoralis Major & Anterior Shoulder Release',
    category: 'Recovery',
    muscle_group: 'Pectoralis Major / Pectoralis Minor / Anterior Deltoid',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie face down with foam roller angled at 45 degrees under the chest just inside the shoulder joint. Slowly roll across the pec tissue toward the sternum and back.',
    description: `Target Musculature & Clinical Purpose:
Relieves shortening and trigger points in the pectoralis major and minor. Essential for correcting protracted, forward-rolled shoulder posture and opening subacromial space.

Setup & Joint Positioning:
Lie prone (face down) on a floor mat. Angle the foam roller at approximately 45 degrees to the torso so it aligns along the diagonal fibers of the pec muscle belly, inside the anterior deltoid and below clavicle.

Biomechanical Execution & Cues:
• Rest forehead on opposite hand; extend working arm out at a 45-to-90 degree angle.
• Use legs and free arm to slowly glide chest side-to-side across the roller.
• Pause on dense spots, slowly sweep working arm along the floor 2-3 inches to actively shear the fascia.
• Internal & External Cues: "Allow chest muscle to drape softly over the roller" and "Slow, relaxed exhales."

Common Faults & Kinetotherapy Fixes:
Placing roller directly onto the anterior deltoid or acromion process. Fix: Keep contact medial to the shoulder joint crease on the chest muscle belly.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000005',
    name: 'Foam Roller Glute & Piriformis Release',
    category: 'Recovery',
    muscle_group: 'Gluteus Maximus / Gluteus Medius / Piriformis',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Sit on the roller, cross one ankle over opposite knee into a figure-4 position. Tilt weight onto the glute of the crossed leg and roll slowly across the buttock.',
    description: `Target Musculature & Clinical Purpose:
Targets the gluteus maximus, gluteus medius, and deep external rotators (piriformis, gemelli, obturator internus). Reduces sciatic nerve entrapment irritation and hip impingement.

Setup & Joint Positioning:
Sit on top of the foam roller. Cross the working leg's ankle over the opposite knee into a figure-4 contour. Shift your torso weight slightly toward the working side hip.

Biomechanical Execution & Cues:
• Roll through the upper and lateral portion of the buttock, spanning from the iliac crest down to the greater trochanter.
• Pause on deep tender points for 20 seconds.
• Rotate the working knee slightly open and closed to massage the piriformis through varying fiber angles.
• Internal & External Cues: "Lean right into the hip pocket" and "Sink deep as you exhale."

Common Faults & Kinetotherapy Fixes:
Tensing up the glute or slouching heavily. Fix: Keep supporting hand planted firmly behind roller and consciously relax gluteal muscles into the foam.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000006',
    name: 'Foam Roller Quadriceps & Rectus Femoris Roll',
    category: 'Recovery',
    muscle_group: 'Quadriceps / Rectus Femoris / Vastus Medialis / Vastus Lateralis',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie face down in a forearm plank with roller placed under your thighs. Roll from the top of the hips down to just above the kneecap. Pause on tight spots and optionally bend/extend knee.',
    description: `Target Musculature & Clinical Purpose:
Reduces hypertonicity and fascial adhesions throughout all four quadriceps heads, with direct emphasis on the rectus femoris. Lowers compressive forces at the patellofemoral joint and patellar tendon.

Setup & Joint Positioning:
Prone plank position supported on forearms, core braced. Position foam roller horizontally across the mid-thighs (or single leg for concentrated pressure).

Biomechanical Execution & Cues:
• Use forearms to roll body forward and backward, gliding from anterior hip flexor origin down to 1 inch above the patella.
• Never roll over the patellar bone.
• Pin and stretch: Stop on a hyper-sensitive spot, then actively flex the knee to 90 degrees and slowly extend it 3-4 times.
• Internal & External Cues: "Maintain a flat plank spine" and "Wave knee heel to glute on trigger points."

Common Faults & Kinetotherapy Fixes:
Collapsing into lumbar lordosis (sagging hips). Fix: Keep transverse abdominis engaged in a forearm plank to protect the lumbar spine.

Rehab / Loading Parameters:
2 sets × 60 seconds (or 45 seconds per leg unilateral).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 60,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000007',
    name: 'Foam Roller Tensor Fasciae Latae (TFL) & Lateral Thigh',
    category: 'Recovery',
    muscle_group: 'Tensor Fasciae Latae (TFL) / Gluteus Medius / Vastus Lateralis',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie on your side with roller positioned just below the hip bone. Cross top foot in front flat on the floor to regulate weight. Roll over the pocket muscle (TFL) and upper lateral quad.',
    description: `Target Musculature & Clinical Purpose:
SMR of the contractile muscle belly of the TFL and vastus lateralis. Clinical best practice targets the muscular driver of IT band tension rather than violently compressing the non-contractile iliotibial band itself, relieving lateral knee pain and runner's knee symptoms.

Setup & Joint Positioning:
Lie in a side-plank posture resting on one forearm. Place the foam roller just inferior and lateral to the ASIS (front hip bone) in the fleshy "front pocket" area. Cross the top foot in front flat on the floor to support and offload bodyweight.

Biomechanical Execution & Cues:
• Roll in short 2–3 inch passes over the fleshy muscle belly of the TFL and junction of vastus lateralis.
• Avoid rolling aggressively down the mid-iliotibial tract directly onto the lateral knee joint.
• Breathe evenly and avoid guarding or muscle tensing.
• Internal & External Cues: "Find the front-pocket muscle" and "Take pressure off with your front foot."

Common Faults & Kinetotherapy Fixes:
Rolling directly over the bony greater trochanter or lateral femoral condyle. Fix: Confine pressure to the soft muscular tissues between the hip crest and upper outer thigh.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000008',
    name: 'Foam Roller Psoas & Hip Flexor Release',
    category: 'Recovery',
    muscle_group: 'Psoas Major / Iliacus / Pectineus',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie face down with end of foam roller placed just inside the hip bone (ASIS). Gently shift weight into the roller and breathe deeply into the belly, allowing deep hip tissues to release.',
    description: `Target Musculature & Clinical Purpose:
Myofascial release of the iliopsoas complex and anterior hip capsule. Lengthens shortened hip flexors caused by chronic sitting, alleviating anterior pelvic tilt and secondary lumbar hyperextension.

Setup & Joint Positioning:
Prone position on the mat. Position the edge or angled head of the roller directly medial to the anterior superior iliac spine (ASIS) into the lower abdomen/hip junction. Bend the opposite leg out to the side for stability.

Biomechanical Execution & Cues:
• Lower body weight gently onto the roller using forearms to control the depth of penetration.
• Practice diaphragmatic breathing: inhale deeply into the abdomen to expand into the roller, then exhale fully to let the roller sink into deep hip tissue.
• Make small micro-oscillations of 1–2 inches.
• Internal & External Cues: "Inhale to push roller away, exhale to sink deep."

Common Faults & Kinetotherapy Fixes:
Pressing too far medial into abdominal organs or holding breath. Fix: Stay right beside the bony pelvic lip and breathe smoothly without straining.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000009',
    name: 'Foam Roller Adductor & Groin Release',
    category: 'Recovery',
    muscle_group: 'Adductor Longus / Adductor Magnus / Gracilis',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie prone on forearms with working leg abducted 90 degrees and knee bent. Place roller parallel to your body under the inner thigh. Roll from groin down toward inner knee.',
    description: `Target Musculature & Clinical Purpose:
Releases tension in the adductor muscle group (magnus, longus, brevis, gracilis). Restores hip abduction, rotation, and frontal plane mechanics, mitigating groin strains and knee valgus collapse during squats and running.

Setup & Joint Positioning:
Lie face down on forearms. Abduct the working leg out to the side at roughly 90 degrees with the knee bent 90 degrees (frog leg posture). Position the foam roller parallel to your torso beneath the medial thigh.

Biomechanical Execution & Cues:
• Shift bodyweight side to side to roll from the groin crest down to 2 inches above the medial knee.
• Pause on tender zones.
• Active rotation: pin a tight spot, slowly rotate the lower leg up toward the ceiling and down to actively lengthen adductor fibers.
• Internal & External Cues: "Open the hip like a gate" and "Roll smoothly across the inner seam of your shorts."

Common Faults & Kinetotherapy Fixes:
Rolling over the medial knee joint capsule. Fix: Stop before reaching the medial epicondyle of the femur.

Rehab / Loading Parameters:
2 sets × 45 seconds per leg.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000010',
    name: 'Foam Roller Hamstrings Release',
    category: 'Recovery',
    muscle_group: 'Biceps Femoris / Semitendinosus / Semimembranosus',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Sit with the roller placed under the back of your thighs. Place hands on the floor behind you, lift hips slightly, and roll from the sit bones down to just above the back of the knees.',
    description: `Target Musculature & Clinical Purpose:
Reduces density and muscle tone in the medial and lateral hamstring complexes. Restores posterior chain compliance, relieving posterior pelvic tilt tug and facilitating hip hinge mechanics.

Setup & Joint Positioning:
Sit on the floor with legs extended, placing the foam roller beneath the mid-hamstrings. Place hands flat behind you with fingers pointed forward or outward. Cross non-working leg over working leg for increased pressure, or keep both legs on roller.

Biomechanical Execution & Cues:
• Lift hips slightly off floor and roll slowly between the ischial tuberosity (sit bone) down to 2 inches above the popliteal fossa (knee crease).
• Rotate toes inward to bias semitendinosus/semimembranosus, and outward to bias biceps femoris.
• Pause on trigger points and perform small horizontal cross-friction rubs.
• Internal & External Cues: "Point toes in, then out" and "Smooth, uniform gliding."

Common Faults & Kinetotherapy Fixes:
Slumping heavily in the shoulders. Fix: Press floor away actively with hands to maintain an upright, proud chest.

Rehab / Loading Parameters:
2 sets × 45 seconds per leg.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000011',
    name: 'Foam Roller Calves (Gastrocnemius & Soleus) Smash',
    category: 'Recovery',
    muscle_group: 'Gastrocnemius / Soleus / Plantaris / Achilles',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Place roller under the mid-calf, stack opposite leg on top for pressure. Roll between Achilles tendon and back of the knee. Pause on tight spots and pump the ankle up and down (floss).',
    description: `Target Musculature & Clinical Purpose:
Targets deep hypertonicity in gastrocnemius (lateral/medial heads) and soleus. Essential for restoring closed-chain ankle dorsiflexion, mitigating Achilles tendinopathy and plantar fasciitis.

Setup & Joint Positioning:
Sit on the floor with hands supporting behind hips. Place the foam roller under the belly of the working calf. Stack the other leg on top to add controlled compressive load.

Biomechanical Execution & Cues:
• Lift hips and roll slowly along the lower leg from lower calf up toward the knee crease.
• Active Tissue Flossing: When a trigger point is located, halt rolling and actively pump the ankle into maximal dorsiflexion (toes to shin) and plantarflexion (pointing toes) for 5 reps.
• Rotate leg inward and outward to scan all angles of the calf muscle belly.
• Internal & External Cues: "Pump the ankle gas pedal while pinning the knot."

Common Faults & Kinetotherapy Fixes:
Rolling directly over the sensitive popliteal space behind the knee. Fix: Keep the roller strictly on the muscular calf tissue.

Rehab / Loading Parameters:
2 sets × 45 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 45,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000012',
    name: 'Foam Roller Peroneals (Lateral Lower Leg) Release',
    category: 'Recovery',
    muscle_group: 'Peroneus Longus / Peroneus Brevis',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Lie on your side with the outside of your lower leg resting on the roller. Support weight with hands and opposite foot. Roll slowly between the ankle bone and the top of the fibula.',
    description: `Target Musculature & Clinical Purpose:
Releases myofascial tightness along the lateral compartment of the lower leg (fibularis longus and brevis). Relieves chronic evertor splinting resulting from lateral ankle sprains or flat-footed gait.

Setup & Joint Positioning:
Side-lying position on the mat. Position the foam roller under the outer side of the lower leg, halfway between the lateral malleolus (ankle bone) and fibular head (just below knee). Place top leg forward on the floor for balance.

Biomechanical Execution & Cues:
• Roll slowly along the outer side of the calf over a 4–6 inch excursion.
• When a tender nodule is found, pause and actively circle the ankle clockwise and counter-clockwise 5 times.
• Internal & External Cues: "Draw circles with big toe while holding pressure."

Common Faults & Kinetotherapy Fixes:
Rolling directly over the bony lateral malleolus or fibular nerve head. Fix: Stay strictly on the soft muscle belly along the mid-shaft of the fibula.

Rehab / Loading Parameters:
2 sets × 40 seconds per leg.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 40,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000013',
    name: 'Foam Roller Anterior Tibialis (Shin) Release',
    category: 'Recovery',
    muscle_group: 'Tibialis Anterior / Extensor Digitorum Longus',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Myofascial Release',
    tracking_type: 'time',
    instructions: 'Kneel on all fours with the outside front of your shin resting on the roller. Roll slowly from just below the knee down toward the ankle along the muscular side of the shin bone.',
    description: `Target Musculature & Clinical Purpose:
Targets the tibialis anterior muscle belly just lateral to the shin crest. Highly effective for preventing and treating medial tibial stress syndrome (shin splints) and alleviating foot slap during running.

Setup & Joint Positioning:
Start in a quadruped (hands and knees) position. Place the foam roller underneath the anterior shin, angling your lower leg slightly outward so the roller contacts the muscular belly lateral to the sharp tibial crest (shin bone).

Biomechanical Execution & Cues:
• Use hands and opposite knee to slide your shin forward and backward along the roller.
• Never roll directly onto the hard, sharp shin bone; remain on the fleshy muscle tissue just to the outside.
• Pause on trigger points and flex the toes upward toward the shin.
• Internal & External Cues: "Stay in the soft valley just outside the bone."

Common Faults & Kinetotherapy Fixes:
Rolling directly over the anterior tibia bone. Fix: Angle shin 15–20 degrees inward to ensure contact stays on the muscular anterior tibialis belly.

Rehab / Loading Parameters:
2 sets × 40 seconds per side.`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 15,
    default_transition_rest_seconds: 15,
    default_duration_seconds: 40,
    default_reps: null,
    seconds_per_rep: null
  },
  {
    id: 'e0000004-0000-4000-a000-000000000014',
    name: 'Foam Roller Supine Longitudinal Chest Opener & Snow Angels',
    category: 'Recovery',
    muscle_group: 'Pectoralis Minor / Pectoralis Major / Anterior Deltoid',
    equipment: 'Foam Roller',
    difficulty: 'Beginner',
    mechanics: 'Active Lengthening',
    tracking_type: 'reps',
    instructions: 'Lie lengthwise on the roller with head and tailbone fully supported. Open arms out wide into a T or goalpost shape. Slowly sweep arms overhead and back like making a snow angel on the floor.',
    description: `Target Musculature & Clinical Purpose:
Combines passive gravity-assisted anterior chest opening with active neuromotor periscapular activation. Reverses rounded-shoulder posture, lengthens tight pec minor, and decompresses the anterior neurovascular bundle.

Setup & Joint Positioning:
Lie spine-length down a full-size foam roller. Both your head and tailbone must be securely supported on the roller. Bend knees with feet placed flat on the floor wider than hip-width for balance.

Biomechanical Execution & Cues:
• Starting Position: Rest arms on the floor in a "goalpost" position (elbows bent 90 degrees, backs of hands on floor).
• Sweep / Angel: Inhale as you slowly slide backs of hands along the floor overhead in an arc, reaching as far as possible without lower back arching.
• Return: Exhale and smoothly pull elbows back down to your sides.
• Internal & External Cues: "Melt shoulder blades around the roller" and "Keep your lower ribs pinned down."

Common Faults & Kinetotherapy Fixes:
Hyperextending the lower back off the roller when arms reach overhead. Fix: Keep abdominal wall lightly braced and ribs down so motion occurs strictly at the glenohumeral and scapulothoracic joints.

Rehab / Loading Parameters:
2–3 sets × 10 slow sweeps (Tempo: 2-0-2-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 40,
    default_reps: 10,
    seconds_per_rep: 4.0
  },
  {
    id: 'e0000004-0000-4000-a000-000000000015',
    name: 'Foam Roller Quadruped Thread the Needle (Thoracic Rotation)',
    category: 'Recovery',
    muscle_group: 'Thoracic Spine Rotators / Rhomboids / Posterior Deltoid / Latissimus Dorsi',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Rotational Mobility',
    tracking_type: 'reps',
    instructions: 'On hands and knees, place roller parallel to your body on the floor. Slide the back of one hand across the roller, rotating through your upper back as the roller glides away. Return to start.',
    description: `Target Musculature & Clinical Purpose:
Isolates thoracic spinal rotation and posterior periscapular active lengthening while stabilizing the lumbopelvic region. Crucial for rotational sports (golf, tennis, throwing) and thoracic joint health.

Setup & Joint Positioning:
Start in a tabletop quadruped position (wrists under shoulders, knees under hips). Place the foam roller on the floor parallel to your torso on one side, just outside your supporting arm.

Biomechanical Execution & Cues:
• Reach the opposite arm under your chest and place the back of your wrist on the foam roller.
• Roll the foam roller away across the floor by rotating the ribcage and thoracic spine.
• Keep hips level and square; do not let the pelvis shift sideways.
• Hold the deep rotation for 2 seconds, exhaling fully into the stretch, then roll back to the starting quadruped posture.
• Internal & External Cues: "Rotate the chest toward the ceiling while hips stay square as headlights."

Common Faults & Kinetotherapy Fixes:
Twisting through the pelvis and lumbar spine instead of isolating the thorax. Fix: Anchor knees firmly and keep hips locked in space.

Rehab / Loading Parameters:
2–3 sets × 8 reps per side (Tempo: 2-2-1-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 20,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 40,
    default_reps: 8,
    seconds_per_rep: 5.0
  },
  {
    id: 'e0000004-0000-4000-a000-000000000016',
    name: 'Foam Roller Forearm Wall Slide with Scapular Upward Rotation',
    category: 'Recovery',
    muscle_group: 'Serratus Anterior / Lower Trapezius / Rotator Cuff',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Scapular Mobility',
    tracking_type: 'reps',
    instructions: 'Stand facing a wall in a split stance. Pin the roller to the wall with your forearms in parallel. Slide forearms upward, rolling the foam roller up the wall while gently pushing your chest back.',
    description: `Target Musculature & Clinical Purpose:
Activates the serratus anterior and lower trapezius to guide optimal scapular upward rotation and posterior tilt during arm elevation. Crucial for rehabilitating subacromial impingement and winged scapula.

Setup & Joint Positioning:
Stand facing a smooth wall in a staggered split stance. Place the foam roller horizontally against the wall at chest height, pinned in place by your parallel forearms (elbows bent 90 degrees, palms facing each other).

Biomechanical Execution & Cues:
• Concentric / Drive: Press gently into the roller to protract the scapulae, then roll forearms slowly upward along the wall.
• Top Position: At peak elevation, reach tall through the armpits without shrugging the upper traps toward the ears. Hold 1-2 seconds.
• Eccentric / Return: Roll smoothly back down under control to chest height.
• Internal & External Cues: "Push wall away as you roll up" and "Feel shoulder blades wrap around ribs."

Common Faults & Kinetotherapy Fixes:
Arching the lower back or hiking the shoulders into the neck. Fix: Keep core braced and neck long; terminate upward roll before form deteriorates.

Rehab / Loading Parameters:
3 sets × 10 reps (Tempo: 2-1-2-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 25,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 40,
    default_reps: 10,
    seconds_per_rep: 4.0
  },
  {
    id: 'e0000004-0000-4000-a000-000000000017',
    name: 'Foam Roller Supine Longitudinal Deadbug',
    category: 'Core',
    muscle_group: 'Transverse Abdominis / Rectus Abdominis / Obliques / Pelvic Floor',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Core Stability',
    tracking_type: 'reps',
    instructions: 'Lie lengthwise down the foam roller (head and tailbone supported). Raise arms toward ceiling and bring knees to 90 degrees. Slowly extend opposite arm and leg without losing balance or arching back.',
    description: `Target Musculature & Clinical Purpose:
High-level anti-extension and rotational core stability drill. Performing the McGill deadbug along an unstable foam roller demands relentless co-contraction of the transverse abdominis, obliques, and multifidus to prevent rolling off.

Setup & Joint Positioning:
Lie longitudinally down the center of the foam roller so your sacrum, spine, and head are all balanced on the roller. Keep feet hip-width on floor, then lift knees into 90-degree tabletop. Extend arms straight up towards ceiling over shoulders.

Biomechanical Execution & Cues:
• Imprint: Gently flatten your lumbar spine against the roller by drawing your navel down.
• Extension: Slowly lower opposite arm overhead and opposite heel toward the floor under strict control.
• Return: Pull arm and leg back to center using abdominal contraction. Alternate sides.
• Internal & External Cues: "Keep the roller completely still underneath you" and "Don't let your lower back peel off the foam."

Common Faults & Kinetotherapy Fixes:
Overarching the lumbar spine or wobbling and falling off. Fix: Lower heel only a few inches initially until core motor control improves.

Rehab / Loading Parameters:
3 sets × 12 alternating reps (6 per side) (Tempo: 2-0-2-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 30,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 45,
    default_reps: 12,
    seconds_per_rep: 3.5
  },
  {
    id: 'e0000004-0000-4000-a000-000000000018',
    name: 'Foam Roller Glute Bridge with Hamstring & Pelvic Stability',
    category: 'Recovery',
    muscle_group: 'Gluteus Maximus / Hamstrings / Core Stabilizers',
    equipment: 'Foam Roller',
    difficulty: 'Intermediate',
    mechanics: 'Dynamic Stability',
    tracking_type: 'reps',
    instructions: 'Lie on your back with knees bent and feet flat on top of the foam roller. Drive through your midfoot to bridge hips up until knees, hips, and shoulders form a straight line, keeping roller steady.',
    description: `Target Musculature & Clinical Purpose:
Strengthens gluteus maximus and hamstrings while training proprioceptive pelvic stabilization on an unstable, rolling surface. Teaches hamstring motor control without cramping.

Setup & Joint Positioning:
Lie supine on a floor mat with arms resting along your sides. Bend knees to roughly 90 degrees and place the soles of your feet hip-width apart directly on top of the foam roller.

Biomechanical Execution & Cues:
• Drive: Press feet firmly down into the foam roller to prevent it from rolling away, while driving hips upward into full extension.
• Top Position: Squeeze glutes firmly at top for 2 seconds. Maintain a neutral spine without hyperextending the lower back.
• Eccentric / Descent: Lower hips down slowly over 2 seconds to lightly tap floor, keeping the roller completely stationary.
• Internal & External Cues: "Glue the roller to the floor with your feet" and "Lock out through glutes, not lower back."

Common Faults & Kinetotherapy Fixes:
Letting the roller kick out forward, causing sudden hamstring cramping. Fix: Actively dig heels down into the roller to keep it stationary.

Rehab / Loading Parameters:
3 sets × 10 reps (Tempo: 2-2-1-0).`,
    is_default: true,
    user_id: null,
    default_inter_set_rest_seconds: 25,
    default_transition_rest_seconds: 20,
    default_duration_seconds: 40,
    default_reps: 10,
    seconds_per_rep: 4.0
  }
];

async function seedFoamRollerExercises() {
  console.log(`Starting insertion of ${FOAM_ROLLER_EXERCISES.length} foam roller exercises into Supabase...`);

  const { data, error } = await supabase
    .from('exercises')
    .upsert(FOAM_ROLLER_EXERCISES, { onConflict: 'id' })
    .select('id, name, equipment, category');

  if (error) {
    console.error('❌ Error inserting foam roller exercises:', error);
    process.exit(1);
  }

  console.log(`✅ Successfully upserted ${data.length} foam roller exercises:`);
  data.forEach((ex, idx) => {
    console.log(`  ${idx + 1}. [${ex.id}] ${ex.name} (${ex.category} - ${ex.equipment})`);
  });
}

seedFoamRollerExercises();
