# Project TODO

- [x] Veritabanı şeması: users, erpCategories, documents, matchingResults, matchingRules, emailSources, apiKeys, processingLogs
- [x] Backend: DB helpers (CRUD tüm tablolar için)
- [x] Backend: LLM tabanlı standardizasyon motoru (extractTerms, semanticMatch, parseEmail)
- [x] Backend: tRPC router'ları (dashboard, documents, matching, categories, rules, emailSources, apiKeys, logs)
- [x] Frontend: Dashboard sayfası (istatistikler, hızlı işlemler, son aktiviteler)
- [x] Frontend: Belgeler sayfası (yükleme, işleme, e-posta parse)
- [x] Frontend: Eşleştirme sonuçları sayfası (filtreleme, onaylama, export)
- [x] Frontend: ERP Kategorileri yönetim sayfası (CRUD, 6 tip)
- [x] Frontend: Eşleştirme kuralları sayfası (4 strateji: exact, contains, regex, semantic)
- [x] Frontend: E-posta kaynakları yönetim sayfası
- [x] Frontend: API & Export sayfası (JSON/CSV export, API key yönetimi)
- [x] Frontend: Veri kalitesi raporları dashboard'u
- [x] Frontend: Ayarlar sayfası (profil, tema, güvenlik)
- [x] Kullanıcı bazlı erişim kontrolü ve userId tabanlı veri izolasyonu
- [x] Vitest testleri (30 test, 3 dosya, hepsi geçti)
- [x] Öğrenme mekanizması: Onaylanan eşleştirmelerden otomatik kural oluşturma
- [x] Veri kalitesi KPI'ları: Tamamlanma oranı, parse başarısızlık oranı, eşleşmeme oranı
- [x] E-posta kaynakları yönetimi (kaynak kayıt ve manuel parse mevcut)

## Yeniden Tasarım - v2

- [x] Tema: Kurumsal kırmızı-beyaz renk paleti (AI/teal görünümünü kaldır)
- [x] Tema: Profesyonel tipografi ve kurumsal görünüm
- [x] Landing Page: Profesyonel hero section (kaliteli görseller ile)
- [x] Landing Page: Gerçekçi özellik tanıtımı (sadece mevcut özellikler)
- [x] Landing Page: Zengin görsel içerik (sahte yorum/sponsor yok)
- [x] Landing Page: CTA ve navigasyon
- [x] Kullanıcı kayıt/giriş sistemi (Manus OAuth entegrasyonu)
- [x] Admin paneli: Üye takip ve yönetim (kullanıcı listesi, rol değiştirme, istatistikler)
- [x] Logo/ikon güncelleme (Layers ikonu, kırmızı kare)
- [x] DashboardLayout sidebar güncelleme (yeni renk paleti, admin menü)
- [x] Admin router: stats, users, updateRole (rol bazlı erişim kontrolü)
- [x] Admin testleri: unauthenticated ve non-admin erişim reddi testleri
