export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export type TrackingType = 'reps' | 'time' | 'distance';

export interface Exercise {
  id: string;
  name: string;
  category: string;
  equipment: string;
  muscle_group: string;
  difficulty?: DifficultyLevel | string | null;
  mechanics?: string | null;
  instructions?: string | null;
  is_default?: boolean;
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
  target_reps?: number | null;
  tracking_type?: TrackingType | string;
  target_time?: number | null;
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
