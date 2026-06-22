export const categories = [
  'Nəqliyyat',
  'Telefonlar',
  'Ev və bağ üçün',
  'Elektronika',
  'Daşınmaz əmlak',
  'Ehtiyat hissələri və aksesuarlar',
  'Xidmətlər və biznes',
  'Şəxsi əşyalar',
  'Məişət texnikası',
  'Uşaq aləmi',
  'Heyvanlar',
  'İş elanları',
  'Məktəblilər üçün',
  'Mağazalar',
  'Hobbi və asudə',
]

// Hər kateqoriya üçün URL slug-ı və ikon adı (lucide-react)
export const categoryMeta = [
  { name: 'Nəqliyyat', slug: 'neqliyyat', icon: 'Car' },
  { name: 'Telefonlar', slug: 'telefonlar', icon: 'Smartphone' },
  { name: 'Ev və bağ üçün', slug: 'ev-ve-bag', icon: 'Sofa' },
  { name: 'Elektronika', slug: 'elektronika', icon: 'Laptop' },
  { name: 'Daşınmaz əmlak', slug: 'dasinmaz-emlak', icon: 'Building2' },
  { name: 'Ehtiyat hissələri və aksesuarlar', slug: 'ehtiyat-hisseleri', icon: 'Wrench' },
  { name: 'Xidmətlər və biznes', slug: 'xidmetler-ve-biznes', icon: 'Briefcase' },
  { name: 'Şəxsi əşyalar', slug: 'sexsi-esyalar', icon: 'Shirt' },
  { name: 'Məişət texnikası', slug: 'meiset-texnikasi', icon: 'WashingMachine' },
  { name: 'Uşaq aləmi', slug: 'usaq-alemi', icon: 'Baby' },
  { name: 'Heyvanlar', slug: 'heyvanlar', icon: 'PawPrint' },
  { name: 'İş elanları', slug: 'is-elanlari', icon: 'BriefcaseBusiness' },
  { name: 'Məktəblilər üçün', slug: 'mektebliler-ucun', icon: 'GraduationCap' },
  { name: 'Mağazalar', slug: 'magazalar', icon: 'Store' },
  { name: 'Hobbi və asudə', slug: 'hobbi-ve-asude', icon: 'Gamepad2' },
]

export const slugToCategory = (slug) =>
  categoryMeta.find((entry) => entry.slug === slug)?.name || ''

export const categoryToSlug = (name) =>
  categoryMeta.find((entry) => entry.name === name)?.slug || ''
