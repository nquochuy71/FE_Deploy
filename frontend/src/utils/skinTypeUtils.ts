export const SKIN_TYPE_MAP: Record<string, string> = {
  'da-dau': 'Da dầu',
  'da-hon-hop': 'Da hỗn hợp',
  'da-mun': 'Da mụn',
  'da-kho': 'Da khô',
  'da-nhay-cam': 'Da nhạy cảm',
  'da-thuong': 'Da thường',
  'da-lao-hoa': 'Da lão hóa',
  'da-mat-do-dan-hoi': 'Da mất độ đàn hồi',
  'moi-loai-da': 'Mọi loại da',
};

export function toLabel(slug: string): string {
  if (!slug) return slug;
  return SKIN_TYPE_MAP[slug] ?? slug.replace(/-/g, ' ');
}

function slugifyLabel(label: string): string {
  if (!label) return label;
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
    return label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
}

export function toSlug(labelOrSlug: string): string {
  if (!labelOrSlug) return labelOrSlug;
  // if already a known slug
  if (SKIN_TYPE_MAP[labelOrSlug]) return labelOrSlug;
  // if it's a label, try to find key by value
  const found = Object.entries(SKIN_TYPE_MAP).find(([, v]) => v === labelOrSlug);
  if (found) return found[0];
  return slugifyLabel(labelOrSlug);
}
