export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TrackingType = 'reps' | 'time' | 'weight_reps' | 'distance' | 'manual';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  muscle_group: string;
  tracking_type?: TrackingType | string | null;
  difficulty?: DifficultyLevel | string | null;
  mechanics?: string | null;
  instructions?: string | null;
  description?: string | null;
  video_url?: string | null;
  video_thumbnail_url?: string | null;
  is_default?: boolean;
  default_rest_seconds?: number;
  default_duration_seconds?: number;
  default_reps?: number;
  seconds_per_rep?: number | null;
  reset_seconds_per_rep?: number | null;
  user_id?: string | null;
  created_at?: string;
}

export interface Worksession {
  id: string;
  name: string;
  modality: string;
  description?: string | null;
  user_id?: string | null;
  created_at?: string;
  worksession_exercises?: WorksessionExercise[];
}

export interface WorksessionExercise {
  id: string;
  worksession_id: string;
  exercise_id: string;
  target_sets: number;
  order_index?: number | null;
  target_reps?: number | null;
  tracking_type?: TrackingType | string;
  target_time?: number | null;
  target_rest_seconds?: number | null;
  target_duration_seconds?: number | null;
  hold_seconds_per_rep?: number | null;
  seconds_per_rep?: number | null;
  reps_per_set?: number[] | null;
  durations_per_set?: number[] | null;
  reset_seconds_per_rep?: number | null;
  notes?: string | null;
  created_at?: string;
  exercises?: Exercise;
}

export interface TrainingPlan {
  id: string;
  name: string;
  schedule_type: 'anchored' | 'floating' | string;
  goal_category?: string | null;
  intensity?: string | null;
  sessions_per_week?: number | null;
  description?: string | null;
  is_standard_template?: boolean;
  user_id?: string | null;
  created_at?: string;
  plan_worksessions?: PlanWorksession[];
}

export interface PlanWorksession {
  id: string;
  plan_id: string;
  worksession_id: string;
  day_name?: string | null;
  order_index?: number | null;
  worksessions?: Worksession;
}

export interface UserGoal {
  id: string;
  user_id?: string | null;
  title: string;
  type: 'weekly_frequency' | 'volume' | 'recovery_target' | string;
  target_value: number;
  current_value: number;
  unit?: string;
  timeframe: 'weekly' | string;
  created_at?: string;
  updated_at?: string;
}

export type ScheduleActivityType = 'workout' | 'rehab' | 'sport' | 'rest';

export interface WeeklyScheduleSlot {
  id: string;
  user_id?: string;
  day_of_week: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  day_index: number; // 0 = Monday ... 6 = Sunday
  activity_type: ScheduleActivityType;
  title: string;
  subtitle?: string | null;
  worksession_id?: string | null;
  program_id?: string | null;
  exercise_id?: string | null;
  bind_to_active_phase?: boolean;
  target_duration_minutes?: number;
  intensity_target?: string | null;
  notes?: string | null;
  order_index?: number;
  created_at?: string;
  updated_at?: string;
}

