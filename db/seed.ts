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
    { fpsoId: uny.id, code: 'UNY-775-COCE-0220', name: 'Compressor COCE 0220' }, // 0
    { fpsoId: uny.id, code: 'MMA-100-PUM-0420',  name: 'Pump 0420' },              // 1
    { fpsoId: uny.id, code: 'PIO-310-HX-0145',   name: 'Heat Exchanger 0145' },    // 2
    { fpsoId: uny.id, code: 'UNY-775-COCE-0221', name: 'Compressor COCE 0221' }, // 3
    { fpsoId: uny.id, code: 'PIO-220-TRB-0312',  name: 'Turbine 0312' },           // 4
    { fpsoId: uny.id, code: 'UNY-775-COCE-0222', name: 'Compressor COCE 0222' }, // 5
    { fpsoId: uny.id, code: 'UNY-775-COCE-0223', name: 'Compressor COCE 0223' }, // 6
    { fpsoId: uny.id, code: 'UNY-775-COCE-0224', name: 'Compressor COCE 0224' }, // 7
    { fpsoId: uny.id, code: 'MMA-100-PUM-0421',  name: 'Pump 0421' },              // 8
    { fpsoId: uny.id, code: 'MMA-100-PUM-0422',  name: 'Pump 0422' },              // 9
    { fpsoId: uny.id, code: 'MMA-100-PUM-0423',  name: 'Pump 0423' },              // 10
    { fpsoId: uny.id, code: 'PIO-310-HX-0146',   name: 'Heat Exchanger 0146' },    // 11
    { fpsoId: uny.id, code: 'PIO-220-TRB-0313',  name: 'Turbine 0313' },           // 12
  ]).returning();


  const processingSteps = {
    abs_value:       { tags_to_apply: 'RUN' },
    drop_missing:    { tags_to_apply: 'all' },
    join_timeseries: { tags_to_apply: 'all' },
    round_timestamp: { period: 'min', tags_to_apply: 'all' },
  };

  // Monitoring Rules — names follow the {EQUIP}_{SYS}_{TYPE}_{NN} convention (e.g. COCE_GEN_SPK_01)
  const rules = await db.insert(monitoringRules).values([
    { name: 'COCE_GEN_SPK_01',   description: 'Compressor general spark monitoring',      processingSteps },
    { name: 'TURB_TEMP_TRND_03',  description: 'Turbine temperature trend monitoring',     processingSteps: {} },
    { name: 'PUMP_VIB_THR_02',   description: 'Pump vibration threshold',                 processingSteps: {} },
    { name: 'COCE_SURG_MGN_06',  description: 'Compressor surge margin monitoring',        processingSteps: {} },
    { name: 'HTEX_NORM_DP_04',   description: 'Heat exchanger normalized dP',              processingSteps: {} },
    { name: 'TURB_OIL_DRFT_05',   description: 'Turbine lube oil drift monitoring',        processingSteps: {} },
  ]).returning();

  // Rule Instances — Map each equipment to the correct rule matching its type
  const lastRun = new Date('2026-02-23T12:47:04');
  const nextRun = new Date('2026-02-24T12:47:04');

  const instancesData = [
    // Original 6 instances (0-5)
    { equipmentId: equipList[0].id, ruleId: rules[0].id }, // COCE-0220 -> Spike (COCE_GEN_SPK_01)
    { equipmentId: equipList[4].id, ruleId: rules[1].id }, // TRB-0312 -> Trend (TURB_TEMP_TRND_03)
    { equipmentId: equipList[1].id, ruleId: rules[2].id }, // PUM-0420 -> Surge (PUMP_VIB_THR_02)
    { equipmentId: equipList[3].id, ruleId: rules[3].id }, // COCE-0221 -> Surge (COCE_SURG_MGN_06)
    { equipmentId: equipList[2].id, ruleId: rules[4].id }, // HX-0145 -> dP (HTEX_NORM_DP_04)
    { equipmentId: equipList[4].id, ruleId: rules[5].id }, // TRB-0312 -> Drift (TURB_OIL_DRFT_05)

    // Additional Spike instances (6-10)
    { equipmentId: equipList[3].id, ruleId: rules[0].id },  // COCE-0221 -> Spike
    { equipmentId: equipList[5].id, ruleId: rules[0].id },  // COCE-0222 -> Spike
    { equipmentId: equipList[6].id, ruleId: rules[0].id },  // COCE-0223 -> Spike
    { equipmentId: equipList[7].id, ruleId: rules[0].id },  // COCE-0224 -> Spike
    { equipmentId: equipList[12].id, ruleId: rules[0].id }, // TRB-0313 -> Spike

    // Additional Surge instances (11-16)
    { equipmentId: equipList[8].id, ruleId: rules[2].id },  // PUM-0421 -> Surge
    { equipmentId: equipList[9].id, ruleId: rules[2].id },  // PUM-0422 -> Surge
    { equipmentId: equipList[10].id, ruleId: rules[2].id }, // PUM-0423 -> Surge
    { equipmentId: equipList[0].id, ruleId: rules[3].id },  // COCE-0220 -> Surge
    { equipmentId: equipList[5].id, ruleId: rules[3].id },  // COCE-0222 -> Surge
    { equipmentId: equipList[6].id, ruleId: rules[3].id },  // COCE-0223 -> Surge

    // Additional other types (17)
    { equipmentId: equipList[11].id, ruleId: rules[4].id }, // HX-0146 -> dP
  ];

  const instances = await db.insert(ruleInstances).values(
    instancesData.map((data, i) => {
      const enabled = i !== 0 && i !== 2;
      let deactivatedUntil: Date | null = null;
      if (i === 0) {
        deactivatedUntil = new Date('2026-01-15T00:00:00');
      } else if (i === 2) {
        deactivatedUntil = new Date('2026-09-15T00:00:00');
      }
      return {
        ruleId:      data.ruleId,
        equipmentId: data.equipmentId,
        timeseries:  `UNY:FPSO:771-VI-181${i + 1}_X`,
        schedule:    'Hourly',
        enabled,
        lastRunAt:   lastRun,
        nextRunAt:   nextRun,
        deactivatedUntil,
      };
    })
  ).returning();

  // Alerts — 12 records covering all 5 new status values and all monitoring rules
  // to_be_validated: 4  |  validation_in_progress: 2  |  validated: 4  |  rejected: 1  |  closed: 1
  await db.insert(alerts).values([
    { instanceId: instances[0].id, type: 'Compressor Performance',  endDate: new Date('2026-02-24T08:00:00'), triggeredAt: new Date('2026-02-23T12:47:04'), reviewedAt: null,                              reviewedBy: null,      status: 'to_be_validated'        },
    { instanceId: instances[0].id, type: 'Compressor Performance',  endDate: new Date('2026-02-25T08:00:00'), triggeredAt: new Date('2026-02-24T09:15:22'), reviewedAt: new Date('2026-02-24T14:30:00'),   reviewedBy: 'Jon Doe', status: 'validated'              },
    { instanceId: instances[1].id, type: 'Turbine Temp Deviation',  endDate: new Date('2026-02-24T10:00:00'), triggeredAt: new Date('2026-02-23T14:22:11'), reviewedAt: null,                              reviewedBy: null,      status: 'to_be_validated'        },
    { instanceId: instances[1].id, type: 'Turbine Temp Deviation',  endDate: new Date('2026-02-25T10:00:00'), triggeredAt: new Date('2026-02-24T11:05:44'), reviewedAt: new Date('2026-02-24T16:00:00'),   reviewedBy: 'Jon Doe', status: 'rejected'               },
    { instanceId: instances[2].id, type: 'Pump Vibration Threshold',endDate: new Date('2026-02-24T12:00:00'), triggeredAt: new Date('2026-02-23T16:33:09'), reviewedAt: null,                              reviewedBy: null,      status: 'validation_in_progress' },
    { instanceId: instances[2].id, type: 'Pump Vibration Threshold',endDate: new Date('2026-02-25T12:00:00'), triggeredAt: new Date('2026-02-24T13:48:55'), reviewedAt: new Date('2026-02-25T09:00:00'),   reviewedBy: 'Jon Doe', status: 'validated'              },
    { instanceId: instances[3].id, type: 'Surge Margin Alert',      endDate: new Date('2026-02-24T14:00:00'), triggeredAt: new Date('2026-02-23T18:01:37'), reviewedAt: null,                              reviewedBy: null,      status: 'to_be_validated'        },
    { instanceId: instances[3].id, type: 'Surge Margin Alert',      endDate: new Date('2026-02-25T14:00:00'), triggeredAt: new Date('2026-02-24T15:20:18'), reviewedAt: new Date('2026-02-25T10:30:00'),   reviewedBy: 'Jon Doe', status: 'validation_in_progress' },
    { instanceId: instances[4].id, type: 'HX Fouling Index Alert',  endDate: new Date('2026-02-24T16:00:00'), triggeredAt: new Date('2026-02-23T20:15:52'), reviewedAt: new Date('2026-02-24T08:00:00'),   reviewedBy: 'Jon Doe', status: 'validated'              },
    { instanceId: instances[4].id, type: 'HX Fouling Index Alert',  endDate: new Date('2026-02-25T16:00:00'), triggeredAt: new Date('2026-02-24T17:44:29'), reviewedAt: new Date('2026-02-25T11:00:00'),   reviewedBy: 'Jon Doe', status: 'closed'                },
    { instanceId: instances[5].id, type: 'Turbine Lube Oil Drift',  endDate: new Date('2026-02-24T18:00:00'), triggeredAt: new Date('2026-02-23T22:30:00'), reviewedAt: null,                              reviewedBy: null,      status: 'to_be_validated'        },
    { instanceId: instances[5].id, type: 'Turbine Lube Oil Drift',  endDate: new Date('2026-02-25T18:00:00'), triggeredAt: new Date('2026-02-24T23:15:00'), reviewedAt: new Date('2026-02-25T12:00:00'),   reviewedBy: 'Jon Doe', status: 'validated'              },
  ]);

  // Distribution of change types/descriptions to match mockup (Change Types):
  // Updated Abs Value tags: 19
  // Adjusted Round Timestamp period: 19
  // Modified Drop Missing tags: 2
  // Enabled rule after maintenance window: 1
  // Updated Join Timeseries tags: 1
  const changeTypesList: string[] = [
    'Updated Abs Value tags',                // i = 0 (Spike) -> overwritten with parameter changes
    'Disabled rule instance (Bulk)',         // i = 1 (Trend) -> Trend disabled log
    'Updated Abs Value tags',                // i = 2 (Surge) -> overwritten with parameter changes
    'Updated Abs Value tags',                // i = 3 (Surge) -> overwritten with parameter changes
    'Enabled rule after maintenance window', // i = 4 (dP) -> dP enabled log
    ...Array(14).fill('Updated Abs Value tags'),
    ...Array(18).fill('Adjusted Round Timestamp period'),
    ...Array(2).fill('Modified Drop Missing tags'),
    ...Array(3).fill('Updated Join Timeseries tags'),
  ];

  // Round-robin distribution across 6 instances so every page of the table shows
  // a variety of equipment/rule combinations (i % 6 → inst 0,1,2,3,4,5,0,1,2,3,4,5...)
  const equipmentDistribution = Array.from({ length: 42 }, (_, i) => i % 17);

  // Distribute users: Top Editor Share -> icaro.zelioli@sbmoffshore.com must have exactly 17 changes (40% of 42)
  const userEmails = [
    ...Array(17).fill('icaro.zelioli@sbmoffshore.com'),
    ...Array(15).fill('jon.doe@sbmoffshore.com'),
    ...Array(10).fill('admin@sbmoffshore.com'),
  ];

  const auditLogsToInsert = [];

  for (let i = 0; i < 42; i++) {
    const instIdx = equipmentDistribution[i];
    let desc = changeTypesList[i];
    const email = userEmails[i];

    const isSpike = instIdx === 0 || (instIdx >= 6 && instIdx <= 10);
    const isSurge = instIdx === 2 || instIdx === 3 || (instIdx >= 11 && instIdx <= 16);

    let before: any;
    let after: any;

    if (desc === 'Disabled rule instance (Bulk)') {
      before = { enabled: true };
      after  = { enabled: false, reason: 'Sensor calibration in progress' };
    } else if (desc === 'Enabled rule after maintenance window') {
      before = { enabled: false };
      after  = { enabled: true };
    } else if (isSpike) {
      if (Math.floor(i / 6) % 2 === 0) {
        desc = 'Adjusted Spike height & prominence';
        before = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
        after = {
          rule_trigger_params: [{ spike_detection: { height: 1.5, threshold: null, distance: 60, prominence: 1.2 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
      } else {
        desc = 'Modified Spike timedelta filter';
        before = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
        after = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 360 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
      }
    } else if (isSurge) {
      if (Math.floor(i / 6) % 2 === 0) {
        desc = 'Adjusted Surge margin threshold';
        before = {
          rule_trigger_params: [{ threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
        after = {
          rule_trigger_params: [{ threshold_comparison: { value: 12.5, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
      } else {
        desc = 'Modified Surge evaluation window';
        before = {
          rule_trigger_params: [{ threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
        after = {
          rule_trigger_params: [{ threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 48, time_period_unit: 'h' } }]
        };
      }
    } else {
      const baseState = {
        abs_value:       { tags_to_apply: 'RUN' },
        drop_missing:    { tags_to_apply: 'all' },
        join_timeseries: { tags_to_apply: 'all' },
        round_timestamp: { period: 'min', tags_to_apply: 'all' },
      };
      before = { ...baseState };
      after  = { ...baseState };

      if (desc === 'Updated Abs Value tags') {
        before.abs_value = { tags_to_apply: 'RUN' };
        after.abs_value  = { tags_to_apply: 'RUN, Surge Margin Actual' };
      } else if (desc === 'Adjusted Round Timestamp period') {
        before.round_timestamp = { period: 'min', tags_to_apply: 'all' };
        after.round_timestamp  = { period: '5min', tags_to_apply: 'all' };
      } else if (desc === 'Modified Drop Missing tags') {
        before.drop_missing = { tags_to_apply: 'all' };
        after.drop_missing  = { tags_to_apply: 'RUN' };
      } else if (desc === 'Updated Join Timeseries tags') {
        before.join_timeseries = { tags_to_apply: 'all' };
        after.join_timeseries  = { tags_to_apply: 'RUN, TEMP' };
      }
    }

    auditLogsToInsert.push({
      instanceId:  instances[instIdx].id,
      userEmail:   email,
      description: desc,
      beforeState: before,
      afterState:  after,
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
