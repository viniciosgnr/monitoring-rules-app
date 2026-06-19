import { config } from 'dotenv';
config({ path: '.env.local' });

import { db } from './index';
import {
  fpsos, equipment, monitoringRules,
  ruleInstances, alerts, auditLog,
} from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  console.log('🧹 Cleaning existing data...');
  await db.delete(auditLog);
  await db.delete(alerts);
  await db.delete(ruleInstances);
  await db.delete(monitoringRules);
  await db.delete(equipment);
  await db.delete(fpsos);

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

  // Monitoring Rules — names follow the {EQUIP}_{SYS}_{TYPE}_{NN} convention (e.g. COCE_GEN_SPK_01)
  const rules = await db.insert(monitoringRules).values([
    { name: 'COCE_GEN_SPK_01',  description: 'Compressor general spark monitoring',      processingSteps },
    { name: 'TURB_TEMP_DEV_03', description: 'Turbine temperature deviation',             processingSteps: {} },
    { name: 'PUMP_VIB_THR_02',  description: 'Pump vibration threshold',                 processingSteps: {} },
    { name: 'COCE_SURG_MGN_06', description: 'Compressor surge margin monitoring',        processingSteps: {} },
    { name: 'HTEX_FOUL_IDX_04', description: 'Heat exchanger fouling index',              processingSteps: {} },
  ]).returning();

  // Rule Instances
  const lastRun = new Date('2026-02-23T12:47:04');
  const nextRun = new Date('2026-02-24T12:47:04');

  const instances = await db.insert(ruleInstances).values(
    equipList.map((eq, i) => ({
      ruleId:      rules[i % rules.length].id, // Properly link ruleInstances to all 5 rules
      equipmentId: eq.id,
      timeseries:  `UNY:FPSO:771-VI-181${i + 1}_X`,
      schedule:    'Hourly',
      enabled:     i !== 0,
      lastRunAt:   lastRun,
      nextRunAt:   nextRun,
    }))
  ).returning();

  // Alerts - seed 10 alerts to match mockup total alerts: 10, pending: 2, overdue (>10): 2
  // Let's make: 5 accepted, 3 rejected, 2 pending
  await db.insert(alerts).values([
    { instanceId: instances[0].id, type: 'Compressor Performance', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'accepted' },
    { instanceId: instances[1].id, type: 'Turbine Temp Deviation', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'rejected' },
    { instanceId: instances[2].id, type: 'Pump Vibration Threshold', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: null, reviewedBy: null, status: 'pending' },
    { instanceId: instances[3].id, type: 'Surge Margin Alert', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'accepted' },
    { instanceId: instances[4].id, type: 'HX Fouling Index Alert', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: null, reviewedBy: null, status: 'pending' },
    { instanceId: instances[0].id, type: 'Compressor Performance', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'accepted' },
    { instanceId: instances[1].id, type: 'Turbine Temp Deviation', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'rejected' },
    { instanceId: instances[2].id, type: 'Pump Vibration Threshold', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'accepted' },
    { instanceId: instances[3].id, type: 'Surge Margin Alert', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'rejected' },
    { instanceId: instances[4].id, type: 'HX Fouling Index Alert', endDate: new Date('2026-02-23T12:47:04'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: new Date('2026-02-23T12:47:04'), reviewedBy: 'Jon Doe', status: 'accepted' },
  ]);

  // Audit Log: Seed exactly 42 records
  // beforeState and afterState are deliberately different so the ParamDiffModal
  // highlights meaningful changes during demo sessions.
  const beforeState = {
    rule_trigger_params: [{
      status_check: { value: 1, tags_to_apply: ['RUN'] },
      threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] },
    }],
    event_trigger_params: [{
      time_totalization: { rule: '0&1', value: 50, operator: 'gt', time_period: 24, tags_to_apply: ['all'] },
    }],
  };

  const afterState = {
    rule_trigger_params: [{
      status_check: { value: 1, tags_to_apply: ['RUN'] },
      threshold_comparison: { value: 10, operator: 'gte', tags_to_apply: ['Surge Margin Actual'] },
    }],
    event_trigger_params: [{
      time_totalization: { rule: '0&1', value: 50, operator: 'gt', time_period: 48, tags_to_apply: ['all'] },
    }],
  };

  const auditLogsToInsert = [];

  // Distribution of change types/descriptions to match mockup (Change Types):
  // Updated threshold_comparison operator: 19
  // Adjusted time_totalization period: 19
  // Modified surge margin threshold: 2
  // Enabled rule after maintenance window: 1
  // Updated alert sensitivity: 1
  const changeTypesList: string[] = [
    ...Array(19).fill('Updated threshold_comparison operator'),
    ...Array(19).fill('Adjusted time_totalization period'),
    ...Array(2).fill('Modified surge margin threshold'),
    ...Array(1).fill('Enabled rule after maintenance window'),
    ...Array(1).fill('Updated alert sensitivity'),
  ];

  // Round-robin distribution across 5 instances so every page of the table shows
  // a variety of equipment/rule combinations (i % 5 → inst 0,1,2,3,4,0,1,2,3,4...)
  const equipmentDistribution = Array.from({ length: 42 }, (_, i) => i % 5);

  // Distribute users: Top Editor Share -> icaro.zelioli@sbmoffshore.com must have exactly 17 changes (40% of 42)
  const userEmails = [
    ...Array(17).fill('icaro.zelioli@sbmoffshore.com'),
    ...Array(15).fill('jon.doe@sbmoffshore.com'),
    ...Array(10).fill('admin@sbmoffshore.com'),
  ];

  for (let i = 0; i < 42; i++) {
    const instIdx = equipmentDistribution[i];
    const desc = changeTypesList[i];
    const email = userEmails[i];

    auditLogsToInsert.push({
      instanceId:  instances[instIdx].id,
      userEmail:   email,
      description: desc,
      beforeState,
      afterState:  afterState,
      createdAt:   new Date(`2026-02-23T17:49:${String(i).padStart(2, '0')}`),
    });
  }

  await db.insert(auditLog).values(auditLogsToInsert);

  console.log('✅ Seed complete');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
