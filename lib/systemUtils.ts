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
