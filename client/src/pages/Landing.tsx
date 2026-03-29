import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import {
  ArrowRight,
  FileText,
  Brain,
  Database,
  Shield,
  BarChart3,
  Layers,
  Workflow,
  CheckCircle2,
  ChevronRight,
  Globe,
  Truck,
  Package,
  Anchor,
} from "lucide-react";
import { useLocation } from "wouter";

const IMAGES = {
  hero: "https://d2xsxph8kpxj0f.cloudfront.net/310519663462217950/AqZQyvQyj58b47RonXN6qp/warehouse-hero_25e6b0b3.jpeg",
  port: "https://d2xsxph8kpxj0f.cloudfront.net/310519663462217950/AqZQyvQyj58b47RonXN6qp/port-logistics_7b34153e.jpg",
  container: "https://d2xsxph8kpxj0f.cloudfront.net/310519663462217950/AqZQyvQyj58b47RonXN6qp/container-port_89e926e9.webp",
  supply: "https://d2xsxph8kpxj0f.cloudfront.net/310519663462217950/AqZQyvQyj58b47RonXN6qp/supply-chain_74976080.jpg",
};

function Navbar() {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-red-600 flex items-center justify-center">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">DDS Platform</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollTo("features")} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Ozellikler</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Nasil Calisir</button>
            <button onClick={() => scrollTo("use-cases")} className="text-sm font-medium text-gray-600 hover:text-red-600 transition-colors">Kullanim Alanlari</button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Giris Yap
            </Button>
            <Button
              size="sm"
              onClick={() => { window.location.href = getLoginUrl(); }}
              className="bg-red-600 hover:bg-red-700 text-white shadow-md"
            >
              Ucretsiz Baslat
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}

