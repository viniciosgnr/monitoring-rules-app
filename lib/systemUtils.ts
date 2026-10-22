export function getSystemFromTimeseries(timeseries: string): string {
  if (!timeseries) return 'Utility System';
  if (timeseries.includes('771')) return 'Gas System';
  if (timeseries.includes('772')) return 'Water Injection System';
  if (timeseries.includes('773')) return 'Crude Oil System';
  if (timeseries.includes('774')) return 'Power Generation System';
  return 'Utility System';
}

export function getSubsystem(timeseries: string, equipmentCode: string): string {
  const code = (equipmentCode || '').toUpperCase();
  const ts = timeseries || '';
  const has771 = ts.includes('771');
  const has772 = ts.includes('772');
  const has773 = ts.includes('773');
  const has774 = ts.includes('774');

  if (code.includes('COCE')) {
    return 'Gas Compression';
  }
  if (code.includes('TRB')) {
    if (has774) return 'Power Generation';
    return 'Gas Turbine Fuel System';
  }
  if (code.includes('HX')) {
    return 'Gas Dehydration & Treatment';
  }
  if (code.includes('PUM')) {
    if (has772) return 'Water Injection Pumps';
    if (has773) return 'Crude Oil Export Pumps';
    if (has771) return 'TEG Circulation Pumps';
    return 'Utility Water Pumps';
  }
  return 'General Process';
}

export function getAlertTypeCode(ruleName?: string | null, source?: string | null): string {
  const src = (source || '').trim();
  if (src === 'Seeq') return 'SEE';
  if (src === 'Pre Warnings Ops' || src === 'PreWarningOps') return 'THR';

  const name = (ruleName || '').toUpperCase();
  if (name.includes('SPK') || name.includes('SPIKE')) return 'SPK';
  if (name.includes('DRFT') || name.includes('DRIFT')) return 'DRF';
  if (name.includes('FOUL') || name.includes('DP') || name.includes('HTEX') || name.includes('NDP')) return 'NDP';
  if (name.includes('SURG') || name.includes('THR') || name.includes('VIB_THR') || name.includes('MGN')) return 'THR';
  if (name.includes('TRND') || name.includes('TREND') || name.includes('DEV') || name.includes('TEMP_DEV')) return 'THR';
  return 'THR';
}

export function formatAlertRef(id: number | string, ruleName?: string | null, source?: string | null): string {
  const numId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10) || 0;
  const seq = String(numId).padStart(3, '0');
  const typeCode = getAlertTypeCode(ruleName, source);
  return `ALT-${typeCode}-${seq}`;
}

