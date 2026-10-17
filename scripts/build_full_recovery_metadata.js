const fs = require('fs');

const currentContent = fs.readFileSync('src/data/recoveryMetadata.js', 'utf8');

// Load clinical exercises
const clinicalExercises = [
  {
    id: 'e0000001-0000-4000-a000-000000000020',
    name: 'Seated Banded Eversion',
    area: 'Ankle Rehab',
    muscle: 'Peroneal / Ankle Stabilizers',
    difficulty: 'Beginner',
    mechanics: 'Isolation',
    instructions: 'Sit on floor with legs straight. Loop resistance band around ball of working foot anchored inward. Sweep foot outward against band without rotating hip/knee. Control inward return over 3 seconds.',
    description: `Target Musculature & Clinical Purpose:
Isolates the peroneal muscles on the outside of the lower leg. These are the primary active stabilizers that fire to prevent the ankle from rolling outward (inversion sprain).

Setup & Joint Positioning:
Sit on the floor with legs straight. Loop a light resistance band around the ball of the working foot, anchoring it to the opposite foot or a heavy object inside the working leg.

Biomechanical Execution & Cues:
• Eccentric / Loading: Control the band as it pulls the foot inward (inversion) over a 3-second count.
• Concentric / Drive: Sweep the foot outward against the band as far as possible without rotating the entire leg at the hip.
• Internal & External Cues: "Swipe your pinky toe away from your body."

Common Faults & Kinetotherapy Fixes:
Rotating the knee and hip outward instead of isolating the ankle. Fix: Place a foam roller under the calf and keep the kneecap pointed straight at the ceiling the entire time.

Rehab / Loading Parameters:
3 sets × 15 reps (Tempo: 3-0-1-1).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000018',
    name: 'Single-Leg Balance (Unstable Surface)',
    alias: 'Single-Leg Balance (Pad)',
    area: 'Ankle Rehab',
    muscle: 'Ankle / Proprioception',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Stand barefoot on an Airex pad or folded towel. Lift non-working leg to 90 degrees with a micro-bend in working knee. Grip floor with toes and fix gaze on a wall point.',
    description: `Target Musculature & Clinical Purpose:
Restores neuromuscular proprioception. Ligament tears disrupt the ankle's spatial awareness; this drill forces the brain to rapidly communicate with the ankle stabilizers to maintain a center of gravity.

Setup & Joint Positioning:
Stand barefoot on an Airex pad, folded towel, or thick yoga mat. Hands on hips, spine tall.

Biomechanical Execution & Cues:
• Lift the non-working leg to 90 degrees.
• Maintain a micro-bend in the working knee (do not lock it out).
• Fixate your eyes on a single point on the wall.
• Internal & External Cues: "Grip the floor with your toes like eagle talons."

Common Faults & Kinetotherapy Fixes:
Flailing the arms or overarching the lower back to catch balance. Fix: If the user cannot hold strict form for 10 seconds, move to a flat, hard floor before progressing to the unstable pad.

Rehab / Loading Parameters:
3 sets × 45 seconds per leg. Progression: Close eyes.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000021',
    name: 'Deficit Calf Raises (Straight & Bent Knee)',
    area: 'Ankle Rehab',
    muscle: 'Gastrocnemius / Soleus / Calves',
    difficulty: 'Intermediate',
    mechanics: 'Compound',
    instructions: 'Stand on edge of step with balls of feet. Lower heels below step over 3s for deep stretch, then push through big toe knuckle to rise tall. Perform straight-knee and bent-knee sets.',
    description: `Target Musculature & Clinical Purpose:
Strengthens the gastrocnemius (straight knee) and soleus (bent knee). A deficit (dropping the heel below the toes) restores full dorsiflexion range of motion lost to scar tissue.

Setup & Joint Positioning:
Stand with the balls of the feet on the edge of a step or weight plate. Hold a wall or rack for balance.

Biomechanical Execution & Cues:
• Eccentric / Loading: Lower the heels past the edge of the step over a 3-second count until a deep stretch is felt in the Achilles/calf.
• Concentric / Drive: Push through the first two toes to rise as high as possible.
• Internal & External Cues: "Push the floor away through your big toe."

Common Faults & Kinetotherapy Fixes:
Rolling the weight onto the outside of the foot (pinky toe) at the top of the rep, which reinforces ankle instability. Fix: Actively press the big toe knuckle into the step.

Rehab / Loading Parameters:
4 sets × 8 reps (Tempo: 3-1-1-1). Perform 2 sets with legs fully straight, and 2 sets with knees bent at a 20-degree angle.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000022',
    name: 'Drop Freeze Landings',
    area: 'Knee & Ankle Rehab',
    muscle: 'Knee / Ankle Stabilizers',
    difficulty: 'Intermediate',
    mechanics: 'Plyometric / Eccentric',
    instructions: 'Stand on a 6-12 inch box. Step off without jumping and land simultaneously on both feet in a quarter-squat. Freeze instantly upon impact with zero wobble or shift.',
    description: `Target Musculature & Clinical Purpose:
Eccentric braking and valgus/varus control. Trains the nervous system to absorb high-impact ground reaction forces safely, which is vital before clearing an athlete for jumping sports.

Setup & Joint Positioning:
Stand on a 6- to 12-inch box.

Biomechanical Execution & Cues:
• Step off the box (do not jump up; simply fall forward).
• Land simultaneously on both feet in a quarter-squat position.
• Freeze instantly upon impact. There should be zero shifting, wobbling, or sinking after the feet hit the ground.
• Internal & External Cues: "Land like a ninja—silent and stuck to the floor."

Common Faults & Kinetotherapy Fixes:
Knees caving inward (valgus) or ankles rolling outward upon impact. Fix: Lower the box height to a 2-inch plate until the landing is structurally perfect.

Rehab / Loading Parameters:
3 sets × 5 reps. Full reset between reps.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000002',
    name: 'Spanish Squat',
    area: 'Knee Rehab',
    muscle: 'Patellar Tendon / Quadriceps',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Loop heavy band behind both knees anchored to rig. Lean back keeping shins perfectly vertical. Squat to 70-90 degrees knee flexion. Hold statically for tendon analgesia.',
    description: `Target Musculature & Clinical Purpose:
Patellar tendon analgesia and quadriceps isometric capacity. Heavy isometrics safely load the muscle-tendon unit, reducing tendon pain via cortical inhibition without joint friction.

Setup & Joint Positioning:
Loop a heavy resistance band around a rig or solid anchor point. Step inside the loop, placing the band directly behind both knees. Step backward until the band is under maximum tension. Stand with feet shoulder-width apart and a neutral spine.

Biomechanical Execution & Cues:
• Eccentric / Loading: Sit backward, allowing the band to support your center of mass.
• Bottom Position: Stop at 70–90 degrees of knee flexion. The shins must remain perfectly vertical (perpendicular to the floor).
• Isometric Hold: Brace the core and hold this position statically.
• Internal & External Cues: "Sit back into an invisible chair" and "Drive the floor straight down."

Common Faults & Kinetotherapy Fixes:
Knees drifting forward over the toes, defeating the band's mechanical advantage. Fix: Shift the center of mass onto the heels and trust the band to support the body's weight.

Rehab / Loading Parameters:
4 sets × 45-second holds (Tempo: Isometric). RPE 8.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000023',
    name: 'Decline Slant Board Squat (Heavy Slow Resistance - HSR)',
    area: 'Knee Rehab',
    muscle: 'Patellar Tendon / VMO / Quads',
    difficulty: 'Advanced',
    mechanics: 'Compound',
    instructions: 'Stand on a 25-degree slant board holding dumbbell in goblet position. Descend slowly over 4s allowing knees to travel forward over toes. Pause 1s at bottom, push up smoothly over 3s.',
    description: `Target Musculature & Clinical Purpose:
Structural collagen remodeling of the patellar tendon and vastus medialis oblique (VMO) hypertrophy. Elevating the heels shifts the load from the hips directly to the anterior chain and patellar tendon.

Setup & Joint Positioning:
Stand with heels elevated on a 25-degree slant board (or two heavy weight plates). Feet hip-width apart. Hold a heavy kettlebell or dumbbell in a goblet position tight against the chest.

Biomechanical Execution & Cues:
• Eccentric / Loading: Inhale, brace, and descend painfully slowly over a 4-second count. Allow the knees to travel far forward over the toes.
• Bottom Position: Pause for 1 second at the maximum pain-free depth while maintaining an upright torso.
• Concentric / Drive: Push smoothly out of the bottom over a 3-second count. Do not use momentum.
• Internal & External Cues: "Elevator down, escalator up."

Common Faults & Kinetotherapy Fixes:
Hinging at the hips and leaning forward to recruit the glutes. Fix: Keep the torso perfectly vertical and force the knees forward; isolate the quadriceps.

Rehab / Loading Parameters:
4 sets × 6 reps (Tempo: 4-1-3-0). Load heavy enough that the 6th rep is challenging (RPE 7-8).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000003',
    name: 'Peterson Step-Up',
    area: 'Knee Rehab',
    muscle: 'VMO / Patellar Tracking',
    difficulty: 'Intermediate',
    mechanics: 'Concentric / Eccentric',
    instructions: 'Stand sideways on a 4-6 inch elevation. Keep hips level, bend working knee slowly over 3s to lightly tap non-working heel to floor. Drive through midfoot to return.',
    description: `Target Musculature & Clinical Purpose:
Eccentric deceleration capacity and patellar tracking. Rebuilds the precise motor control required for soft, silent landings.

Setup & Joint Positioning:
Stand sideways on the edge of a small 4- to 6-inch elevation (a weight plate or aerobic step). The working foot is flat on the box; the non-working foot hangs free.

Biomechanical Execution & Cues:
• Eccentric / Loading: Keeping the hips level, slowly bend the working knee to lower the non-working heel straight down to the floor over a 3-second count.
• Bottom Position: Lightly tap the floor with the heel. Do not transfer weight to the floor.
• Concentric / Drive: Drive through the working midfoot to return to the starting position.
• Internal & External Cues: "Tap glass lightly with your heel—don't break it."

Common Faults & Kinetotherapy Fixes:
Dropping too fast and bouncing off the floor, or dipping the pelvis on the non-working side. Fix: Lower the box height if the pelvis tilts, and strictly enforce the 3-second descent.

Rehab / Loading Parameters:
3 sets × 10 reps per leg (Tempo: 3-0-1-0).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000001',
    name: 'Terminal Knee Extension (TKE)',
    area: 'Knee Rehab',
    muscle: 'VMO / Quadriceps',
    difficulty: 'Beginner',
    mechanics: 'Isometric / Concentric',
    instructions: 'Anchor band at knee height behind working knee. Step back for tension. Start with knee slightly bent, contract quad to snap knee straight and drive heel into floor. Hold 2s.',
    description: `Target Musculature & Clinical Purpose:
VMO activation and joint centration. A low-threshold movement that ensures proper patellar tracking before heavy loading phases.

Setup & Joint Positioning:
Anchor a light resistance band at knee height. Step inside, placing the band directly behind the working knee. Step backward to create tension.

Biomechanical Execution & Cues:
• Eccentric / Loading: Start with the working knee slightly bent and the heel lifted slightly off the floor.
• Concentric / Drive: Contract the quadriceps to forcefully snap the knee straight, driving the heel flat into the floor against the band's resistance.
• Bottom Position: Hold the locked-out position for 2 seconds, maximally contracting the quad.
• Internal & External Cues: "Crush a grape under your heel" and "Lock the joint solid."

Common Faults & Kinetotherapy Fixes:
Extending the hips to pull the band back rather than isolating the knee. Fix: Keep the hips completely static; only the knee joint should articulate.

Rehab / Loading Parameters:
3 sets × 15 reps per leg (Tempo: 1-2-2-0).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000011',
    name: 'Scapular Wall Slides',
    area: 'Shoulder Rehab',
    muscle: 'Serratus Anterior / Lower Trap',
    difficulty: 'Beginner',
    mechanics: 'Scapular Mobility',
    instructions: 'Stand flush against wall in goalpost position with elbows and wrists touching wall. Slide forearms upward in a V shape without arching lower back. Return under control.',
    description: `Target Musculature & Clinical Purpose:
Serratus anterior and lower trapezius activation. This drill trains the scapula to properly upwardly rotate and posteriorly tilt, ensuring the acromion clears the rotator cuff during overhead movements.

Setup & Joint Positioning:
Stand with your back, head, and glutes flush against a wall. Place your feet a few inches away from the wall. Bring your arms into a "goalpost" position (elbows bent at 90 degrees) with wrists and elbows touching the wall. Pull your ribcage down to brace the core.

Biomechanical Execution & Cues:
• Concentric / Drive: Slide your forearms slowly upward along the wall in a "V" shape.
• Top Position: Reach as high as possible without allowing the lower back to arch off the wall or the elbows to lose contact with the surface.
• Eccentric / Loading: Pull the elbows actively back down into the starting goalpost position.
• Internal & External Cues: "Push the wall away as you slide up" and "Keep your ribs glued to the wall."

Common Faults & Kinetotherapy Fixes:
Shrugging the upper traps toward the ears or arching the lumbar spine to fake overhead mobility. Fix: Stop the upward slide the moment the lower back loses contact with the wall, even if the hands are barely above the head. Range of motion will improve over time.

Rehab / Loading Parameters:
3 sets × 12 reps (Tempo: 2-1-2-1).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000024',
    name: 'Dumbbell Scaption (Scapular Plane Elevation)',
    area: 'Shoulder Rehab',
    muscle: 'Supraspinatus / Deltoids',
    difficulty: 'Beginner',
    mechanics: 'Isolation',
    instructions: 'Stand tall with light dumbbells, thumbs pointing up. Raise arms in scapular plane (30-45 degrees forward in a wide V) up to shoulder height. Lower with strict 3-second control.',
    description: `Target Musculature & Clinical Purpose:
Supraspinatus and deltoid strengthening in the safest anatomical position. Elevating the arms 30 to 45 degrees forward of the body (the scapular plane) aligns perfectly with the natural angle of the shoulder blade, preventing subacromial impingement.

Setup & Joint Positioning:
Stand tall with a light dumbbell in each hand. Arms at your sides, thumbs pointing up toward the ceiling (external rotation).

Biomechanical Execution & Cues:
• Concentric / Drive: Raise the dumbbells upward at a 30- to 45-degree angle relative to your torso (forming a wide "V").
• Top Position: Stop exactly at shoulder height. Do not go higher.
• Eccentric / Loading: Lower the dumbbells with strict control over a 3-second count.
• Internal & External Cues: "Pour the water out backward" (keep thumbs up) and "Reach long, not just high."

Common Faults & Kinetotherapy Fixes:
Lifting directly out to the sides (frontal plane), which compresses the rotator cuff, or rotating the hands so thumbs point down (empty can position), which exacerbates impingement. Fix: Forcefully maintain the thumbs-up grip and keep the arms angled slightly forward.

Rehab / Loading Parameters:
4 sets × 8 reps (Tempo: 3-0-1-1). RPE 7.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000012',
    name: 'Banded External Rotation (Eccentric Focus)',
    alias: 'Banded External Rotation',
    area: 'Shoulder Rehab',
    muscle: 'Infraspinatus / Teres Minor / Rotator Cuff',
    difficulty: 'Beginner',
    mechanics: 'Isolation / Eccentric',
    instructions: 'Anchor band at waist height. Pin working elbow to ribs with rolled towel. Rotate forearm outward away from stomach, then fight band back over a slow 4-second count.',
    description: `Target Musculature & Clinical Purpose:
Infraspinatus and teres minor (the posterior rotator cuff). Rebuilds the tendon's capacity to decelerate the arm after a violent throw or strike.

Setup & Joint Positioning:
Anchor a light resistance band at waist height. Stand perpendicular to the anchor. Hold the band in the outside hand. Pin the working elbow to your ribs (place a rolled-up towel between the elbow and ribs to ensure joint centration). Elbow bent at exactly 90 degrees.

Biomechanical Execution & Cues:
• Concentric / Drive: Rotate the forearm outward away from the stomach as far as comfortable.
• Eccentric / Loading: Fight the band's pull, allowing the hand to return to the stomach over a painfully slow 4-second count.
• Internal & External Cues: "Keep the elbow glued" and "Act like a rusty door hinge closing slowly."

Common Faults & Kinetotherapy Fixes:
Letting the elbow drift away from the torso, which turns the movement into a deltoid lateral raise. Fix: Squeeze the towel roll firmly against the ribs; if the towel drops, the rep does not count.

Rehab / Loading Parameters:
3 sets × 12 reps per side (Tempo: 4-0-1-1).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000015',
    name: 'Y-T-W Raises',
    alias: 'Prone Y-T-W Raises',
    area: 'Shoulder Rehab',
    muscle: 'Lower/Mid Traps / Rhomboids',
    difficulty: 'Beginner',
    mechanics: 'Scapular / Compound',
    instructions: 'Lie prone on incline bench. Perform Y (arms forward 45°), T (arms lateral), and W (elbows bent 90°, retract blades) with thumbs up. Squeeze mid-back blades hard at peak.',
    description: `Target Musculature & Clinical Purpose:
Comprehensive conditioning of the scapular stabilizers (lower traps, middle traps, and rhomboids) to counteract the forward-rounded posture typical in athletes.

Setup & Joint Positioning:
Lie prone (face down) on an incline bench set to 30–45 degrees. Hold very light dumbbells (or no weight). Keep the neck neutral. Thumbs point up toward the ceiling for all movements.

Biomechanical Execution & Cues:
• The "Y": Raise straight arms up and forward at a 45-degree angle. Pause, then lower. (Targets lower traps).
• The "T": Raise straight arms directly out to the sides. Pause, squeeze shoulder blades together, then lower. (Targets middle traps).
• The "W": Bend elbows to 90 degrees. Pull the elbows and wrists up to the ceiling simultaneously, squeezing the shoulder blades hard. (Targets rhomboids and external rotators).
• Internal & External Cues: "Pinch a coin between your shoulder blades" and "Pull your shoulder blades down into your back pockets."

Common Faults & Kinetotherapy Fixes:
Using momentum to swing the weights up or shrugging the neck. Fix: Use bare hands instead of dumbbells until the mind-muscle connection is established in the middle back.

Rehab / Loading Parameters:
3 sets × 10 reps of each letter (30 total movements per set). (Tempo: 2-1-2-0).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000025',
    name: 'Single-Leg Drop Landings',
    area: 'Knee Rehab',
    muscle: 'ACL Stabilizers / Glutes / Quads / Hamstrings',
    difficulty: 'Advanced',
    mechanics: 'Plyometric / Deceleration',
    instructions: 'Stand on a low 6-inch box on working leg. Drop off onto same leg into a quarter-squat. Absorb impact silently, freeze instantly for 2s with knee tracked over middle toes.',
    description: `Target Musculature & Clinical Purpose:
Eccentric deceleration and dynamic valgus control. This drill trains the nervous system to rapidly fire the glutes, quads, and hamstrings to stabilize the knee perfectly over the toes upon sudden impact, mimicking a rebound landing or a sudden deceleration on the field.

Setup & Joint Positioning:
Stand on a low 6-inch box or weight plate. Balance on the working leg.

Biomechanical Execution & Cues:
• The Drop: Shift your weight forward and drop (do not jump) off the box onto the same leg.
• The Catch: Absorb the impact by bending the knee and hip into a quarter-squat.
• The Freeze: Stop all downward momentum instantly. The knee must align perfectly with the middle toes. Hold the freeze for 2 seconds.
• Internal & External Cues: "Land on bubble wrap without popping it" and "Stick the landing like a gymnast."

Common Faults & Kinetotherapy Fixes:
The knee collapsing inward (dynamic valgus) upon impact, which places massive sheer force on the ACL. Fix: Lower the box height to a 2-inch plate, or regress to bilateral (two-footed) drop landings until perfect alignment is achieved.

Rehab / Loading Parameters:
3 sets × 5 reps per leg (Tempo: Explosive drop, 2-second isometric freeze).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000026',
    name: 'Bulgarian Split Squat',
    area: 'Knee & Hip Rehab',
    muscle: 'Quadriceps / Glutes / Pelvic Stabilizers',
    difficulty: 'Intermediate',
    mechanics: 'Compound',
    instructions: 'Stand in front of bench with rear foot laces resting on bench. Lower back knee straight down over 3s with slight torso lean. Pause when front thigh is parallel, then drive up.',
    description: `Target Musculature & Clinical Purpose:
Deep unilateral quadriceps and glute strength, requiring massive pelvic stability. Because the back leg is elevated, the athlete cannot subconsciously cheat by shifting their center of mass away from the post-op leg.

Setup & Joint Positioning:
Stand a couple of feet in front of a bench. Reach one foot back and place the shoelaces on the bench. Hold dumbbells at your sides. Feet should be roughly hip-width apart to maintain balance.

Biomechanical Execution & Cues:
• Eccentric / Loading: Drop the back knee straight down toward the floor over a 3-second count. Maintain a slight forward torso lean to recruit the glutes and protect the lower back.
• Bottom Position: Pause when the front thigh is parallel to the floor. The front shin can be vertical or slightly angled forward.
• Concentric / Drive: Drive through the front midfoot to stand tall.
• Internal & External Cues: "Drop straight down an elevator shaft" and "Crush the floor with your front foot."

Common Faults & Kinetotherapy Fixes:
The front knee drifting inward or the pelvis tilting sideways (Trendelenburg sign) due to glute medius weakness. Fix: Drop the dumbbells and use body weight only. Hold onto a PVC pipe or rack with one hand to provide external stability until the hips learn to stay level.

Rehab / Loading Parameters:
4 sets × 6 reps per leg (Tempo: 3-1-1-1). Load heavily, RPE 7-8.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000005',
    name: 'Nordic Hamstring Curl',
    area: 'Knee Rehab',
    muscle: 'Hamstrings / ACL Synergist',
    difficulty: 'Advanced',
    mechanics: 'Eccentric',
    instructions: 'Kneel tall with ankles firmly anchored. Keeping hips fully extended and glutes locked, lower chest toward floor as slowly as possible using hamstrings to brake; catch softly.',
    description: `Target Musculature & Clinical Purpose:
Supramaximal eccentric hamstring strength. The hamstrings are the primary muscular synergists to the ACL (they physically prevent the tibia from sliding forward). If the athlete had a hamstring autograft, this exercise is non-negotiable for rebuilding the donor site tissue.

Setup & Joint Positioning:
Kneel on a soft pad. Have a partner firmly hold your ankles down, or anchor your heels under a heavy barbell/machine. Knees, hips, and shoulders must form a perfectly straight line.

Biomechanical Execution & Cues:
• Eccentric / Loading: Keeping the hips fully extended (locked out), slowly lower your chest toward the floor. Use your hamstrings to brake your descent for as long as possible.
• The Catch: When your hamstrings give out, catch yourself softly with your hands in a push-up position.
• Concentric / Drive: Give yourself a light push off the floor while contracting the hamstrings to return to the tall kneeling position.
• Internal & External Cues: "Fall like a falling tree, straight as a board" and "Fight the fall with your heels."

Common Faults & Kinetotherapy Fixes:
Hinging at the hips (sticking the butt out) to make the exercise easier. Fix: Squeeze the glutes as hard as possible before starting the descent to lock the pelvis in place.

Rehab / Loading Parameters:
3 sets × 5 reps (Tempo: 4-0-X-0).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000027',
    name: 'Banded Monster Walks',
    area: 'Hip & Knee Rehab',
    muscle: 'Gluteus Medius / Minimus / Hip Abductors',
    difficulty: 'Beginner',
    mechanics: 'Dynamic Stability',
    instructions: 'Place resistance loop around balls of feet or ankles. Drop into quarter athletic squat. Take wide diagonal steps forward and backward, never letting feet come closer than shoulder width.',
    description: `Target Musculature & Clinical Purpose:
Gluteus medius and minimus activation. These abductors are responsible for keeping the femur externally rotated, preventing the knee from caving into the danger zone during running and cutting.

Setup & Joint Positioning:
Place a small, heavy resistance loop band around the balls of the feet (hardest) or ankles (medium). Drop into a quarter athletic squat.

Biomechanical Execution & Cues:
• Take small, wide, diagonal steps forward (like a monster walking).
• Never let the feet come closer than shoulder-width apart to maintain constant tension on the band.
• Internal & External Cues: "Lead with the heel" and "Keep the band stretched tight."

Common Faults & Kinetotherapy Fixes:
Dragging the trail foot or standing up too tall. Fix: Stay low in the athletic stance and actively pick up and place the trail foot on every step.

Rehab / Loading Parameters:
2 sets × 20 meters forward and 20 meters backward.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000009',
    name: 'Cat-Cow Stretch',
    area: 'Lower Back Pain',
    muscle: 'Thoracic / Lumbar Spine',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'On all fours, rhythmically alternate between tucking pelvis/chin to round mid-back toward ceiling (Cat) and lifting chest/dropping belly (Cow). Move smoothly in pain-free range.',
    description: `Target Musculature & Clinical Purpose:
Thoracic and lumbar spine mobility. This is a friction-reducing, joint-lubricating movement, not a stretching exercise to pull muscles. It maps out the pain-free boundaries of spinal flexion and extension.

Setup & Joint Positioning:
Assume a quadruped (all-fours) position. Hands directly under shoulders, knees directly under hips. Spine in a neutral baseline.

Biomechanical Execution & Cues:
• Flexion (Cat): Slowly tuck the chin to the chest, tuck the pelvis under, and round the mid-back toward the ceiling.
• Extension (Cow): Slowly lift the head, push the chest forward, and allow the belly to drop toward the floor, slightly arching the lower back.
• Internal & External Cues: "Move smoothly like a segmented chain."

Common Faults & Kinetotherapy Fixes:
Pushing deeply into pain or holding the end ranges like a static stretch. Fix: Only move within the middle 70% of your available range of motion. Do not pause at the ends; keep it dynamic and rhythmic.

Rehab / Loading Parameters:
2 sets × 10 full cycles (Tempo: 2-0-2-0).`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000006',
    name: 'McGill Curl-up',
    area: 'Lower Back Pain',
    muscle: 'Rectus Abdominis / Anterior Core',
    difficulty: 'Beginner',
    mechanics: 'Isometric',
    instructions: 'Lie on back, hands under lumbar arch to preserve natural curve. One knee bent, one straight. Lift head and upper shoulders 1-2 inches as a rigid unit. Hold 10s while breathing.',
    description: `Target Musculature & Clinical Purpose:
Rectus abdominis endurance. Builds anterior core stiffness without the destructive spinal flexion and disc compression caused by traditional sit-ups.

Setup & Joint Positioning:
Lie face up on the floor. Bend one knee to 90 degrees with the foot flat; keep the other leg completely straight. Slide both hands (palms down) under the small of your lower back to preserve the natural lumbar arch.

Biomechanical Execution & Cues:
• Concentric / Drive: Brace the abdominal wall. Lift your head, neck, and the top of your shoulder blades as a single, rigid block just 1 to 2 inches off the floor.
• Isometric Hold: Hold the hover for 10 seconds. Do not hold your breath; sip air rhythmically over the brace.
• Eccentric / Loading: Lower smoothly back to the floor.
• Internal & External Cues: "Imagine your head and upper chest are resting on a bathroom scale, and you only want to make it read zero."

Common Faults & Kinetotherapy Fixes:
Flattening the lower back into the floor and crushing the hands. Fix: The pressure on your hands should remain completely unchanged throughout the entire movement. If it gets heavier, you are flexing the lumbar spine.

Rehab / Loading Parameters:
3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds. Switch the bent/straight leg halfway through each set.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000007',
    name: 'Bird-Dog',
    area: 'Lower Back Pain',
    muscle: 'Erector Spinae / Multifidus / Gluteal',
    difficulty: 'Beginner',
    mechanics: 'Core Stability',
    instructions: 'On all fours, stiffen core 360 degrees. Simultaneously extend opposite arm and leg parallel to floor. Hold 10s with toes pointing down and hips square. Return with total control.',
    description: `Target Musculature & Clinical Purpose:
Erector spinae, multifidus, and gluteal endurance. Teaches the body to lock the spine in a neutral position while the arms and legs move independently (anti-extension and anti-rotation).

Setup & Joint Positioning:
Quadruped position. Hands under shoulders, knees under hips. Stiffen the core 360 degrees.

Biomechanical Execution & Cues:
• Concentric / Drive: Simultaneously extend one arm straight forward and the opposite leg straight backward until they are parallel to the floor.
• Isometric Hold: Hold the peak extension for 10 seconds. Keep the foot flexed and toes pointing straight down.
• Eccentric / Loading: Return hand and knee to the floor with total control.
• Internal & External Cues: "Push the wall away with your heel" and "Balance a full glass of water on your lower back."

Common Faults & Kinetotherapy Fixes:
Lifting the leg too high, which arches the lower back, or rotating the pelvis open toward the ceiling. Fix: Only lift the heel to hip height. Point the toes of the extended leg strictly at the floor to internally rotate the hip and lock the pelvis square.

Rehab / Loading Parameters:
3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side.`
  },
  {
    id: 'e0000001-0000-4000-a000-000000000008',
    name: 'Side Plank',
    area: 'Lower Back Pain',
    muscle: 'Obliques / Quadratus Lumborum',
    difficulty: 'Intermediate',
    mechanics: 'Isometric',
    instructions: 'Lie on side with elbow under shoulder, feet stacked. Drive hips up forming a rigid line from ankles to ears. Hold 10s without sagging or rotating chest.',
    description: `Target Musculature & Clinical Purpose:
Obliques and quadratus lumborum (QL). Creates lateral spinal stability, essential for carrying asymmetrical loads or preventing the spine from buckling sideways under fatigue.

Setup & Joint Positioning:
Lie on your side. Place the bottom elbow directly under the shoulder. Stack the feet (or place the top foot directly in front of the bottom foot for a wider base). Place the free hand on the opposite shoulder.

Biomechanical Execution & Cues:
• Concentric / Drive: Drive the hips up until the body forms a perfect, rigid straight line from the ankles through the knees, hips, and ears.
• Isometric Hold: Hold for 10 seconds.
• Eccentric / Loading: Hinge smoothly from the hips to lower back down.
• Internal & External Cues: "Make your body stiff like a steel beam."

Common Faults & Kinetotherapy Fixes:
Sagging the hips toward the floor or twisting the chest toward the ground. Fix: If the 10-second hold cannot be maintained without sagging, regress to performing the side plank from the knees instead of the feet.

Rehab / Loading Parameters:
3 sets × Descending Pyramid (5, 3, 1 reps) × 10-second holds per side.`
  }
];

// Keep existing RECOVERY_EXERCISES_METADATA and merge clinicalExercises
// Also keep KETTLEBELL_EXERCISES_METADATA, CORE_EXERCISES_METADATA, RECOVERY_WORKSESSIONS_METADATA

// Let's create the recovery map
let recoveryMap = {};
clinicalExercises.forEach(ex => {
  recoveryMap[ex.id] = {
    name: ex.name,
    alias: ex.alias || null,
    area: ex.area,
    muscle: ex.muscle,
    difficulty: ex.difficulty,
    mechanics: ex.mechanics,
    instructions: ex.instructions,
    description: ex.description
  };
});

// Other existing recovery exercises that were in recoveryMetadata.js
const otherRecovery = {
  'e0000001-0000-4000-a000-000000000004': {
    name: 'Glute Bridge',
    area: 'Knee Rehab',
    muscle: 'Gluteus Maximus / Hamstrings',
    difficulty: 'Beginner',
    mechanics: 'Concentric',
    instructions: 'Lie on back, knees bent at 90°, feet flat. Drive through heels to lift hips until thighs and torso align. Squeeze glutes for 2 seconds at the peak without overarching lower back.'
  },
  'e0000001-0000-4000-a000-000000000010': {
    name: 'Pallof Press',
    area: 'Lower Back Pain',
    muscle: 'Core Anti-rotation',
    difficulty: 'Intermediate',
    mechanics: 'Anti-Rotation',
    instructions: 'Stand tall sideways to resistance band anchored at chest height. Hold handle with both hands at chest. Press arms straight forward resisting rotation. Hold 2 seconds; return slowly.'
  },
  'e0000001-0000-4000-a000-000000000013': {
    name: 'Face Pull with External Rotation',
    area: 'Shoulder Rehab',
    muscle: 'Infraspinatus / Teres Minor / Mid Trap',
    difficulty: 'Intermediate',
    mechanics: 'Dynamic Stabilizer',
    instructions: 'Anchor band at eye level. Pull band toward face with high elbows, then externally rotate forearms upward into a field goal post position. Squeeze shoulder blades.'
  },
  'e0000001-0000-4000-a000-000000000014': {
    name: 'Thread the Needle',
    area: 'Shoulder Rehab',
    muscle: 'Thoracic Spine / Posterior Shoulder',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'On all fours, slide one arm underneath chest along floor with palm up, rotating thoracic spine until shoulder reaches floor. Hold 3 seconds; switch.'
  },
  'e0000001-0000-4000-a000-000000000016': {
    name: 'Eccentric Heel Drops',
    area: 'Ankle & Achilles',
    muscle: 'Gastrocnemius / Achilles Tendon',
    difficulty: 'Intermediate',
    mechanics: 'Eccentric',
    instructions: 'Stand on edge of step on balls of feet. Rise up on both feet, remove unaffected foot, and lower working heel down below step level over a slow 3-second cadence.'
  },
  'e0000001-0000-4000-a000-000000000017': {
    name: 'Tibialis Wall Raises',
    area: 'Ankle & Achilles',
    muscle: 'Tibialis Anterior',
    difficulty: 'Beginner',
    mechanics: 'Concentric',
    instructions: 'Lean hips and upper back against a wall, feet placed 1-2 feet forward. Flex ankles to pull toes and front of feet toward shins as high as possible. Pause 1 second at top.'
  },
  'e0000001-0000-4000-a000-000000000019': {
    name: 'Ankle Alphabet',
    area: 'Ankle & Achilles',
    muscle: 'Multi-Planar Ankle Mobility',
    difficulty: 'Beginner',
    mechanics: 'Mobility',
    instructions: 'Seated or supine with leg extended, trace the entire uppercase alphabet (A to Z) with toes, moving strictly from the ankle joint.'
  }
};

const fullRecoveryMetadata = {
  ...recoveryMap,
  ...otherRecovery
};

// Extract kettlebell, core, and worksessions metadata blocks from current file
const kbStart = currentContent.indexOf('export const KETTLEBELL_EXERCISES_METADATA = {');
const wsStart = currentContent.indexOf('export const RECOVERY_WORKSESSIONS_METADATA = {');
const kbAndCore = currentContent.substring(kbStart, wsStart);

const allMetaStart = currentContent.indexOf('export const ALL_EXERCISES_METADATA = {');
const wsContent = currentContent.substring(wsStart, allMetaStart);

const newFileContent = `// Metadata and clinical instructions for rehabilitation, kettlebell, and core exercises and worksessions

export const RECOVERY_EXERCISES_METADATA = ${JSON.stringify(fullRecoveryMetadata, null, 2)};

${kbAndCore}
${wsContent}
export const ALL_EXERCISES_METADATA = {
  ...RECOVERY_EXERCISES_METADATA,
  ...KETTLEBELL_EXERCISES_METADATA,
  ...CORE_EXERCISES_METADATA
};

// Name-based index for fast fallback lookups
const EXERCISE_BY_NAME = {};
Object.values(ALL_EXERCISES_METADATA).forEach(meta => {
  if (meta?.name) {
    EXERCISE_BY_NAME[meta.name.toLowerCase().trim()] = meta;
  }
  if (meta?.alias) {
    EXERCISE_BY_NAME[meta.alias.toLowerCase().trim()] = meta;
  }
});

// Additional explicit aliases
EXERCISE_BY_NAME['single-leg balance (pad)'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000018'];
EXERCISE_BY_NAME['single leg balance (unstable surface)'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000018'];
EXERCISE_BY_NAME['banded external rotation'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000012'];
EXERCISE_BY_NAME['prone y-t-w raises'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000015'];
EXERCISE_BY_NAME['decline slant board squat'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000023'];
EXERCISE_BY_NAME['dumbbell scaption'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000024'];
EXERCISE_BY_NAME['deficit calf raises'] = ALL_EXERCISES_METADATA['e0000001-0000-4000-a000-000000000021'];

const WORKSESSION_BY_NAME = {};
Object.values(RECOVERY_WORKSESSIONS_METADATA).forEach(meta => {
  if (meta?.name) {
    WORKSESSION_BY_NAME[meta.name.toLowerCase().trim()] = meta;
  }
});

export const getExerciseInstructions = (exercise) => {
  if (!exercise) return null;
  if (exercise.instructions) return exercise.instructions;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.instructions) {
    return ALL_EXERCISES_METADATA[exercise.id].instructions;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.instructions) {
    return EXERCISE_BY_NAME[nameKey].instructions;
  }
  return null;
};

export const getExerciseDescription = (exercise) => {
  if (!exercise) return null;
  if (exercise.description) return exercise.description;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.description) {
    return ALL_EXERCISES_METADATA[exercise.id].description;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.description) {
    return EXERCISE_BY_NAME[nameKey].description;
  }
  return null;
};

export const getExerciseDifficulty = (exercise) => {
  if (!exercise) return null;
  if (exercise.difficulty) return exercise.difficulty;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.difficulty) {
    return ALL_EXERCISES_METADATA[exercise.id].difficulty;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.difficulty) {
    return EXERCISE_BY_NAME[nameKey].difficulty;
  }
  return null;
};

export const getExerciseMechanics = (exercise) => {
  if (!exercise) return null;
  if (exercise.mechanics) return exercise.mechanics;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.mechanics) {
    return ALL_EXERCISES_METADATA[exercise.id].mechanics;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.mechanics) {
    return EXERCISE_BY_NAME[nameKey].mechanics;
  }
  return null;
};

export const getWorksessionDescription = (worksession) => {
  if (!worksession) return null;
  if (worksession.description) return worksession.description;
  if (worksession.id && RECOVERY_WORKSESSIONS_METADATA[worksession.id]?.description) {
    return RECOVERY_WORKSESSIONS_METADATA[worksession.id].description;
  }
  const nameKey = worksession.name?.toLowerCase().trim();
  if (nameKey && WORKSESSION_BY_NAME[nameKey]?.description) {
    return WORKSESSION_BY_NAME[nameKey].description;
  }
  return null;
};

export const getWorksessionExerciseCue = (worksession, exerciseId) => {
  if (!worksession || !exerciseId) return null;
  const wsMeta = RECOVERY_WORKSESSIONS_METADATA[worksession.id] || WORKSESSION_BY_NAME[worksession.name?.toLowerCase().trim()];
  return wsMeta?.cues?.[exerciseId] || null;
};

export const getExerciseVideoUrl = (exercise) => {
  if (!exercise) return null;
  if (exercise.video_url) return exercise.video_url;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.video_url) {
    return ALL_EXERCISES_METADATA[exercise.id].video_url;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.video_url) {
    return EXERCISE_BY_NAME[nameKey].video_url;
  }
  return null;
};

export const getExerciseVideoThumbnail = (exercise) => {
  if (!exercise) return null;
  if (exercise.video_thumbnail_url) return exercise.video_thumbnail_url;
  if (exercise.id && ALL_EXERCISES_METADATA[exercise.id]?.video_thumbnail_url) {
    return ALL_EXERCISES_METADATA[exercise.id].video_thumbnail_url;
  }
  const nameKey = exercise.name?.toLowerCase().trim();
  if (nameKey && EXERCISE_BY_NAME[nameKey]?.video_thumbnail_url) {
    return EXERCISE_BY_NAME[nameKey].video_thumbnail_url;
  }
  return null;
};

export const getExerciseTrackingType = (exercise) => {
  if (!exercise) return 'weight_reps';

  // Explicit tracking type field
  const explicit = exercise.tracking_type || exercise.trackingType;
  if (explicit === 'time' || explicit === 'duration') return 'time';
  if (explicit === 'weight_reps') return 'weight_reps';
  if (explicit === 'bodyweight') return 'bodyweight';

  const n = (exercise.name || '').toLowerCase();
  const c = (exercise.category || '').toLowerCase();
  const eq = (exercise.equipment || '').toLowerCase();
  const m = (exercise.mechanics || '').toLowerCase();

  // 1. Time-related (holds, isometrics, planks, yoga poses, duration-based)
  if (
    n.includes('hold') ||
    n.includes('plank') ||
    n.includes('wall sit') ||
    n.includes('l-sit') ||
    n.includes('hollow') ||
    n.includes('spanish squat') ||
    n.includes('balance') ||
    n.includes('deadbug') ||
    n.includes('bird-dog') ||
    n.includes('cat-cow') ||
    n.includes('alphabet') ||
    c === 'yoga' ||
    n.includes('pose') ||
    n.includes('dog') ||
    n.includes('chaturanga') ||
    n.includes('warrior') ||
    n.includes('thread the needle') ||
    m.includes('isometric') ||
    m.includes('static')
  ) {
    return 'time';
  }

  // 2. Weight + Rep related (barbell, dumbbell, kettlebell, loaded resistance)
  if (
    eq.includes('dumbbell') ||
    eq.includes('barbell') ||
    eq === 'kettlebell' ||
    n.includes('bench press') ||
    n.includes('deadlift') ||
    (n.includes('squat') && !n.includes('pistol') && !n.includes('jump')) ||
    (n.includes('curl') && !n.includes('nordic') && !n.includes('mcgill')) ||
    n.includes('overhead press') ||
    n.includes('clean') ||
    n.includes('snatch') ||
    n.includes('kettlebell') ||
    (n.includes('row') && !n.includes('trx') && !n.includes('inverted')) ||
    n.includes('farmer') ||
    n.includes('suitcase') ||
    n.includes('halo')
  ) {
    return 'weight_reps';
  }

  // 3. Rep-related / Bodyweight (pull-ups, push-ups, dips, box jumps, TRX, calisthenics)
  return 'bodyweight';
};
`;

fs.writeFileSync('src/data/recoveryMetadata.js', newFileContent, 'utf8');
console.log('✓ Successfully wrote src/data/recoveryMetadata.js');
