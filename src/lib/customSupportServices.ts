export interface CustomSupportService {
  name: string;
  type: string;
  contact_number: string;
  website_link?: string;
}

export interface ExtractedSupportServices {
  eap: CustomSupportService[];
  emergency: CustomSupportService[];
  all: CustomSupportService[];
}

// Each /groups/get_all "active_groups" entry has the joined group object
// nested under `forest.group` (or sometimes flattened). Walk the known shapes
// so callers don't need to.
function readServices(group: any): CustomSupportService[] {
  const list =
    group?.forest?.group?.custom_support_services ??
    group?.group?.custom_support_services ??
    group?.custom_support_services ??
    [];
  return Array.isArray(list) ? list : [];
}

export function extractCustomSupportServices(
  groups: any[] | undefined | null,
): ExtractedSupportServices {
  const seen = new Set<string>();
  const all: CustomSupportService[] = [];
  for (const g of groups ?? []) {
    for (const s of readServices(g)) {
      if (!s?.name) continue;
      const key = `${s.type ?? ''}::${s.name}::${s.contact_number ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);
      all.push(s);
    }
  }
  return {
    eap: all.filter((s) => s.type === 'EAP'),
    emergency: all.filter((s) => s.type === 'Emergency Services'),
    all,
  };
}
