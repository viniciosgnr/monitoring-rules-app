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

  // FPSOs (SBM Offshore Trigrams)
  const [uny, cdi, sep, adg, atd] = await db.insert(fpsos).values([
    { code: 'UNY', name: 'FPSO Unity' },
    { code: 'CDI', name: 'FPSO Cidade de Ilhabela' },
    { code: 'SEP', name: 'FPSO Sepetiba' },
    { code: 'ADG', name: 'FPSO Alexandre de Gusmão' },
    { code: 'ATD', name: 'FPSO Almirante Tamandaré' },
  ]).returning();

  // Equipment
  const equipList = await db.insert(equipment).values([
    { fpsoId: uny.id, code: 'UNY-775-COCE-0220', name: 'Compressor COCE 0220' }, // 0
    { fpsoId: cdi.id, code: 'CDI-100-PUM-0420',  name: 'Pump 0420' },              // 1
    { fpsoId: sep.id, code: 'SEP-310-HX-0145',   name: 'Heat Exchanger 0145' },    // 2
    { fpsoId: uny.id, code: 'UNY-775-COCE-0221', name: 'Compressor COCE 0221' }, // 3
    { fpsoId: adg.id, code: 'ADG-220-TRB-0312',  name: 'Turbine 0312' },           // 4
    { fpsoId: uny.id, code: 'UNY-775-COCE-0222', name: 'Compressor COCE 0222' }, // 5
    { fpsoId: cdi.id, code: 'CDI-775-COCE-0223', name: 'Compressor COCE 0223' }, // 6
    { fpsoId: atd.id, code: 'ATD-775-COCE-0224', name: 'Compressor COCE 0224' }, // 7
    { fpsoId: cdi.id, code: 'CDI-100-PUM-0421',  name: 'Pump 0421' },              // 8
    { fpsoId: sep.id, code: 'SEP-100-PUM-0422',  name: 'Pump 0422' },              // 9
    { fpsoId: adg.id, code: 'ADG-100-PUM-0423',  name: 'Pump 0423' },              // 10
    { fpsoId: sep.id, code: 'SEP-310-HX-0146',   name: 'Heat Exchanger 0146' },    // 11
    { fpsoId: atd.id, code: 'ATD-220-TRB-0313',  name: 'Turbine 0313' },           // 12
    { fpsoId: sep.id, code: 'SEP-500-VES-0101',  name: 'Separator Vessel 0101' },  // 13
    { fpsoId: adg.id, code: 'ADG-500-VES-0102',  name: 'Separator Vessel 0102' },  // 14
    { fpsoId: atd.id, code: 'ATD-600-ALT-0201',  name: 'Generator Alternator 0201' },// 15
  ]).returning();


  const processingStepsSpike = {
    rule_trigger_params: [
      {
        spike_detection: {
          height: null,
          threshold: null,
          distance: 50,
          prominence: 1,
        }
      }
    ]
  };

  const processingStepsSurge = {
    rule_trigger_params: [
      {
        threshold_comparison: {
          value: 150,
          operator: 'gt',
        }
      }
    ]
  };

  // Monitoring Rules — names follow the {EQUIP}_{SYS}_{TYPE}_{NN} convention
  const rules = await db.insert(monitoringRules).values([
    { name: 'COCE_GEN_SPK_01',   description: 'Compressor general spark monitoring',      processingSteps: processingStepsSpike },
    { name: 'TURB_TEMP_TRND_03',  description: 'Turbine temperature trend monitoring',     processingSteps: { threshold: 10 } },
    { name: 'PUMP_VIB_THR_02',   description: 'Pump vibration threshold',                 processingSteps: processingStepsSurge },
    { name: 'COCE_SURG_MGN_06',  description: 'Compressor surge margin monitoring',        processingSteps: processingStepsSurge },
    { name: 'HTEX_NORM_DP_04',   description: 'Heat exchanger normalized dP',              processingSteps: { threshold: 10 } },
    { name: 'TURB_OIL_DRFT_05',   description: 'Turbine lube oil drift monitoring',        processingSteps: { threshold: 10 } },
  ]).returning();

  // Rule Instances — 32 Instances across equipment assets
  const lastRun = new Date('2026-02-23T12:47:04');
  const nextRun = new Date('2026-02-24T12:47:04');

  const instancesData = [
    // Spike rules (0-9)
    { equipmentId: equipList[0].id,  ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[3].id,  ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[5].id,  ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[6].id,  ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[7].id,  ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[12].id, ruleId: rules[0].id, schedule: 'Daily' },
    { equipmentId: equipList[13].id, ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[14].id, ruleId: rules[0].id, schedule: 'Hourly' },
    { equipmentId: equipList[15].id, ruleId: rules[0].id, schedule: 'Daily' },
    { equipmentId: equipList[4].id,  ruleId: rules[0].id, schedule: 'Hourly' },

    // Surge rules (10-19)
    { equipmentId: equipList[1].id,  ruleId: rules[2].id, schedule: 'Hourly' },
    { equipmentId: equipList[8].id,  ruleId: rules[2].id, schedule: 'Hourly' },
    { equipmentId: equipList[9].id,  ruleId: rules[2].id, schedule: 'Hourly' },
    { equipmentId: equipList[10].id, ruleId: rules[2].id, schedule: 'Daily' },
    { equipmentId: equipList[3].id,  ruleId: rules[3].id, schedule: 'Hourly' },
    { equipmentId: equipList[0].id,  ruleId: rules[3].id, schedule: 'Hourly' },
    { equipmentId: equipList[5].id,  ruleId: rules[3].id, schedule: 'Hourly' },
    { equipmentId: equipList[6].id,  ruleId: rules[3].id, schedule: 'Hourly' },
    { equipmentId: equipList[7].id,  ruleId: rules[3].id, schedule: 'Hourly' },
    { equipmentId: equipList[13].id, ruleId: rules[3].id, schedule: 'Hourly' },

    // Trend rules (20-25)
    { equipmentId: equipList[4].id,  ruleId: rules[1].id, schedule: 'Daily' },
    { equipmentId: equipList[12].id, ruleId: rules[1].id, schedule: 'Daily' },
    { equipmentId: equipList[15].id, ruleId: rules[1].id, schedule: 'Daily' },
    { equipmentId: equipList[0].id,  ruleId: rules[1].id, schedule: 'Daily' },
    { equipmentId: equipList[1].id,  ruleId: rules[1].id, schedule: 'Daily' },
    { equipmentId: equipList[2].id,  ruleId: rules[1].id, schedule: 'Weekly' },

    // dP and Drift rules (26-31)
    { equipmentId: equipList[2].id,  ruleId: rules[4].id, schedule: 'Hourly' },
    { equipmentId: equipList[11].id, ruleId: rules[4].id, schedule: 'Hourly' },
    { equipmentId: equipList[4].id,  ruleId: rules[5].id, schedule: 'Hourly' },
    { equipmentId: equipList[12].id, ruleId: rules[5].id, schedule: 'Hourly' },
    { equipmentId: equipList[14].id, ruleId: rules[4].id, schedule: 'Daily' },
    { equipmentId: equipList[15].id, ruleId: rules[5].id, schedule: 'Daily' },
  ];

  const instances = await db.insert(ruleInstances).values(
    instancesData.map((data, i) => {
      const enabled = i !== 0 && i !== 2 && i !== 10;
      let deactivatedUntil: Date | null = null;
      if (i === 0) {
        deactivatedUntil = new Date('2026-01-15T00:00:00');
      } else if (i === 2) {
        deactivatedUntil = new Date('2026-09-15T00:00:00');
      } else if (i === 10) {
        deactivatedUntil = new Date('2026-10-01T00:00:00');
      }

      // Generate realistic, diversified execution dates based on schedule and index
      const baseNow = new Date('2026-08-28T10:00:00Z').getTime();
      let lastRunDate: Date;
      let nextRunDate: Date;

      if (data.schedule === 'Hourly') {
        const hoursAgo = (i % 6) + 1;
        const minutesOffset = (i * 13) % 60;
        lastRunDate = new Date(baseNow - hoursAgo * 3600000 - minutesOffset * 60000);
        nextRunDate = new Date(lastRunDate.getTime() + 3600000);
      } else if (data.schedule === 'Daily') {
        const daysAgo = (i % 5) + 1;
        const hoursOffset = (i * 7) % 24;
        lastRunDate = new Date(baseNow - daysAgo * 86400000 - hoursOffset * 3600000);
        nextRunDate = new Date(lastRunDate.getTime() + 86400000);
      } else {
        // Weekly
        const daysAgo = (i % 3 + 1) * 7;
        lastRunDate = new Date(baseNow - daysAgo * 86400000);
        nextRunDate = new Date(lastRunDate.getTime() + 7 * 86400000);
      }

      return {
        ruleId:      data.ruleId,
        equipmentId: data.equipmentId,
        timeseries:  `UNY:FPSO:771-VI-181${(i % 20) + 1}_X`,
        schedule:    data.schedule,
        enabled,
        lastRunAt:   lastRunDate,
        nextRunAt:   nextRunDate,
        deactivatedUntil,
      };
    })
  ).returning();

  // Alerts — Rich dataset dynamically distributed across 365 days (1 Year / All time)
  const typePool = [
    'Compressor Performance', 'Turbine Temp Deviation', 'Pump Vibration Threshold', 'Surge Margin Alert', 'HX Fouling Index Alert', 'Turbine Lube Oil Drift'
  ];

  const alertsValues = [];
  const nowMs = Date.now();

  // Generate alerts across past 365 days with dense daily frequency
  for (let day = 0; day < 365; day++) {
    let alertsPerDay = 0;
    if (day < 7) {
      // Recent 7 Days (Last Week): 18-25 alerts/day (~150 alerts in last week)
      alertsPerDay = 18 + ((day * 7 + 3) % 8);
    } else if (day < 30) {
      // Days 7-30 (Last Month): 12-18 alerts/day
      alertsPerDay = 12 + ((day * 5 + 2) % 7);
    } else if (day < 180) {
      // Days 30-180 (Last 6 Months): 8-14 alerts/day
      alertsPerDay = 8 + ((day * 3 + 1) % 7);
    } else {
      // Days 180-365 (1 Year / All time): 5-10 alerts/day
      alertsPerDay = 5 + ((day * 2) % 6);
    }

    // Non-uniform instance weights array to produce a realistic bad actors distribution
    const instWeightsPool = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
      2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2,
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      4, 4, 4, 4, 4, 4, 4, 4, 4,
      5, 5, 5, 5, 5, 5, 5, 5,
      6, 6, 6, 6, 6, 6, 6,
      7, 7, 7, 7, 7, 7,
      8, 8, 8, 8, 8,
      9, 9, 9, 9, 9,
      10, 10, 10, 10,
      11, 11, 11, 11,
      12, 12, 12,
      13, 13, 13,
      14, 14, 14,
      15, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 23, 24, 24, 25, 25, 26, 27, 28, 29, 30, 31
    ];

    for (let j = 0; j < alertsPerDay; j++) {
      const idx = day * 13 + j;
      const poolIdx = (idx * 17 + day * 7 + j * 3) % instWeightsPool.length;
      const inst = instances[instWeightsPool[poolIdx] % instances.length];
      const type = typePool[idx % typePool.length];

      // Weighted status distribution: ~80% true positive (validated/closed), ~12% rejected (FP), ~8% pending
      let status = 'validated';
      const randMod = (idx * 37 + day * 13 + j * 7) % 100;
      if (randMod < 80) {
        status = 'validated';
      } else if (randMod < 92) {
        status = 'rejected'; // False positive
      } else if (randMod < 96) {
        status = 'validation_in_progress';
      } else {
        status = 'to_be_validated';
      }

      const hoursOffset = (j * 2 + (day * 3) % 4) % 24;
      const minutesOffset = (j * 17) % 60;
      const triggeredAt = new Date(nowMs - day * 24 * 60 * 60 * 1000 - hoursOffset * 60 * 60 * 1000 - minutesOffset * 60 * 1000);
      const endDate = new Date(triggeredAt.getTime() + 12 * 60 * 60 * 1000);
      const reviewedAt = status !== 'to_be_validated'
        ? new Date(triggeredAt.getTime() + 2 * 60 * 60 * 1000)
        : null;
      const operatorEmails = ['smetzner@slb.com', 'jdoe@slb.com', 'mrodrigues@slb.com', 'icaro.zelioli@sbmoffshore.com'];
      const reviewedBy = status !== 'to_be_validated'
        ? operatorEmails[j % operatorEmails.length]
        : null;

      const tierPool = ['Good - Tier 4', 'Good - Tier 3', 'Degraded - Tier 2', 'Critical - Tier 1'];
      const tier = status === 'validated'
        ? tierPool[(idx * 3 + j) % tierPool.length]
        : null;

      alertsValues.push({
        instanceId: inst.id,
        type,
        endDate,
        triggeredAt,
        reviewedAt,
        reviewedBy,
        status,
        tier,
      });
    }
  }

  await db.insert(alerts).values(alertsValues);

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
      after  = { enabled: false, reason: 'Sensor Calibration' };
    } else if (desc === 'Enabled rule after maintenance window') {
      before = { enabled: false };
      after  = { enabled: true };
    } else if (isSpike) {
      desc = 'Updated rule parameters';
      if (Math.floor(i / 6) % 2 === 0) {
        before = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
        after = {
          rule_trigger_params: [{ spike_detection: { height: 1.5, threshold: null, distance: 60, prominence: 1.2 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
      } else {
        before = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 1.0 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
        after = {
          rule_trigger_params: [{ spike_detection: { height: null, threshold: null, distance: 60, prominence: 0.8 }, filter_spikes_near_filter_false: { timedelta_minutes: 480 }, status_check: { value: 1 } }],
          event_trigger_params: [{ spike_detection_trigger: { value: 0 } }]
        };
      }
    } else if (isSurge) {
      desc = 'Updated rule parameters';
      if (Math.floor(i / 6) % 2 === 0) {
        before = {
          rule_trigger_params: [{ threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
        after = {
          rule_trigger_params: [{ threshold_comparison: { value: 12.5, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
      } else {
        before = {
          rule_trigger_params: [{ threshold_comparison: { value: 10, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
        };
        after = {
          rule_trigger_params: [{ threshold_comparison: { value: 15.0, operator: 'gt', tags_to_apply: ['Surge Margin Actual'] } }],
          event_trigger_params: [{ time_totalization: { value: 50, rule: '0&1', operator: 'gt', time_period: 24, time_period_unit: 'h' } }]
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

    const isParamChange = desc !== 'Disabled rule instance (Bulk)' && desc !== 'Enabled rule after maintenance window';
    const finalBefore = isParamChange ? { processingSteps: before } : before;
    const finalAfter  = isParamChange ? { processingSteps: after } : after;

    let finalDesc = desc;
    if (desc === 'Disabled rule instance (Bulk)') {
      finalDesc = 'Disabled rule for Sensor Calibration';
    } else if (desc === 'Enabled rule after maintenance window') {
      finalDesc = 'Enabled Rule';
    } else {
      finalDesc = 'Update rule parameters';
    }

    auditLogsToInsert.push({
      instanceId:  instances[instIdx].id,
      userEmail:   email,
      description: finalDesc,
      beforeState: finalBefore,
      afterState:  finalAfter,
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
