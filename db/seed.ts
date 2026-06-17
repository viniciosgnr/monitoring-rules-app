import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import {
  fpsos, equipment, monitoringRules,
  ruleInstances, alerts, auditLog,
} from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  // FPSOs
  const [uny] = await db.insert(fpsos).values([
    { code: 'UNY', name: 'FPSO Unity' },
  ]).returning();

  // Equipment
  const equipList = await db.insert(equipment).values([
    { fpsoId: uny.id, code: 'UNY-775-COCE-0220', name: 'Compressor COCE 0220' },
    { fpsoId: uny.id, code: 'MMA-100-PUM-0420',  name: 'Pump 0420' },
    { fpsoId: uny.id, code: 'PIO-310-HX-0145',   name: 'Heat Exchanger 0145' },
    { fpsoId: uny.id, code: 'UNY-775-COCE-0221', name: 'Compressor COCE 0221' },
    { fpsoId: uny.id, code: 'PIO-220-TRB-0312',  name: 'Turbine 0312' },
  ]).returning();

  const processingSteps = {
    abs_value:       { tags_to_apply: 'RUN' },
    drop_missing:    { tags_to_apply: 'all' },
    join_timeseries: { tags_to_apply: 'all' },
    round_timestamp: { period: 'min', tags_to_apply: 'all' },
  };

  // Monitoring Rules
  const rules = await db.insert(monitoringRules).values([
    { name: 'COCE_TIME_NRS_01',  description: 'Compressor time-based NRS monitoring', processingSteps },
    { name: 'TURB_TEMP_DEV_03',  description: 'Turbine temperature deviation',          processingSteps: {} },
    { name: 'PUMP_VIB_THRES_02', description: 'Pump vibration threshold',               processingSteps: {} },
    { name: 'SURGE_MARGIN_06',   description: 'Surge margin monitoring',                processingSteps: {} },
    { name: 'HX_FOULING_04',     description: 'Heat exchanger fouling index',           processingSteps: {} },
  ]).returning();

  // Rule Instances
  const lastRun = new Date('2026-02-23T12:47:04');
  const nextRun = new Date('2026-02-24T12:47:04');

  const instances = await db.insert(ruleInstances).values(
    equipList.map((eq, i) => ({
      ruleId:      rules[0].id,
      equipmentId: eq.id,
      timeseries:  `UNY:FPSO:771-VI-181${i + 1}_X`,
      schedule:    'Daily',
      enabled:     i !== 0,
      lastRunAt:   lastRun,
      nextRunAt:   nextRun,
    }))
  ).returning();

  // Alerts
  await db.insert(alerts).values(
    instances.map((inst, i) => ({
      instanceId:  inst.id,
      type:        'Compressor Performance',
      endDate:     new Date('2026-02-23T12:47:04'),
      triggeredAt: new Date('2026-02-23T12:47:04'),
      reviewedAt:  i % 3 !== 2 ? new Date('2026-02-23T12:47:04') : null,
      reviewedBy:  i % 3 !== 2 ? 'Jon Doe' : null,
      status:      (['accepted', 'rejected', 'pending', 'accepted', 'pending'] as const)[i % 5],
    }))
  );

  // Audit Log
  const beforeState = {
    rule_trigger_params: [{
      status_check: { value: 1, tags_to_apply: ['RUN'] },
      threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] },
    }],
    event_trigger_params: [{
      time_totalization: { rule: '0&1', value: 50, operator: 'gt', time_period: 24, tags_to_apply: ['all'] },
    }],
  };

  const descriptions = [
    'Updated threshold_comparison operator',
    'Adjusted time_totalization period',
    'Modified surge margin threshold',
    'Enabled rule after maintenance window',
    'Updated alert sensitivity',
  ];

  await db.insert(auditLog).values(
    Array.from({ length: 10 }, (_, i) => ({
      instanceId:  instances[i % instances.length].id,
      userEmail:   'icaro.zelioli@sbmoffshore.com',
      description: descriptions[i % descriptions.length],
      beforeState,
      afterState:  { ...beforeState },
      createdAt:   new Date(`2026-02-23T17:49:${String(33 + i).padStart(2, '0')}`),
    }))
  );

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