function HeroSection() {
  return (
    <section className="relative pt-16 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-red-50/30" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-50 border border-red-100">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-semibold text-red-700 tracking-wide uppercase">Lojistik Veri Standardizasyonu</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold text-gray-900 leading-tight tracking-tight">
              Tedarik Zincirinizin
              <span className="block text-red-600 mt-1">Karanlik Verisini</span>
              Aydinlatin
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-xl">
              Farkli tedarikcilerden, gumruklerden ve nakliyecilerden gelen daginik metinleri yapay zeka ile analiz edin. Serbest metin halindeki siparis notlarini, irsaliyeleri ve gumruk aciklamalarini otomatik olarak standart ERP formatina donusturun.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={() => { window.location.href = getLoginUrl(); }}
                className="bg-red-600 hover:bg-red-700 text-white shadow-lg hover:shadow-xl transition-all text-base px-8 h-12"
              >
                Hemen Baslayin
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" })}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 text-base px-8 h-12"
              >
                Nasil Calisir
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                <span className="text-sm text-gray-600">LLM Destekli Analiz</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-red-600" />
                <span className="text-sm text-gray-600">Otomatik ERP Eslestirme</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-gray-200">
              <img
                src={IMAGES.hero}
                alt="Lojistik depo yonetimi"
                className="w-full h-[400px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 shadow-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-red-100 flex items-center justify-center">
                      <Brain className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Anlamsal Eslestirme</p>
                      <p className="text-[11px] text-gray-500">Yapay zeka ile otomatik siniflandirma</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-gray-50 rounded-lg p-2">
                      <p className="text-[10px] text-gray-400 mb-0.5">Giris</p>
                      <p className="text-xs font-medium text-gray-700">"Yurt ici nakliye bedeli"</p>
                    </div>
                    <div className="flex items-center">
                      <ArrowRight className="h-3 w-3 text-red-400" />
                    </div>
                    <div className="flex-1 bg-red-50 rounded-lg p-2">
                      <p className="text-[10px] text-red-400 mb-0.5">ERP Ciktisi</p>
                      <p className="text-xs font-medium text-red-700">Nakliye Giderleri</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -top-4 -right-4 h-24 w-24 bg-red-100 rounded-full blur-3xl opacity-60" />
            <div className="absolute -bottom-4 -left-4 h-32 w-32 bg-red-50 rounded-full blur-3xl opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: FileText,
    title: "Belge Isleme",
    desc: "E-posta, irsaliye, siparis notu ve gumruk aciklamalarini sisteme yukleyin. Serbest metin icerikleri otomatik olarak parse edilir ve yapilandirilir.",
  },
  {
    icon: Brain,
    title: "LLM Anlamsal Analiz",
    desc: "Yapay zeka modelleri ile lojistik terimler, kisaltmalar ve farkli dillerdeki aciklamalar anlamlandirilir. 'Milk run maliyeti' ile 'yurt ici dagitim gideri' ayni kategoriye eslestirilir.",
  },
  {
    icon: Database,
    title: "ERP Standardizasyonu",
    desc: "Analiz edilen veriler, tanimladiginiz ERP kategorilerine otomatik olarak eslestirilir. Gider kalemleri, operasyon tipleri ve malzeme kodlari standart formata donusturulur.",
  },
  {
    icon: Workflow,
    title: "Kural Motoru",
    desc: "Tam eslesme, icerik arama, regex ve anlamsal olmak uzere 4 farkli strateji ile eslestirme kurallari tanimlayin. Sistem onaylanan eslestirmelerden otomatik kural olusturur.",
  },
  {
    icon: BarChart3,
    title: "Veri Kalitesi Raporlari",
    desc: "Eslestirme guven skorlari, tamamlanma oranlari ve parse basari metrikleri ile veri kalitenizi surekli izleyin. Detayli KPI dashboard'u ile sureci kontrol edin.",
  },
  {
    icon: Shield,
    title: "API ve Entegrasyon",
    desc: "Standardize edilmis verileri JSON veya CSV formatinda disari aktarin. API key sistemi ile harici sistemlerle guvenli entegrasyon kurun.",
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-red-600 tracking-wide uppercase">Platform Ozellikleri</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 tracking-tight">
            Uctan Uca Veri Standardizasyonu
          </h2>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed">
            Tedarik zincirinizden gelen her turlu yapilandirilmamis veriyi, yapay zeka destekli motorumuz ile standart ERP formatina donusturun.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="group border border-gray-100 shadow-sm hover:shadow-lg hover:border-red-100 transition-all duration-300 bg-white">
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-xl bg-red-50 flex items-center justify-center mb-4 group-hover:bg-red-100 transition-colors">
                  <f.icon className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

const steps = [
  {
    num: "01",
    title: "Veri Yukleme",
    desc: "E-posta icerikleri, irsaliyeler, siparis notlari veya gumruk aciklamalarini sisteme yukleyin. Manuel metin girisi veya e-posta parse ozelligi ile veri girisi yapin.",
    img: IMAGES.supply,
  },
  {
    num: "02",
    title: "Yapay Zeka Analizi",
    desc: "LLM tabanli anlamsal analiz motoru, yuklenen metinleri inceler. Lojistik terimleri, kisaltmalari ve farkli isimlendirmeleri tanimlayarak dogru kategorilere eslestirir.",
    img: IMAGES.container,
  },
  {
    num: "03",
    title: "ERP Aktarimi",
    desc: "Standardize edilen veriler, tanimladiginiz ERP kategorilerine otomatik olarak yerlestirilir. Sonuclari onaylayin, JSON/CSV olarak disari aktarin veya API uzerinden entegre edin.",
    img: IMAGES.port,
  },
];

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 lg:py-28 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-red-600 tracking-wide uppercase">Surecimiz</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 tracking-tight">
            Uc Adimda Veri Standardizasyonu
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Karmasik lojistik verilerinizi saniyeler icinde standart formata donusturun.
          </p>
        </div>
        <div className="space-y-16">
          {steps.map((step, i) => (
            <div key={i} className={`grid lg:grid-cols-2 gap-10 items-center ${i % 2 === 1 ? "lg:grid-flow-dense" : ""}`}>
              <div className={`space-y-5 ${i % 2 === 1 ? "lg:col-start-2" : ""}`}>
                <span className="text-5xl font-black text-red-100">{step.num}</span>
                <h3 className="text-2xl font-bold text-gray-900">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed text-base">{step.desc}</p>
              </div>
              <div className={`${i % 2 === 1 ? "lg:col-start-1" : ""}`}>
                <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200">
                  <img src={step.img} alt={step.title} className="w-full h-[280px] object-cover" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const useCases = [
  {
    icon: Truck,
    title: "Nakliye ve Dagitim",
    items: ["Nakliye faturalarinin otomatik siniflandirilmasi", "Farkli nakliyeci terminolojilerinin standartlastirilmasi", "Dagitim maliyet kalemlerinin ERP'ye aktarimi"],
  },
  {
    icon: Anchor,
    title: "Gumruk ve Dis Ticaret",
    items: ["Gumruk beyanname aciklamalarinin parse edilmesi", "GTIP kodlari ile otomatik eslestirme", "Ithalat/ihracat gider kalemlerinin siniflandirilmasi"],
  },
  {
    icon: Package,
    title: "Depo ve Stok Yonetimi",
    items: ["Tedarikci irsaliyelerindeki malzeme isimlerinin standartlastirilmasi", "Farkli birim ve olcu sistemlerinin donusturulmesi", "Stok giris kayitlarinin otomatik olusturulmasi"],
  },
  {
    icon: Globe,
    title: "Coklu Tedarikci Yonetimi",
    items: ["Farkli tedarikcilerin ayni malzeme icin kullandigi isimlerin eslesmesi", "Tedarikci bazli fiyat tekliflerinin karsilastirilmasi", "Siparis notlarinin standart formata cevirilmesi"],
  },
];

function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 lg:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-sm font-semibold text-red-600 tracking-wide uppercase">Kullanim Alanlari</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-3 tracking-tight">
            Her Lojistik Surec Icin Cozum
          </h2>
          <p className="text-gray-600 mt-4 text-lg">
            Tedarik zincirinizin her noktasinda veri standardizasyonu saglayin.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {useCases.map((uc, i) => (
            <Card key={i} className="border border-gray-100 shadow-sm hover:shadow-md transition-all bg-white">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <uc.icon className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{uc.title}</h3>
                    <ul className="space-y-2">
                      {uc.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="py-16 bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-white">4</p>
            <p className="text-sm text-gray-400 mt-1">Eslestirme Stratejisi</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-white">6</p>
            <p className="text-sm text-gray-400 mt-1">ERP Kategori Tipi</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-red-400">LLM</p>
            <p className="text-sm text-gray-400 mt-1">Yapay Zeka Destekli</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-bold text-white">API</p>
            <p className="text-sm text-gray-400 mt-1">Entegrasyon Hazir</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-br from-red-600 to-red-700 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          Tedarik Zincirinizi Dijitallestirin
        </h2>
        <p className="text-red-100 mt-4 text-lg max-w-xl mx-auto leading-relaxed">
          Daginik lojistik verilerinizi standart formata donusturerek operasyonel verimliligizi artirin. Hemen ucretsiz hesap olusturun.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => { window.location.href = getLoginUrl(); }}
            className="bg-white text-red-600 hover:bg-red-50 shadow-lg text-base px-8 h-12 font-semibold"
          >
            Ucretsiz Hesap Olusturun
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-gray-900 py-12 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-600 flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-white">DDS Platform</span>
          </div>
          <p className="text-sm text-gray-500">
            Dark Data Standardizer — Lojistik veri standardizasyon platformu
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <StatsSection />
      <HowItWorksSection />
      <UseCasesSection />
      <CTASection />
      <Footer />
    </div>
  );
}
