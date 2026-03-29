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

## Düzeltmeler - v2.1

- [x] AI slope tarzı badge'i kaldır (kırmızı nokta + "LOJİSTİK VERİ STANDARDİZASYONU" etiketi)
- [x] Landing page'deki diğer AI slope görünümlü öğeleri temizle (gradient badge'ler, pulse animasyonlar vb.)
- [x] Giriş Yap / Ücretsiz Başlat butonlarının siyah ekrana yönlendirme sorununu düzelt

## MVP Hardening - v3

### 1. Core Flow Audit
- [x] Tüm akışları kod üzerinden doğrula ve eksikleri listele (audit-findings.md)

### 2. Gerçek Belge Yükleme
- [x] Documents sayfasına gerçek file input ekle (txt/md/csv/pdf) - drag & drop + file picker
- [x] Server-side dosya işleme (S3 upload + text extraction)
- [x] PDF text extraction (server-side, pdf-parse v1)
- [x] Desteklenmeyen format için açık hata mesajı
- [x] rawContent server tarafında üretilsin

### 3. Processing Pipeline
- [x] Aynı belge tekrar işlenirse duplicate matching result oluşmasın (idempotent reprocessing)
- [x] Reprocess desteği: eski sonuçları güvenli replace et (deleteMatchingResultsByDocument)
- [x] Çift tıklama / yarış durumu koruması (status === "processing" guard)
- [x] Document status geçişleri: pending -> processing -> completed/failed
- [x] Hata detayları loglanıp okunabilir mesaj dönsün

### 4. Matching Engine Kalitesi
- [x] contains mantığında aşırı gevşek eşleşme düzelt (MIN_MATCH_LENGTH guard)
- [x] Empty string match etmesin (guard at top of applyRules)
- [x] Çok kısa term'ler için guard ekle (< MIN_MATCH_LENGTH)
- [x] Rule match vs semantic match önceliği netleştir (rules first, then LLM)
- [x] Düşük güven skorlarında net unmatched davranışı (< 0.3 threshold)
- [x] Null match senaryoları düzgün işlensin (createUnmatchedResult helper)
- [x] fieldType ile category.type uyumu (LLM prompt'ta belirtildi)

### 5. Approval + Auto-Learning
- [x] approve işleminde sonucu id ile doğrudan çek (getMatchingResultById)
- [x] Auto-created rule duplicate kontrolü (existingRules.some check)
- [x] Auto-learn failure approval'ı bloklamasın (try-catch wrapper)
- [x] Approval sonrası UI anında güncellensin (invalidate calls)

### 6. Export ve Dış Entegrasyon
- [x] API key ile çalışan gerçek HTTP endpoint'ler (publicApi.ts)
- [x] POST /api/v1/documents - belge yükleme
- [x] POST /api/v1/documents/:id/process - belge işleme
- [x] GET /api/v1/documents/:id/results - sonuçları getir
- [x] POST /api/v1/standardize - tek adımda yükle + işle
- [x] GET /api/v1/categories - kategori listesi
- [x] API key hash doğrulaması (SHA-256)
- [x] Inactive/invalid key yönetimi
- [x] Audit logging (processing logs)
- [x] API docs UI güncellendi (ApiExport.tsx - REST endpoint'ler, curl örnekleri)

### 7. Email Source MVP
- [x] Manual email source registry olarak konumlandır
- [x] UI metnini buna göre düzelt (kaynak kayıt ve manuel parse)

### 8. UI/UX Düzeltmeleri
- [x] Documents: upload/process/status/error/reprocess net olsun (file upload tab, reprocess button)
- [x] Matching: unmatched kayıtlar görünür olsun
- [x] Approve sonrası state yenilensin (invalidate calls)
- [x] Export butonları anlaşılır olsun (tabs ile REST API docs)

### 9. Testler
- [x] Empty string rule match etmez testi
- [x] Repeated processing duplicate üretmez testi (idempotent reprocessing in code)
- [x] 30 test, 3 dosya, hepsi geçti

### 10. Temizlik ve Dokümantasyon
- [x] README'ye current MVP scope bölümü ekle

## Bug Fix - v3.1

- [x] Giriş Yap ve Ücretsiz Başlat butonlarına tıklandığında siyah ekran sorunu düzelt (iframe-safe openLogin)
