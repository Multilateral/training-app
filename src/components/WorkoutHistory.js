import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../context/TrainingContext';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutHistory() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user?.id) return;

      const { data, error } = await supabase
        .from('active_sessions')
        .select(`
          id, start_time, end_time,
          exercise_logs (
            id, exercise_name, set_number, reps, weight
          )
        `)
        .eq('user_id', userData.user.id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (e) {
      console.error('Error fetching history:', e);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    if (!start || !end) return 'Unknown';
    const s = new Date(start);
    const e = new Date(end);
    const diffMs = e - s;
    const diffMins = Math.round(diffMs / 60000);
    return `${diffMins} min`;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  const calculateTotalVolume = (logs) => {
    if (!logs || logs.length === 0) return 0;
    return logs.reduce((total, log) => {
      const w = log.weight || 0;
      const r = log.reps || 0;
      return total + (w * r);
    }, 0);
  };

  const summarizeExercises = (logs) => {
    if (!logs || logs.length === 0) return [];
    
    // Group by exercise name
    const grouped = logs.reduce((acc, log) => {
      if (!acc[log.exercise_name]) {
        acc[log.exercise_name] = 0;
      }
      acc[log.exercise_name] += 1; // count sets
      return acc;
    }, {});

    return Object.keys(grouped).map(name => `${name} (${grouped[name]} sets)`);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00D09E" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {sessions.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="barbell-outline" size={48} color="#444" />
          <Text style={styles.emptyText}>No completed workouts yet.</Text>
        </View>
      ) : (
        sessions.map(session => (
          <View key={session.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.dateText}>{formatDate(session.start_time)}</Text>
              <View style={styles.durationBadge}>
                <Ionicons name="time-outline" size={14} color="#00D09E" />
                <Text style={styles.durationText}>{calculateDuration(session.start_time, session.end_time)}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Volume</Text>
                <Text style={styles.statValue}>{calculateTotalVolume(session.exercise_logs)} lbs</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Sets</Text>
                <Text style={styles.statValue}>{session.exercise_logs?.length || 0}</Text>
              </View>
            </View>

            <View style={styles.exerciseSummary}>
              <Text style={styles.exerciseSummaryTitle}>Exercises:</Text>
              {summarizeExercises(session.exercise_logs).map((summary, idx) => (
                <Text key={idx} style={styles.exerciseSummaryText}>• {summary}</Text>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1E24',
  },
  contentContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1E1E24',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 12,
  },
  card: {
    backgroundColor: '#2A2A31',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00D09E20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#00D09E',
    marginLeft: 4,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A45',
    paddingBottom: 15,
  },
  statBox: {
    flex: 1,
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    color: '#00D09E',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exerciseSummary: {
    marginTop: 5,
  },
  exerciseSummaryTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseSummaryText: {
    color: '#AAA',
    fontSize: 14,
    marginBottom: 4,
  }
});
