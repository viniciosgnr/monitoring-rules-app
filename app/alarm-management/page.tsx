import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { db } from '@/db';
import { fpsos } from '@/db/schema';
import Topbar from '@/components/layout/Topbar';
import NavTabs from '@/components/layout/NavTabs';
import AlarmManagementClient, {
  MostFrequentAlarmRow,
  MostFrequentActionRow,
  ChatteringAlarmRow,
  FleetingAlarmRow,
  SymptomaticAnalysisRow,
} from '@/components/alarm-management/AlarmManagementClient';

export const dynamic = 'force-dynamic';

type RawSheetRow = (string | number)[];

function extractFpsoFromAsset(asset: string): string {
  const trimmed = String(asset || '').trim();
  if (!trimmed) return 'UNY';
  const prefix = trimmed.split('_')[0];
  return prefix || 'UNY';
}

export default async function AlarmManagementPage() {
  const fpsoRows = await db.select({ code: fpsos.code }).from(fpsos);
  const fpsoCodes = Array.from(new Set(fpsoRows.map(f => f.code))).filter(Boolean).sort();

  const filePath = path.join(process.cwd(), 'docs', 'Bad Actors Report_2026 (2 - 6 Nov).xlsx');
  const fileBuffer = fs.readFileSync(filePath);
  const wb = XLSX.read(fileBuffer, { type: 'buffer' });

  // 1. Most Frequent Alarms (Header at row 3)
  const mfaSheet = wb.Sheets['Most Frequent Alarms'];
  const mfaRaw = mfaSheet ? (XLSX.utils.sheet_to_json(mfaSheet, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const mostFrequentAlarms: MostFrequentAlarmRow[] = mfaRaw
    .slice(4)
    .filter(r => r[0] !== '')
    .map((r, idx) => ({
      id: idx + 1,
      fpso: extractFpsoFromAsset(String(r[6] || 'UNY_TS')),
      tag: String(r[0] || ''),
      identifier: String(r[1] || ''),
      count: Number(r[2]) || 0,
      percentage: Number(r[3]) || 0,
      priority: String(r[4] || ''),
      description: String(r[5] || ''),
      asset: String(r[6] || ''),
    }));

  // 2. Most Frequent Actions (Header at row 0)
  const mfaActSheet = wb.Sheets['Most Frequent Actions'];
  const mfaActRaw = mfaActSheet ? (XLSX.utils.sheet_to_json(mfaActSheet, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const mostFrequentActions: MostFrequentActionRow[] = mfaActRaw
    .slice(1)
    .filter(r => r[0] !== '')
    .map((r, idx) => ({
      id: idx + 1,
      fpso: 'UNY',
      tag: String(r[0] || ''),
      parameter: String(r[1] || ''),
      count: Number(r[2]) || 0,
    }));

  // 3. Chattering Alarms (Header at row 0)
  const chatSheet = wb.Sheets['Chattering Alarms'];
  const chatRaw = chatSheet ? (XLSX.utils.sheet_to_json(chatSheet, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const chatteringAlarms: ChatteringAlarmRow[] = chatRaw
    .slice(1)
    .filter(r => r[0] !== '')
    .map((r, idx) => ({
      id: idx + 1,
      fpso: 'UNY',
      tag: String(r[0] || ''),
      identifier: String(r[1] || ''),
      priority: String(r[2] || ''),
      occurrence: Number(r[3]) || 0,
    }));

  // 4. Fleeting Alarms (Header at row 0)
  const fleetSheet = wb.Sheets['Fleeting Alarms'];
  const fleetRaw = fleetSheet ? (XLSX.utils.sheet_to_json(fleetSheet, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const fleetingAlarms: FleetingAlarmRow[] = fleetRaw
    .slice(1)
    .filter(r => r[0] !== '')
    .map((r, idx) => ({
      id: idx + 1,
      fpso: 'UNY',
      tag: String(r[0] || ''),
      identifier: String(r[1] || ''),
      priority: String(r[2] || ''),
      occurrence: Number(r[3]) || 0,
    }));

  // 5. Symptomatic Analysis (Header at row 0)
  const symSheet = wb.Sheets['Symptomatic Analysis'];
  const symRaw = symSheet ? (XLSX.utils.sheet_to_json(symSheet, { header: 1, defval: '' }) as RawSheetRow[]) : [];
  const symptomaticAnalysis: SymptomaticAnalysisRow[] = symRaw
    .slice(1)
    .filter(r => r[0] !== '')
    .map((r, idx) => ({
      id: idx + 1,
      fpso: extractFpsoFromAsset(String(r[6] || 'UNY_TS')),
      parentTag: String(r[0] || ''),
      parentIdentifier: String(r[1] || ''),
      childTag: String(r[2] || ''),
      childIdentifier: String(r[3] || ''),
      childBlockName: String(r[4] || ''),
      childDescription: String(r[5] || ''),
      childAsset: String(r[6] || ''),
      childPath: String(r[7] || ''),
      occurrence: Number(r[8]) || 0,
      predictability: Number(r[9]) || 0,
      significance: Number(r[10]) || 0,
    }));

  return (
    <div className="min-h-screen bg-bg-base text-text-primary">
      <Topbar breadcrumb="Alarm Management" />
      <NavTabs title="Monitoring Rules" />
      <div className="p-6 max-w-[1600px] mx-auto">
        <AlarmManagementClient
          fpsos={fpsoCodes.length > 0 ? fpsoCodes : ['ADG', 'ATD', 'CDI', 'SEP', 'UNY']}
          reportWindow={{ from: '2026-11-02', to: '2026-11-06' }}
          mostFrequentAlarms={mostFrequentAlarms}
          mostFrequentActions={mostFrequentActions}
          chatteringAlarms={chatteringAlarms}
          fleetingAlarms={fleetingAlarms}
          symptomaticAnalysis={symptomaticAnalysis}
        />
      </div>
    </div>
  );
}

