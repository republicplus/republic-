import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Lang = 'en' | 'es'

const STORAGE_KEY = 'arcabid-lang'

type Dict = Record<string, string>

const en: Dict = {
  // Section headers
  'section.main': 'Main',
  'section.execution': 'Execution',
  'section.company': 'Company',
  'section.settings': 'Settings',

  // Nav items
  'nav.dashboard': 'Dashboard',
  'nav.bid_pages': 'Bid Pages',
  'nav.contract_flow': 'Contract Analyzer Flow',
  'nav.contracts': 'Current Contracts',
  'nav.suppliers': 'Suppliers',
  'nav.wallet': 'Wallet',
  'nav.capital': 'Capital',
  'nav.investors': 'Investors',
  'nav.insurers': 'Capital Backers',
  'nav.company': 'Company Profile',
  'nav.tools': 'Tools & Resources',
  'nav.documents': 'Documents',
  'nav.risk': 'Risk Analysis',
  'nav.settings': 'Settings',
  'nav.logout': 'Logout',

  // Page headings
  'page.dashboard.title': 'Dashboard',
  'page.dashboard.subtitle': 'Your command center with Orbe AI',
  'page.bid_pages.title': 'Bid Pages',
  'page.contract_flow.title': 'Contract Analyzer Flow',
  'page.contract_flow.subtitle': 'Upload a contract, text or screenshot and AI analyzes product, suppliers, costs, compliance and generates a quote',
  'page.contracts.title': 'Current Contracts',
  'page.contracts.subtitle': 'Manage your active government contracts',
  'page.suppliers.title': 'Suppliers',
  'page.wallet.title': 'Wallet',
  'page.wallet.subtitle': 'Financial overview of your operation',
  'page.capital.title': 'Capital',
  'page.investors.title': 'Investors',
  'page.insurers.title': 'Capital Backers',
  'page.insurers.subtitle': 'Backup capital providers for awarded contracts',
  'page.company.title': 'Company Profile',
  'page.company.subtitle': 'Your company profile for government contracting',
  'page.tools.title': 'Tools & Resources',
  'page.documents.title': 'Documents',
  'page.risk.title': 'Risk Analysis',

  // Common
  'common.search': 'Search…',
  'common.loading': 'Loading…',
  'common.cancel': 'Cancel',
  'common.save': 'Save',
  'common.delete': 'Delete',
  'common.edit': 'Edit',
  'common.new': 'New',
  'common.all': 'All',
  'common.reject': 'Reject Opportunity',
  'common.move_to_contracts': 'Move to Current Contracts',
  'common.analyze': 'Analyze Contract',
  'common.create_ai': 'Create with AI',

  // Language switcher
  'lang.en': 'English',
  'lang.es': 'Español',
}

const es: Dict = {
  'section.main': 'Principal',
  'section.execution': 'Ejecución',
  'section.company': 'Empresa',
  'section.settings': 'Configuración',

  'nav.dashboard': 'Dashboard',
  'nav.bid_pages': 'Bid Pages',
  'nav.contract_flow': 'Analizador de Contratos',
  'nav.contracts': 'Contratos Actuales',
  'nav.suppliers': 'Proveedores',
  'nav.wallet': 'Wallet',
  'nav.capital': 'Capital',
  'nav.investors': 'Inversionistas',
  'nav.insurers': 'Respaldos de Capital',
  'nav.company': 'Perfil de Empresa',
  'nav.tools': 'Herramientas y Recursos',
  'nav.documents': 'Documentos',
  'nav.risk': 'Análisis de Riesgo',
  'nav.settings': 'Configuración',
  'nav.logout': 'Cerrar sesión',

  'page.dashboard.title': 'Dashboard',
  'page.dashboard.subtitle': 'Tu centro de comando con Orbe AI',
  'page.bid_pages.title': 'Bid Pages',
  'page.contract_flow.title': 'Analizador de Contratos',
  'page.contract_flow.subtitle': 'Sube un contrato, texto o screenshot y la IA analiza producto, proveedores, costos, cumplimiento y genera una cotización',
  'page.contracts.title': 'Contratos Actuales',
  'page.contracts.subtitle': 'Gestiona tus contratos gubernamentales activos',
  'page.suppliers.title': 'Proveedores',
  'page.wallet.title': 'Wallet',
  'page.wallet.subtitle': 'Resumen financiero de tu operación',
  'page.capital.title': 'Capital',
  'page.investors.title': 'Inversionistas',
  'page.insurers.title': 'Respaldos de Capital',
  'page.insurers.subtitle': 'Proveedores de capital de respaldo para contratos adjudicados',
  'page.company.title': 'Perfil de Empresa',
  'page.company.subtitle': 'Perfil de tu compañía para contratos del gobierno',
  'page.tools.title': 'Herramientas y Recursos',
  'page.documents.title': 'Documentos',
  'page.risk.title': 'Análisis de Riesgo',

  'common.search': 'Buscar…',
  'common.loading': 'Cargando…',
  'common.cancel': 'Cancelar',
  'common.save': 'Guardar',
  'common.delete': 'Eliminar',
  'common.edit': 'Editar',
  'common.new': 'Nuevo',
  'common.all': 'Todos',
  'common.reject': 'Rechazar Oportunidad',
  'common.move_to_contracts': 'Mover a Contratos Actuales',
  'common.analyze': 'Analizar Contrato',
  'common.create_ai': 'Crear con AI',

  'lang.en': 'English',
  'lang.es': 'Español',
}

const dicts: Record<Lang, Dict> = { en, es }

type I18nCtx = {
  lang: Lang
  setLang: (l: Lang) => void
  t: (key: string) => string
}

const Ctx = createContext<I18nCtx>({ lang: 'en', setLang: () => {}, t: (k) => k })

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    return (saved as Lang) || 'en'
  })

  useEffect(() => {
    if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, lang)
  }, [lang])

  function setLang(l: Lang) { setLangState(l) }
  function t(key: string) { return dicts[lang][key] ?? key }

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>
}

export function useI18n() { return useContext(Ctx) }
