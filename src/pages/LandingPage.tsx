import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import {
  Sparkles, ArrowRight, FileText, Search, Calculator, Store,
  Crown, Briefcase, TrendingUp, ShieldCheck, Zap, Check, Menu, X,
  Building2, Truck, Wrench, Cpu, Package, HardHat,
} from 'lucide-react'
import { cn } from '../lib/utils'

export function LandingPage() {
  const { session } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const dashboardPath = session ? '/app' : '/auth'

  return (
    <div className="min-h-screen bg-[#0a0418] text-white overflow-x-hidden">
      {/* ============ NAV ============ */}
      <nav className={cn('fixed top-0 left-0 right-0 z-50 transition-all duration-300', scrolled ? 'bg-[#0a0418]/90 backdrop-blur-md border-b border-gold-400/10' : 'bg-transparent')}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Sparkles size={18} className="text-[#0a0418]" />
            </div>
            <span className="font-display text-lg font-bold gold-gradient-text">ArcaBid</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#software" className="text-sm text-white/70 hover:text-gold-300 transition">Software</a>
            <a href="#done-for-you" className="text-sm text-white/70 hover:text-gold-300 transition">Done For You</a>
            <a href="#planes" className="text-sm text-white/70 hover:text-gold-300 transition">Planes</a>
            <a href="#contratos" className="text-sm text-white/70 hover:text-gold-300 transition">Contratos</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" className="text-sm text-white/80 hover:text-gold-300 transition font-medium">Iniciar sesión</Link>
            <Link to="/auth" className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-[#0a0418] text-sm font-bold hover:shadow-lg hover:shadow-gold-500/30 transition">
              Empezar gratis
            </Link>
          </div>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden text-white">
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
        {mobileOpen && (
          <div className="md:hidden bg-[#0a0418]/95 backdrop-blur-md border-t border-gold-400/10 px-6 py-4 space-y-3">
            <a href="#software" onClick={() => setMobileOpen(false)} className="block text-sm text-white/70 hover:text-gold-300">Software</a>
            <a href="#done-for-you" onClick={() => setMobileOpen(false)} className="block text-sm text-white/70 hover:text-gold-300">Done For You</a>
            <a href="#planes" onClick={() => setMobileOpen(false)} className="block text-sm text-white/70 hover:text-gold-300">Planes</a>
            <a href="#contratos" onClick={() => setMobileOpen(false)} className="block text-sm text-white/70 hover:text-gold-300">Contratos</a>
            <Link to="/auth" className="block px-4 py-2.5 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-[#0a0418] text-sm font-bold text-center">Empezar gratis</Link>
          </div>
        )}
      </nav>

      {/* ============ BANNER IMAGE — primera posición ============ */}
      <section className="pt-[72px]">
        <div className="relative w-full overflow-hidden">
          <img
            src="/ChatGPT_Image_Jul_27,_2026,_09_02_06_PM.png"
            alt="Arca Bid — Government Contracts, trabaja con el mejor cliente del mundo"
            className="w-full object-cover object-top"
            style={{ maxHeight: '600px' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0418]" />
        </div>
      </section>

      {/* ============ HERO ============ */}
      <section className="relative min-h-screen flex items-center justify-center hero-grid-bg pt-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gold-500/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0a0418]" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold-400/10 border border-gold-400/20 mb-8 animate-fade-up">
            <Crown size={14} className="text-gold-400" />
            <span className="text-xs font-medium text-gold-200 tracking-wide">GOVERNMENT CONTRACTING OS</span>
          </div>

          <h1 className="font-display text-5xl md:text-7xl font-bold mb-2 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            Government Contracts
          </h1>
          <h2 className="font-display text-2xl md:text-3xl font-bold text-shimmer mb-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
            Trabaja con el mejor cliente del mundo
          </h2>

          <p className="text-lg text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up" style={{ animationDelay: '0.3s' }}>
            Arca Bid te ayuda a encontrar, analizar, gestionar y presentar contratos del gobierno de Estados Unidos con inteligencia artificial, proveedores y automatización.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <a href="#planes" className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-400 to-gold-600 text-[#0a0418] font-bold text-base hover:shadow-xl hover:shadow-gold-500/30 transition flex items-center gap-2">
              Quiero usar el software
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </a>
            <a href="#done-for-you" className="group px-8 py-4 rounded-2xl border border-white/20 bg-white/5 text-white font-bold text-base hover:border-gold-400/40 hover:bg-white/10 transition flex items-center gap-2">
              Quiero que lo hagan por mí
              <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
            </a>
          </div>

          <div className="mt-16 flex items-center justify-center gap-8 text-xs text-white/40 animate-fade-up" style={{ animationDelay: '0.5s' }}>
            <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-gold-400/60" /> SAM.gov Ready</div>
            <div className="flex items-center gap-1.5"><Zap size={14} className="text-gold-400/60" /> IA Integrada</div>
            <div className="flex items-center gap-1.5"><TrendingUp size={14} className="text-gold-400/60" /> +$2B en oportunidades</div>
          </div>
        </div>
      </section>

      {/* ============ DOS CAMINOS ============ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Dos caminos</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Elige cómo quieres entrar</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Software */}
            <div className="group relative rounded-3xl border border-gold-400/15 bg-gradient-to-br from-gold-950/20 to-[#0a0418] p-8 card-hover">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gold-500/10 blur-3xl rounded-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gold-400/15 flex items-center justify-center mb-5">
                  <Briefcase size={26} className="text-gold-400" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Opción 1: Hazlo tú con nuestro software</h3>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Para personas y empresas que quieren aprender, analizar y presentar contratos usando nuestra plataforma con inteligencia artificial.
                </p>
                <ul className="space-y-2.5 mb-6">
                  {['Busca oportunidades en tiempo real', 'Analiza contratos con IA', 'Compara proveedores y precios', 'Calcula ganancias automáticamente'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check size={16} className="text-gold-400 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="#software" className="inline-flex items-center gap-2 text-gold-300 font-semibold text-sm group-hover:gap-3 transition-all">
                  Ver el software <ArrowRight size={16} />
                </a>
              </div>
            </div>

            {/* Done For You */}
            <div className="group relative rounded-3xl border border-violet-400/15 bg-gradient-to-br from-violet-950/20 to-[#0a0418] p-8 card-hover">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-violet-400/15 flex items-center justify-center mb-5">
                  <Crown size={26} className="text-violet-300" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Opción 2: Nosotros lo hacemos por ti</h3>
                <p className="text-white/60 mb-6 leading-relaxed">
                  Para inversionistas o empresas que quieren entrar al mercado de contratos del gobierno sin hacer todo el proceso operativo.
                </p>
                <ul className="space-y-2.5 mb-6">
                  {['Configuramos tu empresa', 'Buscamos y analizamos oportunidades', 'Gestionamos proveedores y cotizaciones', 'Presentamos y administramos el contrato'].map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <Check size={16} className="text-violet-300 shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
                <a href="#done-for-you" className="inline-flex items-center gap-2 text-violet-300 font-semibold text-sm group-hover:gap-3 transition-all">
                  Ver servicios Done For You <ArrowRight size={16} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TIPOS DE CONTRATOS ============ */}
      <section id="contratos" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Contratos del gobierno</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Tipos de contratos que el gobierno ofrece</h2>
            <p className="text-white/50 mt-3 max-w-xl mx-auto">El gobierno de EE.UU. compra casi todo. Estas son las categorías más comunes.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Package, label: 'Productos', desc: 'Suministros y materiales' },
              { icon: Briefcase, label: 'Servicios', desc: 'Consultoría y profesional' },
              { icon: HardHat, label: 'Construcción', desc: 'Obras e infraestructura' },
              { icon: Cpu, label: 'IT', desc: 'Tecnología y software' },
              { icon: Truck, label: 'Logística', desc: 'Transporte y distribución' },
              { icon: Wrench, label: 'Mantenimiento', desc: 'Reparación y operaciones' },
            ].map((c) => (
              <div key={c.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-5 text-center card-hover hover:border-gold-400/20">
                <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center mx-auto mb-3">
                  <c.icon size={22} className="text-gold-400" />
                </div>
                <h3 className="font-semibold text-sm text-white mb-1">{c.label}</h3>
                <p className="text-xs text-white/40">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CRM / SOFTWARE ============ */}
      <section id="software" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">CRM para contratos</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">CRM para gestionar contratos del gobierno</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Para empresas, contratistas y usuarios que quieren aprender, buscar oportunidades, analizar contratos y manejar todo el proceso desde una plataforma inteligente.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: FileText, title: 'Automatic Contract Flow', desc: 'Sube un contrato, PDF, texto o screenshot y la IA extrae productos, servicios, requisitos, fechas y costos automáticamente.' },
              { icon: Briefcase, title: 'CRM de Contratos', desc: 'Gestiona contratos, proveedores, cotizaciones, estados, ganancias y documentos desde un solo lugar.' },
              { icon: Store, title: 'Comparador de Proveedores', desc: 'Encuentra dónde comprar productos, compara precios, inventario, tiempos de entrega y rentabilidad.' },
              { icon: Calculator, title: 'Calculadora de Ganancias', desc: 'Calcula costos, shipping, margen, precio de bid y ganancia estimada antes de presentar tu propuesta.' },
            ].map((f, i) => (
              <div key={f.title} className={cn('rounded-2xl border border-white/8 bg-white/[0.03] p-7 card-hover hover:border-gold-400/20', i % 2 === 0 ? 'animate-slide-left' : 'animate-slide-right')}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gold-400/10 flex items-center justify-center shrink-0">
                    <f.icon size={22} className="text-gold-400" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
                    <p className="text-sm text-white/55 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <a href="#planes" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-gold-400/30 bg-gold-400/10 text-gold-200 font-semibold text-sm hover:bg-gold-400/20 transition">
              Ver planes del software <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </section>

      {/* ============ PLANES SOFTWARE ============ */}
      <section id="planes" className="py-24 px-6 border-t border-white/5 bg-gradient-to-b from-transparent to-gold-950/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-gold-400 tracking-widest uppercase">Planes del software</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2">Empieza con el plan que te fits</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { name: 'Plan Pro', price: '$129', period: '/mes', features: ['Buscador de oportunidades', 'CRM de contratos', 'Comparador de proveedores', 'Calculadora de ganancias', 'Soporte por email'], highlight: false },
              { name: 'Plan Business', price: '$199', period: '/mes', features: ['Todo lo del Plan Pro', 'Automatic Contract Flow con IA', 'Gestión de documentos', 'Análisis de riesgo', 'Pools de inversión', 'Soporte prioritario'], highlight: true },
            ].map((plan) => (
              <div key={plan.name} className={cn('relative rounded-3xl p-8 card-hover', plan.highlight ? 'border-2 border-gold-400/40 bg-gradient-to-b from-gold-950/30 to-[#0a0418]' : 'border border-white/10 bg-white/[0.03]')}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gold-400 text-[#0a0418] text-xs font-bold">MÁS POPULAR</div>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display text-4xl font-bold gold-gradient-text">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-5 h-5 rounded-full bg-gold-400/15 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-gold-400" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className={cn('block w-full py-3.5 rounded-xl text-center font-bold text-sm transition', plan.highlight ? 'bg-gradient-to-r from-gold-400 to-gold-600 text-[#0a0418] hover:shadow-lg hover:shadow-gold-500/30' : 'border border-white/15 text-white hover:border-gold-400/30 hover:bg-white/5')}>
                  Empezar ahora
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DONE FOR YOU ============ */}
      <section id="done-for-you" className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-semibold text-violet-400 tracking-widest uppercase">Done For You</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold mt-2 mb-3">Servicios Done For You para inversionistas y empresas</h2>
            <p className="text-white/50 max-w-2xl mx-auto">
              Para personas o empresas que quieren entrar al mundo de los contratos del gobierno, pero prefieren que nuestro equipo configure, busque, analice y someta las oportunidades por ellos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                name: 'Setup + Comisión',
                price: '$5,000', suffix: '+ 5% comisión',
                desc: 'Nosotros configuramos tu empresa, encontramos oportunidades, buscamos proveedores y administramos el proceso. Solo cobramos comisión cuando ganas contratos.',
                features: ['Setup completo de la empresa', 'Búsqueda y análisis de oportunidades', 'Gestión de proveedores', 'Administración del proceso', 'Comisión solo si ganas'],
                highlight: false,
              },
              {
                name: 'Flat Fee Done For You',
                price: '$10,000', suffix: 'sin comisión',
                desc: 'Servicio completo sin comisión por contrato ganado. El 100% del contrato es para el cliente.',
                features: ['Todo lo del Setup + Comisión', 'Sin comisión por contrato', '100% del contrato para ti', 'Prioridad en asignación', 'Estrategia personalizada'],
                highlight: true,
              },
            ].map((plan) => (
              <div key={plan.name} className={cn('relative rounded-3xl p-8 card-hover', plan.highlight ? 'border-2 border-violet-400/40 bg-gradient-to-b from-violet-950/30 to-[#0a0418]' : 'border border-white/10 bg-white/[0.03]')}>
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-violet-400 text-[#0a0418] text-xs font-bold">RECOMENDADO</div>
                )}
                <h3 className="font-display text-xl font-bold mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.suffix}</span>
                </div>
                <p className="text-sm text-white/55 mb-6 leading-relaxed">{plan.desc}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-5 h-5 rounded-full bg-violet-400/15 flex items-center justify-center shrink-0">
                        <Check size={12} className="text-violet-300" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/auth" className={cn('block w-full py-3.5 rounded-xl text-center font-bold text-sm transition', plan.highlight ? 'bg-gradient-to-r from-violet-500 to-fuchsia-600 text-white hover:shadow-lg hover:shadow-violet-500/30' : 'border border-white/15 text-white hover:border-violet-400/30 hover:bg-white/5')}>
                  Aplicar para Done For You
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="absolute inset-0 bg-gradient-to-b from-gold-500/5 to-transparent rounded-3xl blur-2xl" />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
              <Sparkles size={28} className="text-[#0a0418]" />
            </div>
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-4">Empieza hoy con ArcaBid</h2>
            <p className="text-white/50 mb-8 max-w-xl mx-auto">
              Crea tu cuenta gratis y empieza a buscar oportunidades de contratos del gobierno en minutos. Sin tarjeta de crédito.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/auth" className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-gold-400 to-gold-600 text-[#0a0418] font-bold text-base hover:shadow-xl hover:shadow-gold-500/30 transition flex items-center gap-2">
                Empezar gratis <ArrowRight size={18} className="group-hover:translate-x-1 transition" />
              </Link>
              <a href="#done-for-you" className="px-8 py-4 rounded-2xl border border-white/20 bg-white/5 text-white font-bold text-base hover:border-gold-400/40 hover:bg-white/10 transition">
                Aplicar para Done For You
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
                <Sparkles size={16} className="text-[#0a0418]" />
              </div>
              <span className="font-display text-base font-bold gold-gradient-text">ArcaBid</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-white/40">
              <a href="#software" className="hover:text-gold-300 transition">Software</a>
              <a href="#done-for-you" className="hover:text-gold-300 transition">Done For You</a>
              <a href="#planes" className="hover:text-gold-300 transition">Planes</a>
              <Link to="/auth" className="hover:text-gold-300 transition">Iniciar sesión</Link>
            </div>
            <div className="text-xs text-white/30">© 2026 ArcaBid. Government Contracting OS.</div>
          </div>
        </div>
      </footer>
    </div>
  )
}


export { LandingPage }