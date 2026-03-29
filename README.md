# DDS Platform — Dark Data Standardizer

Lojistik ve tedarik zincirindeki serbest metinleri (e-posta, irsaliye, sipariş notu, gümrük beyannamesi vb.) yapay zeka ile analiz edip standart ERP formatına dönüştüren B2B SaaS platformu.

## MVP Kapsamı

| Özellik | Durum | Açıklama |
|---|---|---|
| Belge Yükleme | Tamamlandı | Metin yapıştırma, dosya yükleme (PDF/TXT/CSV), e-posta parse |
| Anlamsal Eşleştirme | Tamamlandı | LLM tabanlı terim çıkarma ve kategori eşleştirme |
| Kural Motoru | Tamamlandı | 4 strateji: exact, contains, regex, semantic |
| ERP Kategorileri | Tamamlandı | 6 tip: gider, operasyon, malzeme, rota, tedarikçi, özel |
| Otomatik Öğrenme | Tamamlandı | Onaylanan eşleştirmelerden kural üretimi |
| Public REST API | Tamamlandı | API key ile dış entegrasyon (Bearer token) |
| JSON/CSV Export | Tamamlandı | Eşleştirme sonuçlarını dışa aktarma |
| Veri Kalitesi Raporları | Tamamlandı | KPI dashboard (güven dağılımı, eşleşme oranları) |
| Admin Paneli | Tamamlandı | Kullanıcı yönetimi, rol atama, sistem istatistikleri |
| E-posta Kaynakları | Tamamlandı | Manuel kaynak kaydı (otomatik IMAP izleme gelecek) |

## Teknik Mimari

Uygulama React 19 + Tailwind CSS 4 + Express 4 + tRPC 11 yığını üzerine kurulmuştur. Veritabanı olarak MySQL/TiDB, dosya depolama için S3 kullanılmaktadır. Kimlik doğrulama Manus OAuth ile sağlanır.

### Temel Bileşenler

**Standardizasyon Motoru** (`server/standardization.ts`): Gelen metinlerden LLM ile terim çıkarır, kural motorundan geçirir, eşleşmeyen terimleri anlamsal olarak kategorize eder. Boş/kısa terim koruması, idempotent işleme ve güven skoru eşikleri içerir.

**Public REST API** (`server/publicApi.ts`): Dış sistemlerin (ERP, otomasyon araçları) API key ile belge yüklemesi, işlemesi ve sonuç alması için HTTP endpoint'leri sunar.

**Kural Motoru**: Exact (tam eşleşme), contains (içerme), regex (düzenli ifade) ve semantic (anlamsal) stratejileri destekler. Kurallar öncelik sırasına göre değerlendirilir.

## API Endpoint'leri

| Yöntem | Endpoint | Açıklama |
|---|---|---|
| POST | `/api/v1/documents` | Belge yükle |
| POST | `/api/v1/documents/:id/process` | Belge işle |
| GET | `/api/v1/documents/:id/results` | Sonuçları getir |
| POST | `/api/v1/standardize` | Tek adımda yükle + işle |
| GET | `/api/v1/categories` | Kategori listesi |

Tüm endpoint'ler `Authorization: Bearer dds_...` header'ı gerektirir.

## Gelecek Geliştirmeler

Aşağıdaki özellikler henüz uygulanmamıştır ve gelecek sürümlerde planlanmaktadır:

- IMAP ile otomatik e-posta izleme ve parse
- SARIMAX zaman serisi tahminleme entegrasyonu
- Webhook ile ERP sistemlerine otomatik veri aktarımı (SAP, Logo, Netsis)
- Toplu belge yükleme kuyruğu (batch import)
- Çoklu dil desteği (i18n)
